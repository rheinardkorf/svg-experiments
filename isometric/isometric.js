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
, 'touchcancel' ].forEach(function(event) {

  /* add event to SVG.Element */
  SVGElement.prototype[event] = function(f) {
    var self = this

    /* bind event to element rather than element node */
    this.node['on' + event] = typeof f == 'function' ?
      function() { return f.apply(self, arguments) } : null

    return this
  }

})

/**
 * GameGrid Object
 */
var GameGrid = GameGrid || {};

/**
 * Example of using Object.assign.
 * @see polifills.js for support of Object.assign.
 */
Object.assign( GameGrid, {

	_ratio: 0.8659333,
	_angle: 30,
	width: 60,
	height: 0,
	tileRows: 10,
	tileCols: 10,
	svg: false,
	map: false,
	defs: false,
	svgNS: 'http://www.w3.org/2000/svg',
	_topPoint: false,
	_leftPoint: false,
	_rightPoint: false,
	_bottomPoint: false,
	_origin: false,
	_lastFill: false,

	/**
	 * Create a document ready listener.
	 * @param fn
	 * @returns {GameGrid}
	 */
	ready: function ( fn, surface, gridID ) {

		if ( typeof surface === 'undefined' ) {
			this.surface = document.body;
		} else {
			this.surface = surface;
		}

		if ( typeof gridID === 'undefined' ) {
			this.gridID = 'gamegrid';
		} else {
			this.gridID = gridID;
		}

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
		// <pattern xmlns="http://www.w3.org/2000/svg" id="img1" patternUnits="userSpaceOnUse" width="600" height="450">
        //     <image xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="daisy-grass-repeating-background.jpg" x="0" y="0" width="600" height="450"/><!-- Image from http://silviahartmann.com/background-tile/6-grass-meadow-tile.php-->
        // </pattern>
		this.defs.appendChild( this.createPattern( 'grass1', 'grass1.png', this.width, this.height ) );
		this.defs.appendChild( this.createPattern( 'grass2', 'grass2.png', this.width, this.height ) );
		this.defs.appendChild( this.createPattern( 'sheep', 'sheep.png', this.width - 10 , this.width - 10 ) );
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
		image.setAttributeNS( null, 'height', width ); // because its square
		pattern.appendChild( image );

		if ( 'undefined' !== typeof xt && 'undefined' !== typeof yt ) {
			image.setAttributeNS( null, 'transform', 'translate(' + xt + ' ' + yt + ')' );
		} else if ( 'undefined' !== typeof xt ) {
			image.setAttributeNS( null, 'transform', 'translate(' + xt + ' 0)' );
		} else if ( 'undefined' !== typeof yt ) {
			image.setAttributeNS( null, 'transform', 'translate( 0 ' + yt + ')' );
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

		/**
		 * Adjust view accordingly.
		 */
		this.map.setAttributeNS( null, 'transform', 'translate(' + width / 2 + ' ' + 0 + ')' );
		this.svg.setAttribute( 'width', width);
		this.svg.setAttribute( 'height', height + 5);
		this.log( 'Viewport adjusted.');
	},

	draw: function() {
		var pos = document.querySelector( '.tile1-2' ).getBoundingClientRect();
		var block = document.createElementNS(this.svgNS, 'rect');
		block.setAttributeNS( null, 'x', pos.left + 20 );
		block.setAttributeNS( null, 'y', pos.top );
		block.setAttributeNS( null, 'width', this.width );
		block.setAttributeNS( null, 'height', this.height );
		block.setAttributeNS(null, 'style', 'fill:url(\'#sheep\');');
		this.svg.appendChild( block );

		var pos = document.querySelector( '.tile2-2' ).getBoundingClientRect();
		var block = document.createElementNS(this.svgNS, 'rect');
		block.setAttributeNS( null, 'x', pos.left + 20 );
		block.setAttributeNS( null, 'y', pos.top );
		block.setAttributeNS( null, 'width', this.width );
		block.setAttributeNS( null, 'height', this.height );
		block.setAttributeNS(null, 'style', 'fill:url(\'#sheep\');');
		this.svg.appendChild( block );

		// this.log( pos );


		// var block = document.createElementNS(this.svgNS, 'rect');
		// block.setAttributeNS( null, 'x', this.width * x);
		// block.setAttributeNS( null, 'y', this.height * y );
		// block.setAttributeNS( null, 'width', this.width );
		// block.setAttributeNS( null, 'height', this.height );
		// block.setAttributeNS( null, 'class', 'tile tile' + ( x + 1 ) + '-' + ( y + 1 ) );
		// pattern = 'grass2' === pattern ? 'grass1' : 'grass2';
		// block.setAttributeNS(null, 'style', 'fill:url(\'#' + pattern + '\');stroke:black;stroke-width:1');
		// block.setAttributeNS( null, 'transform', 'rotate(' + this._angle + ') skewX(' + (  -1 * this._angle ) + ')' );
		// this.map.appendChild( block );
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
		console.log( e.target.nodeName );
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

GameGrid.log('Document is ready!').ready( GameGrid.setup, document.body, 'gamegrid' );
