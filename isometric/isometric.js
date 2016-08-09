/**
 * If true it generates the SVG completely via javascript.
 * If false it will use an SVG element in the HTML with ID 'gamegrid'.
 */
var debugDynamic = true;

/* Show console logging. */
var debugLogs = true;

/**
 * Give SVG elements new superpowers.
 */
;[ 'click'
, 'dblclick'
, 'mousedown'
, 'mouseup'
, 'mouseover'
, 'mouseout'
, 'mousemove'
, 'mouseenter'
, 'mouseleave'
, 'touchstart'
, 'touchend'
, 'touchmove'
, 'touchcancel' ].forEach( function(event) {

  /* add event to SVG.Element */
  SVGElement.prototype[event] = function(f) {
    var self = this

    /* bind event to element rather than element node */
    this.node['on' + event] = typeof f == 'function' ?
      function() { return f.apply(self, arguments) } : null

    return this
  }

} );

/**
 * GameGrid Object
 */
var GameGrid = GameGrid || {};
var GameController = GameController || {};
var GameSound = GameSound || {};

/**
 * Example of using Object.assign.
 * @see polifills.js for support of Object.assign.
 */
Object.assign( GameGrid, {

	_ratio: 0.8659333,
	_angle: 30,
	width: 80,
	height: 0,
	tileRows: 8,
	tileCols: 8,
	svg: false,
	map: false,
	defs: false,
	sprites: false,
	gameBoard: false,
	svgNS: 'http://www.w3.org/2000/svg',
	_topPoint: false,
	_leftPoint: false,
	_rightPoint: false,
	_bottomPoint: false,
	_origin: false,
	_lastFill: false,
	_lastSelected: false,
	gameState: 'roll',
	player: 1,
	diceNumber: 1,

	/**
	 * Create a document ready listener.
	 * @param fn
	 * @returns {GameGrid}
	 */
	prepare: function ( fn, options ) {

		this.surface = typeof options.surface === 'undefined' ? document.body : options.surface;
		this.gridID = typeof options.gridID === 'undefined' ? 'gamegrid' : options.gridID;
		this.sprites = typeof options.sprites === 'undefined' ? false : options.sprites;
		this.gameBoard = typeof options.gameBoard === 'undefined' ? false : options.gameBoard;

		if ( document.readyState != 'loading' ) {
			fn()
		} else {
			document.addEventListener( 'DOMContentLoaded', fn );
		}

		// Returning the object allows for method chaining.
		return this;
	},

	log: function ( message ) {
		if ( debugLogs ) {
			console.log( message );
		}
		return this;
	},

	init: function() {

		/**
		 * Set isometric height.
		 */
		 this.height = this.width * this._ratio;

		if ( debugDynamic ) {
			this.svg = document.createElementNS( this.svgNS, 'svg' );
			this.svg.style.position = 'absolute';
			this.svg.style.top = 0;
			this.svg.style.left = 0;
		} else {
			this.svg = document.getElementById( this.gridID );
		}
		this.log( 'SVG created.' );

		this.defs = document.createElementNS( this.svgNS, 'defs' );
		this.svg.appendChild( this.defs );
		this.map = document.createElementNS( this.svgNS, 'g' );
		this.svg.appendChild( this.map );
		this.log( 'Map area created.' );

		this.patterns();

		this.surface.appendChild( this.svg );

		this.svg.addEventListener( 'click', this.click );
		this.svg.addEventListener( 'mouseover', this.dim );
		this.svg.addEventListener( 'mouseout', this.restore );
		this.log( 'Events added.' );
	},

	patterns: function() {
		for ( var spriteName in this.sprites ) {
		    if ( this.sprites.hasOwnProperty( spriteName ) ) {
				sprite = this.sprites[ spriteName ];

				var width = sprite.width ? sprite.width : this.width,
					height = sprite.height ? sprite.height : this.height;

				this.defs.appendChild( this.createPattern( spriteName, sprite.src, width , width  ) );
		    }
		}

	},

	createPattern: function( id, src, width, height, xt, yt ) {
		var pattern = document.createElementNS( this.svgNS, 'pattern' ),
			image = document.createElementNS( this.svgNS, 'image' ),
			namespace = 'http://www.w3.org/1999/xlink';
		pattern.setAttribute( 'xmlns', this.svgNS );
		// pattern.setAttributeNS( null, 'patternUnits', 'userSpaceOnUse' );
		// pattern.setAttributeNS( null, 'patternUnits', 'objectBoundingBox' );
		// pattern.setAttributeNS( null, 'patternContentUnits', 'userSpaceOnUse' );
		pattern.setAttributeNS( null, 'id', id );
		pattern.setAttributeNS( null, 'width', 1 );
		pattern.setAttributeNS( null, 'height', 1 );
		// image.setAttributeNS( null, 'href', src );
		image.setAttribute( 'xmlns:xlink', namespace );
		image.setAttributeNS( namespace, 'xlink:href', src );
		image.setAttributeNS( null, 'x', 0 );
		image.setAttributeNS( null, 'y', 0 );
		image.setAttributeNS( null, 'width', width );
		image.setAttributeNS( null, 'height', height );
		pattern.appendChild( image );

		if ( 'undefined' !== typeof xt && 'undefined' !== typeof yt ) {
			image.setAttributeNS( null, 'transform', 'translate(' + xt + ' ' + yt + ')' );
		} else if ( 'undefined' !== typeof xt ) {
			image.setAttributeNS( null, 'transform', 'translate(' + xt + ' 0)' );
		} else if ( 'undefined' !== typeof yt ) {
			image.setAttributeNS( null, 'transform', 'translate( 0 ' + yt + ') scale(1.9)' );
		}

		return pattern;
	},

	drawMap: function() {
		var blocks = [],
			pattern = 'grass1',
			pos = false;

		for ( y = 0; y < this.tileRows; y++ ) {
			for ( x = 0; x < this.tileCols; x++ ) {
				var block = document.createElementNS(this.svgNS, 'rect');
				block.setAttributeNS( null, 'x', this.width * x);
				block.setAttributeNS( null, 'y', this.height * y );
				block.setAttributeNS( null, 'width', this.width );
				block.setAttributeNS( null, 'height', this.height );
				block.setAttributeNS( null, 'class', 'tile tile' + ( x + 1 ) + '-' + ( y + 1 ) );
				pattern = 'grass2' === pattern ? 'grass1' : 'grass2';
				block.setAttributeNS(null, 'style', 'fill:url(\'#' + pattern + '\');stroke:black;stroke-width:1');
				block.setAttributeNS( null, 'transform', 'rotate(' + this._angle + ') skewX(' + (  -1 * this._angle ) + ')' );
				this.map.appendChild( block );
				if( ! pos ) {
					pos = block.getBoundingClientRect();
				}
			}
			pattern = 'grass2' === pattern ? 'grass1' : 'grass2';
		}
		// Draw Thick Line
		var block = document.createElementNS(this.svgNS, 'path');
		block.setAttributeNS(null, 'style', 'fill:none;stroke:black;stroke-width:3');
		block.setAttributeNS( null, 'd', 'M' + (this.width * this.tileCols + 2 ) + ',0 L' + (this.width * this.tileCols + 2 ) + ',' + ( this.height * this.tileRows + 2 ) + ' 0,' + ( this.height * this.tileRows + 2 ) );
		block.setAttributeNS( null, 'transform', 'rotate(' + this._angle + ') skewX(' + (  -1 * this._angle ) + ')' );
		this.map.appendChild( block );

		this.log( 'Map drawn.' );

		/**
		 * Get SVG width and height;
		 */
		var width = this.width * 1.733 * this.tileCols,
			height =  this.height * this.tileRows / this._ratio;

		/**
		 * Draw a block around the SVG canvas.
		 */
		var block = document.createElementNS(this.svgNS, 'rect');
		block.setAttributeNS( null, 'x', -width /2);
		block.setAttributeNS( null, 'y', 0);
		block.setAttributeNS( null, 'width', width);
		block.setAttributeNS( null, 'height',height );
		block.setAttributeNS(null, 'style', 'fill:none;stroke:red;stroke-width:1');
		// this.map.appendChild( block );

		var block = document.createElementNS(this.svgNS, 'rect');
		block.setAttributeNS( null, 'id', 'dice');
		block.setAttributeNS( null, 'x', 20);
		block.setAttributeNS( null, 'y', 20);
		block.setAttributeNS( null, 'width', 100 );
		block.setAttributeNS( null, 'height', 100 );
		block.setAttributeNS(null, 'style', 'fill:url(\'#dice1\');');
		this.svg.appendChild( block );

		/**
		 * Adjust view accordingly.
		 */
		this.map.setAttributeNS( null, 'transform', 'translate(' + ( width / 2 + this.width / 2 ) + ' ' + ( this.height / 2 ) + ')' );
		this.svg.setAttribute( 'width', width + this.width );
		this.svg.setAttribute( 'height', height + this.height );
		this.log( 'Viewport adjusted.');
	},

	drawSprite: function( spriteName, tile ) {

		if ( 'undefined' === typeof this.sprites[ spriteName ] || 0 === spriteName.length ) {
			return;
		}

		var spriteClass = tile.replace( 'tile', 'sprite' ) + ' ' + spriteName,
			tile = document.querySelector( '.' + tile ).getBoundingClientRect(),
			spriteEl = document.createElementNS( this.svgNS, 'rect' ),
			sprite = this.sprites[ spriteName ];

		spriteEl.setAttributeNS( null, 'class', 'sprite ' + spriteClass );
		spriteEl.setAttributeNS( null, 'x', tile.left + Math.abs( tile.width - sprite.width ) / 2 );
		spriteEl.setAttributeNS( null, 'y', tile.top - Math.abs( tile.height - sprite.height / this._ratio ) / 2 );
		spriteEl.setAttributeNS( null, 'width', sprite.width );
		spriteEl.setAttributeNS( null, 'height', sprite.height );
		spriteEl.setAttributeNS(null, 'style', 'fill:url(\'#' + spriteName + '\');');
		this.svg.appendChild( spriteEl );
		spriteEl.style.pointerEvents = 'none';
	},

	draw: function() {
		if ( this.gameBoard ) {
			var across = this.gameBoard[0].length,
				down = this.gameBoard.length;

				for ( var y = 0; y < down; y++ ) {
					for ( var x = 0; x < across; x++ ) {
						if ( 0 < this.gameBoard[y][x].length ) {
							this.drawSprite( this.gameBoard[y][x], 'tile' + ( x + 1 ) + '-' + ( y + 1 ) );
						}
					}
				}

		}

	},

	hasClass: function( el, className ) {
		if (el.classList)
  			return el.classList.contains(className);
		else
  			return new RegExp('(^| )' + className + '( |$)', 'gi').test(el.className);
	},

	/**
	 * Events
	 */
	setup: function ( e ) {
		GameGrid.init();
		GameGrid.drawMap();
		GameGrid.draw();
	},

	click: function( e ) {
		if ( 'rect' === e.target.nodeName && GameGrid.hasClass(e.target, 'tile' ) && 'play' === GameGrid.gameState ) {
			var spritePos = 'sprite' + e.target.getAttribute( 'class' ).match( /\d*-\d*/ ),
				tilePos = spritePos.replace( 'sprite', 'tile' );
				sprite = GameGrid.svg.querySelector( '.' + spritePos ),
				canMove = false;

			if ( sprite ) {

				if ( tilePos !== GameGrid._lastSelected ) {
					var last = GameGrid.svg.querySelector( '.' + GameGrid._lastSelected );
					if ( last ){
						last.style.fill = GameGrid._lastFill;
					}
				}
				GameGrid._lastFill = e.target.style.fill;
				GameGrid._lastSelected = tilePos;
				// e.target.style.fill = 'blue';
				spriteName = sprite.getAttribute( 'class' ).replace( 'sprite', '' ).replace( spritePos, '' ).trim();
				if ( 'sheep' === spriteName || 'sheep2' === spriteName ) {
					var sheep = Object.assign( {}, GameSound );
					sheep.init( 'sheep.mp3' );
					sheep.play();
					canMove = 2 === GameGrid.player;
				}
				if ( 'ostritch' === spriteName || 'ostritch2' === spriteName ) {
					var ostritch = Object.assign( {}, GameSound );
					ostritch.init( 'ostritch.mp3' );
					ostritch.play();
					canMove = 1 === GameGrid.player;
				}

				if ( false === canMove ) {
					return;
				}

				var direction = 1 === GameGrid.player ? 'down' : 'up',
					grid = spritePos.replace('sprite','').split('-'),
					canMove = false;

				if ( 'up' === direction ) {
					var value = parseInt( grid[1] ) - GameGrid.diceNumber;
					if ( 1 > value ) value = 1 + ( Math.abs( value  - 1 ) );
				} else if ( 'down' === direction ) {
					var value = parseInt( grid[1] ) + GameGrid.diceNumber;
					if ( 8 < value ) value = 8 - ( Math.abs( 8 - value ) );
				}

				GameGrid.gameBoard[ parseInt( grid[1] -1 ) ][ parseInt( grid[0] -1 ) ] = '';
				GameGrid.gameBoard[ value - 1 ][ parseInt( grid[0] -1 ) ] = spriteName;

				/* Move calculations elsewhere... */
				var spriteProps = GameGrid.sprites[ spriteName ],
					tile = GameGrid.svg.querySelector( '.tile' + grid[0] + '-' + value ).getBoundingClientRect();

				sprite.setAttributeNS( null, 'class', 'sprite sprite' + grid[0] + '-' + value + ' ' + spriteName );
				sprite.setAttributeNS( null, 'x', tile.left + Math.abs( tile.width - spriteProps.width ) / 2 );
				sprite.setAttributeNS( null, 'y', tile.top - Math.abs( tile.height - spriteProps.height / GameGrid._ratio ) / 2 );

				GameGrid.gameState = 'roll';
				GameGrid.player = 1 === GameGrid.player ? 2 : 1;

			} else {
				var last = GameGrid.svg.querySelector( '.' + GameGrid._lastSelected );
				if ( last ){
					last.style.fill = GameGrid._lastFill;
				}
			}
		}

		if ( 'rect' === e.target.nodeName && 'dice' === e.target.id && 'roll' === GameGrid.gameState ) {
			var itteration = 0,
				number = 1,
				dicetimer = setInterval( function( e ) {
					number = Math.floor(Math.random() * 6) + 1 ;
					var dice = GameGrid.svg.querySelector( '#dice' );
					dice.style.fill = 'url(\'#dice' + number + '\')';
					itteration += 1;
					if( 10 === itteration) {
						itteration = 0;
						clearInterval( dicetimer );
						GameGrid.gameState = 'play';
						GameGrid.diceNumber = number;
					}
			}, 100 );
		}
	},

	dim: function( e ) {
		if ( 'rect' === e.target.nodeName && GameGrid.hasClass(e.target, 'tile' ) ) {
			// this._lastFill = e.target.style.fill;
			// e.target.style.fill = 'red';
			e.target.style.opacity = '0.5';
		}
	},

	restore: function( e ) {
		if ( 'rect' === e.target.nodeName && GameGrid.hasClass(e.target, 'tile' ) ) {
			// e.target.style.fill = this._lastFill;
			// e.target.style.background = 'url("./grass1.png")';
			e.target.style.opacity = '1.0';
		}
	}

} );

var sprites = {
	grass1: {
		src: 'grass1.png',
		width: false,
		height: false
	},
	grass2: {
		src: 'grass2.png',
		width: false,
		height: false
	},
	sheep: {
		src: 'sheep.png',
		width: 73,
		height: 72
	},
	sheep2: {
		src: 'sheep2.png',
		width: 73,
		height: 72
	},
	ostritch: {
		src: 'ostritch.png',
		width: 80,
		height: 114
	},
	ostritch2: {
		src: 'ostritch2.png',
		width: 87,
		height: 114
	},
	dice1: {
		src: 'dice1.png',
		width: 100,
		height: 100
	},
	dice2: {
		src: 'dice2.png',
		width: 100,
		height: 100
	},
	dice3: {
		src: 'dice3.png',
		width: 100,
		height: 100
	},
	dice4: {
		src: 'dice4.png',
		width: 100,
		height: 100
	},
	dice5: {
		src: 'dice5.png',
		width: 100,
		height: 100
	},
	dice6: {
		src: 'dice6.png',
		width: 100,
		height: 100
	}
}

var gameBoard = [
	[ '', 'ostritch', '', 'ostritch', '', 'ostritch', '', 'ostritch' ],
	[ '', '', '', '', '', '', '', '' ],
	[ '', '', '', '', '', '', '', '' ],
	[ '', '', '', '', '', '', '', '' ],
	[ '', '', '', '', '', '', '', '' ],
	[ '', '', '', '', '', '', '', '' ],
	[ '', '', '', '', '', '', '', '' ],
	[ 'sheep2', '', 'sheep2', '', 'sheep2', '', 'sheep2', '' ],
]

Object.assign( GameSound, {
	sound: false,
	init: function( src ) {
		this.sound = document.createElement("audio");
		this.sound.src = src;
		this.sound.setAttribute("preload", "auto");
		this.sound.setAttribute("controls", "none");
		this.sound.style.display = "none";
		document.body.appendChild(this.sound);
	},
	play: function(){
		this.sound.play();
	},
	stop: function(){
		this.sound.pause();
	}
} );

GameGrid.log('Document is ready!').prepare( GameGrid.setup, { gameBoard: gameBoard, sprites: sprites, surface: document.body, gridID: 'gamegrid' } );
