/* KILLA educational OLS analysis. AI-assisted implementation and documentation.
 * NASA source observations are not AI-generated. No network or external dependencies.
 * Nominal intervals assume independent, constant-variance normal errors.
 * They are NOT autocorrelation-robust or adjusted for multiple comparisons.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.KillaAnalysis = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function logGamma(z) {
    const p = [676.5203681218851, -1259.1392167224028, 771.3234287776531,
      -176.6150291621406, 12.507343278686905, -0.13857109526572012,
      9.984369578019572e-6, 1.5056327351493116e-7];
    if (z < 0.5) return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * z)) - logGamma(1 - z);
    z -= 1;
    let x = 0.9999999999998099;
    for (let i = 0; i < p.length; i++) x += p[i] / (z + i + 1);
    const t = z + p.length - 0.5;
    return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
  }

  function betaFraction(a, b, x) {
    const tiny = 1e-300;
    const safe = value => Math.abs(value) < tiny ? tiny : value;
    let c = 1;
    let d = 1 / safe(1 - (a + b) * x / (a + 1));
    let h = d;
    for (let m = 1; m <= 300; m++) {
      const m2 = 2 * m;
      let aa = m * (b - m) * x / ((a - 1 + m2) * (a + m2));
      d = 1 / safe(1 + aa * d);
      c = safe(1 + aa / c);
      h *= d * c;
      aa = -(a + m) * (a + b + m) * x / ((a + m2) * (a + 1 + m2));
      d = 1 / safe(1 + aa * d);
      c = safe(1 + aa / c);
      const delta = d * c;
      h *= delta;
      if (Math.abs(delta - 1) < 3e-14) return h;
    }
    throw new Error('Incomplete beta did not converge');
  }

  function regularizedBeta(x, a, b) {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    const bt = Math.exp(logGamma(a + b) - logGamma(a) - logGamma(b) +
      a * Math.log(x) + b * Math.log1p(-x));
    return x < (a + 1) / (a + b + 2)
      ? bt * betaFraction(a, b, x) / a
      : 1 - bt * betaFraction(b, a, 1 - x) / b;
  }

  function studentTCdf(t, df) {
    if (!(df > 0)) throw new Error('Student t degrees of freedom must be positive');
    if (t === 0) return 0.5;
    const ib = regularizedBeta(df / (df + t * t), df / 2, 0.5);
    return t > 0 ? 1 - ib / 2 : ib / 2;
  }

  function studentTQuantile(probability, df) {
    if (!(probability > 0 && probability < 1 && df > 0)) throw new Error('Invalid t quantile arguments');
    if (probability === 0.5) return 0;
    if (probability < 0.5) return -studentTQuantile(1 - probability, df);
    let low = 0;
    let high = 1;
    while (studentTCdf(high, df) < probability) high *= 2;
    for (let i = 0; i < 100; i++) {
      const middle = (low + high) / 2;
      if (studentTCdf(middle, df) < probability) low = middle;
      else high = middle;
    }
    return (low + high) / 2;
  }

  function linearTrend(years, values) {
    if (!Array.isArray(years) || !Array.isArray(values) || years.length !== values.length || years.length < 3) {
      throw new Error('Trend needs matching arrays with at least three finite observations');
    }
    if (!years.every(Number.isFinite) || !values.every(Number.isFinite)) throw new Error('Missing or invalid observations');
    if (new Set(years).size !== years.length) throw new Error('Duplicate years are not supported');
    const points = years.map((year, i) => [year, values[i]]).sort((a, b) => a[0] - b[0]);
    const n = points.length;
    const meanYear = points.reduce((sum, p) => sum + p[0], 0) / n;
    const meanValue = points.reduce((sum, p) => sum + p[1], 0) / n;
    const sxx = points.reduce((sum, p) => sum + (p[0] - meanYear) ** 2, 0);
    const sxy = points.reduce((sum, p) => sum + (p[0] - meanYear) * (p[1] - meanValue), 0);
    const syy = points.reduce((sum, p) => sum + (p[1] - meanValue) ** 2, 0);
    if (sxx <= 0) throw new Error('Year variance must be positive');
    const slopePerYear = sxy / sxx;
    const residuals = points.map(p => p[1] - (meanValue + slopePerYear * (p[0] - meanYear)));
    let sse = residuals.reduce((sum, r) => sum + r * r, 0);
    if (sse < Number.EPSILON ** 2 * Math.max(1, syy) * n * 16) sse = 0;
    const degreesOfFreedom = n - 2;
    const standardErrorPerYear = Math.sqrt((sse / degreesOfFreedom) / sxx);
    const criticalT = studentTQuantile(0.975, degreesOfFreedom);
    const margin = criticalT * standardErrorPerYear;
    const equallySpaced = points.slice(2).every((p, i) => Math.abs((p[0] - points[i + 1][0]) - (points[1][0] - points[0][0])) < 1e-10);
    const lagNumerator = residuals.slice(1).reduce((sum, r, i) => sum + r * residuals[i], 0);
    const residualLag1Correlation = sse > 0 && equallySpaced ? lagNumerator / sse : null;
    return {
      n, degreesOfFreedom, firstYear: points[0][0], lastYear: points[n - 1][0],
      meanYear, meanValue, slopePerYear, slopePerDecade: slopePerYear * 10,
      ci95: [(slopePerYear - margin) * 10, (slopePerYear + margin) * 10],
      standardErrorPerDecade: standardErrorPerYear * 10, criticalT,
      rSquared: syy > 0 ? Math.max(0, Math.min(1, 1 - sse / syy)) : null,
      residualLag1Correlation, equallySpaced,
      intervalMethod: 'Nominal two-sided 95% OLS Student-t interval for slope; df=n-2',
      intervalAssumptions: 'Independent normal errors with constant variance and a correctly specified linear mean; not verified for these climate series.',
      autocorrelationAdjusted: false, multipleComparisonsAdjusted: false,
      pValue: null,
      pValueNote: 'Not reported: time dependence and model uncertainty have not been accounted for.'
    };
  }

  return {linearTrend, studentTCdf, studentTQuantile};
});
