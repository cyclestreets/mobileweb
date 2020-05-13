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
			
			cyclestreetsui.createMap ('map');
			cyclestreetsui.createMap ('mini-map');
			cyclestreetsui.createUIEvents();
		},
		
		
		// Create the map
		createMap: function (container)
		{
			// Create the map in the "map" div, set the view to a given place and zoom
			mapboxgl.accessToken = _settings.mapboxAccessToken;
			_map = new mapboxgl.Map({
				container: container,
				style: 'mapbox://styles/mapbox/light-v9',
				center: [_settings.defaultLocation.longitude, _settings.defaultLocation.latitude],
				zoom: _settings.defaultLocation.zoom,
				
				// We display attribution in the nav, so remove it from the map (https://docs.mapbox.com/help/how-mapbox-works/attribution/)
				attributionControl: false
			});
		},
		
		
		// Setup nav events
		createUIEvents: function ()
		{
			/* Nav bar functions */
			// Open the nav bar
			$('#hamburger-menu').click(function() {$('nav').show("slide", { direction: "left" }, 300);});
			
			// Close the nav bar
			var closeNav = function() {$('nav').hide("slide", { direction: "left" }, 300);};
			
			// Enable implicit click/touch on map as close menu
			if ($('nav').is(':visible')) {$('#map').click(function () {resetUI ();});}
			
			// Enable swipe-to-close
			$('nav').on('swipeleft', function () {$('nav').hide("slide", { direction: "left" }, 300);});
			
			// Open the Data submenu
			$('li.data').click(function() {$('li.data ul').slideToggle();});
			
			// Open the route search box
			var routeSearchBoxFocus = function() {
				resetUI();
				$('#route-search-box, #route-search-panel').addClass( 'open' );
				$('#shortcut-icons, #journey-options').addClass ('visible');
				
			};
			
			// Make route browser div dragable
			$('#route-search-panel').draggable ({
				axis: "y",
				refreshPositions: true,
				grid: [ 50, 350 ],
				drag: function () {
					routeSearchBoxFocus ();
				}
			});
			
			
			/* Main UI functions */
			// Reset the UI to its default state
			var resetUI = function () {
				closeNav ();
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
			
			// Close the route search box
			var closeRouteSearchBox = function() {
				$('#route-search-panel, #route-search-box').removeClass( 'open' );
				$('#shortcut-icons, #journey-options').removeClass ('visible');
				
			};
			
			// Display the elevation graph
			var ctx = document.getElementById('elevationChart').getContext('2d');
			var myChart = new Chart(ctx, {
			  type: 'line',
			  data: {
				labels: [1, 5, 3, 5, 3, 2, 5],
				datasets: [{
				  label: '',
				  data: [1, 3, 5, 3, 7, 8, 4],
				  backgroundColor: "rgba(220,79,85,1)"
				}]
			  },
			options: {
					responsive:true,
					maintainAspectRatio: false,
					elements: {
					    point:{
					        radius: 0
					    }
					},
					layout: {
						padding: {
						left: -10,
						right: 0,
						top: 0,
						bottom: -10
						}
					},
					legend: {
						display: false,
					},
					scales: {
						 xAxes: [{
							ticks: {
								display: false
							},
							gridLines: {
								drawOnChartArea: false,
								drawBorder: true,
								display: false
							}
						}],
						yAxes: [{
							gridLines: {
								drawOnChartArea: false,
								drawBorder: true,
								display: false
							},
							ticks: {
								display: false
							}
						}]
					}
				}
			});
			
			// Make elevation scrubber draggable
			$('#elevation-scrubber').draggable({axis: "x"});
			
			// Close the Browse search box
			$('#close-browse-box-icon').click(hideBrowseSearchBox);
			
			// Open the Route search box
			$('#route-search-box').focus(routeSearchBoxFocus);
			
			// Development "tour" actions
			$('#photomap-add-button').click(function() {				
				$('#photomap-panel').hide();
				$('#photomap-add-location-panel').show();
			});
			$('#photomap-add-location-continue').click(function() {				
				$('#photomap-add-location-panel').hide();
				$('#photomap-add-details-panel').show();
			});
			$('#photomap-upload').click(function() {				
				$('#photomap-add-details-panel').hide();
				$('#photomap-uploading-panel').show();
			});
			$('#cancel-photomap-upload').click(function() {				
				$('#photomap-uploading-panel').hide();
				$('#route-search-panel').show();
			});
			
			
			// Open card from main nav items
			$('nav ul > li').click( function () {
				// Hide nav & open searchbars or panels
				resetUI ();
				$('.panel').hide();
				
				// Get the class name from the li
				var className = this.className.split(' ')[0];
				
				// Show the matching panel
				$('#' + className + '-panel').show();
			});
			
			
			// Hide photomap popup panel
			$('#popup-close-button').click( function() {
				$('#photomap-popup-panel').hide('300');
			});
			
			// When creating account, after inputting username, display password set card
			$('#choose-username-next').click( function (){
				$('#create-account-panel').addClass('open');
				$('#choose-username').addClass('hidden');
				$('#choose-password').removeClass('hidden');
				$('#choose-username-next').addClass('hidden');
				$('#finish-account-creation').removeClass('hidden');
			});
			
			// Hide the user information input panel, and display the creating account card
			$('#finish-account-creation').click ( function () {
				$('#create-account-panel').hide();
				$('#creating-account-panel').show();
			});
			
			// Close sign-in card
			$('#cancel-sign-in').click( function () {
				resetUI();
				$('#sign-in-panel').hide();
				$('#route-search-panel').show();
			});
			
			// Close sign-in card
			$('#cancel-sign-in').click( function () {
				resetUI();
				$('#sign-in-panel').hide();
				$('#route-search-panel').show();
			});
			
			// Open sign-up card
			$('#create-account-button').click( function () {
				$('#sign-in-panel').hide();
				$('#create-account-panel').show();
			});
			
			
			// Close map-style card
			$('#map-style-done').click( function () {
				$('#map-style-panel').hide();
				$('#route-search-panel').show();
			});
			
			
			// Close settings card
			$('#settings-done').click( function () {
				$('#settings-panel').hide();
				$('#route-search-panel').show();
			});
			
			// Open about card
			$('#about-cyclestreets').click( function () {
				$('#settings-panel').hide();
				$('#about-panel').show();
			});
			
			// Open settings card (coming back from About)
			$('#about-back-button').click( function () {
				$('#about-panel').hide();
				$('#settings-panel').show();
			});
			
			// Close about card
			$('#about-done').click( function () {
				$('#about-panel').hide();
				$('#route-search-panel').show();
			});
				
			// Start ride tracking
			$('#start-ride-tracking').click( function () {
				$('#ridetracker-panel').addClass('tracking');
				$('#my-rides-button, #start-ride-tracking').removeClass('enabled');
				$('#cancel-tracking, #finish-tracking').addClass('enabled');
			});
			
			// Open add-ride-details panel
			$('#finish-tracking').click( function () {
				$('#ridetracker-panel').hide();
				$('#add-ride-details-panel').show();
			});
			
			// Cancel add-ride-details panel
			$('#continue-satnav-mode').click( function () {
				$('#add-ride-details-panel').hide();
				$('#ridetracker-panel').show();
			});
			
			// Save and show the ride details
			$('#save-ride-button').click( function () {
				$('#add-ride-details-panel').hide();
				$('#show-tracked-ride-panel').show();
			});
			
			// Cancel ride tracking
			$('#cancel-tracking').click( function () {
				$('#cancel-tracking, #finish-tracking').removeClass('enabled');
				$('#my-rides-button, #start-ride-tracking').addClass('enabled');
				$('#ridetracker-panel').removeClass('tracking');
				
			});
			
			// Open my-rides panel
			$('#my-rides-button').click( function () {
				$('#ridetracker-panel').hide();
				$('#my-rides-panel').show();
			});
			
			// Open the my-rides information screen
			$('#my-rides-panel ul li').click(function() {
				$('#my-rides-panel').hide();
				$('#ride-info-panel').show();
			});
			
			// Close rides info panel
			$('#ride-info-back').click( function () {
				$('#ride-info-panel').hide();
				$('#my-rides-panel').show();
			});
			
			// Close my-rides panel
			$('#my-rides-back').click( function () {
				$('#my-rides-panel').hide();
				$('#ridetracker-panel').show();
			});
			
			// Close rides info panel
			$('#close-ride-tracker').click( function () {
				$('#show-tracked-ride-panel').hide();
				$('#route-search-panel').show();
			});
			
			// Open feedback panel
			$('#feedback-menu-item').click( function () {
				resetUI();
				$('#route-search-panel').hide();
				$('#feedback-panel').show();
			});
			
			// Close feedback panel
			$('#cancel-feedback').click( function () {
				$('#feedback-panel').hide();
				$('#route-search-panel').show();
				
			});
			
			// Slide up the ride notification on click
			$('#ride-notification').click( function () {
				$('#ride-notification').slideUp('slow');
			});
			
			// Flip photomap popup card
			$('#photo-info-flip').click( function () {
				$('#inner-card').addClass('flipped');
			});
			$('#popup-back-button').click( function () {
				$('#inner-card').removeClass('flipped');
			});
			
			
			
			// While developing, shortcut to certain panels on load
			//$('#route-search-panel').hide();
			//$('#ride-notification').delay(2000).slideDown('slow');
			$('#map-style-panel').show();
			
			
		}
	
	};	
} (jQuery));
