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
		$('#data-sub-menu').slideToggle();
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
	
	/* for demonstration purposes */
	var togglePhotomapMenuBadge = function() {
		if ($('#photomap-menu-badge').is(":visible")) {
			$('#photomap-menu-badge').removeClass('menu-badge').addClass('menu-badge-hidden');
		}
		else {
			$('#photomap-menu-badge').removeClass('menu-badge-hidden').addClass('mmenu-badge');
		}
	};
	
	mapboxgl.accessToken = 'API_KEY';
	var map = new mapboxgl.Map({
		container: 'map',
		style: 'mapbox://styles/mapbox/light-v9'
	});
	
	/* openNav(); for dev use */
	$('#data-sub-menu').hide();

	// Events
	// Nav
	/* $('#closeNavButton').click(closeNav); */
	$('#hamburger-menu').click(openNav);
	$('#data-menu-href').click(showDataMenu);
	$('#data-menu-badge').click(showDataMenu);
	$('#photomap-badge-row').click(togglePhotomapMenuBadge);
	
	// UI
	$('#glasses-icon').click(showBrowseSearchBox);
	$('#close-browse-box-icon').click(hideBrowseSearchBox);
	$('#route-search-box').focus(browseRouteSearchBox);
});