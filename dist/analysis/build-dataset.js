'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const {linearTrend} = require('./analysis.js');
const dataDir = path.resolve(__dirname, '../data');
const years = Array.from({length:25}, (_, i) => 2001 + i);
const documentation = [
  {title:'NASA POWER Monthly and Annual API', url:'https://power.larc.nasa.gov/docs/services/api/temporal/monthly/'},
  {title:'NASA POWER Meteorological Data Sources and Validation', url:'https://power.larc.nasa.gov/docs/methodology/data/sources_meteorology/'},
  {title:'NASA POWER Data FAQs', url:'https://power.larc.nasa.gov/docs/faqs/data/'},
  {title:'NIST: Regression error independence', url:'https://www.itl.nist.gov/div898/handbook/pmd/section4/pmd444.htm'},
  {title:'Penn State STAT 415: Simple Linear Regression, slope interval', url:'https://online.stat.psu.edu/stat415/Lesson12'}
];
const caveats = [
  'Real NASA POWER MERRA-2 reanalysis grid estimates; not local station records and not direct satellite images.',
  'Native meteorological resolution is 0.5 degrees latitude by 0.625 degrees longitude (roughly 56 by 70 km near the equator). Point coordinates select a source grid cell; the API geometry repeats request coordinates and does not identify exact cell boundaries.',
  'The selected locations are sample grid cells near Esmeraldas and Cuenca, not averages of city or province boundaries. Coastal land/ocean mixing and the Andes terrain can differ from conditions at a specific school.',
  'T2M is 2-metre air temperature at the average grid elevation. PRECTOTCORR is corrected precipitation; the API annual values remain mean daily precipitation in mm/day, not annual totals in mm/year.',
  'Annual entries are the API-provided YYYY13 values. This prototype does not average monthly values or treat months as independent annual samples.',
  'The 25-year window describes this chosen period, not a complete long-term climate record. Interannual variability, including ENSO, and reanalysis changes may affect the slopes. No causal attribution or forecast is made.',
  '95% intervals describe regression sampling uncertainty under independent normal, constant-variance errors and a linear mean; assumptions have not been established. They omit reanalysis measurement/model uncertainty, temporal autocorrelation and spatial representation error.',
  'Four location-variable comparisons are exploratory and are not corrected for multiple comparisons. Choosing many dates or regions can create chance patterns; the interface must not label a robust detection or rank significance.',
  'Residual lag-1 correlation is a descriptive diagnostic, not a correction or a test of independence. P-values are intentionally omitted.',
  'This educational prototype is not an operational warning, a site-specific forecast, or evidence that a particular event was caused by climate change.'
];
const inputs = [
  {id:'esmeraldas',name:'Near Esmeraldas, Ecuador',lat:0.96,lon:-79.65},
  {id:'cuenca',name:'Near Cuenca, Ecuador',lat:-2.90,lon:-79.00}
];
const provenance = {
  schemaVersion:1,
  aiAssistance: {codeAndWriting:'AI-assisted; implementation tested against known statistical examples.', sourceData:'Original NASA API values; not AI-generated, interpolated or simulated.'},
  generatedAtUtc:new Date().toISOString(),
  project:'KILLA — Earth Change Observatory',
  source:'NASA POWER Monthly and Annual API; MERRA-2',
  documentation,
  documentationCheckedOn:'2026-11-14 (America/Guayaquil)',
  requests:[],
  transformation:{
    period:{start:2001,end:2025},
    annualKey:'YYYY13',
    sourceValues:'Annual entries preserved exactly as supplied by the NASA API; no synthetic or interpolated values.',
    missingPolicy:'Build fails if any monthly or annual value is absent, non-finite, or equals the NASA fill value.',
    statistic:'Ordinary least squares slope against year; per-decade slope = annual slope times 10; CI95 = 10 * [slope +/- t_(0.975,n-2) * sqrt((SSE/(n-2))/Sxx)].',
    uncertainty:'Nominal iid Student-t slope interval, no autocorrelation or multiple-comparison correction; no p-values.',
    sourcePrecision:'API annual values are already rounded to 0.01 source units. Analysis retains those reported values.',
    code:'../analysis/analysis.js',
    rebuild:'node analysis/build-dataset.js',
    tests:'node analysis/test-analysis.js'
  },
  caveats
};
const locations = inputs.map(location => {
  const rawFile = `power-${location.id}-2001-2025.raw.json`;
  const bytes = fs.readFileSync(path.join(dataDir, rawFile));
  const raw = JSON.parse(bytes.toString('utf8'));
  const download = JSON.parse(fs.readFileSync(path.join(dataDir, `power-${location.id}-download.json`),'utf8'));
  assert.equal(download.status, 200);
  assert.deepEqual(raw.header.sources, ['MERRA2']);
  assert.equal(raw.header.start, '20010101');
  assert.equal(raw.header.end, '20251231');
  assert.deepEqual(raw.messages, []);
  const variables = {};
  for (const parameter of ['T2M', 'PRECTOTCORR']) {
    const all = raw.properties.parameter[parameter];
    assert.equal(Object.keys(all).length, 25 * 13);
    for (const year of years) for (let month=1;month<=13;month++) {
      const value=all[`${year}${String(month).padStart(2,'0')}`];
      assert.ok(Number.isFinite(value) && value !== raw.header.fill_value, `${location.id} ${parameter} ${year}/${month} missing`);
    }
    const values = years.map(year => all[`${year}13`]);
    variables[parameter] = {
      name:raw.parameters[parameter].longname,
      unit:raw.parameters[parameter].units,
      displayName:parameter==='T2M'?'Annual mean 2-m air temperature':'Annual mean daily precipitation',
      years, values,
      ...linearTrend(years,values)
    };
  }
  provenance.requests.push({
    locationId:location.id,
    ...download,
    rawFile,
    sha256:crypto.createHash('sha256').update(bytes).digest('hex'),
    bytes:bytes.length,
    api:raw.header.api,
    sources:raw.header.sources,
    timeStandard:raw.header.time_standard,
    fillValue:raw.header.fill_value,
    responseGeometry:raw.geometry,
    parameterMetadata:raw.parameters,
    validation:'300 monthly and 25 annual observations per parameter; no missing/fill values; no API warning messages.'
  });
  return {...location,sourceUrl:download.url,rawFile,sourceGridElevationM:raw.geometry.coordinates[2],variables};
});
const dataset = {
  schemaVersion:1,
  source:{name:'NASA POWER',dataset:'MERRA-2 reanalysis',apiVersion:'v2.10.0',temporalResolution:'Annual API values',nativeResolution:{latitudeDegrees:0.5,longitudeDegrees:0.625},provenance:'provenance.json'},
  period:{start:2001,end:2025,n:25},
  downloadedAtUtc:provenance.requests.map(request=>request.retrievedAtUtc),
  analysis:{method:'OLS slope per decade',confidence:0.95,interval:'Nominal Student t, df=n-2',autocorrelationAdjusted:false,multipleComparisonsAdjusted:false,comparisons:4,pValuesReported:false},
  caveats,
  locations
};
fs.writeFileSync(path.join(dataDir,'provenance.json'),JSON.stringify(provenance,null,2)+'\n');
fs.writeFileSync(path.join(dataDir,'dataset.json'),JSON.stringify(dataset)+'\n');
for(const location of locations) for(const [id,v] of Object.entries(location.variables)) console.log(JSON.stringify({location:location.id,variable:id,unit:v.unit,n:v.n,slopePerDecade:v.slopePerDecade,ci95:v.ci95,criticalT:v.criticalT,lag1:v.residualLag1Correlation}));
console.log('Built dataset.json and provenance.json from verified real NASA responses.');
