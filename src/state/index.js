var stampit = require( 'stampit' )

// group together all the functions that determine state in this folder
var stateMethods = stampit().methods( {
	stateMethods: {
		hashOrCSSEnd: require( './hashOrCSSEnd' ),
		hashOrCSSStart: require( './hashOrCSSStart' ),
		keyframesEnd: require( './keyframesEnd' ),
		keyframesStart: require( './keyframesStart' ),
		startsWithComment: require( './startsWithComment' ),
		stylintOff: require( './stylintOff' ),
		stylintOn: require( './stylintOn' )
	}
} )

module.exports = stateMethods
