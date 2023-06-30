'use strict'

const fs = require( 'fs' )
const { glob } = require( 'glob' )
const async = require( 'async' )
const path = require( 'path' )

/**
 * @description globs files and returns an array, used in various methods
 * @param {string} [dir] directory of files to glob
 * @returns {Array} returns an array of files
*/
let getFiles = function( dir ) {
	if ( typeof dir !== 'string' && !( dir instanceof Array ) ) {
		throw new TypeError( 'getFiles err. Expected string or array, but received: ' + typeof dir )
	}

	if ( typeof dir === 'string' ) {
		return glob( dir, {}, function( err, files ) {
			if ( err ) { throw err }

			files = files.filter( function( file ) {
				let excluded = false
				let relPath = path.relative( dir.replace( '/**/*.styl', '' ), file )

				this.config.exclude.forEach( function( exclude ) {
					excluded = excluded || exclude.match( relPath )
				} )

				return !excluded
			}, this )

			this.cache.filesLen = files.length - 1
			this.cache.files = files

			return async.map( this.cache.files, fs.readFile, this.parse.bind( this ) )
		}.bind( this ) )
	}
	else if ( dir instanceof Array ) {

		let files = dir.filter( function( filepath ) {
			let excluded = false

			this.config.exclude.forEach( function( exclude ) {
				excluded = excluded || exclude.match( filepath )
			} )

			return !excluded
		}, this )

		this.cache.filesLen = files.length - 1
		this.cache.files = files
		return this.cache.files.forEach( function( file ) {
			return this.read( file )
		}.bind( this ) )
	}
}

module.exports = getFiles
