var cyclestreetsui = (function ($) {
	
	'use strict';
	
	// Settings defaults
	var _settings = {
		
		// API
		apiBaseUrl: 'API_BASE_URL',
		apiKey: 'YOUR_API_KEY',
		
		// Mapbox API key
		mapboxAccessToken: 'MAPBOX_ACCESS_TOKEN',
		
		// Initial lat/lon/zoom of map and tile layer
		defaultLocation: {
			latitude: 54.661,
			longitude: 1.263,
			zoom: 6
		},
		maxBounds: null,	// Or [W,S,E,N]
		defaultTileLayer: 'mapnik',
		maxZoom: 20
	};
	
	
	// Internal class properties
	var _map = null;
	
	
	return {
		
		// Main function
		initialise: function (config)
		{
			// Merge the configuration into the settings
			$.each (_settings, function (setting, value) {
				if (config.hasOwnProperty(setting)) {
					_settings[setting] = config[setting];
				}
			});
			
			cyclestreetsui.createMap ();
			cyclestreetsui.createUIEvents();
		},
		
		
		// Create the map
		createMap: function ()
		{
			// Create the map in the "map" div, set the view to a given place and zoom
			mapboxgl.accessToken = _settings.mapboxAccessToken;
			_map = new mapboxgl.Map({
				container: 'map',
				style: 'mapbox://styles/mapbox/light-v9',
				center: [_settings.defaultLocation.longitude, _settings.defaultLocation.latitude],
				zoom: _settings.defaultLocation.zoom
			});
			
			//_map.addControl (new mapboxgl.NavigationControl (), 'top-left'); can this be positioned elsewhere?
		},
		
		
		// Setup nav events
		createUIEvents: function ()
		{
			/* Nav bar functions */
			// Open the nav bar
			$('#hamburger-menu').click(function() {$('nav').addClass('open');});
			
			// Close the nav bar
			var closeNav = function() {$('nav').removeClass('open');};
			
			// Enable implicit click/touch on map as close menu
			if ($('nav').is(':visible')) {$('#map').click(function () {resetUI ();});}
			
			// Enable swipe-to-close
			$('nav').on('swipeleft', function () {$('nav').removeClass('open');});
			
			// Open the Data submenu
			$('li.data').click(function() {$('li.data ul').slideToggle();});
			
			
			/* Main UI functions */
			// Reset the UI to its default state
			var resetUI = function () {
				closeNav ();
				hideBrowseSearchBox ();
				closeRouteSearchBox ();
			};
			
			// Show the Browse search box
			$('#glasses-icon').click(function() {
				resetUI ();
				$('#browse-search-box').show();
				$('#browse-search-box').addClass( 'open' );
				$('#close-browse-box-icon').show();
				$('#glasses-icon').hide();
				$('#browse-search-box').animate({width: '80%',}, "slow");
				$('#browse-search-box').focus();
			});
			
			// Hide the Browse search box
			var hideBrowseSearchBox = function() {
				$('#browse-search-box').width('50px');
				$('#glasses-icon').show();
				$('#close-browse-box-icon').hide();
				$('#browse-search-box').removeClass( 'open' );
				$('#browse-search-box').hide();
			};
			
			// Open the route search box
			var routeSearchBoxFocus = function() {
				resetUI();
				$('#route-search-box, #route-search-panel, #route-box-handle, #shortcut-icons-div').addClass( 'open' );
				
			};
			
			// Close the route search box
			var closeRouteSearchBox = function() {
				$('#route-search-panel, #route-search-box, #route-box-handle, #shortcut-icons-div').removeClass( 'open' );
			};	
			
			// Close the Browse search box
			$('#close-browse-box-icon').click(hideBrowseSearchBox);
			
			// Open the Route search box
			$('#route-search-box').focus(routeSearchBoxFocus);
		}
	
	};	
} (jQuery));
