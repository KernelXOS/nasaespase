# KILLA data and analysis

The public dataset contains real NASA POWER API responses for sample grid cells near Esmeraldas (0.96, -79.65) and Cuenca (-2.90, -79.00), 2001–2025. Coordinates are illustrative query points, not school coordinates or city boundaries. Both response headers identify MERRA2 and API v2.10.0. The raw files preserve the downloaded response bodies. `data/provenance.json` records exact URLs, UTC download times, SHA-256 hashes, response metadata, validation and limitations.

`data/dataset.json` contains 25 API-provided annual `YYYY13` values for each of two variables in each location. Monthly values are retained in the raw responses. `PRECTOTCORR` annual units are **mm/day (annual mean daily precipitation)**, not mm/year. `T2M` is **2-m air temperature**, not MODIS land surface temperature. The full raw API response contains 300 monthly plus 25 annual observations per variable; no missing or NASA fill values were found.

## Reproduce

From the project root:

```text
node analysis/test-analysis.js
node analysis/build-dataset.js
```

The tests use explicitly synthetic arrays only inside `test-analysis.js`. The dataset builder reads only downloaded NASA response files, validates every expected observation, and fails instead of interpolating or generating data.

Load `analysis/analysis.js` in the browser to access `KillaAnalysis.linearTrend(years, values)`, or `require('./analysis.js')` in Node. Inputs need at least three observations, distinct years and no missing/non-finite values. For interpretation the classroom demo should retain a substantial historical window, rather than presenting a three-point estimate as robust climate evidence.

## Method

For `x = year` and `y = annual value`, the slope is `sum((x-xmean)*(y-ymean))/sum((x-xmean)^2)`. The reported slope and its uncertainty are multiplied by 10 for units per decade. The nominal two-sided 95% slope interval uses a Student-t critical value with `n-2` degrees of freedom and `SE = sqrt((SSE/(n-2))/Sxx)`. For all 25 observations, `df=23` and `t*=2.06865761041904`. The implementation computes the t quantile numerically and tests it against independent tabulated values. The interval is for the fitted slope, not a prediction interval for future weather.

This classical interval assumes independent, constant-variance normal errors and an adequate linear mean. Those assumptions have **not** been established for these climate series. Annual aggregation avoids treating 300 seasonal months as 300 independent annual samples, but does **not** remove serial correlation. The residual lag-1 autocorrelation is included as a descriptive diagnostic, not a correction or proof of independence. The interval excludes model/data uncertainty, spatial representation error, reanalysis inhomogeneity and effects of temporal dependence. No p-values are reported.

The four location-variable comparisons and any interactive date selections are exploratory. There is no multiple-comparison adjustment. A nominal interval excluding zero is not sufficient to declare a robust climate detection. The 25-year record is a selected window, not a complete long-term climatology; ENSO and other variability can influence the fit. Trends do not identify causes or forecast future values.

## Source limitations

POWER meteorology is based on MERRA-2 modeling and assimilation of multiple observation types, not a local thermometer/rain gauge series or direct satellite image measurement. The native meteorological grid is 0.5 degrees latitude by 0.625 degrees longitude, about 56 by 70 km at the equator. The API echoes request coordinates; it does not provide cell bounds here. Coastal and mountainous grid means can differ substantially from local conditions. The source grid-average elevations returned by NASA are preserved; they are not assertions about the city elevations.

Sources consulted (14 November 2026, America/Guayaquil):

- NASA Monthly and Annual API: https://power.larc.nasa.gov/docs/services/api/temporal/monthly/
- NASA meteorological methodology: https://power.larc.nasa.gov/docs/methodology/data/sources_meteorology/
- NASA data FAQs, including terrain/elevation limitations: https://power.larc.nasa.gov/docs/faqs/data/
- NIST regression error independence: https://www.itl.nist.gov/div898/handbook/pmd/section4/pmd444.htm
- Penn State regression slope confidence interval: https://online.stat.psu.edu/stat415/Lesson12

Data acquisition and processing code were prepared with AI assistance. The educational prototype is not an operational warning system or a validated planning service.
