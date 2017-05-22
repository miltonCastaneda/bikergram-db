'use strict'
// coorutina
const co = require('co')
const r = require('rethinkdb')
const Promise = require('bluebird')
const uuid = require('uuid-base62')
const utils = require('./utils')
// Valores por default para la base de datos

const defaults = {
  host: 'localhost',
  port: 28015,
  db: 'bikergram'
}

class Db {
  constructor (options) {
    options = options || {}
    this.host = options.host || defaults.host
    this.port = options.port || defaults.port
    this.db = options.db || defaults.db
  }

  connect (callback) {
    /*
     * si se usa solo connect es default
     * se quiere hacer configurable
     * connect retorna una promesa
     */
    this.connection = r.connect({
      host: this.host,
      port: this.port
    })
    this.connected = true

    let db = this.db
    let connection = this.connection

    /**
     * funcion generadora corriendo sobre co que
     * retornara una promesa
     * crear tablas y base de datos
     * function *() funcione generadora
     */
    let setup = co.wrap(function * () {
      let conn = yield connection
      /**
       * Crear la base de datos si no existe
       * invocar el metodo r.dbList() para traer el listado
       * de bases de datos que existen con respecto a la connexion
       * corremos el comando y le pasamos la referencia
       * de la conexion .run(conn)
       * retorna una promesa que la resuelve yield,
       * let dbList tiene el arreglo como tal que retorna la base de datos
       * verifico si la base de datos existe en el arreglo con indexOf
       */
      let dbList = yield r.dbList().run(conn)
      if (dbList.indexOf(db) === -1) {
        // crear base de datos, con yield no continuara hasta que se cree
        yield r.dbCreate(db).run(conn)
      }
      // lista de tablas de la base de datos
      let dbTables = yield r.db(db).tableList().run(conn)
      /**
       * Si existen las tablas retorna conn
       * sino las crea y retorna conn
       */
      if (dbTables.indexOf('images') === -1) {
        yield r.db(db).tableCreate('images').run(conn)
        // indice para la trabla imagenes
        yield r.db(db).table('images').indexCreate('createdAt').run(conn)
      }
      if (dbTables.indexOf('users') === -1) {
        yield r.db(db).tableCreate('users').run(conn)
      }
      return conn
    })
    // si no pasan callback manejo promesa de lo contrario
    // manejo todo como una funcion asyncrona normal con callback
    return Promise.resolve(setup()).asCallback(callback)
  }

  disconnect (callback) {
    if (!this.connected) {
      return Promise.reject(new Error('not connected')).asCallback(callback)
    }
    this.connected = false
    return Promise.resolve(this.connection).then((conn) => conn.close())
  }

  saveImage (image, callback) {
    if (!this.connected) {
      return Promise.reject(new Error('not connected')).asCallback(callback)
    }

    let connection = this.connection
    let db = this.db

    let tasks = co.wrap(function * () {
      let conn = yield connection
      image.createdAt = new Date()
      image.tags = utils.extractTags(image.description)

      let result = yield r.db(db).table('images').insert(image).run(conn)

      if (result.errors > 0) {
        return Promise.reject(new Error(result.first_error))
      }

      image.id = result.generated_keys[0]

      yield r.db(db).table('images').get(image.id).update({
        public_id: uuid.encode(image.id)
      }).run(conn)

      let created = yield r.db(db).table('images').get(image.id).run(conn)

      return Promise.resolve(created)
    })

    return Promise.resolve(tasks()).asCallback(callback)
  }

  likeImage (id, callback) {
    if (!this.connected) {
      return Promise.reject(new Error('not connected')).asCallback(callback)
    }

    let connection = this.connection
    let db = this.db
    let imageId = uuid.decode(id)

    let tasks = co.wrap(function * () {
      let conn = yield connection
      let image = yield r.db(db).table('images').get(imageId).run(conn)
      yield r.db(db).table('images').get(imageId).update({
        liked: true,
        likes: image.likes + 1
      }).run(conn)

      let created = yield r.db(db).table('images').get(imageId).run(conn)
      return Promise.resolve(created)
    })

    return Promise.resolve(tasks()).asCallback(callback)
  }

  getImage (id, callback) {
    if (!this.connected) {
      return Promise.reject(new Error('not connected')).asCallback(callback)
    }

    let connection = this.connection
    let db = this.db
    let imageId = uuid.decode(id)

    let tasks = co.wrap(function * () {
      let conn = yield connection
      let image = yield r.db(db).table('images').get(imageId).run(conn)

      return Promise.resolve(image)
    })

    return Promise.resolve(tasks()).asCallback(callback)
  }

  getImages (callback) {
    if (!this.connected) {
      return Promise.reject(new Error('not connected')).asCallback(callback)
    }

    let connection = this.connection
    let db = this.db
    let tasks = co.wrap(function * () {
      let conn = yield connection
      let images = yield r.db(db).table('images').orderBy({
        index: r.desc('createdAt')
      }).run(conn)

      let result = yield images.toArray()

      return Promise.resolve(result)
    })

    return Promise.resolve(tasks()).asCallback(callback)
  }

  saveUser (user, callback) {
    if (!this.connected) {
      return Promise.reject(new Error('not connected')).asCallback(callback)
    }

    let connection = this.connection
    let db = this.db
    let tasks = co.wrap(function * () {
      let conn = yield connection
      user.password = utils.encrypt(user.password)
      user.createdAt = new Date()

      let result = yield r.db(db).table('users').insert(user).run(conn)

      if (result.errors > 0) {
        return Promise.reject(new Error(result.first_error))
      }

      user.id = result.generated_keys[0]

      let created = yield r.db(db).table('users').get(user.id).run(conn)

      return Promise.resolve(created)
    })

    return Promise.resolve(tasks()).asCallback(callback)
  }
}

module.exports = Db
