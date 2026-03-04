import { useState, useMemo, useCallback, useEffect, useRef } from "react";

// ═══════════════════════════════════════════════════════════════════
//  COLOR PALETTE
// ═══════════════════════════════════════════════════════════════════
const FSX = {
  bg:       "#0B1120",   // deep navy (FSX site background)
  surface:  "#111B2E",   // card / raised surface
  border:   "rgba(255,255,255,0.06)",
  teal:     "#00BFA5",   // primary accent (logo teal-green)
  tealDim:  "#00897B",   // muted teal
  tealGlow: "rgba(0,191,165,0.25)",
  coral:    "#FF6B6B",   // alert / critical threshold
  amber:    "#FFB74D",   // warning / medium threshold
  white:    "#FFFFFF",
  text:     "#E2E8F0",   // primary text (slate-100)
  muted:    "#94A3B8",   // secondary text (slate-400)
  dim:      "#64748B",   // tertiary text (slate-500)
  faint:    "#334155",   // very muted (slate-700)
};

// ═══════════════════════════════════════════════════════════════════
//  DATA SOURCES
// ═══════════════════════════════════════════════════════════════════
const SOURCES = {
  iea:  { name: "IEA Energy & AI Report", year: 2025, license: "CC BY 4.0", url: "https://www.iea.org/reports/energy-and-ai" },
  epri: { name: "EPRI Powering Intelligence", year: 2024, license: "Public", url: "https://www.epri.com" },
  eia:  { name: "U.S. EIA", year: 2024, license: "Public Domain", url: "https://www.eia.gov" },
  lbnl: { name: "Lawrence Berkeley National Lab", year: 2024, license: "Public Domain", url: "https://eta-publications.lbl.gov" },
  cso:  { name: "CSO Ireland", year: 2025, license: "Public", url: "https://www.cso.ie" },
  pew:  { name: "Pew Research", year: 2025, license: "Public", url: "https://www.pewresearch.org" },
  wm:   { name: "Wood Mackenzie", year: 2025, license: "Published Findings", url: "https://www.woodmac.com" },
  ember:{ name: "Ember Energy", year: 2025, license: "Open Data", url: "https://ember-energy.org" },
};

function interp(points, year) {
  if (year <= points[0][0]) return points[0][1];
  if (year >= points[points.length - 1][0]) return points[points.length - 1][1];
  for (let i = 0; i < points.length - 1; i++) {
    if (year >= points[i][0] && year <= points[i + 1][0]) {
      const t = (year - points[i][0]) / (points[i + 1][0] - points[i][0]);
      return points[i][1] + t * (points[i + 1][1] - points[i][1]);
    }
  }
  return points[points.length - 1][1];
}

// ─── REGION DATA ──────────────────────────────────────────────────
const REGION_DATA = {
  "North America": { color: FSX.teal, points: [[2000,0.8],[2005,1.2],[2010,1.6],[2015,2.0],[2018,2.5],[2020,2.8],[2022,3.4],[2023,3.8],[2024,4.2],[2026,5.5],[2028,7.0],[2030,8.5],[2035,11.0],[2040,13.5],[2045,15.5],[2050,17.0]], sources: ["iea","epri","eia","lbnl"], countries: ["United States","Canada","Mexico"] },
  Europe: { color: "#26A69A", points: [[2000,0.4],[2005,0.7],[2010,1.0],[2015,1.3],[2018,1.5],[2020,1.7],[2022,2.0],[2023,2.2],[2024,2.4],[2026,3.0],[2028,3.6],[2030,4.2],[2035,5.5],[2040,6.8],[2045,7.8],[2050,8.5]], sources: ["iea","ember"], countries: ["Ireland","Netherlands","United Kingdom","Germany","France","Nordics","Spain"] },
  "Asia Pacific": { color: "#4DD0E1", points: [[2000,0.2],[2005,0.5],[2010,0.8],[2015,1.1],[2018,1.4],[2020,1.6],[2022,1.9],[2023,2.1],[2024,2.4],[2026,3.2],[2028,4.2],[2030,5.2],[2035,7.0],[2040,9.0],[2045,10.5],[2050,12.0]], sources: ["iea","wm"], countries: ["China","Japan","Singapore","Australia","South Korea","India","Malaysia"] },
  "Middle East & Africa": { color: "#FFB74D", points: [[2000,0.05],[2005,0.1],[2010,0.2],[2015,0.3],[2018,0.4],[2020,0.5],[2022,0.6],[2023,0.7],[2024,0.8],[2026,1.1],[2028,1.5],[2030,2.0],[2035,3.0],[2040,4.2],[2045,5.5],[2050,6.5]], sources: ["iea"], countries: ["UAE","Saudi Arabia","South Africa","Kenya","Israel"] },
  "Latin America": { color: "#81C784", points: [[2000,0.1],[2005,0.2],[2010,0.3],[2015,0.5],[2018,0.6],[2020,0.7],[2022,0.8],[2023,0.9],[2024,1.0],[2026,1.3],[2028,1.7],[2030,2.1],[2035,3.0],[2040,4.0],[2045,5.0],[2050,5.8]], sources: ["iea"], countries: ["Brazil","Chile","Colombia"] },
};

// ─── COUNTRY DATA ─────────────────────────────────────────────────
const COUNTRY_DATA = {
  "United States": { region: "North America", color: "#00BFA5", points: [[2000,1.0],[2005,1.5],[2010,1.8],[2015,2.2],[2018,2.8],[2020,3.2],[2022,3.8],[2023,4.0],[2024,4.4],[2026,5.8],[2028,7.5],[2030,9.1],[2035,12.0],[2040,15.0],[2045,17.0],[2050,18.5]], sources: ["iea","epri","eia","lbnl","pew"], states: ["Virginia","Texas","California","Oregon","Iowa","North Dakota","Nebraska","Illinois","Georgia","Arizona"] },
  Canada: { region: "North America", color: "#26A69A", points: [[2000,0.3],[2005,0.5],[2010,0.7],[2015,0.9],[2018,1.1],[2020,1.3],[2022,1.5],[2023,1.6],[2024,1.8],[2026,2.2],[2028,2.8],[2030,3.5],[2035,4.8],[2040,6.0],[2045,7.0],[2050,7.8]], sources: ["iea"] },
  Mexico: { region: "North America", color: "#4DB6AC", points: [[2000,0.1],[2005,0.2],[2010,0.3],[2015,0.4],[2018,0.5],[2020,0.6],[2022,0.7],[2023,0.8],[2024,0.9],[2026,1.2],[2028,1.6],[2030,2.0],[2035,3.0],[2040,4.0],[2045,5.0],[2050,5.5]], sources: ["iea"] },
  Ireland: { region: "Europe", color: "#FF6B6B", points: [[2000,0.5],[2005,1.0],[2010,2.0],[2015,5.0],[2018,10.0],[2020,14.0],[2022,18.0],[2023,21.0],[2024,22.0],[2026,28.0],[2028,30.0],[2030,32.0],[2035,34.0],[2040,33.0],[2045,31.0],[2050,29.0]], sources: ["iea","cso"] },
  Netherlands: { region: "Europe", color: "#26A69A", points: [[2000,0.5],[2005,0.8],[2010,1.5],[2015,2.5],[2018,3.5],[2020,4.0],[2022,4.5],[2023,4.8],[2024,5.0],[2026,5.8],[2028,6.5],[2030,7.0],[2035,8.0],[2040,8.5],[2045,9.0],[2050,9.0]], sources: ["iea"] },
  "United Kingdom": { region: "Europe", color: "#4DB6AC", points: [[2000,0.3],[2005,0.6],[2010,1.0],[2015,1.4],[2018,1.7],[2020,2.0],[2022,2.3],[2023,2.5],[2024,2.7],[2026,3.2],[2028,3.8],[2030,4.5],[2035,5.8],[2040,7.0],[2045,8.0],[2050,8.5]], sources: ["iea"] },
  Germany: { region: "Europe", color: "#009688", points: [[2000,0.3],[2005,0.5],[2010,0.8],[2015,1.2],[2018,1.5],[2020,1.8],[2022,2.0],[2023,2.2],[2024,2.4],[2026,2.9],[2028,3.5],[2030,4.0],[2035,5.2],[2040,6.5],[2045,7.5],[2050,8.0]], sources: ["iea"] },
  France: { region: "Europe", color: "#00897B", points: [[2000,0.2],[2005,0.4],[2010,0.6],[2015,0.8],[2018,1.0],[2020,1.2],[2022,1.4],[2023,1.5],[2024,1.7],[2026,2.2],[2028,2.8],[2030,3.4],[2035,4.8],[2040,6.2],[2045,7.2],[2050,7.8]], sources: ["iea"] },
  Nordics: { region: "Europe", color: "#4DD0E1", points: [[2000,0.3],[2005,0.5],[2010,1.0],[2015,2.0],[2018,3.0],[2020,3.5],[2022,4.0],[2023,4.5],[2024,5.0],[2026,6.5],[2028,8.0],[2030,10.0],[2035,13.0],[2040,14.5],[2045,15.0],[2050,15.0]], sources: ["iea"] },
  Spain: { region: "Europe", color: "#80CBC4", points: [[2000,0.1],[2005,0.2],[2010,0.3],[2015,0.5],[2018,0.7],[2020,0.8],[2022,1.0],[2023,1.1],[2024,1.2],[2026,1.6],[2028,2.0],[2030,2.5],[2035,3.5],[2040,4.5],[2045,5.5],[2050,6.0]], sources: ["iea"] },
  China: { region: "Asia Pacific", color: "#4DD0E1", points: [[2000,0.2],[2005,0.4],[2010,0.7],[2015,1.2],[2018,1.6],[2020,1.9],[2022,2.2],[2023,2.4],[2024,2.7],[2026,3.6],[2028,4.6],[2030,5.5],[2035,7.5],[2040,10.0],[2045,12.0],[2050,13.5]], sources: ["iea"] },
  Japan: { region: "Asia Pacific", color: "#26C6DA", points: [[2000,0.4],[2005,0.7],[2010,1.0],[2015,1.5],[2018,1.8],[2020,2.0],[2022,2.3],[2023,2.5],[2024,2.8],[2026,3.6],[2028,4.5],[2030,5.5],[2035,7.5],[2040,9.0],[2045,10.0],[2050,11.0]], sources: ["iea"] },
  Singapore: { region: "Asia Pacific", color: "#00ACC1", points: [[2000,1.0],[2005,2.0],[2010,3.5],[2015,5.0],[2018,6.0],[2020,6.5],[2022,7.0],[2023,7.5],[2024,8.0],[2026,9.5],[2028,11.0],[2030,12.0],[2035,14.0],[2040,15.0],[2045,15.5],[2050,15.0]], sources: ["iea","wm"] },
  Australia: { region: "Asia Pacific", color: "#0097A7", points: [[2000,0.3],[2005,0.5],[2010,0.8],[2015,1.0],[2018,1.3],[2020,1.5],[2022,1.8],[2023,2.0],[2024,2.2],[2026,2.8],[2028,3.5],[2030,4.2],[2035,5.5],[2040,7.0],[2045,8.0],[2050,8.5]], sources: ["iea"] },
  "South Korea": { region: "Asia Pacific", color: "#00838F", points: [[2000,0.3],[2005,0.5],[2010,0.8],[2015,1.2],[2018,1.5],[2020,1.7],[2022,2.0],[2023,2.2],[2024,2.5],[2026,3.2],[2028,4.0],[2030,5.0],[2035,6.5],[2040,8.0],[2045,9.0],[2050,9.5]], sources: ["iea"] },
  India: { region: "Asia Pacific", color: "#006064", points: [[2000,0.05],[2005,0.1],[2010,0.2],[2015,0.4],[2018,0.6],[2020,0.8],[2022,1.0],[2023,1.1],[2024,1.3],[2026,1.8],[2028,2.5],[2030,3.2],[2035,5.0],[2040,7.0],[2045,9.0],[2050,10.5]], sources: ["iea"] },
  Malaysia: { region: "Asia Pacific", color: "#4DD0E1", points: [[2000,0.1],[2005,0.2],[2010,0.4],[2015,0.7],[2018,1.0],[2020,1.3],[2022,1.8],[2023,2.5],[2024,3.2],[2026,5.5],[2028,8.0],[2030,10.5],[2035,14.0],[2040,16.0],[2045,17.0],[2050,17.0]], sources: ["iea","wm","ember"] },
  UAE: { region: "Middle East & Africa", color: "#FFB74D", points: [[2000,0.1],[2005,0.2],[2010,0.4],[2015,0.7],[2018,1.0],[2020,1.3],[2022,1.6],[2023,1.8],[2024,2.0],[2026,2.8],[2028,3.5],[2030,4.5],[2035,6.0],[2040,7.5],[2045,9.0],[2050,10.0]], sources: ["iea"] },
  "Saudi Arabia": { region: "Middle East & Africa", color: "#FFA726", points: [[2000,0.05],[2005,0.1],[2010,0.2],[2015,0.3],[2018,0.4],[2020,0.5],[2022,0.7],[2023,0.8],[2024,1.0],[2026,1.5],[2028,2.2],[2030,3.0],[2035,5.0],[2040,7.0],[2045,8.5],[2050,9.5]], sources: ["iea"] },
  "South Africa": { region: "Middle East & Africa", color: "#FF8A65", points: [[2000,0.05],[2005,0.1],[2010,0.2],[2015,0.3],[2018,0.4],[2020,0.5],[2022,0.6],[2023,0.7],[2024,0.8],[2026,1.1],[2028,1.5],[2030,2.0],[2035,3.0],[2040,4.0],[2045,5.0],[2050,5.8]], sources: ["iea"] },
  Kenya: { region: "Middle East & Africa", color: "#FFCC80", points: [[2000,0.01],[2005,0.03],[2010,0.05],[2015,0.1],[2018,0.15],[2020,0.2],[2022,0.3],[2023,0.35],[2024,0.4],[2026,0.6],[2028,0.9],[2030,1.2],[2035,2.0],[2040,3.0],[2045,4.0],[2050,5.0]], sources: ["iea"] },
  Israel: { region: "Middle East & Africa", color: "#FFB74D", points: [[2000,0.2],[2005,0.4],[2010,0.7],[2015,1.0],[2018,1.3],[2020,1.5],[2022,1.8],[2023,2.0],[2024,2.2],[2026,2.8],[2028,3.5],[2030,4.2],[2035,5.5],[2040,6.5],[2045,7.5],[2050,8.0]], sources: ["iea"] },
  Brazil: { region: "Latin America", color: "#81C784", points: [[2000,0.1],[2005,0.2],[2010,0.4],[2015,0.6],[2018,0.8],[2020,1.0],[2022,1.2],[2023,1.3],[2024,1.5],[2026,2.0],[2028,2.6],[2030,3.2],[2035,4.5],[2040,6.0],[2045,7.0],[2050,7.8]], sources: ["iea"] },
  Chile: { region: "Latin America", color: "#66BB6A", points: [[2000,0.1],[2005,0.2],[2010,0.3],[2015,0.5],[2018,0.7],[2020,0.8],[2022,1.0],[2023,1.1],[2024,1.2],[2026,1.6],[2028,2.1],[2030,2.6],[2035,3.8],[2040,5.0],[2045,6.0],[2050,6.5]], sources: ["iea"] },
  Colombia: { region: "Latin America", color: "#A5D6A7", points: [[2000,0.05],[2005,0.1],[2010,0.2],[2015,0.3],[2018,0.4],[2020,0.5],[2022,0.6],[2023,0.7],[2024,0.8],[2026,1.1],[2028,1.5],[2030,2.0],[2035,3.0],[2040,4.0],[2045,5.0],[2050,5.5]], sources: ["iea"] },
};

// ─── STATE DATA ───────────────────────────────────────────────────
const STATE_DATA = {
  Virginia: { country: "United States", color: "#00BFA5", points: [[2005,2.0],[2010,5.0],[2015,10.0],[2018,15.0],[2020,18.0],[2022,22.0],[2023,26.0],[2024,27.0],[2026,32.0],[2028,38.0],[2030,42.0],[2035,48.0],[2040,50.0],[2045,48.0],[2050,45.0]], sources: ["epri","pew"] },
  Texas: { country: "United States", color: "#26A69A", points: [[2005,0.8],[2010,1.2],[2015,1.8],[2018,2.5],[2020,3.0],[2022,3.8],[2023,4.2],[2024,4.8],[2026,6.5],[2028,8.5],[2030,10.5],[2035,14.0],[2040,17.0],[2045,19.0],[2050,20.0]], sources: ["epri","eia"] },
  California: { country: "United States", color: "#4DB6AC", points: [[2005,1.0],[2010,1.5],[2015,2.0],[2018,2.5],[2020,2.8],[2022,3.2],[2023,3.5],[2024,3.8],[2026,4.5],[2028,5.5],[2030,6.5],[2035,8.5],[2040,10.0],[2045,11.0],[2050,11.5]], sources: ["epri","eia"] },
  Oregon: { country: "United States", color: "#009688", points: [[2005,1.5],[2010,3.0],[2015,5.0],[2018,7.0],[2020,8.5],[2022,9.5],[2023,10.2],[2024,11.0],[2026,13.5],[2028,16.0],[2030,18.0],[2035,22.0],[2040,24.0],[2045,25.0],[2050,25.0]], sources: ["epri","pew"] },
  Iowa: { country: "United States", color: "#4DD0E1", points: [[2005,0.5],[2010,1.5],[2015,4.0],[2018,7.0],[2020,8.5],[2022,10.0],[2023,11.7],[2024,12.5],[2026,15.0],[2028,18.0],[2030,20.0],[2035,24.0],[2040,26.0],[2045,27.0],[2050,27.0]], sources: ["epri","pew"] },
  "North Dakota": { country: "United States", color: "#00897B", points: [[2005,0.2],[2010,0.5],[2015,2.0],[2018,5.0],[2020,8.0],[2022,12.0],[2023,15.4],[2024,16.5],[2026,20.0],[2028,24.0],[2030,27.0],[2035,32.0],[2040,34.0],[2045,35.0],[2050,34.0]], sources: ["epri","pew"] },
  Nebraska: { country: "United States", color: "#26C6DA", points: [[2005,0.3],[2010,1.0],[2015,3.0],[2018,6.0],[2020,8.0],[2022,10.0],[2023,11.6],[2024,12.5],[2026,15.0],[2028,18.0],[2030,20.0],[2035,24.0],[2040,26.0],[2045,27.0],[2050,27.0]], sources: ["epri","pew"] },
  Illinois: { country: "United States", color: "#80CBC4", points: [[2005,0.5],[2010,1.0],[2015,1.8],[2018,2.5],[2020,3.0],[2022,3.5],[2023,4.0],[2024,4.5],[2026,5.5],[2028,7.0],[2030,8.5],[2035,11.0],[2040,13.0],[2045,14.0],[2050,14.5]], sources: ["epri","eia"] },
  Georgia: { country: "United States", color: "#00ACC1", points: [[2005,0.3],[2010,0.6],[2015,1.0],[2018,1.5],[2020,2.0],[2022,2.5],[2023,3.0],[2024,3.5],[2026,4.5],[2028,6.0],[2030,7.5],[2035,10.0],[2040,12.0],[2045,13.5],[2050,14.0]], sources: ["epri"] },
  Arizona: { country: "United States", color: "#0097A7", points: [[2005,0.3],[2010,0.7],[2015,1.2],[2018,2.0],[2020,2.5],[2022,3.2],[2023,3.8],[2024,4.3],[2026,5.5],[2028,7.0],[2030,8.5],[2035,11.5],[2040,14.0],[2045,15.5],[2050,16.0]], sources: ["epri","eia"] },
};

const GLOBAL_TWH = [[2000,60],[2005,100],[2010,160],[2015,220],[2018,280],[2020,310],[2022,360],[2023,390],[2024,415],[2026,560],[2028,750],[2030,945],[2035,1200],[2040,1500],[2045,1750],[2050,2000]];
const GLOBAL_PCT = [[2000,0.4],[2005,0.6],[2010,0.8],[2015,1.0],[2018,1.2],[2020,1.3],[2022,1.4],[2023,1.4],[2024,1.5],[2026,1.9],[2028,2.4],[2030,3.0],[2035,3.8],[2040,4.5],[2045,5.1],[2050,5.6]];

// ═══════════════════════════════════════════════════════════════════
//  COUNTRY ELECTRICITY CONSUMPTION (TWh, ~2024 baseline)
//  Source: IEA Global Energy Review 2025, Ember, Enerdata
//  Sorted ascending by consumption. Used for the "DC exceeds country" analogy.
// ═══════════════════════════════════════════════════════════════════
const COUNTRY_ELEC = [
  { name: "Malta", twh: 2.5, flag: "\uD83C\uDDF2\uD83C\uDDF9", region: "Europe" },
  { name: "Montenegro", twh: 3.5, flag: "\uD83C\uDDF2\uD83C\uDDEA", region: "Europe" },
  { name: "Jamaica", twh: 4.2, flag: "\uD83C\uDDEF\uD83C\uDDF2", region: "Latin America" },
  { name: "Cyprus", twh: 5.2, flag: "\uD83C\uDDE8\uD83C\uDDFE", region: "Europe" },
  { name: "Luxembourg", twh: 6.5, flag: "\uD83C\uDDF1\uD83C\uDDFA", region: "Europe" },
  { name: "El Salvador", twh: 7, flag: "\uD83C\uDDF8\uD83C\uDDFB", region: "Latin America" },
  { name: "Estonia", twh: 8.5, flag: "\uD83C\uDDEA\uD83C\uDDEA", region: "Europe" },
  { name: "Latvia", twh: 7.5, flag: "\uD83C\uDDF1\uD83C\uDDFB", region: "Europe" },
  { name: "Nepal", twh: 10, flag: "\uD83C\uDDF3\uD83C\uDDF5", region: "Asia Pacific" },
  { name: "Bolivia", twh: 10.5, flag: "\uD83C\uDDE7\uD83C\uDDF4", region: "Latin America" },
  { name: "Honduras", twh: 10.5, flag: "\uD83C\uDDED\uD83C\uDDF3", region: "Latin America" },
  { name: "Trinidad & Tobago", twh: 10.5, flag: "\uD83C\uDDF9\uD83C\uDDF9", region: "Latin America" },
  { name: "Cambodia", twh: 12, flag: "\uD83C\uDDF0\uD83C\uDDED", region: "Asia Pacific" },
  { name: "Kenya", twh: 12.5, flag: "\uD83C\uDDF0\uD83C\uDDEA", region: "Africa" },
  { name: "Costa Rica", twh: 12.5, flag: "\uD83C\uDDE8\uD83C\uDDF7", region: "Latin America" },
  { name: "Panama", twh: 12.5, flag: "\uD83C\uDDF5\uD83C\uDDE6", region: "Latin America" },
  { name: "Uruguay", twh: 12.5, flag: "\uD83C\uDDFA\uD83C\uDDFE", region: "Latin America" },
  { name: "Lithuania", twh: 13, flag: "\uD83C\uDDF1\uD83C\uDDF9", region: "Europe" },
  { name: "Guatemala", twh: 14, flag: "\uD83C\uDDEC\uD83C\uDDF9", region: "Latin America" },
  { name: "Sri Lanka", twh: 17, flag: "\uD83C\uDDF1\uD83C\uDDF0", region: "Asia Pacific" },
  { name: "Paraguay", twh: 17, flag: "\uD83C\uDDF5\uD83C\uDDFE", region: "Latin America" },
  { name: "Ghana", twh: 18, flag: "\uD83C\uDDEC\uD83C\uDDED", region: "Africa" },
  { name: "Croatia", twh: 19, flag: "\uD83C\uDDED\uD83C\uDDF7", region: "Europe" },
  { name: "Iceland", twh: 20, flag: "\uD83C\uDDEE\uD83C\uDDF8", region: "Europe" },
  { name: "Tunisia", twh: 21, flag: "\uD83C\uDDF9\uD83C\uDDF3", region: "Africa" },
  { name: "Myanmar", twh: 25, flag: "\uD83C\uDDF2\uD83C\uDDF2", region: "Asia Pacific" },
  { name: "Slovakia", twh: 28, flag: "\uD83C\uDDF8\uD83C\uDDF0", region: "Europe" },
  { name: "Bahrain", twh: 32, flag: "\uD83C\uDDE7\uD83C\uDDED", region: "Middle East" },
  { name: "Ireland", twh: 32, flag: "\uD83C\uDDEE\uD83C\uDDEA", region: "Europe" },
  { name: "Denmark", twh: 34, flag: "\uD83C\uDDE9\uD83C\uDDF0", region: "Europe" },
  { name: "Serbia", twh: 35, flag: "\uD83C\uDDF7\uD83C\uDDF8", region: "Europe" },
  { name: "Nigeria", twh: 36, flag: "\uD83C\uDDF3\uD83C\uDDEC", region: "Africa" },
  { name: "Bulgaria", twh: 38, flag: "\uD83C\uDDE7\uD83C\uDDEC", region: "Europe" },
  { name: "New Zealand", twh: 43, flag: "\uD83C\uDDF3\uD83C\uDDFF", region: "Asia Pacific" },
  { name: "Hungary", twh: 46, flag: "\uD83C\uDDED\uD83C\uDDFA", region: "Europe" },
  { name: "Portugal", twh: 50, flag: "\uD83C\uDDF5\uD83C\uDDF9", region: "Europe" },
  { name: "Greece", twh: 53, flag: "\uD83C\uDDEC\uD83C\uDDF7", region: "Europe" },
  { name: "Singapore", twh: 57, flag: "\uD83C\uDDF8\uD83C\uDDEC", region: "Asia Pacific" },
  { name: "Switzerland", twh: 58, flag: "\uD83C\uDDE8\uD83C\uDDED", region: "Europe" },
  { name: "Romania", twh: 58, flag: "\uD83C\uDDF7\uD83C\uDDF4", region: "Europe" },
  { name: "Czech Republic", twh: 66, flag: "\uD83C\uDDE8\uD83C\uDDFF", region: "Europe" },
  { name: "Austria", twh: 69, flag: "\uD83C\uDDE6\uD83C\uDDF9", region: "Europe" },
  { name: "Israel", twh: 70, flag: "\uD83C\uDDEE\uD83C\uDDF1", region: "Middle East" },
  { name: "Belgium", twh: 82, flag: "\uD83C\uDDE7\uD83C\uDDEA", region: "Europe" },
  { name: "Finland", twh: 83, flag: "\uD83C\uDDEB\uD83C\uDDEE", region: "Europe" },
  { name: "Chile", twh: 87, flag: "\uD83C\uDDE8\uD83C\uDDF1", region: "Latin America" },
  { name: "Colombia", twh: 82, flag: "\uD83C\uDDE8\uD83C\uDDF4", region: "Latin America" },
  { name: "Bangladesh", twh: 102, flag: "\uD83C\uDDE7\uD83C\uDDE9", region: "Asia Pacific" },
  { name: "Philippines", twh: 115, flag: "\uD83C\uDDF5\uD83C\uDDED", region: "Asia Pacific" },
  { name: "Netherlands", twh: 112, flag: "\uD83C\uDDF3\uD83C\uDDF1", region: "Europe" },
  { name: "Norway", twh: 130, flag: "\uD83C\uDDF3\uD83C\uDDF4", region: "Europe" },
  { name: "Sweden", twh: 132, flag: "\uD83C\uDDF8\uD83C\uDDEA", region: "Europe" },
  { name: "UAE", twh: 142, flag: "\uD83C\uDDE6\uD83C\uDDEA", region: "Middle East" },
  { name: "Argentina", twh: 142, flag: "\uD83C\uDDE6\uD83C\uDDF7", region: "Latin America" },
  { name: "Pakistan", twh: 155, flag: "\uD83C\uDDF5\uD83C\uDDF0", region: "Asia Pacific" },
  { name: "Poland", twh: 172, flag: "\uD83C\uDDF5\uD83C\uDDF1", region: "Europe" },
  { name: "Malaysia", twh: 185, flag: "\uD83C\uDDF2\uD83C\uDDFE", region: "Asia Pacific" },
  { name: "Egypt", twh: 205, flag: "\uD83C\uDDEA\uD83C\uDDEC", region: "Africa" },
  { name: "Thailand", twh: 212, flag: "\uD83C\uDDF9\uD83C\uDDED", region: "Asia Pacific" },
  { name: "South Africa", twh: 215, flag: "\uD83C\uDDFF\uD83C\uDDE6", region: "Africa" },
  { name: "Australia", twh: 242, flag: "\uD83C\uDDE6\uD83C\uDDFA", region: "Asia Pacific" },
  { name: "Spain", twh: 252, flag: "\uD83C\uDDEA\uD83C\uDDF8", region: "Europe" },
  { name: "Vietnam", twh: 275, flag: "\uD83C\uDDFB\uD83C\uDDF3", region: "Asia Pacific" },
  { name: "Taiwan", twh: 282, flag: "\uD83C\uDDF9\uD83C\uDDFC", region: "Asia Pacific" },
  { name: "United Kingdom", twh: 295, flag: "\uD83C\uDDEC\uD83C\uDDE7", region: "Europe" },
  { name: "Italy", twh: 305, flag: "\uD83C\uDDEE\uD83C\uDDF9", region: "Europe" },
  { name: "Indonesia", twh: 325, flag: "\uD83C\uDDEE\uD83C\uDDE9", region: "Asia Pacific" },
  { name: "Mexico", twh: 335, flag: "\uD83C\uDDF2\uD83C\uDDFD", region: "Latin America" },
  { name: "Turkey", twh: 345, flag: "\uD83C\uDDF9\uD83C\uDDF7", region: "Europe" },
  { name: "Saudi Arabia", twh: 400, flag: "\uD83C\uDDF8\uD83C\uDDE6", region: "Middle East" },
  { name: "France", twh: 440, flag: "\uD83C\uDDEB\uD83C\uDDF7", region: "Europe" },
  { name: "Germany", twh: 530, flag: "\uD83C\uDDE9\uD83C\uDDEA", region: "Europe" },
  { name: "Canada", twh: 580, flag: "\uD83C\uDDE8\uD83C\uDDE6", region: "North America" },
  { name: "South Korea", twh: 600, flag: "\uD83C\uDDF0\uD83C\uDDF7", region: "Asia Pacific" },
  { name: "Brazil", twh: 655, flag: "\uD83C\uDDE7\uD83C\uDDF7", region: "Latin America" },
  { name: "Japan", twh: 910, flag: "\uD83C\uDDEF\uD83C\uDDF5", region: "Asia Pacific" },
  { name: "Russia", twh: 1100, flag: "\uD83C\uDDF7\uD83C\uDDFA", region: "Europe" },
  { name: "India", twh: 1900, flag: "\uD83C\uDDEE\uD83C\uDDF3", region: "Asia Pacific" },
  { name: "United States", twh: 4100, flag: "\uD83C\uDDFA\uD83C\uDDF8", region: "North America" },
  { name: "China", twh: 9500, flag: "\uD83C\uDDE8\uD83C\uDDF3", region: "Asia Pacific" },
];

// ─── SPARKLINE ────────────────────────────────────────────────────
function Sparkline({ points, year, width = 120, height = 36, color = FSX.teal }) {
  const maxY = Math.max(...points.map(p => p[1])) * 1.15;
  const toX = x => ((x - 2000) / 50) * width;
  const toY = y => height - (y / maxY) * height;
  const d = points.map((p, i) => (i === 0 ? "M" : "L") + toX(p[0]).toFixed(1) + "," + toY(p[1]).toFixed(1)).join(" ");
  const curVal = interp(points, year);
  const isForecast = year > 2026;
  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      <line x1={toX(2026)} y1={0} x2={toX(2026)} y2={height} stroke={FSX.dim} strokeWidth="0.5" strokeDasharray="2,2" />
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" opacity={0.7} />
      <circle cx={toX(year)} cy={toY(curVal)} r={3} fill={isForecast ? "none" : color} stroke={color} strokeWidth={1.5} />
    </svg>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────
export default function DCEnergyDashboard() {
  const [year, setYear] = useState(2024);
  const [level, setLevel] = useState("region");
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setYear(prev => { if (prev >= 2050) { setIsPlaying(false); return 2050; } return prev + 1; });
      }, 300);
    }
    return () => clearInterval(intervalRef.current);
  }, [isPlaying]);

  const globalTWh = useMemo(() => interp(GLOBAL_TWH, year), [year]);
  const globalPct = useMemo(() => interp(GLOBAL_PCT, year), [year]);

  const currentData = useMemo(() => {
    if (level === "region") return Object.entries(REGION_DATA).map(([name, d]) => ({ name, ...d, value: interp(d.points, year) })).sort((a, b) => b.value - a.value);
    if (level === "country" && selectedRegion) return (REGION_DATA[selectedRegion]?.countries || []).filter(c => COUNTRY_DATA[c]).map(name => ({ name, ...COUNTRY_DATA[name], value: interp(COUNTRY_DATA[name].points, year) })).sort((a, b) => b.value - a.value);
    if (level === "state" && selectedCountry === "United States") return (COUNTRY_DATA["United States"]?.states || []).filter(s => STATE_DATA[s]).map(name => ({ name, ...STATE_DATA[name], value: interp(STATE_DATA[name].points, year) })).sort((a, b) => b.value - a.value);
    return [];
  }, [level, selectedRegion, selectedCountry, year]);

  const maxBarValue = useMemo(() => Math.max(...currentData.map(d => d.value), 1), [currentData]);

  const handleDrillDown = useCallback((item) => {
    if (level === "region") { setSelectedRegion(item.name); setLevel("country"); }
    else if (level === "country" && COUNTRY_DATA[item.name]?.states) { setSelectedCountry(item.name); setLevel("state"); }
  }, [level]);

  const handleBack = useCallback(() => {
    if (level === "state") { setLevel("country"); setSelectedCountry(null); }
    else if (level === "country") { setLevel("region"); setSelectedRegion(null); }
  }, [level]);

  const breadcrumb = useMemo(() => {
    const parts = [{ label: "Global Regions", onClick: () => { setLevel("region"); setSelectedRegion(null); setSelectedCountry(null); } }];
    if (level !== "region") parts.push({ label: selectedRegion, onClick: () => { setLevel("country"); setSelectedCountry(null); } });
    if (level === "state") parts.push({ label: selectedCountry, onClick: () => {} });
    return parts;
  }, [level, selectedRegion, selectedCountry]);

  const isForecast = year > 2026;

  // ─── COUNTRY COMPARISON: "DC consumes more than X's entire grid" ───
  const countryComparison = useMemo(() => {
    const dcTWh = globalTWh;
    const exceeded = COUNTRY_ELEC.filter(c => dcTWh >= c.twh);
    const headline = exceeded.length > 0 ? exceeded[exceeded.length - 1] : null;
    const notExceeded = COUNTRY_ELEC.filter(c => dcTWh < c.twh);
    const approaching = notExceeded.length > 0 ? notExceeded[0] : null;
    const approachPct = approaching ? Math.round((dcTWh / approaching.twh) * 100) : 0;
    const recentBig = exceeded.filter(c => c.twh > 10).slice(-5).reverse();
    return { exceeded, headline, approaching, approachPct, recentBig, dcTWh, total: exceeded.length };
  }, [globalTWh]);

  // Threshold color: matches the legend consistently across all levels
  const thresholdColor = (val) => val > 15 ? FSX.coral : val > 5 ? FSX.amber : FSX.teal;

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(170deg, " + FSX.bg + " 0%, #0D1525 40%, " + FSX.surface + " 100%)", color: FSX.text, fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet" />

      {/* ═══ HEADER ═══ */}
      <div style={{ padding: "28px 32px 24px", borderBottom: "1px solid " + FSX.border, background: "linear-gradient(180deg, rgba(0,191,165,0.03) 0%, transparent 100%)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 20 }}>
          <div style={{ maxWidth: 640 }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: 3, color: FSX.dim, textTransform: "uppercase", marginBottom: 8 }}>Data Center Energy Observatory</div>
            <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, lineHeight: 1.2, color: FSX.white }}>
              How Much of the Grid Do <span style={{ color: FSX.teal, fontStyle: "italic" }}>Data Centers</span> Consume?
            </h1>
            <p style={{ fontSize: 13, color: FSX.muted, marginTop: 10, lineHeight: 1.65 }}>
              Data centers consumed <span style={{ color: FSX.white, fontWeight: 600 }}>1.5% of global electricity</span> in 2024, more than many entire countries.
              This dashboard tracks <span style={{ color: FSX.white, fontWeight: 600 }}>DC electricity as a share of total grid load</span> across regions, countries, and states, from 2000 to 2050 projections.
            </p>
            <div style={{ display: "flex", gap: 16, marginTop: 12, fontSize: 12, color: FSX.dim }}>
              <span><span style={{ color: FSX.teal, fontWeight: 600 }}>1.</span> Drag the year slider</span>
              <span><span style={{ color: FSX.teal, fontWeight: 600 }}>2.</span> Click any region to drill down</span>
              <span><span style={{ color: FSX.teal, fontWeight: 600 }}>3.</span> Explore country & state level</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: FSX.dim, letterSpacing: 1 }}>GLOBAL DC SHARE</div>
              <div style={{ fontSize: 32, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: thresholdColor(globalPct) }}>{globalPct.toFixed(1)}%</div>
              <div style={{ fontSize: 10, color: FSX.faint, fontFamily: "'JetBrains Mono', monospace" }}>of world grid</div>
            </div>
            <div style={{ width: 1, height: 48, background: FSX.border }} />
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: FSX.dim, letterSpacing: 1 }}>CONSUMPTION</div>
              <div style={{ fontSize: 32, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: FSX.white }}>{Math.round(globalTWh)} <span style={{ fontSize: 13, fontWeight: 400, color: FSX.muted }}>TWh</span></div>
              <div style={{ fontSize: 10, color: FSX.faint, fontFamily: "'JetBrains Mono', monospace" }}>in {year}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ COUNTRY COMPARISON BANNER ═══ */}
      {countryComparison.headline && (
        <div style={{ padding: "18px 32px", borderBottom: "1px solid " + FSX.border, background: "linear-gradient(90deg, rgba(0,191,165,0.04) 0%, rgba(0,191,165,0.01) 50%, rgba(0,191,165,0.04) 100%)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
            {/* Left: headline analogy */}
            <div style={{ flex: "1 1 400px", minWidth: 320 }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: 2, color: FSX.dim, textTransform: "uppercase", marginBottom: 6 }}>
                Scale Comparison {"\u00B7"} {year}
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: FSX.text, lineHeight: 1.4 }}>
                Data centers consume more electricity than{" "}
                <span style={{ color: FSX.teal, fontWeight: 700, fontStyle: "italic", fontSize: 18, display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(0,191,165,0.08)", padding: "2px 10px", borderRadius: 6, border: "1px solid rgba(0,191,165,0.15)" }}>
                  {countryComparison.headline.flag} {countryComparison.headline.name}
                </span>
                {"\u2019"}s entire electricity grid
              </div>
              <div style={{ fontSize: 11, color: FSX.dim, marginTop: 6, fontFamily: "'JetBrains Mono', monospace" }}>
                {countryComparison.headline.name}: {countryComparison.headline.twh} TWh {"\u00B7"} Global DCs: {Math.round(countryComparison.dcTWh)} TWh
                <span style={{ marginLeft: 12, color: FSX.muted }}>{"\u2192"} exceeds <span style={{ color: FSX.teal, fontWeight: 600 }}>{countryComparison.total}</span> countries</span>
              </div>
            </div>

            {/* Right: recently exceeded country pills + approaching */}
            <div style={{ flex: "0 0 auto", display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
              {/* Recently exceeded pills */}
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap", justifyContent: "flex-end" }}>
                {countryComparison.recentBig.map(c => (
                  <span key={c.name} style={{ fontSize: 10, padding: "3px 8px", borderRadius: 5, background: "rgba(0,191,165,0.06)", border: "1px solid rgba(0,191,165,0.12)", color: FSX.muted, fontFamily: "'JetBrains Mono', monospace", whiteSpace: "nowrap" }}>
                    {c.flag} {c.name} <span style={{ color: FSX.dim }}>{c.twh} TWh</span>
                  </span>
                ))}
              </div>
              {/* Approaching next country */}
              {countryComparison.approaching && (
                <div style={{ fontSize: 10, color: FSX.dim, fontFamily: "'JetBrains Mono', monospace", textAlign: "right" }}>
                  Approaching: {countryComparison.approaching.flag} {countryComparison.approaching.name} ({countryComparison.approaching.twh} TWh)
                  <div style={{ marginTop: 3, height: 3, width: 120, borderRadius: 2, background: "rgba(255,255,255,0.06)", position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: Math.min(countryComparison.approachPct, 100) + "%", borderRadius: 2, background: countryComparison.approachPct > 90 ? FSX.amber : FSX.teal, transition: "width 0.3s ease" }} />
                  </div>
                  <span style={{ fontSize: 9, color: countryComparison.approachPct > 90 ? FSX.amber : FSX.dim }}>{countryComparison.approachPct}% there</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ YEAR SLIDER ═══ */}
      <div style={{ padding: "16px 32px", background: "rgba(0,0,0,0.15)", borderBottom: "1px solid " + FSX.border }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button onClick={() => setIsPlaying(!isPlaying)}
            style={{ width: 42, height: 42, borderRadius: "50%", background: isPlaying ? FSX.coral : FSX.teal, border: "none", color: FSX.bg, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, flexShrink: 0, boxShadow: isPlaying ? "0 0 16px rgba(255,107,107,0.4)" : "0 0 16px " + FSX.tealGlow }}>
            {isPlaying ? "\u23F8" : "\u25B6"}
          </button>
          <div style={{ flex: 1, position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: FSX.dim }}>2000</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700, color: thresholdColor(globalPct), display: "flex", alignItems: "center", gap: 6 }}>
                {year}
                {isForecast && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "rgba(255,183,77,0.12)", color: FSX.amber, border: "1px solid rgba(255,183,77,0.25)", letterSpacing: 1 }}>FORECAST</span>}
                {!isForecast && year >= 2020 && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "rgba(0,191,165,0.12)", color: FSX.teal, border: "1px solid rgba(0,191,165,0.25)", letterSpacing: 1 }}>REPORTED</span>}
              </span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: FSX.dim }}>2050</span>
            </div>
            <div style={{ position: "relative", height: 28, display: "flex", alignItems: "center" }}>
              <div style={{ position: "absolute", left: 0, right: 0, height: 8, borderRadius: 4, background: "rgba(255,255,255,0.06)" }} />
              <div style={{ position: "absolute", left: 0, height: 8, borderRadius: 4, width: ((year - 2000) / 50 * 100) + "%", background: globalPct > 5 ? (globalPct > 15 ? "linear-gradient(90deg, " + FSX.teal + " 0%, " + FSX.amber + " 60%, " + FSX.coral + " 100%)" : "linear-gradient(90deg, " + FSX.teal + " 0%, " + FSX.amber + " 100%)") : FSX.teal, transition: "width 0.15s ease" }} />
              <div style={{ position: "absolute", left: ((2026 - 2000) / 50 * 100) + "%", top: -2, width: 2, height: 32, background: "rgba(255,183,77,0.5)", borderRadius: 1 }} />
              <input type="range" min={2000} max={2050} step={1} value={year} onChange={e => setYear(+e.target.value)} style={{ position: "absolute", left: 0, right: 0, width: "100%", height: 28, opacity: 0, cursor: "pointer", zIndex: 2 }} />
              <div style={{ position: "absolute", left: "calc(" + ((year - 2000) / 50 * 100) + "% - 10px)", width: 20, height: 20, borderRadius: "50%", background: globalPct > 15 ? FSX.coral : globalPct > 5 ? FSX.amber : FSX.teal, boxShadow: "0 0 14px " + (globalPct > 15 ? "rgba(255,107,107,0.5)" : globalPct > 5 ? "rgba(255,183,77,0.5)" : FSX.tealGlow), border: "3px solid " + FSX.bg, pointerEvents: "none", transition: "background 0.3s ease" }} />
            </div>
          </div>
        </div>
      </div>

      {/* ═══ BREADCRUMB ═══ */}
      <div style={{ padding: "12px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid " + FSX.border }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13 }}>
          {breadcrumb.map((b, i) => (
            <span key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {i > 0 && <span style={{ color: FSX.faint }}>{"\u203A"}</span>}
              <span onClick={b.onClick} style={{ color: i === breadcrumb.length - 1 ? FSX.text : FSX.teal, cursor: i === breadcrumb.length - 1 ? "default" : "pointer", fontWeight: i === breadcrumb.length - 1 ? 600 : 400 }}>{b.label}</span>
            </span>
          ))}
        </div>
        {level !== "region" && <button onClick={handleBack} style={{ fontSize: 12, padding: "5px 14px", borderRadius: 6, background: "rgba(255,255,255,0.04)", border: "1px solid " + FSX.border, color: FSX.muted, cursor: "pointer" }}>{"\u2190"} Back</button>}
      </div>

      {/* ═══ DATA BARS ═══ */}
      <div style={{ padding: "16px 32px", overflowY: "auto", maxHeight: "calc(100vh - 410px)" }}>
        {currentData.map((item, idx) => {
          const canDrill = (level === "region") || (level === "country" && COUNTRY_DATA[item.name]?.states);
          const barWidth = Math.max((item.value / Math.max(maxBarValue, 1)) * 100, 0.5);
          const barColor = thresholdColor(item.value);
          const intensity = item.value > 20 ? 1 : item.value > 10 ? 0.85 : item.value > 5 ? 0.7 : item.value > 2 ? 0.55 : 0.4;
          return (
            <div key={item.name} onClick={() => canDrill && handleDrillDown(item)} onMouseEnter={() => setHoveredItem(item.name)} onMouseLeave={() => setHoveredItem(null)}
              style={{ display: "flex", alignItems: "center", gap: 14, padding: "11px 16px", borderRadius: 10, marginBottom: 6, background: hoveredItem === item.name ? "rgba(0,191,165,0.04)" : "rgba(255,255,255,0.015)", border: "1px solid " + (hoveredItem === item.name ? "rgba(0,191,165,0.15)" : FSX.border), cursor: canDrill ? "pointer" : "default", transition: "all 0.2s ease" }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: FSX.faint, width: 18, textAlign: "right", flexShrink: 0 }}>{idx + 1}</div>
              <div style={{ width: 170, flexShrink: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: FSX.text, display: "flex", alignItems: "center", gap: 6 }}>
                  {item.name}
                  {canDrill && <span style={{ fontSize: 9, color: FSX.dim, background: "rgba(0,191,165,0.08)", padding: "1px 5px", borderRadius: 3, border: "1px solid rgba(0,191,165,0.15)" }}>drill {"\u2192"}</span>}
                </div>
                <div style={{ marginTop: 3 }}><Sparkline points={item.points} year={year} color={barColor} width={130} height={26} /></div>
              </div>
              <div style={{ flex: 1, position: "relative", height: 26 }}>
                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: barWidth + "%", borderRadius: 6, background: "linear-gradient(90deg, " + barColor + Math.round(intensity * 255).toString(16).padStart(2, "0") + " 0%, " + barColor + Math.round(intensity * 0.5 * 255).toString(16).padStart(2, "0") + " 100%)", transition: "width 0.3s ease" }} />
                {item.value > 12 && <div style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: "rgba(255,255,255,0.7)", zIndex: 1 }}>{item.value.toFixed(1)}%</div>}
              </div>
              <div style={{ width: 65, textAlign: "right", flexShrink: 0, fontFamily: "'JetBrains Mono', monospace" }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: barColor }}>{item.value.toFixed(1)}%</div>
              </div>
            </div>
          );
        })}

        {/* ═══ LEGEND & SOURCES ═══ */}
        <div style={{ marginTop: 20, padding: "18px 20px", borderRadius: 10, background: "rgba(255,255,255,0.015)", border: "1px solid " + FSX.border }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: FSX.dim, marginBottom: 10, letterSpacing: 1, textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace" }}>How to Read This Dashboard</div>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 12 }}>
            {[{ color: FSX.teal, label: "< 5% of grid, modest share" }, { color: FSX.amber, label: "5\u201315%, significant load" }, { color: FSX.coral, label: "> 15%, critical grid pressure" }].map(t => (
              <div key={t.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: t.color }} />
                <span style={{ fontSize: 11, color: FSX.muted }}>{t.label}</span>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11, color: FSX.dim, marginBottom: 14 }}>
            Each bar shows data center electricity as a percentage of total grid electricity for that territory.
            The sparkline shows the full 2000{"\u2013"}2050 trajectory. The dashed line marks the 2026 forecast boundary.
          </div>

          <div style={{ fontSize: 11, fontWeight: 600, color: FSX.dim, marginBottom: 8, marginTop: 14, letterSpacing: 1, textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace" }}>Data Sources & Methodology</div>
          <div style={{ fontSize: 10, color: FSX.dim, lineHeight: 1.7, marginBottom: 12 }}>
            <span style={{ color: FSX.muted, fontWeight: 600 }}>Historical data (2000{"\u2013"}2026):</span> compiled from published government and institutional reports.{" "}
            <span style={{ color: FSX.muted, fontWeight: 600 }}>Projections (2027{"\u2013"}2050):</span> based on IEA Base Case scenario (Energy & AI, 2025) and EPRI growth scenarios.{" "}
            <span style={{ color: FSX.muted, fontWeight: 600 }}>Country comparison:</span> national electricity consumption from IEA Global Energy Review 2025 / Ember / Enerdata (2024 baseline).
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {Object.values(SOURCES).map(s => (
              <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 9, padding: "3px 8px", borderRadius: 4, textDecoration: "none", background: "rgba(0,191,165,0.04)", border: "1px solid rgba(0,191,165,0.1)", color: FSX.dim, fontFamily: "'JetBrains Mono', monospace" }}>
                {s.name} ({s.year}) {"\u00B7"} {s.license}
              </a>
            ))}
          </div>
          <div style={{ fontSize: 9, color: FSX.faint, marginTop: 12, lineHeight: 1.5 }}>
            IEA data used under Creative Commons Attribution 4.0 International License (CC BY 4.0). US government data (EIA, LBNL, DOE) is public domain. This dashboard synthesizes publicly reported aggregate statistics.
          </div>
        </div>
      </div>
    </div>
  );
}
