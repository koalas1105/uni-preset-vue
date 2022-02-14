module.exports = [{
  type: 'list',
  name: 'template',
  message: 'Please select a miniapp template',
  choices: [{
    name: 'Default template',
    value: 'default'
  },
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
