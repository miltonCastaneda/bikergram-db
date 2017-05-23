'use strict'
// biene con node js
const crypto = require('crypto')

const utils = {
  extractTags,
  encrypt,
  normalize
}

function extractTags (text) {
  //  Con doble == valido si es nulo e idefinido
  if (text == null) return []
  //  extraer las palabras que coinciden con la expresion regular
  //  match: permite hacer match de una expresion regular
  //  g: declara la expresion como global
  //  donde aplica para todas las palabras del texto

  let matches = text.match(/#(\w+)/g)

  if (matches === null) return []

  matches = matches.map(normalize)

  return matches
}

function normalize (text) {
  text = text.toLowerCase()
  text = text.replace(/#/g, '')
  return text
}

function encrypt (password) {
  let shasum = crypto.createHash('sha256')
  shasum.update(password)
  return shasum.digest('hex')
}

module.exports = utils
