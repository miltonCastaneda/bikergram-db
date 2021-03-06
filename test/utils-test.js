'use strict'

/**
 * Con test se define cada uno de los casos
 * de prueba de manera concurrente y ahislada,
 * por ende no es recomendado manejar globales
 */

const test = require('ava')
const utils = require('../lib/utils')

test('estracting hashtags from text', t => {
  // funcion que extrae los tags
  let tags = utils.extractTags('a #picture with tags #AwEsOmE #Platzi #AVA and #100 ##yes')
  // acerccion de exactamente igual
  t.deepEqual(tags, [
    'picture',
    'awesome',
    'platzi',
    'ava',
    '100',
    'yes'
  ])
  // si no tiene tags
  tags = utils.extractTags('a picture whit no tags')
  t.deepEqual(tags, [])
  // bacio
  tags = utils.extractTags()
  t.deepEqual(tags, [])
  // null
  tags = utils.extractTags(null)
  t.deepEqual(tags, [])
})

test('encrypt password', t => {
  let password = 'foo123'
  let encrypted = '02b353bf5358995bc7d193ed1ce9c2eaec2b694b21d2f96232c9d6a0832121d1'

  let result = utils.encrypt(password)
  t.is(result, encrypted)
})
