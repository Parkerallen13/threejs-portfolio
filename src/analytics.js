import site from './data/site.json'

// Privacy-friendly page counts with GoatCounter (no cookies, no personal data). Stays off until
// site.json `analytics.goatcounter` holds your GoatCounter code, and never runs on the dev server.
export function initAnalytics() {
  const code = site.analytics?.goatcounter
  if (import.meta.env.DEV || !code || !/^[a-z0-9-]+$/.test(code)) return
  const script = document.createElement('script')
  script.async = true
  script.dataset.goatcounter = `https://${code}.goatcounter.com/count`
  script.src = 'https://gc.zgo.at/count.js'
  document.head.append(script)
}
