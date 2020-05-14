var cyclestreetsui = (function ($) {
	
	'use strict';
	
	// Default settings
	var _settings = {
		
		// CycleStreets API
		apiBaseUrl: 'API_BASE_URL',
		apiKey: 'YOUR_API_KEY',
		
		// Mapbox API key
		mapboxAccessToken: 'MAPBOX_ACCESS_TOKEN',
		
		// Initial lat/long/zoom of map and tile layer
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
	
	// Breadcrump trail used when clicking left chevrons
	var _breadcrumbs = [];
	
	
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
			
			// Create the maps, mini-maps and UI events
			cyclestreetsui.createMap ('map');
			cyclestreetsui.createMap ('mini-map');
			cyclestreetsui.createUIEvents();
			$('.panel.journeyplanner.search').show();
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
			/*
			 * Nav bar functions
			 */
			
			// Open the nav bar
			$('#hamburger-menu').click(function() {$('nav').show("slide", { direction: "left" }, 300);});
			
			// Close the nav bar
			var closeNav = function() {$('nav').hide("slide", { direction: "left" }, 300);};
			
			// Enable implicit click/touch on map as close menu
			if ($('nav').is(':visible')) {$('#map').click(function () {resetUI ();});}
			
			// Enable swipe-to-close
			$('nav').on('swipeleft', function () {$('nav').hide("slide", { direction: "left" }, 300);});
			
			// Open card from main nav items
			$('nav ul > li').click( function () {
				// Get the class name from the li
				var className = this.className.split(' ')[0];
				
				// If this is the data menu item, open its sub-menu
				if (className == 'data') {
					// Open the Data submenu
					$('li.data ul').slideToggle();
				}
				// Otherwise, close the nav and open the desired panel
				else {
					// Hide nav & open searchbars and all panels
					resetUI ();
					$('.panel').hide();
				
					// Reset the breadcrumb trail as we are starting a new "journey" from the nav
					_breadcrumbs = [];
				
					// Show the matching panel
					$('.panel.' + className).first().show();
				}
			});
			
			
			/*
			 * Main UI functions
			 */
			
			// Switch panel
			var switchPanel = function (currentPanel, destinationPanel) {
				_breadcrumbs.push(currentPanel);
				$(currentPanel).hide();
				$(destinationPanel).show();
			};
			
			// Return to previous card
			$('.action.back').click(function () {
				// If we have stored a previous breadcrump, return to it
				if (_breadcrumbs.length > 0) {
					// Hide all panels
					$('.panel').hide();
					
					// Show the previous panel
					var lastPanel = _breadcrumbs.pop();
					$(lastPanel).first().show();
				}
				else {
					// Otherwise, if there are no breadcrumbs, return to the default home screen
					returnHome ();	
				}
			});
			
			// Reset nav and move-map search box to their default states
			var resetUI = function () {
				// Close the nav bar
				closeNav ();
				
				// Reset the route search box to default "peeking" height
				closeRouteSearchBox ();
				
				// Hide the move-map browse input field
				hideBrowseSearchBox ();
			};
			
			// Set-up the default home-screen
			var returnHome = function () {
				resetUI ();
				$('.panel').hide();
				$('.panel.journeyplanner.search').show();
			};
			
			// Show the move-map-to search box
			$('#glasses-icon').click(function() {
				resetUI ();
				$('#browse-search-box').show();
				$('#browse-search-box').addClass( 'open' );
				$('#close-browse-box-icon').show();
				$('#glasses-icon').hide();
				$('#browse-search-box').animate({width: '80%',}, "slow");
				$('#browse-search-box').focus();
			});
			
			// Hide the move-map-to search box
			var hideBrowseSearchBox = function() {
				$('#browse-search-box').width('50px');
				$('#glasses-icon').show();
				$('#close-browse-box-icon').hide();
				$('#browse-search-box').removeClass( 'open' );
				$('#browse-search-box').hide();
			};
			
			// Close the Browse search box
			$('#close-browse-box-icon').click(hideBrowseSearchBox);
			
			// Slide up the ride notification on click
			$('#ride-notification').click( function () {
				$('#ride-notification').slideUp('slow');
			});
			
			
			/*
			 * Journey planner functions
			 */
			
			// Open the route search box
			var routeSearchBoxFocus = function() {
				resetUI();
				$('.panel.journeyplanner.search').addClass( 'open' );
			};
			
			// Open the Route search box
			$('.panel.journeyplanner.search input').focus(routeSearchBoxFocus);
					
			// Close the route search box
			var closeRouteSearchBox = function() {$('.panel.journeyplanner.search').removeClass( 'open' );};
			
			// Make route browser div dragable
			$('.panel.journeyplanner.search').draggable ({
				axis: "y",
				refreshPositions: true,
				grid: [ 50, 350 ],
				drag: function () {
				}
			});
			
			// Show the routing options after clicking on routing button
			$('.panel.journeyplanner.search ul li a').click(function() {
				$('.panel.journeyplanner.search').hide();
				$('.panel.journeyplanner.select').show();
			});
			
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
			
			
			/*
			 * Ride tracker actions
			 */
			
			// Main ridetracker panel actions
			$('.panel.ridetracker.track .action.forward').click( function () {
				if ($('.panel.ridetracker').hasClass('tracking')) {
						// Reset the ride tracking panel to default state
						$('.panel.ridetracker.track').hide();
						$('.panel.ridetracker.track').removeClass('tracking');
						$('#cancel-tracking, #finish-tracking').removeClass('enabled');
						$('#my-rides-button, #start-ride-tracking').addClass('enabled');
						
						
						// Open the add-details panel
						switchPanel ('.panel.ridetracker.track', '.panel.ridetracker.add-details');
					}
				else {
						// Add breadcrumb to enable the back chevron functionality
						_breadcrumbs.push ('.panel.ridetracker.track');
						
						// Add tracking classes to adjust the appearance of this panel to satnav-mode
						$('.panel.ridetracker.track').addClass('tracking');
						$('#my-rides-button, #start-ride-tracking').removeClass('enabled');
						$('#cancel-tracking, #finish-tracking').addClass('enabled');
					}
			});
			
			$('.panel.ridetracker.track .action.back').click( function () {
				// If we are in satnav mode, cancel the tracking and return to default state
				if ($('.panel.ridetracker.track').hasClass('tracking')) {
						$('.panel.ridetracker.track').removeClass('tracking');
						$('#cancel-tracking, #finish-tracking').removeClass('enabled');
						$('#my-rides-button, #start-ride-tracking').addClass('enabled');
					}
				// Otherwise, open the My Rides panel
				else {
						_breadcrumbs.push ('.panel.ridetracker.track');
						$('.panel.ridetracker.track').hide();
						$('.panel.ridetracker.my-rides').show();
					}
			});
			
			$('.panel.ridetracker.add-details .action.forward').click( function () {
				switchPanel ('.panel.ridetracker.add-details', '.panel.ridetracker.show-tracked-ride');
			});
			
			// Enable the share sheet 
			$('.panel.ridetracker.show-tracked-ride .action.forward').click( function () {
				const shareData = {
					title: 'My CycleStreets Journey',
					text: 'View my latest journey here!',
					url: 'https://www.cyclestreets.net/journey/52327060/'
				};
				navigator.share(shareData);
			});
			
			
			/*
			 *  Photomap actions
			 */
			
			// Photomap panel navigation actions
			$('.panel.photomap .action.forward').click(function() {				
				switchPanel ('.panel.photomap', '.panel.photomap.add-location');
			});
			
			$('.panel.photomap.add-location .action.forward').click(function() {				
				switchPanel ('.panel.photomap.add-location', '.panel.photomap.add-details');
			});
			
			$('.panel.photomap.add-details .action.forward').click(function() {				
				switchPanel ('.panel.photomap.add-details', '.panel.photomap.uploading');
			});
			
			$('.panel.photomap.uploading a').click(function() {				
				returnHome ();
			});
			
			
			/*
			 * Account management and sign-in
			 */
			
			// When creating account, after inputting username, display password set card
			$('#choose-username-next').click( function (){
				$('#create-account-panel').addClass('open');
				$('#choose-username').addClass('hidden');
				$('#choose-password').removeClass('hidden');
				$('#choose-username-next').addClass('hidden');
				$('#finish-account-creation').removeClass('hidden');
			});
			
			
			/*
			 * Settings, about and map-styles
			 */
			
			// Close map-style card
			$('.panel.map-style .action.forward').click( function () {
				returnHome ();
			});
			
			
			// Close settings card
			$('.panel.settings .action.forward').click( function () {
				returnHome ();
			});
			
			// Open about card
			$('#about-cyclestreets').click( function () {
				switchPanel ('.panel.settings', '.panel.about');
				//_breadcrumbs.push('.panel.settings');
				//$('.panel.settings').hide();
				//$('.panel.about').show();
			});
			
			// Close about card
			$('.panel.about .action.forward').click( function () {
				returnHome ();
			});
		
			
			/*
			 * Popup actions
			 */
			
			// Close a popup panel
			$('.popup .close-button').click( function() {
				$('.popup').hide('300');
			});
			
			// Flip photomap popup card
			$('.popup a.flip').click( function () {
				$('#inner-card').addClass('flipped');
			});
			$('.popup a.back').click( function () {
				$('#inner-card').removeClass('flipped');
			});
			
			// Start navigation from a places popup card
			$('.popup .get-directions').click( function () {
				switchPanel ('.popup.places', '.panel.journeyplanner.select');
			});
			
			
			/*
			 * Developer tools
			 */
			
			// Capture click event
			//$(document).click(function(){
			//	console.log ('Previous breadcrumbs are: ' + _breadcrumbs);
			//});
			
			// While developing, shortcut to certain panels on load
			$('.panel.settings').show();
			
			// Test the ride notification slide-down notification
			//$('#ride-notification').delay(2000).slideDown('slow');
		}
	};	
} (jQuery));
