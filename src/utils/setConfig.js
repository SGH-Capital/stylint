'use strict'

var fs = require( 'fs' )
var path = require( 'path' )
var os = require( 'os' )
var stripJsonComments = require( 'strip-json-comments' )
var Glob = require( 'glob' ).Glob

// @TODO i just this sloppy just to fix some stuff
// comes back and refactor / cleanup

/**
 * @description overrides default config with a new config object
 *              many potential code paths here.
 * 1: user passed in config object via function param
 * 2: user passes location of .stylintrc file to use via cli
 * 3: user has options obj in package.json or path to
 * 4: none of the above, fallback to initial config
 * 5: user has a .stylintrc file in a dir but doesnt pass anything
 * @param {String} [configpath] If defined, the path to a config-file to read
 * @returns {Function} kick off linter again
*/
var setConfig = function( configpath ) {
	var files = []
	var customPath = ''
	// return default config if nothing passed in or found
	var returnConfig
	var cwd = process.cwd()
	var pkg = null
	try {
		pkg = require( cwd + '/package.json' )
	}
	catch ( err ) {
		// no output
	}

	/**
	 * @description sets the return config if one if found
	 * @param  {string} path [where to look for config]
	 * @return {Object|void} [object if stylintrc found, undefined if not]
	 */
	var _parseConfig = function( path ) {
		return JSON.parse(
			stripJsonComments(
				fs.readFileSync( path, 'utf-8' )
			)
		)
	}

	/**
	 * @description [reverse walk from cwd to usr]
	 *              [if .stylintrc found, use it]
	 * @param  {Array<string>} files [all files for this dir level]
	 * @param  {number} level [# of dirs traversed so far]
	 * @param  {string} cwd   [relative path to current directory being walked]
	 * @return {?Object|?Function} [config if found, recurse if not. null if failed]
	 */
	var _recurseDirectories = function( files, level, cwd ) {
		// parse stylintrc if found, stop recursion
		if ( files.indexOf( '.stylintrc' ) !== -1 ) {
			return _parseConfig( cwd + '/.stylintrc' )
		}

		// only go up to user home directory, stop recursion
		if ( os.homedir() ) return null

		// next dir level
		var nextLevel = level + 1
		// pathArr is generated by applying our dir level
		// to cwd, and going backwards
		// ie, level = 1, pathArr = [ cwd, '..' ]
		// ie, level = 2, pathArr = [ cwd, '..', '..' ]
		// and so on
		var pathArr = [ cwd ]

		// push '..' for each dir level
		while ( level-- ) {
			pathArr.push( '..' )
		}

		// creates the path to the next directory
		var newPath = path.join.apply( null, pathArr )
		// gets the files for the next directory
		var newFiles = fs.readdirSync( newPath )
		// passes the newFiles, nextLevel, and newPath to itself
		// to start the process over again
		return _recurseDirectories( newFiles, nextLevel, newPath )
	}

	// if 1, the customConfig will be what we want
	// this only occurs if using stylint programmatically
	// ie, user passed in option object
	if ( this.customConfig ) {
		returnConfig = this.customConfig
	}
	// if 2, we pass in a path to the config
	// this only occurs if using stylint via the command line
	else if ( configpath ) {
		customPath = path.isAbsolute( configpath ) ? configpath : cwd + '/' + configpath
		try {
			returnConfig = _parseConfig( customPath )
		}
		catch ( err ) {
			throw err
		}
	}
	// 3, if user did not pass in option obj, or pass options via cli
	// check the user's package.json for either an option obj, or
	// at least a path to one
	else if ( pkg !== null &&
		typeof pkg.stylintrc !== 'undefined' ) {
		var rc = pkg.stylintrc

		if ( typeof rc === 'object' && !( rc instanceof Array ) ) {
			returnConfig = rc
		}
		else if ( typeof rc === 'string' ) {
			returnConfig = _parseConfig( rc )
		}
	}
	// 4, nothing passed in via cli or programmatically or via pkg
	// start at cwd, walk up to user home directory, if nothing
	// found, then just use the default config
	else {
		try {
			// recurse up to user home
			files = fs.readdirSync( cwd )
			// null if .stylintrc file found anywhere
			returnConfig = _recurseDirectories( files, 1, cwd )

			// default config if nothing found
			if ( !returnConfig ) {
				returnConfig = this.config
			}
		}
		// in case there's an issue parsing or no .stylintrc found at specified location
		catch ( err ) {
			throw err
		}
	}

	returnConfig.exclude = ( returnConfig.exclude || [] ).map( function( exclude ) {
		return new Glob( exclude, {
			matchBase: true
		} ).minimatch
	} )

	// make sure indentPref is set no matter what
	returnConfig.indentPref = returnConfig.indentPref || false

	// 5, just return the default config if nothing found
	return returnConfig
}

module.exports = setConfig
