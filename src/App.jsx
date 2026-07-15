import { useState, useEffect, useMemo } from "react";

// ─────────── SHEET BACKEND (paste your published CSV URLs here) ───────────
// File > Share > Publish to web > pick tab > CSV. Leave blank to use placeholders.
const SHEET_CSV = {
  hospitals: "",
  schedule: "",
  links: "",
  announcement: "",
};
// Editable Google Sheet link — the top-right menu "Edit schedule" opens this.
const SHEET_EDIT_URL = "";

// ─────────── FALLBACK PLACEHOLDER DATA ───────────
const HOSPITALS_FALLBACK = [
  { id: 1, abbr: "H1", title: "Hospital 1", full: "Placeholder Hospital One", color: "#3f8a9d" },
  { id: 2, abbr: "H2", title: "Hospital 2", full: "Placeholder Hospital Two", color: "#3f8a9d" },
  { id: 3, abbr: "H3", title: "Hospital 3", full: "Placeholder Hospital Three", color: "#7b5ea7" },
  { id: 4, abbr: "H4", title: "Hospital 4", full: "Placeholder Hospital Four", color: "#c99a2e" },
  { id: 5, abbr: "H5", title: "Hospital 5", full: "Placeholder Hospital Five", color: "#4a8b6f" },
  { id: 6, abbr: "H6", title: "Hospital 6", full: "Placeholder Hospital Six", color: "#b5443a" },
  { id: 7, abbr: "H7", title: "Hospital 7", full: "Placeholder Hospital Seven", color: "#7b5ea7", fullWidth: true },
];

const ROLES = [
  { key: "IR", label: "IR", icon: "🩺", color: "#6b4e8f" },
  { key: "RES", label: "Resident", icon: "🧑‍⚕️", color: "#5a6b7d" },
  { key: "IRRN", label: "IR RN", icon: "💉", color: "#3d7d8f" },
  { key: "IRTECH", label: "IR Tech", icon: "🖥️", color: "#4a7ba8" },
  { key: "CTTECH", label: "CT Tech", icon: "🖥️", color: "#3f8a9d" },
  { key: "ANES", label: "Anesthesia", icon: "💉", color: "#c96a4a" },
  { key: "TIE", label: "Tie Line Dialer", icon: "📞", color: "#4a8b6f" },
  { key: "OTHER", label: "Other Numbers", icon: "🔢", color: "#b5843a" },
];
const LINKS_FALLBACK = [
  { label: "Link One", url: "", color: "blue" },
  { label: "Link Two", url: "", color: "lightblue" },
  { label: "Link Three", url: "", color: "navy" },
];

function rosterFallback(roleKey, hospId) {
  const p = (a, b) => `(555) ${String(100 + hospId).padStart(3, "0")}-${a}${b}`;
  switch (roleKey) {
    case "IR": return [{ header: "IR — 5:00 PM – 7:00 AM", people: [{ name: "Dr. Placeholder One", time: "5p-7a", phone: p("00", "01") }] }];
    case "RES": return [{ header: "Resident On-Call", people: [{ name: "Dr. Placeholder Two", time: "5p-7a", phone: p("01", "02") }] }];
    case "IRRN": return [
      { header: "In-House IR RN — 7A-7:30P", people: [
        { name: "Nurse Placeholder A", time: "7a-7:30p", phone: p("02", "10") },
        { name: "Nurse Placeholder B", time: "7a-7:30p", phone: p("02", "11") },
        { name: "Nurse Placeholder C", time: "7a-7:30p", phone: p("02", "12") }] },
      { header: "Primary IR RN", people: [{ name: "Nurse Placeholder D", time: "7a-7p", phone: p("02", "20") }] }];
    case "IRTECH": return [{ header: "IR Tech — 7A-5P", people: [
      { name: "Tech Placeholder A", time: "7a-5p", phone: p("03", "30") },
      { name: "Tech Placeholder B", time: "7a-5p", phone: p("03", "31") }] }];
    case "CTTECH": return [{ header: "CT Tech", people: [
      { name: "Tech Placeholder C", time: "7a-7p", phone: p("04", "40") },
      { name: "Tech Placeholder D", time: "7p-7a", phone: p("04", "41") }] }];
    case "ANES": return [{ header: "Anesthesia", people: [{ name: "Dr. Placeholder Three", time: "On-call", phone: p("05", "50") }] }];
    case "TIE": return [{ header: "Tie Line Dialer", people: [
      { name: "Tie Line 1", time: "", phone: p("06", "60") },
      { name: "Tie Line 2", time: "", phone: p("06", "61") }] }];
    case "OTHER": return [{ header: "Other Numbers", people: [
      { name: "Front Desk", time: "", phone: p("07", "70") },
      { name: "Reading Room", time: "", phone: p("07", "71") },
      { name: "Scheduling", time: "", phone: p("07", "72") }] }];
    default: return [];
  }
}

// ─────────── CSV PARSER (handles quoted fields) ───────────
function parseCSV(text) {
  const rows = []; let row = [], field = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') q = false;
      else field += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c !== "\r") field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  if (!rows.length) return [];
  const head = rows[0].map((h) => h.trim());
  return rows.slice(1).filter((r) => r.some((v) => v.trim() !== ""))
    .map((r) => Object.fromEntries(head.map((h, i) => [h, (r[i] || "").trim()])));
}

const tel = (n) => "tel:+1" + n.replace(/[^0-9]/g, "");
const sms = (n) => "sms:+1" + n.replace(/[^0-9]/g, "");

function buildDays() {
  const names = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const longNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const mon = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const today = new Date(); const out = [];
  for (let i = -3; i <= 3; i++) {
    const d = new Date(today); d.setDate(today.getDate() + i);
    out.push({ dn: names[d.getDay()], dd: `${mon[d.getMonth()]} ${d.getDate()}`, isToday: i === 0,
      full: `${longNames[d.getDay()]}, ${mon[d.getMonth()]} ${d.getDate()}`,
      short: ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d.getDay()] });
  }
  return out;
}

export default function App() {
  const days = useMemo(buildDays, []);
  const [view, setView] = useState("home");
  const [curHosp, setCurHosp] = useState(0);
  const [curRole, setCurRole] = useState("IR");
  const [curDay, setCurDay] = useState(3);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem("iroc-theme") === "dark"; } catch { return false; }
  });

  const [hospitals, setHospitals] = useState(HOSPITALS_FALLBACK);
  const [links, setLinks] = useState(LINKS_FALLBACK);
  const [schedule, setSchedule] = useState(null);
  const [announcement, setAnnouncement] = useState("Placeholder announcement text goes here.");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    try { localStorage.setItem("iroc-theme", dark ? "dark" : "light"); } catch {}
  }, [dark]);

  function loadSheets() {
    if (SHEET_CSV.hospitals) fetch(SHEET_CSV.hospitals).then(r => r.text()).then(t => {
      const rows = parseCSV(t).map(x => ({ id: +x.id, abbr: x.abbr, title: x.title, full: x.full, color: x.color }));
      if (rows.length) { rows[rows.length - 1].fullWidth = true; setHospitals(rows); }
    }).catch(() => {});
    if (SHEET_CSV.links) fetch(SHEET_CSV.links).then(r => r.text()).then(t => {
      const rows = parseCSV(t); if (rows.length) setLinks(rows);
    }).catch(() => {});
    if (SHEET_CSV.schedule) fetch(SHEET_CSV.schedule).then(r => r.text()).then(t => {
      const rows = parseCSV(t); if (rows.length) setSchedule(rows);
    }).catch(() => {});
    if (SHEET_CSV.announcement) fetch(SHEET_CSV.announcement).then(r => r.text()).then(t => {
      const rows = parseCSV(t); if (rows.length) setAnnouncement(rows);
    }).catch(() => {});
  }
  useEffect(loadSheets, []);

  function rosterFor(roleKey, hospId, dayShort) {
    if (schedule) {
      const label = ROLES.find(r => r.key === roleKey).label;
      const rows = schedule.filter(r => +r.hospital_id === hospId && r.role === label &&
        (r.day === "*" || r.day === "" || r.day === dayShort));
      const groups = [];
      rows.forEach(r => {
        let g = groups.find(x => x.header === r.group);
        if (!g) { g = { header: r.group, people: [] }; groups.push(g); }
        g.people.push({ name: r.name, time: r.time, phone: r.phone });
      });
      if (groups.length) return groups;
    }
    return rosterFallback(roleKey, hospId);
  }

  function annText(hospId) {
    if (Array.isArray(announcement)) {
      const row = announcement.find(a => a.hospital_id === "*" || +a.hospital_id === hospId);
      return row ? row.text : "";
    }
    return announcement;
  }

  const openHosp = (i) => { setCurHosp(i); setCurRole("IR"); setView("detail"); setMenuOpen(false); window.scrollTo(0, 0); };
  const goHome = () => { setView("home"); setMenuOpen(false); window.scrollTo(0, 0); };
  const theme = ROLES.find((r) => r.key === curRole).color;

  const Menu = () => (
    <div className="menu-wrap">
      <button className="menu-btn" aria-label="Menu" onClick={() => setMenuOpen(o => !o)}>
        <span /><span /><span />
      </button>
      {menuOpen && (
        <div className="menu-panel">
          <div className="menu-title">Menu</div>
          <a className="menu-item" href={SHEET_EDIT_URL || "#"} target="_blank" rel="noreferrer"
             onClick={() => setMenuOpen(false)}>✎ Edit schedule / change shifts</a>
          <button className="menu-item" onClick={() => { loadSheets(); setMenuOpen(false); }}>⟳ Refresh on-call data</button>
          {view === "detail" && <button className="menu-item" onClick={goHome}>⌂ Back to hospitals</button>}
        </div>
      )}
    </div>
  );

  const ThemeToggle = () => (
    <div className="theme-toggle">
      <button className={!dark ? "on" : ""} onClick={() => setDark(false)}>☀ Light</button>
      <button className={dark ? "on" : ""} onClick={() => setDark(true)}>☾ Night</button>
    </div>
  );

  if (view === "home") {
    return (
      <div className="wrap">
        <div className="home">
          <div className="home-head"><Menu /></div>
          <div className="eyebrow">Interventional Radiology On-Call</div>
          <div className="logo">IROC</div>
          <div className="logo-underline"><span /><span /><span /></div>

          <div className="grid">
            {hospitals.map((h, i) => (
              <button key={i} className={`hcard${h.fullWidth ? " full" : ""}`} style={{ "--hc": h.color }} onClick={() => openHosp(i)}>
                <div className="avatar" style={{ background: h.color }}>{h.abbr}</div>
                <div className="hc-main">
                  <div className="hc-title">{h.title}</div>
                  <div className="hc-sub">{h.full}</div>
                </div>
                <div className="chev">›</div>
              </button>
            ))}
          </div>

          <div className="section-label">Quick Links</div>
          <div className="quick">
            {links.map((l, i) => (
              <a key={i} className={`qbtn q-${l.color || "blue"}`} href={l.url || "#"} target="_blank" rel="noreferrer">{l.label}</a>
            ))}
          </div>

          <ThemeToggle />
        </div>
      </div>
    );
  }

  const hosp = hospitals[curHosp];
  const day = days[curDay];
  const groups = rosterFor(curRole, hosp.id, day.short);

  return (
    <div className="wrap" style={{ "--theme": theme }}>
      <div className="detail">
        <div className="topbar">
          <button className="pill-btn" onClick={goHome}>← Back</button>
          <h1>{hosp.title}</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button className="pill-btn" onClick={() => alert("Navigate — placeholder")}>📍</button>
            <Menu />
          </div>
        </div>

        <div className="detail-body">
          {annText(hosp.id) && (
            <div className="announce">
              <div className="announce-h">📢 Announcements</div>
              <div className="announce-t">{annText(hosp.id)}</div>
            </div>
          )}

          <div className="days">
            {days.map((d, i) => (
              <div key={i} className={`day${i === curDay ? " sel" : ""}`} onClick={() => setCurDay(i)}>
                <div className="dn">{d.dn}</div><div className="dd">{d.dd}</div>
              </div>
            ))}
          </div>

          <div className="mini-label">Role</div>
          <div className="roles">
            {ROLES.map((r) => (
              <button key={r.key} className={`role${r.key === curRole ? " sel" : ""}`} onClick={() => setCurRole(r.key)}>
                <span className="ri">{r.icon}</span>{r.label}
              </button>
            ))}
          </div>

          <div className="oncall-head">
            On-Call — {day.full} {day.isToday && <span className="today-badge">TODAY</span>}
          </div>

          {groups.map((g, gi) => (
            <div className="group" key={gi}>
              <div className="group-h">{g.header}</div>
              {g.people.map((pp, pi) => (
                <div className="person" key={pi}>
                  <div className="person-line">
                    <b>{pp.name}</b>{pp.time && <span className="meta"> · {pp.time}</span>} · 📞 <span className="ph">{pp.phone}</span>
                  </div>
                  <div className="ct-row">
                    <a className="ct ct-call" href={tel(pp.phone)}>📞 Call</a>
                    <a className="ct ct-text" href={sms(pp.phone)}>💬 Text</a>
                  </div>
                </div>
              ))}
            </div>
          ))}

          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}
