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
	svgNS: 'http://www.w3.org/2000/svg',
	_topPoint: false,
	_leftPoint: false,
	_rightPoint: false,
	_bottomPoint: false,
	_origin: false,

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

		this.map = document.createElementNS( this.svgNS, 'g' );
		this.svg.appendChild( this.map );
		this.log( 'Map area created.' );

		this.surface.appendChild( this.svg );

		this.svg.addEventListener( 'click', this.click );
		this.svg.addEventListener( 'mouseover', this.dim );
		this.svg.addEventListener( 'mouseout', this.restore );
		this.log( 'Events added.' );
	},

	draw: function() {
		var blocks = [];

		for ( y = 0; y < this.tileRows; y++ ) {
			for ( x = 0; x < this.tileCols; x++ ) {
				var block = document.createElementNS(this.svgNS, 'rect');
				block.setAttributeNS( null, 'x', this.width * x);
				block.setAttributeNS( null, 'y', this.height * y );
				block.setAttributeNS( null, 'width', this.width );
				block.setAttributeNS( null, 'height', this.height );
				block.setAttributeNS( null, 'class', 'tile' );
				block.setAttributeNS(null, 'style', 'fill:white;stroke:black;stroke-width:1');
				block.setAttributeNS( null, 'transform', 'rotate(' + this._angle + ') skewX(' + (  -1 * this._angle ) + ')' );
				this.map.appendChild( block );
			}
		}
		this.log( 'Blocks drawn.' );

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
		this.svg.setAttribute( 'height', height);
		this.log( 'Viewport adjusted.');
	},

	/**
	 * Events
	 */
	setup: function ( e ) {
		GameGrid.init();
		GameGrid.draw();
	},

	click: function( e ) {
		console.log( e.target.nodeName );
	},

	dim: function( e ) {

		if ( 'rect' === e.target.nodeName ) {
			e.target.style.fill = 'red';
			e.target.style.opacity = '0.5';
		}
	},

	restore: function( e ) {
		if ( 'rect' === e.target.nodeName ) {
			e.target.style.fill = 'white';
			e.target.style.opacity = '1.0';
		}
	}
} );

GameGrid.log('Document is ready!').ready( GameGrid.setup, document.body, 'gamegrid' );
