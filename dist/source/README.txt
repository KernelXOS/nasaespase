KILLA - Earth Change Observatory
NASA Space Apps 2026 | Team KILLA Esmeraldas | Educational prototype

This project explores real NASA POWER annual grid estimates near Esmeraldas and
Cuenca, Ecuador, for 2001-2025. The interface compares two environmental variables,
plots annual series and ordinary least-squares trends, and reports nominal
Student-t 95% slope intervals. It includes date selection, comparison, CSV export,
source data and provenance, and a seven-slide English demonstration.

This is a first working prototype, with global coverage and classroom co-design
as future work. It is not a validated climate attribution or forecasting service.
See analysis/README.md for the method, assumptions, references and limitations.

REPRODUCE (Node.js 24 or newer; no npm packages required)
  node analysis/test-analysis.js
  node analysis/build-dataset.js

The source archive retains analysis/ and data/ so these commands work from its
root. To view the app, serve the dist/ directory from an ordinary static web
server. The hosted app needs no API keys, sign-in, user
information, background server or live NASA request. Dataset acquisition URLs
and SHA-256 hashes are recorded in data/provenance.json.

DATA
T2M: annual mean 2-metre air temperature in degrees Celsius.
PRECTOTCORR: annual mean daily precipitation in mm/day, not annual precipitation
totals. These are NASA POWER MERRA-2 model/reanalysis grid estimates. The nominal
native grid is 0.5 latitude by 0.625 longitude degrees, roughly 56 by 70 km near
the equator. Query points are city-near examples, not school coordinates, city
boundary averages or local weather station measurements.

AI DISCLOSURE
AI tools assisted with initial ideation, research, code, the analysis
implementation, writing and presentation. Source NASA observations remain
unchanged; synthetic arrays appear only in the explicitly named statistical
tests. AI-generated text and code were reviewed and tested. No NASA branding
assets are incorporated. Cartography is credited below.

CARTOGRAPHY AND LIBRARIES
Leaflet 1.9.4 renders the interactive reference map; its BSD-2-Clause license is
included at dist/vendor/leaflet/LICENSE.txt. OpenStreetMap tiles are requested
only for a visible interactive map using ordinary browser caching, with visible
attribution. No OSM tile downloads, prefetching or offline tile archive are
included. A separate Natural Earth 110m public-domain map provides generalized
geography if online tiles are unavailable. Geographic outlines are not risk
forecasts or exact MERRA-2 cell boundaries. See dist/data/cartography-provenance.json.
The user-provided Rioverde dashboard informed the interface structure; no
municipal seal, operator data or private records were reused.

Leaflet: https://leafletjs.com/
OpenStreetMap: https://www.openstreetmap.org/copyright
Natural Earth: https://www.naturalearthdata.com/about/terms-of-use/
User-provided design reference: https://rioverde.ghosstless.com/

NASA POWER: https://power.larc.nasa.gov/
Challenge: https://www.spaceappschallenge.org/2026/challenges/earth-system-trend-detective/
