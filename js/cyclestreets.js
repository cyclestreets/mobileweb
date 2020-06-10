var cyclestreetsui = (function ($) {
	
	'use strict';
	
	// Default settings
	var _settings = {
		
		// CycleStreets API
		apiBaseUrl: 'https://api.cyclestreets.net',
		apiKey: 'YOUR_API_KEY',
		
		// Mapbox API key
		mapboxApiKey: 'MAPBOX_ACCESS_TOKEN',
		
		// Initial lat/long/zoom of map and tile layer
		defaultLocation: {
			latitude: 51.51137,
			longitude: -0.10498,
			zoom: 17
		},
		defaultTileLayer: 'opencyclemap',
		
		// Default layers ticked
		defaultLayers: ['photomap'],
		
		// Icon size, set globally for all layers
		iconSize: [38, 42],
		
		// Enable scale bar
		enableScale: true,
		
		// First-run welcome message
		firstRunMessageHtml: '<p>Welcome to CycleStreets.</p>',

		// Images; size set in CSS with .itinerarymarker
		images: {
			start: '/images/wisps/start.png',
			waypoint: '/images/wisps/waypoint.png',
			finish: '/images/wisps/finish.png'
		}
		
	};
	
	// Class properties
	var _map = null;
	var _breadcrumbs = []; // Breadcrump trail used when clicking left chevrons
	var _isMobileDevice = true;
	var _panningEnabled = false;

	// Enable panels and additional functionality
	var _actions = [
		'journeyPlanner',
		'rideTracker',
		'settings'
	];

	// Layer definitions
	var _layerConfig = {
		
		collisions: {
			apiCall: '/v2/collisions.locations',
			apiFixedParameters: {
				jitter: '1',
				datetime: 'friendly'
			},
			fullZoom: 17,
			parameterNamespace: 'field:',		// See: https://www.cyclestreets.net/api/v2/collisions.locations/
			sendZoom: true,	// Needed for jitter support
			iconField: 'severity',
			icons: {
				slight:  '/images/icons/icon_collision_slight.svg',
				serious: '/images/icons/icon_collision_serious.svg',
				fatal:   '/images/icons/icon_collision_fatal.svg'
			},
			markerImportance: ['slight', 'serious', 'fatal'],
			popupHtml:
				  '<p><a href="{properties.url}"><img src="/images/icons/bullet_go.png" /> <strong>View full, detailed report</a></strong></p>'
				+ '<p>Reference: <strong>{properties.id}</strong></p>'
				+ '<p>'
				+ 'Date and time: <strong>{properties.datetime}</strong><br />'
				+ 'Severity: <strong>{properties.severity}</strong><br />'
				+ 'Casualties: <strong>{properties.casualties}</strong><br />'
				+ 'No. of Casualties: <strong>{properties.Number_of_Casualties}</strong><br />'
				+ 'No. of Vehicles: <strong>{properties.Number_of_Vehicles}</strong>'
				+ '</p>'
		},
		
		taxidata: {
			apiCall: '/v2/advocacydata.taxis',
			iconUrl: '/images/icons/road_neutral.svg',
			heatmap: true
		},
		
		trafficcounts: {
			apiCall: '/v2/trafficcounts.locations',
			apiFixedParameters: {
				groupyears: '1'
			},
			iconUrl: '/images/icons/icon_congestion_bad.svg',
			lineColourField: 'car_pcu',	// #!# Fixme - currently no compiled all_motors_pcu value
			lineColourStops: [
				[40000, '#ff0000'],	// Colour and line values based on GMCC site
				[20000, '#d43131'],
				[10000, '#e27474'],
				[5000, '#f6b879'],
				[2000, '#fce8af'],
				[0, '#61fa61']
			],
			lineWidthField: 'cycle_pcu',	// #!# Fixme - should be Daily cycles
			lineWidthStops: [
				[1000, 10],
				[500, 8],
				[100, 6],
				[10, 4],
				[0, 2],
			],
			popupHtml:	// Popup code thanks to https://hfcyclists.org.uk/wp/wp-content/uploads/2014/02/captions-html.txt
				  '<p>Count Point {properties.id} on <strong>{properties.road}</strong>, a {properties.road_type}<br />'
				+ 'Located in {properties.wardname} in {properties.boroughname}<br />'
				+ '[macro:yearstable({properties.minyear}, {properties.maxyear}, cycles;p2w;cars;buses;lgvs;mgvs;hgvs;all_motors;all_motors_pcu, Cycles;P2W;Cars;Buses;LGVs;MGVs;HGVs;Motors;Motor PCU)]'
				+ '<p><strong>{properties.maxyear} PCU breakdown -</strong> Cycles: {properties.cycle_pcu}, P2W: {properties.p2w_pcu}, Cars: {properties.car_pcu}, Buses: {properties.bus_pcu}, LGVs: {properties.lgv_pcu}, MGVs: {properties.mgv_pcu}, HGVs: {properties.hgv_pcu}</p>'
				+ '</div>'
		},
		
		planningapplications: {
			apiCall: 'https://www.planit.org.uk/api/applics/geojson',
			apiFixedParameters: {
				pg_sz: 100,
				limit: 100
			},
			apiKey: false,
			iconUrl: '/images/icons/signs_neutral.svg',
			iconSizeField: 'app_size',
			iconSizes: {
				'Small': [24, 24],
				'Medium': [36, 36],
				'Large': [50, 50],
			},
			popupHtml:
				  '<p><strong>{properties.description}</strong></p>'
				+ '<p>{properties.address}</p>'
				+ '<p>Size of development: <strong>{properties.app_size}</strong><br />'
				+ 'Type of development: <strong>{properties.app_type}</strong><br />'
				+ 'Status: <strong>{properties.app_state}</strong></p>'
				+ '<p>Reference: <a href="{properties.url}">{properties.uid}</a><br />'
				+ 'Local Authority: {properties.authority_name}<br />'
				+ 'Date: {properties.start_date}</p>'
				+ '<p><a href="{properties.url}"><img src="images/icons/bullet_go.png" /> <strong>View full details</a></strong></p>'
		},
		
		bikeshare: {
			apiCall: '/v2/pois.locations',
			apiFixedParameters: {
				type: 'londoncyclehire',	// NB This value likely to be changed (generalised) in future
				limit: 400
			},
			iconField: 'iconUrl',
			iconSize: [28, 28],
			popupHtml:
				  '<p><strong>Cycle hire dock</strong></p>'
				+ '<p>{properties.name}</p>'
				+ '<p>{properties.notes}</p>'
		},
		
		triplengths: {
			apiCall: '/v2/usage.journeylengths',
			polygonStyle: 'grid',
			popupHtml:
				  '<p>Average distance: <strong>{properties.distance}km</strong>'
		},
		
		pois: {
			apiCall: '/v2/pois.locations',
			apiFixedParameters: {
				fields: 'id,name,osmTags[capacity,access,bicycle_parking,covered],nodeId',
				limit: 400
			},
			iconUrl: '/images/icons/cycleparking_good.svg',
			//iconField: 'iconUrl',		// icons specified in the field value
			iconSize: [24, 24],
			popupHtml:
				  '<p><strong>Cycle parking</strong></p>'
				+ '<table>'
				+ '<tr><td>Spaces:</td><td>{properties.Capacity}</td></tr>'
				+ '<tr><td>Access:</td><td>{properties.Access}</tr>'
				+ '<tr><td>Type:</td><td>{properties.Bicycle_parking}</tr>'
				+ '<tr><td>Covered?:</td><td>{properties.Covered}</tr>'
				+ '</table>'
				+ '<p class="edit"><a href="https://www.openstreetmap.org/edit?node={properties.nodeId}" target="_blank">Add/edit details</a></p>'
		},
		
		// https://data.police.uk/docs/method/crime-street/
		// https://data.police.uk/api/crimes-street/bicycle-theft?poly=52.199295,0.124497:52.214312,0.124497:52.214312,0.1503753:52.1992,0.15037:52.19929,0.1244&date=2016-07
		cycletheft: {
			apiCall: 'https://data.police.uk/api/crimes-street/bicycle-theft',
			retrievalStrategy: 'polygon',
			flatJson: ['location.latitude', 'location.longitude'],
			apiKey: false,
			apiBoundaryField: 'poly',
			apiBoundaryFormat: 'latlon-comma-colons',
			iconUrl: '/images/icons/icon_enforcement_bad.svg',
			popupHtml:
				  '<p>Crime no.: <strong>{properties.persistent_id}</strong></p>'
				+ '<p>'
				+ 'Date: <strong>{properties.month}</strong><br />'
				+ 'Location: <strong>{properties.location.street.name}</strong><br />'
				+ 'Outcome: <strong>{properties.outcome_status.category}</strong><br />'
				+ '</p>'
				+ '<p>Note: The location given in the police data is <a href="https://data.police.uk/about/#location-anonymisation" target="_blank" title="See more details [link opens in a new window]">approximate</a>, for anonymity reasons.</p>'
		},
		
		// https://www.cyclescape.org/api
		issues: {
			apiCall: 'https://www.cyclescape.org/api/issues.json',
			apiKey: false,
			apiFixedParameters: {
				page: 1,
				per_page: 100
			},
			iconUrl: '/images/icons/destinations_bad.svg',
			polygonStyle: 'red',
			popupHtml:
				  '<p><strong><a href="{properties.cyclescape_url}">{properties.title}</a></strong></p>'
				+ '<div class="scrollable">'
				+ '{properties.description}'	// Already HTML
				+ '</div>'
				+ '<p><a href="{properties.cyclescape_url}">Full details</a></p>'
		},
		
		photomap: {
			apiCall: '/v2/photomap.locations',
			apiFixedParameters: {
				fields: 'id,captionHtml,hasPhoto,thumbnailUrl,url,username,licenseName,iconUrl,categoryName,metacategoryName,datetime,apiUrl',
				limit: 150,
				thumbnailsize: 300,
				datetime: 'friendlydate'
			},
			iconField: 'iconUrl',		// icons specified in the field value
			popupHtml:
				  '<p><a href="/photomap/{properties.id}/" id="details" data-url="{properties.apiUrl}&thumbnailsize=800"><img src="{properties.thumbnailUrl}" /></a></p>'
				+ '<div class="scrollable">'
				+ '<strong>{properties.captionHtml}</strong>'
				+ '</div>'
				+ '<table>'
				+ '<tr><td>Date:</td><td>{properties.datetime}</td></tr>'
				+ '<tr><td>By:</td><td>{properties.username}</td></tr>'
				+ '<tr><td>Category:</td><td>{properties.categoryName} &mdash; {properties.metacategoryName}</td></tr>'
				+ '</table>'
				+ '<p><a href="{properties.url}"><img src="images/icons/bullet_go.png" /> <strong>View full details</a></strong></p>',
			detailsOverlay: 'apiUrl',
			overlayHtml:
				  '<table class="fullimage">'
				+ '<tr>'
				+ '<td>'
				+ '<p><img src="{properties.thumbnailUrl}" /></p>'
				+ '</td>'
				+ '<td>'
				+ '<p>'
				+ '<strong>{properties.caption}</strong>'
				+ '</p>'
				+ '<table>'
				// + '<tr><td>Date:</td><td>{properties.datetime}</td></tr>'
				+ '<tr><td>By:</td><td>{properties.username}</td></tr>'
				// + '<tr><td>Category:</td><td>{properties.categoryName} &mdash; {properties.metacategoryName}</td></tr>'
				+ '</table>'
				+ '{%streetview}'
				+ '</td>'
				+ '</tr>'
				+ '</table>'
		},
		
		// https://wiki.openstreetmap.org/wiki/Strava
		strava: {
			apiCall: false,
			apiKey: false,
			tileLayer: {
				tiles: 'https://tile.cyclestreets.net/strava/ride/{%style}/{z}/{x}/{y}@2x.png',	// E.g. https://heatmap-external-c.strava.com/tiles/ride/blue/11/1026/674.png?v=19
				maxZoom: 11.999,
				attribution: 'Strava heatmap',
				tileSize: 512,
				label: 'Strava heatmap'
			}
		},
		
		// https://www.cyipt.bike/api/#width
		widths: {
			apiCall: 'https://www.cyipt.bike/api/v1/width.json',
			sendZoom: true,
			lineColourField: 'width',
			lineColourStops: [
				[14, '#4575b4'],
				[12, '#74add1'],
				[10, '#abd9e9'],
				[8, '#e0f3f8'],
				[6, '#fee090'],
				[4, '#fdae61'],
				[2, '#f46d43'],
				[0, '#d73027']
			],
			lineWidthField: 'width',
			lineWidthStops: [
				[21, 8],
				[14, 7],
				[8, 6],
				[5, 5],
				[3, 4],
				[0, 3],
			],
			popupHtml:
				  '<p>Width: {properties.width}</p>'
				+ '{%streetview}'
		},
		
		// https://www.cyclestreets.net/api/v2/mapdata/
		cycleability: {
			apiCall: '/v2/mapdata',
			apiFixedParameters: {
				limit: 400,
				types: 'way'
			},
			sendZoom: true,
			popupHtml:
				  '<table>'
				+ '<tr><td>Name:</td><td><strong>{properties.name}</strong></td></tr>'
				+ '<tr><td>OSM ID:</td><td><a href="https://www.openstreetmap.org/way/{properties.id}" target="_blank" title="[Link opens in a new window]">{properties.id}</a></td></tr>'
				+ '<tr><td>Cycleable?</td><td>{properties.cyclableText}</td></tr>'
				+ '<tr><td>Quietness:</td><td><strong>{properties.quietness}</strong></td></tr>'
				+ '<tr><td>Speed rating</td><td>{properties.speed}</td></tr>'
				+ '<tr><td>Pause</td><td>{properties.pause}</td></tr>'
				+ '<tr><td>Type</td><td>{properties.ridingSurface}</td></tr>'
				+ '</table>'
				+ '<p>{%osmeditlink}</p>'
		},
		
		// https://www.cyclescape.org/api
		groups: {
			apiCall: 'https://www.cyclescape.org/api/groups.json',
			apiKey: false,
			polygonStyle: 'green',
			popupHtml:
				  '<p><strong>{properties.title}</strong></p>'
				+ '<p>{properties.description}</p>'
				+ '<p><a href="{properties.url}">Cyclescape group</a></p>'
		},
		
		// https://www.cyclestreets.net/api/v2/isochrones.show/
		howfar: {
			apiCall: '/v2/isochrones.show',
			iconUrl: '/images/icons/destinations_good.svg',
			setMarker: 'lonlat',
			polygonStyle: 'blue'
		},
		
		// https://www.cyclestreets.net/api/v2/infrastructure.locations/
		tflcid: {
			apiCall: '/v2/infrastructure.locations',
			apiFixedParameters: {
				dataset: 'tflcid',
				thumbnailsize: 400
			},
			iconSize: [24, 24],
			iconField: 'iconUrl',
			style: {
				LineString: {
					'line-color': 'red',
					'line-width': 3
				}
			},
			popupImagesField: 'images',
			popupLabels: {
				ss_road: 'Road marking',
				ss_patch: 'Coloured patch on surface',
				ss_facing: 'Facing off-side',
				ss_nocyc: 'No cycling',
				ss_noveh: 'No vehicles',
				ss_circ: 'Circular/Rectangular',
				ss_exempt: 'Exemption',
				ss_noleft: 'No left turn exception',
				ss_norigh: 'No right turn exception',
				ss_left: 'Compulsory turn left exception',
				ss_right: 'Compulsory turn right exception',
				ss_noexce: 'No straight ahead exception',
				ss_dismou: 'Cyclists dismount',
				ss_end: 'End of Route',
				ss_cycsmb: 'Cycle symbol',
				ss_pedsmb: 'Pedestrian symbol',
				ss_bussmb: 'Bus symbol',
				ss_smb: 'Other vehicle symbol',
				ss_lnsign: 'Line on sign',
				ss_arrow: 'Direction arrow',
				ss_nrcol: 'Road marking or Sign includes a number in a box',
				ss_ncn: 'National Cycle Network',
				ss_lcn: 'London Cycle Network',
				ss_superh: 'Cycle Superhighway',
				ss_quietw: 'Quietway',
				ss_greenw: 'Greenway',
				ss_routen: 'Route Number',
				ss_destn: 'Destination',
				ss_access: 'Access times',
				ss_name: 'TSRGD Sign number',
				ss_colour: 'Colour of Patch',
				sig_head: 'Cycle signal head',
				sig_separa: 'Separate stage for cyclists',
				sig_early: 'Early release',
				sig_twostg: 'Two stage turn',
				sig_gate: 'Cycle gate/Bus gate',
				trf_raised: 'Raised table',
				trf_entry: 'Raised side road entry treatment',
				trf_cushi: 'Speed cushions',
				trf_hump: 'Speed hump',
				trf_sinuso: 'Sinusoidal',
				trf_barier: 'Barrier',
				trf_narow: 'Carriageway narrowing',
				trf_calm: 'Other traffic calming',
				rst_steps: 'Steps',
				rst_lift: 'Lift',
				prk_carr: 'Carriageway',
				prk_cover: 'Covered',
				prk_secure: 'Secure',
				prk_locker: 'Locker',
				prk_sheff: 'Sheffield',
				prk_mstand: 'M stand',
				prk_pstand: 'P stand',
				prk_hoop: 'Cyclehoop',
				prk_post: 'Post',
				prk_buterf: 'Butterfly',
				prk_wheel: 'Wheel rack',
				prk_hangar: 'Bike hangar',
				prk_tier: 'Two tier',
				prk_other: 'Other / unknown',
				prk_provis: 'Provision',
				prk_cpt: 'Capacity',
				clt_carr: 'On / Off Carriageway',
				clt_segreg: 'Segregated lane / track',
				clt_stepp: 'Stepped lane / track',
				clt_parseg: 'Partially segregated lane / track',
				clt_shared: 'Shared lane or footway',
				clt_mandat: 'Mandatory cycle lane',
				clt_advis: 'Advisory cycle lane',
				clt_priori: 'Cycle lane/track priority',
				clt_contra: 'Contraflow lane/track',
				clt_bidire: 'Bi-directional',
				clt_cbypas: 'Cycle bypass',
				clt_bbypas: 'Continuous cycle facilities at bus stop',
				clt_parkr: 'Park route',
				clt_waterr: 'Waterside route',
				clt_ptime: 'Full-time / Part-time',
				clt_access: 'Access times',
				asl_fdr: 'Feeder lane',
				asl_fdrlft: 'Feeder lane on left',
				asl_fdcent: 'Feeder Lane in centre',
				asl_fdrigh: 'Feeder lane on right',
				asl_shared: 'Shared nearside lane',
				crs_signal: 'Signal controlled crossing',
				crs_segreg: 'Segregated cycles and pedestrians',
				crs_cygap: 'Cycle gap',
				crs_pedest: 'Pedestrian Only Crossing',
				crs_level: 'Level Crossing',
				res_pedest: 'Pedestrian only route',
				res_bridge: 'Pedestrian bridge',
				res_tunnel: 'Pedestrian tunnel',
				res_steps: 'Steps',
				res_lift: 'Lift',
				colour: 'Surface colour',
				road_name: 'Road name',
				osm_id: 'OSM way ID assignment',
				'_type': 'Asset type'
			},
			popupFormatters: {
				osm_id: function (value, feature) {return '<a href="https://www.openstreetmap.org/way/' + value + '" target="_blank">' + value + '</a>';}
			}
		},
		
		// OpenStreetMap; see: https://wiki.openstreetmap.org/wiki/API_v0.6
		osm: {
			apiCall: 'https://www.openstreetmap.org/api/0.6/map',	// Will return XML; see: https://wiki.openstreetmap.org/wiki/API_v0.6#Retrieving_map_data_by_bounding_box:_GET_.2Fapi.2F0.6.2Fmap
			bbox: true,
			dataType: 'xml',
			minZoom: 19,
			fullZoom: 19,
			fullZoomMessage: 'OSM data is only available from zoom 19 - please zoom in further.',
			style: {
				LineString: {
					'line-color': 'red',
					'line-width': 3
				}
			},
			convertData: function (osmXml) {
				var geojson = osm2geo (osmXml);		// Requires osm2geo from https://gist.github.com/tecoholic/1396990
				geojson.features = geojson.features.filter (function (feature) { return (feature.geometry.type == 'LineString') });	// See: https://stackoverflow.com/a/2722213
				return geojson;
			}
		}
	};
	
	
	return {
		
		// Main function
		initialise: function (config)
		{
			// Merge the configuration into the settings
			$.each (_settings, function (setting, value) {
				if (config.hasOwnProperty (setting)) {
					_settings[setting] = config[setting];
				}
			});
			
			
			// Run the layerviewer for these settings and layers
			layerviewer.initialise (_settings, _layerConfig);
			_map = layerviewer.getMap ();

			// Autocomplete
			cyclestreetsui.autocomplete ();
			
			// Initialise the UI
			cyclestreetsui.mainUI ();
			cyclestreetsui.navBar ();
			cyclestreetsui.popupActions ();
			
			// Initialise developerTools
			//cyclestreetsui.developerTools ();
			
			// Initialise each section
			$.each (_actions, function (setting, action) {
				cyclestreetsui[action] ();
			});

			// Add routing
			cyclestreetsui.routing ();
			
			// Show the default panel
			$('.panel.journeyplanner.search').delay (300).slideToggle ('slow');
			
			
		},
		
		// Routing
		routing: function ()
		{
			// Delegate to separate class
			routing.initialise (_settings, _map, _isMobileDevice, _panningEnabled);
		},
		
		// Autocomplete
		autocomplete: function ()
		{
			// Enable autocomplete for Photomap tags; see: https://stackoverflow.com/a/21398000/180733
			$('#photomap input[name="tags"]').autocomplete({
				minLength: 3,
				source: function (request, response) {
					$.ajax({
						dataType: 'json',
						type : 'GET',
						url: _settings.apiBaseUrl + '/v2/photomap.tags?key=' + _settings.apiKey + '&limit=10',
						data: {
							match: request.term
						},
						success: function (data) {
							response ($.map (data, function (item) {
								return {
									label: item.tag,
									value: item.tag
								}
							}));
						}
					});
				}
			});
		},
		
		// Layer-specific behaviour
		tflCid: function ()
		{
			// Provide drop-down filters based on feature type, firstly getting the schema from the server
			$.ajax({
				url: _settings.apiBaseUrl + '/v2/infrastructure.schema?dataset=tflcid&key=' + _settings.apiKey,
				success: function (schema) {
					
					// Load description for type dropdown and filters
					var field = $("form #tflcid select[name='type']").val ();
					cyclestreetsui.setFilters (schema, field);
					$("form #tflcid select[name='type']").on ('change', function () {
						cyclestreetsui.setFilters (schema, this.value);
					});
				}
			});
		},
		
		
		// Helper function to set the field
		setFilters: function (schema, field)
		{
			// If no field selected (i.e. blank option), set HTML to be empty
			if (!field) {
				$('#featuretypedescription p').html ('All feature types are shown. Change the box above to filter to particular asset types.');
				$('#featuretypefilters').html ('');
				return;
			}
			
			// Set description for type dropdown
			$('#featuretypedescription p').html (schema[field]['description']);
			
			// Obtain the selected fields
			var fields = schema[field]['fields'];
			
			// Create HTML controls for each field
			var html = '<p>Filter to:</p>';
			$.each (fields, function (field, attributes) {
				var fieldname = 'field:' + field;
				
				// Parse out the form field
				var matches = attributes.datatype.match (/^([A-Z]+)\((.+)\)$/);
				var type = matches[1];
				var option = matches[2];
				var widgetHtml = '';
				switch (type) {
					case 'VARCHAR':
						widgetHtml = '<input name="' + fieldname + '" type="text" maxlength=' + option + '" />';
						break;
					case 'INT':
						widgetHtml = '<input name="' + fieldname + '" type="number" maxlength=' + option + '" step="1" min="0" style="width: 4em;" />';
						break;
					case 'ENUM':
						var matches = option.match(/'[^']*'/g);		// https://stackoverflow.com/a/11227539/180733
						if (matches) {
							for (var i=0, len=matches.length; i<len; i++) {
								matches[i] = matches[i].replace(/'/g, '');
							}
						}
						widgetHtml  = '<select name="' + fieldname + '">';
						widgetHtml += '<option value="">';
						$.each (matches, function (index, value) {
							widgetHtml += '<option value="' + value + '">' + value + '</option>'
						});
						widgetHtml += '</select>';
				}
				
				// Assemble the HTML
				html += '<hr />';
				html += '<p>' + layerviewer.htmlspecialchars (attributes.field) + ':</p>';
				html += '<p>' + widgetHtml + '</p>';
				html += '<p class="smaller">' + layerviewer.htmlspecialchars (attributes.description) + '</p>';
			});
			
			// Add reset link
			// #!# Doesn't currently force a form/URL rescan
			html = '<p class="smaller right"><a id="resetfilters" href="#">[Reset filters]</a></p>' + html;
			$(document).on ('click', '#resetfilters', function (e) {
				$.each (fields, function (field, attributes) {
					var fieldname = 'field:' + field;
					$('input[name="' + fieldname + '"], select[name="' + fieldname + '"]').val (function() {return this.defaultValue;} );	// https://stackoverflow.com/a/8668089/180733
				});
				e.preventDefault ();
			});
			
			// Show the HTML
			$('#featuretypefilters').html (html);
		},
		
		// Function to go the map page
		mapPageLink: function (longitude, latitude)
		{
			var zoom = 13;		// #!# Currently fixed - need to compute dynamically, e.g. https://github.com/mapbox/mapbox-unity-sdk/issues/1125
			var targetUrl = '/map/' + '#' + zoom + '/' + latitude.toFixed(6) + '/' + longitude.toFixed(6);
			window.location.href = targetUrl;
		},
		
		
		/*
		 * Nav bar functions
		 */
		navBar: function () {
			
			// Open the nav bar
			$('#hamburger-menu').click(function() {
				$('nav').show ('slide', {direction: 'left' }, 300);
			});
			
			// Enable implicit click/touch on map as close menu			
			$('#map').click(function () {
				if ($('nav').is (':visible')) {cyclestreetsui.resetUI ();}
			});
			
			// Enable swipe-to-close
			$('nav').on('swipeleft', function () {
				$('nav').hide ('slide', {direction: 'left'}, 300);
			});
			
			// Open card from main nav items
			$('nav ul > li').click (function () {
				
				// Get the class name from the li
				var className = this.className.split (' ')[0];
				
				// If this is the data menu item, open its sub-menu
				if (className == 'data') {
					// Open the Data submenu
					$('li.data ul').slideToggle ();
				
				// Otherwise, close the nav and open the desired panel
				} else {
					// Hide nav & open searchbars and all panels
					cyclestreetsui.resetUI ();
					$('.panel').hide ();
				
					// Reset the breadcrumb trail as we are starting a new "journey" from the nav
					_breadcrumbs = [];
				
					// Show the matching panel
					$('.panel.' + className).first ().slideToggle (); // Slide in animations do not work smoothly
				}
			});
		},
		
		// Close the nav bar
		closeNav: function() {$('nav').hide ("slide", {direction: "left"}, 300);},
		
		
		/*
		 * Journey planner functions
		 */
		journeyPlanner: function ()
		{	
			// Open the route search box
			var routeSearchBoxFocus = function() {
				cyclestreetsui.resetUI ();
				$('.panel.journeyplanner.search').addClass ('open', 500);
			};
			
			// Open the Route search box
			$('.panel.journeyplanner.search input').focus (routeSearchBoxFocus);
			
			// Show the routing options after clicking on routing button
			$('.panel.journeyplanner.search ul li a').click (function () {
				cyclestreetsui.switchPanel ('.panel.journeyplanner.search', '.panel.journeyplanner.select');
			});
			
			// Display the elevation graph
			var ctx = document.getElementById('elevationChart').getContext ('2d');
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
			$('.elevation-scrubber').draggable ({axis: "x"});
		},
		
			
		// Close the route search box
		closeRouteSearchBox: function() {$('.panel.journeyplanner.search').removeClass ('open');},
			
		
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
			$('.action.back').click (function () {
				// Follow any directly specified href
				var href = $(this).attr ('href');
				if (href != '#') {
					// Get the current panel class name
					var currentPanel = $(this).closest ('.panel').attr ('class');
					currentPanel = '.' + currentPanel.replace (/\s/g, '.');
					
					// Build a class name out of the href
					href = href.replace (/^#/, '.');
					
					// Switch panels
					cyclestreetsui.switchPanel (currentPanel, href);
				} 
				else {
					// If we have stored a previous breadcrump, return to it
					if (_breadcrumbs.length > 0) {
						// Hide all panels
						$('.panel').hide ();
						
						// Show the previous panel
						var lastPanel = _breadcrumbs.pop ();
						$(lastPanel).first ().show ();
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
				var closestPanel = $(this).closest ('.panel').attr ('class'); // i.e., 'panel photomap'
				var panelClass = closestPanel.split (' '); // Split the current panel, i.e. [panel, photomap]
				var wizardClass = cyclestreetsui.removeFromArray (panelClass, 'panel');
				wizardClass = '.wizard' + '.' + wizardClass; // i.e., '.wizard.photomap'
				
				// Locate the first panel of this wizard
				var firstWizardPanel = $(wizardClass).find ('.panel').first ();
				
				// Switch panel, and add the current panel to the breadcrumb trail
				closestPanel = closestPanel.replace (/\s/g, '.');
				cyclestreetsui.switchPanel ('.' + closestPanel, firstWizardPanel);
			});
			
			// Move forward in a wizard
			$('.action.forward').click (function() {
				
				// Did we click inside a wizard?
				var wizard = $(this).closest ('.wizard');
				if (wizard.length) {
					
					// Get current panel name and convert spaces into dots
					var currentPanel = $(this).closest ('.panel').attr ('class');
					currentPanel = currentPanel.replace (/\s/g, '.');
					
					// Get the panel class we are in, without sub-panel
					var panelClass = currentPanel.split ('.'); // Split the current panel, i.e. [panel, photomap, add-photo]
					panelClass.pop(); // Pop the sub-panel out of the array
					panelClass = panelClass.join ('.'); // Reconstruct the string from array, i.e panel.photomap
					panelClass = '.' + panelClass; // Add the leading dot, i.e. .panel.photomap
					
					// Find the next children of this panel
					var nextPanel = $(this).closest ('.panel').next (panelClass);
					var nextPanelClass = '.' + nextPanel.attr ('class').replace (/\s/g, '.');
					
					// Check whether we can progress
					if (!cyclestreetsui.canProgress ('.' + currentPanel)) {
						return;
					}
					// Switch the panel
					cyclestreetsui.switchPanel ('.' + currentPanel, nextPanelClass);
				}
				
			});
			
			// On every click inside a wizard, check to see if we can progress
			$('.wizard .panel').click (function () {
				cyclestreetsui.enableNavigation (this);
			});
			
			// On every click inside a wizard, check to see if we can progress
			$('.wizard .panel').keydown (function () {
				cyclestreetsui.enableNavigation (this);
			});
			
			 $('input:file').change(function (){
				cyclestreetsui.enableNavigation (this);
			 });
			
			// Show the move-map-to search box
			$('#glasses-icon').click (function() {
				cyclestreetsui.resetUI ();
				$('#browse-search-box').show ();
				$('#browse-search-box').addClass ('open');
				$('#close-browse-box-icon').show ();
				$('#glasses-icon').hide ();
				$('#browse-search-box').animate ({width: '70%',}, "slow");
				$('#browse-search-box').focus ();
			});
			
			// Close the Browse search box
			$('#close-browse-box-icon').click (cyclestreetsui.hideBrowseSearchBox);
			
			// Slide up the ride notification on click
			$('.ride-notification').click( function () {
				$('.ride-notification').slideUp ('slow');
			});
		},
		
		// Enable wizard navigation
		enableNavigation: function (element) {
			// Get current panel name and convert spaces into dots
			var currentPanel = $(element).closest ('.panel').attr ('class');
			currentPanel = currentPanel.replace (/\s/g, '.');
			
			var canProgress = cyclestreetsui.canProgress ('.' + currentPanel);
			$('.' + currentPanel + ' .action.forward').toggleClass ('enabled', canProgress);	
		},
		
		// Determine whether any form item within the selector has been filled
		canProgress: function (selector)
		{
			// Find closest data input types in this panel
			var nearestInputs = [];
			var inputTypes = ['input', 'select', 'textarea', 'textfield']; // Add other types
			$.each(inputTypes, function (index, type) {
				// Find all inputs of this type
				var closestInputs = $(selector).find (type);
				
				// If any were found, add this to the nearestInputs array
				if (closestInputs.length) {nearestInputs.push (closestInputs);}
			});
			
			// If any of these have not been filled out, can not progress
			var canProgress = true; // Default action is to progress
			$.each(nearestInputs, function (index, input) {
				var value = $(input).val ();
				if (!value) {canProgress = false;}
			});
			
			return canProgress;
		},
		
		// Hide the move-map-to search box
		hideBrowseSearchBox: function()
		{
			$('#browse-search-box').width ('50px');
			$('#glasses-icon').show ();
			$('#close-browse-box-icon').hide ();
			$('#browse-search-box').removeClass ('open');
			$('#browse-search-box').hide ();
		},
		
		// Switch panel
		switchPanel: function (currentPanel, destinationPanel) {
			_breadcrumbs.push (currentPanel);
			$(currentPanel).hide ();
			$(destinationPanel).show ();
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
			$('.panel').hide (); // Hide all panels
			$('.panel.journeyplanner.search').show (); // Show the default pannel, i.e. journeyplanner search
		},
			
			
		/*
		 * Ride tracker actions
		 */
		rideTracker: function ()
		{
			// Main ridetracker panel actions
			$('.panel.ridetracker.track .action.forward').click (function () {
				if ($('.panel.ridetracker').hasClass ('tracking')) {
						// Reset the ride tracking panel to default state
						$('.panel.ridetracker.track').hide ();
						$('.panel.ridetracker.track').removeClass ('tracking');
						$('#cancel-tracking, #finish-tracking').removeClass ('enabled');
						$('#my-rides-button, #start-ride-tracking').addClass ('enabled');
						
						
						// Open the add-details panel
						cyclestreetsui.switchPanel ('.panel.ridetracker.track', '.panel.ridetracker.add-details');
					}
				else {
						// Add breadcrumb to enable the back chevron functionality
						_breadcrumbs.push ('.panel.ridetracker.track');
						
						// Add tracking classes to adjust the appearance of this panel to satnav-mode
						$('.panel.ridetracker.track').addClass ('tracking');
						$('#my-rides-button, #start-ride-tracking').removeClass ('enabled');
						$('#cancel-tracking, #finish-tracking'). addClass('enabled');
					}
			});
			
			$('.panel.ridetracker.track .action.back').click (function () {
				// If we are in satnav mode, cancel the tracking and return to default state
				if ($('.panel.ridetracker.track').hasClass ('tracking')) {
						$('.panel.ridetracker.track').removeClass ('tracking');
						$('#cancel-tracking, #finish-tracking').removeClass ('enabled');
						$('#my-rides-button, #start-ride-tracking').addClass ('enabled');
					}
				// Otherwise, open the My Rides panel
				else {
						//cyclestreetsui.switchPanel ('.panel.ridetracker.track', '.panel.ridetracker.my-rides');
					}
			});
			
			
			$('.panel.ridetracker.add-details .action.forward').click (function () {
				cyclestreetsui.switchPanel ('.panel.ridetracker.add-details', '.panel.ridetracker.show-tracked-ride');
			});
			
			// Enable the share sheet 
			$('.panel.ridetracker.show-tracked-ride .action.forward').click (function () {
				const shareData = {
					title: 'My CycleStreets Journey',
					text: 'View my latest journey here!',
					url: 'https://www.cyclestreets.net/journey/52327060/'
				};
				navigator.share (shareData);
			});
		},
		
			
		/*
		 * Settings, about and map-styles
		 */
		settings: function ()
		{
			// Open about card
			$('#about-cyclestreets').click (function () {
				cyclestreetsui.switchPanel ('.panel.settings', '.panel.about');
			});
		},
		
			
		/*
		 * Popup actions
		 */
		popupActions: function ()
		{
			// Close a popup panel
			$('.popup .close-button').click (function() {
				$('.popup').hide('300');
			});
			
			// Flip photomap popup card
			$('.popup a.flip').click (function () {
				$('#inner-card').addClass('flipped');
			});
			$('.popup a.back').click (function () {
				$('#inner-card').removeClass('flipped');
			});
			
			// Start navigation from a places popup card
			$('.popup .get-directions').click (function () {
				cyclestreetsui.switchPanel ('.popup.places', '.panel.journeyplanner.select');
			});
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
