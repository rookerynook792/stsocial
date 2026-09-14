'use strict';
const SourceAdapter = require('./base');

/**
 * Daily weather forecast for St Andrews — a REAL, live source.
 *
 * Uses the free Open-Meteo API (no key required) to produce a town update for
 * each of the next 6 days: conditions, high/low, rain chance and wind. One row
 * per calendar day, refreshed on every ingest (the pipeline updates the body
 * when the same day is re-fetched).
 */

const WMO = {
  0: ['Clear sky', '☀️'], 1: ['Mainly clear', '🌤️'], 2: ['Partly cloudy', '⛅'], 3: ['Overcast', '☁️'],
  45: ['Fog', '🌫️'], 48: ['Icy fog', '🌫️'],
  51: ['Light drizzle', '🌦️'], 53: ['Drizzle', '🌦️'], 55: ['Heavy drizzle', '🌧️'],
  56: ['Freezing drizzle', '🌧️'], 57: ['Freezing drizzle', '🌧️'],
  61: ['Light rain', '🌧️'], 63: ['Rain', '🌧️'], 65: ['Heavy rain', '🌧️'],
  66: ['Freezing rain', '🌧️'], 67: ['Freezing rain', '🌧️'],
  71: ['Light snow', '🌨️'], 73: ['Snow', '🌨️'], 75: ['Heavy snow', '❄️'], 77: ['Snow grains', '🌨️'],
  80: ['Light showers', '🌦️'], 81: ['Showers', '🌦️'], 82: ['Heavy showers', '⛈️'],
  85: ['Snow showers', '🌨️'], 86: ['Snow showers', '🌨️'],
  95: ['Thunderstorm', '⛈️'], 96: ['Storm with hail', '⛈️'], 99: ['Storm with hail', '⛈️'],
};

class WeatherSource extends SourceAdapter {
  constructor() {
    super();
    this.id = 'weather';
    this.name = 'St Andrews Weather — Open-Meteo';
    this.type = 'weather';
    this.reliability = 8;
    this.produces = 'town';
    this.isDemoSource = false;
  }

  async fetch(config, live) {
    if (!live) return [];
    const url = (config && config.url && /^https?:/i.test(config.url))
      ? config.url
      : 'https://api.open-meteo.com/v1/forecast';
    const params = new URLSearchParams({
      latitude: '56.3356',
      longitude: '-2.8021',
      current: 'temperature_2m,weather_code,wind_speed_10m',
      daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max',
      forecast_days: '6',
      timezone: 'auto',
    });
    let data;
    try {
      const res = await fetch(`${url}?${params.toString()}`, { signal: AbortSignal.timeout(10000) });
      if (!res.ok) return [];
      data = await res.json();
    } catch { return []; }

    const days = (data && data.daily && data.daily.time) || [];
    const cur = (data && data.current) || null;
    const out = [];

    days.forEach((day, i) => {
      const code = data.daily.weather_code[i];
      const [cond, emoji] = WMO[code] || ['Changeable', '🌡️'];
      const hi = Math.round(data.daily.temperature_2m_max[i]);
      const lo = Math.round(data.daily.temperature_2m_min[i]);
      const rain = data.daily.precipitation_probability_max[i];
      const wind = data.daily.wind_speed_10m_max[i];
      const d = new Date(day + 'T12:00:00');
      const dayLabel = d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
      const when = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : dayLabel;

      let body = `${emoji} ${cond}. High ${hi}°, low ${lo}°. Rain chance ${rain}%. Wind up to ${Math.round(wind)} km/h.`;
      if (i === 0 && cur) {
        const [curCond] = WMO[cur.weather_code] || ['changeable'];
        body = `Now ${Math.round(cur.temperature_2m)}° and ${curCond.toLowerCase()}. ` + body;
      }
      // Title is date-based (not "Today"/"Tomorrow") so the dedupe key is
      // stable for a calendar day and the row refreshes instead of duplicating.
      out.push({
        title: `St Andrews weather — ${dayLabel}`,
        body: body.slice(0, 500),
        category: 'weather',
        date: day,
        sourceUrl: 'https://open-meteo.com/',
        sourceName: this.name,
      });
    });
    return out;
  }
}
module.exports = WeatherSource;
