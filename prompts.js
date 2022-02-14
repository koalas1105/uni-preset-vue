module.exports = [{
  type: 'list',
  name: 'template',
  message: 'Please select a uni-app template',
  choices: [{
    name: 'Default template',
    value: 'default'
  },
  {
    name: 'Default template(TypeScript)',
    value: 'default-ts'
  },
  {
    name: 'Hello uni-app',
    value: 'dcloudio/hello-uniapp'
  },
  {
    name: 'Front and back login template',
    value: 'dcloudio/uni-template-login'
  },
  {
    name: 'Look at the picture template',
    value: 'dcloudio/uni-template-picture'
  },
  {
    name: 'news/Information template',
    value: 'dcloudio/uni-template-news'
  },
  {
    name: 'custom template',
    value: 'custom'
  }
  ],
  default: 'None'
},
{
  when: answers => answers.template === 'custom',
  type: 'input',
  name: 'repo',
  message: 'Please enter the custom uni-app template address',
  filter (input) {
    return new Promise(function (resolve, reject) {
      if (input) {
        resolve(input)
      } else {
        reject(new Error('uni-app Template address cannot be empty'))
      }
    })
  }
}
]
