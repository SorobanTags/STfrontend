type WebVitalMetric = {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
};

const CORE_WEB_VITALS = new Set(['CLS', 'FID', 'INP', 'LCP']);
const ANALYTICS_ENDPOINT = '/api/analytics/web-vitals';
const THRESHOLDS = {
  CLS: 0.1,
  LCP: 2500,
} as const;

/**
 * Best-effort delivery (#94): every failure, whether serialisation, a
 * throwing sendBeacon, or a rejected or failed fetch, is caught and logged
 * with console.warn, so a broken analytics endpoint can never throw out of
 * the Next.js vitals callback or leave an unhandled rejection.
 */
const sendToAnalytics = async (metric: WebVitalMetric): Promise<void> => {
  if (process.env.NODE_ENV !== 'production') return;

  try {
    const payload = JSON.stringify({
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      path: typeof window !== 'undefined' ? window.location.pathname : undefined,
      timestamp: Date.now(),
    });

    if (typeof navigator !== 'undefined' && 'sendBeacon' in navigator) {
      navigator.sendBeacon(ANALYTICS_ENDPOINT, new Blob([payload], { type: 'application/json' }));
      return;
    }

    const res = await fetch(ANALYTICS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    });
    if (res && res.ok === false) {
      console.warn(`[Web Vitals] analytics endpoint returned ${res.status} for ${metric.name}`);
    }
  } catch (error) {
    console.warn(`[Web Vitals] failed to report ${metric.name}:`, error);
  }
};

export const reportWebVitals = async (metric: WebVitalMetric): Promise<void> => {
  if (!CORE_WEB_VITALS.has(metric.name)) return;

  const logDetails = {
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
  };

  if (process.env.NODE_ENV === 'development') {
    console.info('[Web Vitals]', logDetails);

    if (metric.name === 'LCP' && metric.value > THRESHOLDS.LCP) {
      console.warn(`[Web Vitals] Warning: ${metric.name} is above threshold (${metric.value}ms > ${THRESHOLDS.LCP}ms)`, logDetails);
    }

    if (metric.name === 'CLS' && metric.value > THRESHOLDS.CLS) {
      console.warn(`[Web Vitals] Warning: ${metric.name} is above threshold (${metric.value} > ${THRESHOLDS.CLS})`, logDetails);
    }
  }

  if (process.env.NODE_ENV === 'production') {
    await sendToAnalytics(metric);
  }
};
