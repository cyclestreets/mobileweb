# CycleStreets mobile website


CycleStreets HTML5 site, featuring our leading cycle routing, Photomap, POIs, data layers for campaigning, and more.

A full 3D interface, including terrain.

Contributions and pull requests are very welcome.


## Features

* Our leading cycle journey planner
  * Plan cycle routes from A-B
  * UK coverage, and beyond
  * Choice of route types
  * Turn-by-turn directions list
  * Full waypoint support
  * Elevation display with slider
  * Recent searches
  * Recent journeys
* Photomap
  * View cycle infrastructure photos
  * Contribute your images
  * Filter by type, category
* POIs
  * E.g. bike shops, cycle parking
* Campaigning data layers
  * Collisions
  * Traffic counts
  * Cycle theft
  * Cycleability ratings
  * Planning applications
  * Cycling groups
* Full 3D interface
  * 3D
  * Pan/zoom support
  * Two-finger pan/rotate gesture support
  * Terrain
  * One-finger zoom: (double-tap-up/down) support
* Geolocation and geocoder
* Simultaneous layer support
* Blog
* Feedback
* Settings and signin
* Choice of map styles
  * Various vector styles
  * Bitmap styles
  * Historic map styles
* Share sheet support
* Night mode


## Credits

* Routing by Simon Nuttall
* Site development by Patrick Johansson
* Library development by Martin Lucas-Smith
* UX/UI design and concept by Martin Lucas-Smith & Patrick Johansson
* UI design and icons by Jamie Watson
* Uses Mapbox GL JS mapping library



## Installation

Contributions and pull requests are very welcome.

A supplied example Apache configuration is supplied.

1. Create an Apache VirtualHost; this is necessary as the site employs mod_rewrite for proper permalink support
2. Clone this repo
3. Clone the [Mapboxgljs.LayerViewer library](https://github.com/cyclestreets/Mapboxgljs.LayerViewer) into /js/lib/ or use an alias as per the Apache configuration
4. Clone the [routing-ui library](https://github.com/cyclestreets/routing-ui) into /js/lib/ or use an alias as per the Apache configuration


## Code structure

Three components are used: The current repo, a layer management library, and a routing UI library.

The site structure is as follows:

- (1) The current repo, which is a user interface class, defines the available data layers, and contains UI logic; it uses:
  - (2) The Mapboxgljs.LayerViewer library, which is a general UI library responsible for managing multiple layers on a map.
  - (3) The routing-ui library (for the journey planner layer), which is a routing UI library, managing the mechanics of planning a route.

The `index.html` file defines various libraries and then runs `/js/cyclestreets.js` which contains the site logic.

All URL requests, other than assets, are challenged into that index.html file, using rewriting at webserver level.


## Copyright

Copyright CycleStreets Ltd, 2020-21.


## License

GPL3.
