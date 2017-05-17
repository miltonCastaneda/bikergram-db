'use strict'

const co = require('co')//coorutina
const r = require('rethinkdb')
const Promise = require('bluebird')

/**
 * Valores por default para la base de datos
 */

const defaults = {
  host: 'localhost',
  port: 28015,
  db: 'bikergram'
}

class Db {
  constructor (options){
    options = options || {}
    this.host = options.host || defaults.host
    this.port = options.port || defaults.port
    this.db = options.db || defaults.db
  }

  connect(callback) {
    /*
     * si se usa solo connect es default
     * se quiere hacer configurable
     * connect retorna una promesa
     */
    this.connection = r.connect({
      host: this.host,
      port: this.port
    })

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
       *  
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
}

module.exports = Db
