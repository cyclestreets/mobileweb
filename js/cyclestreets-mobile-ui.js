$(function() {
	// Handlers
	var openNav = function() {
		$('nav').addClass('open');
	};

	var closeNav = function() {
		$('nav').removeClass('open');
	};
	
	// Enable implicit click/touch on map as close menu
	if ($('nav').is(':visible')) {
		$('#map').click(function () {
			$('nav').removeClass('open');
		});
	};
	
	// Enable swipe-to-close
	$('nav').on('swipeleft', function () {
		$('nav').removeClass('open');
	});

	var showDataMenu = function() {
		$('li.data ul').slideToggle();
	};
	
	var showBrowseSearchBox = function() {
		$('#browse-search-box').show();
		$('#browse-search-box').addClass( 'open' );
		$('#close-browse-box-icon').show();
		$('#glasses-icon').hide();
		$('#browse-search-box').animate({width: '80%',}, "slow");
		$('#browse-search-box').focus();
	};
	
	var hideBrowseSearchBox = function() {
		$('#browse-search-box').width('50px');
		$('#glasses-icon').show();
		$('#close-browse-box-icon').hide();
		$('#browse-search-box').removeClass( 'open' );
		$('#browse-search-box').hide();
	};
	
	var browseRouteSearchBox = function() {
		hideBrowseSearchBox();
		$('#route-search-panel').addClass( 'open' );
		$('#routeroute-search-box').addClass( 'open' );
		$('#route-box-handle').addClass( 'open' );
	};
	
	mapboxgl.accessToken = 'API_KEY';
	var map = new mapboxgl.Map({
		container: 'map',
		style: 'mapbox://styles/mapbox/light-v9'
	});
	
	/* openNav(); to speed up design process */

	// Events
	// Nav
	$('#hamburger-menu').click(openNav);
	$('li.data').click(showDataMenu);
	
	// UI
	$('#glasses-icon').click(showBrowseSearchBox);
	$('#close-browse-box-icon').click(hideBrowseSearchBox);
	$('#route-search-box').focus(browseRouteSearchBox);
});