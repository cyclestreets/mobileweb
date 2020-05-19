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
	
	var _actions = [
		'journeyPlanner',
		'rideTracker',
		'settings',
		'developerTools'
	];
	
	
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
			
			// Create the maps
			cyclestreetsui.createMap ('map');
			cyclestreetsui.createMap ('mini-map');
			
			// Initialise the UI
			cyclestreetsui.mainUI ();
			cyclestreetsui.navBar ();
			cyclestreetsui.popupActions ();
			
			// Initialise each section
			$.each (_actions, function (setting, value) {
				cyclestreetsui[value] ();
			});
			
			// Show the default panel
			$('.panel.journeyplanner.search').show();
		},
		
		
		// Create the map
		createMap: function (container)
		{
			// Create the map in the "map" div, set the view to a given place and zoom
			mapboxgl.accessToken = _settings.mapboxAccessToken;
			_map = new mapboxgl.Map({
				container: container,
				style: 'mapbox://styles/mapbox/streets-v11',
				center: [_settings.defaultLocation.longitude, _settings.defaultLocation.latitude],
				zoom: _settings.defaultLocation.zoom,
				
				// We display attribution in the nav, so remove it from the map (https://docs.mapbox.com/help/how-mapbox-works/attribution/)
				attributionControl: false
			});
		},
		
		
		/*
		 * Nav bar functions
		 */
		navBar: function () {
			
			// Open the nav bar
			$('#hamburger-menu').click(function() {$('nav').show("slide", { direction: "left" }, 300);});
			
			// Enable implicit click/touch on map as close menu
			if ($('nav').is(':visible')) {$('#map').click(function () {cyclestreetsui.resetUI ();});}
			
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
					cyclestreetsui.resetUI ();
					$('.panel').hide();
				
					// Reset the breadcrumb trail as we are starting a new "journey" from the nav
					_breadcrumbs = [];
				
					// Show the matching panel
					$('.panel.' + className).first().show();
				}
			});
		},
		
		// Close the nav bar
		closeNav: function() {$('nav').hide("slide", { direction: "left" }, 300);},
		
		
		/*
		 * Journey planner functions
		 */
		journeyPlanner: function ()
		{	
			// Open the route search box
			var routeSearchBoxFocus = function() {
				cyclestreetsui.resetUI();
				$('.panel.journeyplanner.search').addClass( 'open' );
			};
			
			// Open the Route search box
			$('.panel.journeyplanner.search input').focus(routeSearchBoxFocus);
					
			
			
			// Make route browser div dragable
			/*
			$('.panel.journeyplanner.search').draggable ({
				axis: "y",
				refreshPositions: true,
				grid: [ 50, 350 ],
				drag: function () {
				}
			});
			*/
			
			// Show the routing options after clicking on routing button
			$('.panel.journeyplanner.search ul li a').click(function() {
				cyclestreetsui.switchPanel ('.panel.journeyplanner.search', '.panel.journeyplanner.select');
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
			$('.elevation-scrubber').draggable({axis: "x"});
		},
		
			
		// Close the route search box
		closeRouteSearchBox: function() {$('.panel.journeyplanner.search').removeClass( 'open' );},
			
		
		/*
		 * Main UI functions
		 */
		mainUI: function ()
		{
			
			// Swiping down on a card closes it
			$('.panel').on('swipedown', function () {
				cyclestreetsui.returnHome ();
			});
			
			// Swiping up on a card opens it
			$('.panel').on('swipeup', function () {
				$(this).addClass ('open');
			});
			
			// Generic handler for back actions
			$('.action.back').click(function () {
				// Follow any directly specified href
				var href = $(this).attr('href');
				if (href != '#') {
					// Get the current panel class name
					var currentPanel = $(this).closest('.panel').attr('class');
					currentPanel = '.' + currentPanel.replace(/\s/g, '.');
					
					// Build a class name out of the href
					href = href.replace(/^#/, '.');
					
					// Switch panels
					cyclestreetsui.switchPanel (currentPanel, href);
				} 
				else {
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
						cyclestreetsui.returnHome ();	
					}
				}
			});
			
			// Generic action to return home clicking cancel button
			$('.returnHome').click (function () {cyclestreetsui.returnHome ();});
			
			// Generic action to start a wizard
			$('.start-wizard').click (function () {
				
				// Get current panel name and deduce the wizard name from the class name
				var closestPanel = $(this).closest('.panel').attr('class'); // i.e., 'panel photomap'
				var panelClass = closestPanel.split(' '); // Split the current panel, i.e. [panel, photomap]
				var wizardClass = cyclestreetsui.removeFromArray (panelClass, 'panel');
				wizardClass = '.wizard' + '.' + wizardClass; // i.e., '.wizard.photomap'
				
				// Locate the first panel of this wizard
				var firstWizardPanel = $(wizardClass).find('.panel').first();
				
				// Switch panel, and add the current panel to the breadcrumb trail
				closestPanel = closestPanel.replace(/\s/g, '.');
				cyclestreetsui.switchPanel ('.' + closestPanel, firstWizardPanel);
			});
			
			// Move forward in a wizard
			$('.action.forward').click (function() {
				
				// Did we click inside a wizard?
				var wizard = $(this).closest('.wizard');
				if (wizard.length) {
					
					// Get current panel name and convert spaces into dots
					var currentPanel = $(this).closest('.panel').attr('class');
					currentPanel = currentPanel.replace(/\s/g, '.');
					
					// Get the panel class we are in, without sub-panel
					var panelClass = currentPanel.split('.'); // Split the current panel, i.e. [panel, photomap, add-photo]
					panelClass.pop(); // Pop the sub-panel out of the array
					panelClass = panelClass.join('.'); // Reconstruct the string from array, i.e panel.photomap
					panelClass = '.' + panelClass; // Add the leading dot, i.e. .panel.photomap
					
					// Find the next children of this panel
					var nextPanel = $(this).closest('.panel').next(panelClass);
					var nextPanelClass = '.' + nextPanel.attr('class').replace(/\s/g, '.');
					
					// Check whether we can progress
					if (!cyclestreetsui.canProgress ('.' + currentPanel)) {
						return;
					}
					
					// Switch the panel
					cyclestreetsui.switchPanel ('.' + currentPanel, nextPanelClass);
				}
			});
			
			// Show the move-map-to search box
			$('#glasses-icon').click(function() {
				cyclestreetsui.resetUI ();
				$('#browse-search-box').show();
				$('#browse-search-box').addClass( 'open' );
				$('#close-browse-box-icon').show();
				$('#glasses-icon').hide();
				$('#browse-search-box').animate({width: '80%',}, "slow");
				$('#browse-search-box').focus();
			});
			
			// Close the Browse search box
			$('#close-browse-box-icon').click(cyclestreetsui.hideBrowseSearchBox);
			
			// Slide up the ride notification on click
			$('.ride-notification').click( function () {
				$('.ride-notification').slideUp('slow');
			});
		},
		
		// Determine whether any form item within the selector has been filled
		canProgress: function (selector)
		{
			// Find closest data input types in this panel
			var nearestInputs = [];
			var inputTypes = ['input', 'select', 'textarea', 'textfield']; // Add other types
			$.each(inputTypes, function (index, type) {
				// Find all inputs of this type
				var closestInputs = $(selector).find(type);
				
				// If any were found, add this to the nearestInputs array
				if (closestInputs.length) {nearestInputs.push(closestInputs);}
			});
			
			// If any of these have not been filled out, can not progress
			var canProgress = true; // Default action is to progress
			$.each(nearestInputs, function(index, input) {
				var value = $(input).val();
				if (!value) {canProgress = false;}
			});
			
			return canProgress;
		},
		
		// Hide the move-map-to search box
		hideBrowseSearchBox: function() {
			$('#browse-search-box').width('50px');
			$('#glasses-icon').show();
			$('#close-browse-box-icon').hide();
			$('#browse-search-box').removeClass( 'open' );
			$('#browse-search-box').hide();
		},
		
		// Switch panel
		switchPanel: function (currentPanel, destinationPanel) {
			_breadcrumbs.push(currentPanel);
			$(currentPanel).hide();
			$(destinationPanel).show();
		},
		
		// Reset nav and move-map search box to their default states
		resetUI: function () {
			// Close the nav bar
			cyclestreetsui.closeNav ();
			
			// Reset the route search box to default "peeking" height
			cyclestreetsui.closeRouteSearchBox ();
			
			// Hide the move-map browse input field
			cyclestreetsui.hideBrowseSearchBox ();
		},
		
		// Set-up the default home-screen
		returnHome: function () {
			cyclestreetsui.resetUI ();
			$('.panel').hide(); // Hide all panels
			$('.panel.journeyplanner.search').show(); // Show the default pannel, i.e. journeyplanner search
		},
			
			
		/*
		 * Ride tracker actions
		 */
		rideTracker: function ()
		{
			// Main ridetracker panel actions
			$('.panel.ridetracker.track .action.forward').click( function () {
				if ($('.panel.ridetracker').hasClass('tracking')) {
						// Reset the ride tracking panel to default state
						$('.panel.ridetracker.track').hide();
						$('.panel.ridetracker.track').removeClass('tracking');
						$('#cancel-tracking, #finish-tracking').removeClass('enabled');
						$('#my-rides-button, #start-ride-tracking').addClass('enabled');
						
						
						// Open the add-details panel
						cyclestreetsui.switchPanel ('.panel.ridetracker.track', '.panel.ridetracker.add-details');
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
						//cyclestreetsui.switchPanel ('.panel.ridetracker.track', '.panel.ridetracker.my-rides');
					}
			});
			
			
			$('.panel.ridetracker.add-details .action.forward').click( function () {
				cyclestreetsui.switchPanel ('.panel.ridetracker.add-details', '.panel.ridetracker.show-tracked-ride');
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
		},
		
			
		/*
		 * Settings, about and map-styles
		 */
		settings: function ()
		{
			// Open about card
			$('#about-cyclestreets').click( function () {
				cyclestreetsui.switchPanel ('.panel.settings', '.panel.about');
			});
		},
			
			
		/*
		 * Popup actions
		 */
		popupActions: function ()
		{
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
				cyclestreetsui.switchPanel ('.popup.places', '.panel.journeyplanner.select');
			});
		},	
		
			
		/*
		 * Developer tools
		 */
		developerTools: function ()
		{
			// Capture click event
			//$(document).click(function(){
			//	console.log ('Previous breadcrumbs are: ' + _breadcrumbs);
			//});
			
			// While developing, shortcut to certain panels on load
			//$('.popup.ride-notification').delay(2000).slideDown();
			
			// Test the ride notification slide-down notification
			//$('#ride-notification').delay(2000).slideDown('slow');
		},
		
		
		/*
		 * Utilities
		 */
		removeFromArray: function (myArray, removeItem)
		{
			myArray.splice ($.inArray (removeItem, myArray), 1);
			return myArray;
		}
	};	
} (jQuery));
