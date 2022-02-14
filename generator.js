const fs = require('fs')
const path = require('path')
const fse = require('fs-extra')

const isBinary = require('isbinaryfile')

async function generate (dir, files, base = '', rootOptions = {}) {
  const glob = require('glob')

  glob.sync('**/*', {
    cwd: dir,
    nodir: true
  }).forEach(rawPath => {
    const sourcePath = path.resolve(dir, rawPath)
    const filename = path.join(base, rawPath)

    if (isBinary.sync(sourcePath)) {
      files[filename] = fs.readFileSync(sourcePath) // return buffer
    } else {
      let content = fs.readFileSync(sourcePath, 'utf-8')
      if (path.basename(filename) === 'manifest.json') {
        content = content.replace('{{name}}', rootOptions.projectName || '')
      }
      if (filename.charAt(0) === '_' && filename.charAt(1) !== '_') {
        files[`.${filename.slice(1)}`] = content
      } else if (filename.charAt(0) === '_' && filename.charAt(1) === '_') {
        files[`${filename.slice(1)}`] = content
      } else {
        files[filename] = content
      }
    }
  })
}

module.exports = (api, options, rootOptions) => {
  const templateWithSass = [
    'dcloudio/hello-uniapp',
    'dcloudio/uni-template-news'
  ]
  api.extendPackage(pkg => {
    return {
      dependencies: {
        'regenerator-runtime': '^0.12.1',// Lock the version to avoid errors in the applet with the higher version
        '@dcloudio/uni-helper-json': '*'
      },
      devDependencies: {
        "@babel/runtime": "~7.12.0",// Temporarily specify the version, 7.13.x will report an error
        'postcss-comment': '^2.0.0',
        '@dcloudio/types': '*',
        'miniprogram-api-typings': '*',
        'mini-types': '*'
      }
    }
  })
  if (options.template === 'default-ts') { // enable typescript
    api.extendPackage(pkg => {
      return {
        dependencies: {
          'vue-class-component': '^6.3.2',
          'vue-property-decorator': '^8.0.0'
        },
        devDependencies: {
          '@babel/plugin-syntax-typescript': '^7.2.0',
          '@vue/cli-plugin-typescript': '*',
          'typescript': api.hasPlugin('eslint') ? '~3.1.1' : '^3.0.0'
        }
      }
    })
  } else if (templateWithSass.includes(options.template)) {
    api.extendPackage(pkg => {
      return {
        devDependencies: {
          'node-sass': '^4.11.0',
          'sass-loader': '^7.1.0'
        }
      }
    })
  }

  api.render(async function (files) {
    Object.keys(files).forEach(name => {
      delete files[name]
    })

    const template = options.repo || options.template

    const base = 'src'
    await generate(path.resolve(__dirname, './template/common'), files)
    if (template === 'default') {
      await generate(path.resolve(__dirname, './template/default'), files, base, rootOptions)
    } else if (template === 'default-ts') {
      await generate(path.resolve(__dirname, './template/common-ts'), files)
      await generate(path.resolve(__dirname, './template/default-ts'), files, base, rootOptions)
    } else {
      const ora = require('ora')
      const home = require('user-home')
      const download = require('download-git-repo')

      const spinner = ora('Template download...')
      spinner.start()

      const tmp = path.join(home, '.uni-app/templates', template.replace(/[/:]/g, '-'), 'src')

      if (fs.existsSync(tmp)) {
        try {
          require('rimraf').sync(tmp)
        } catch (e) {
          console.error(e)
        }
      }

      await new Promise((resolve, reject) => {
        download(template, tmp, err => {
          spinner.stop()
          if (err) {
            return reject(err)
          }
          resolve()
        })
      })

      // Merge template dependencies
      const jsonPath = path.join(tmp, './package.json')
      if (fs.existsSync(jsonPath)) {
        try {
          const json = fs.readFileSync(jsonPath, { encoding: 'utf-8' })
          content = JSON.parse(json)
          api.extendPackage(pkg => {
            return {
              dependencies: Object.assign({}, content.dependencies),
              devDependencies: Object.assign({}, content.devDependencies)
            }
          })
        } catch (error) {
          console.warn('package.json merge failed')
        }
      }

      const dirNames = ['cloudfunctions-aliyun', 'cloudfunctions-tcb']
      dirNames.forEach(dirName => {
        const dirPath = path.join(tmp, './', dirName)
        if(fs.existsSync(dirPath)) {
          fse.moveSync(dirPath, path.join(tmp, '../', dirName), {
            overwrite: true
          })
        }
      })

      await generate(path.join(tmp, '../'), files, path.join(base, '../'))
    }
  })
}
