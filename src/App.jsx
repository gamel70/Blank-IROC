import { useState, useMemo } from "react";

// ─────────────────────────── PLACEHOLDER DATA ───────────────────────────
const HOSPITALS = [
  { abbr: "H1", title: "Hospital 1", full: "Placeholder Hospital One", color: "#3f8a9d" },
  { abbr: "H2", title: "Hospital 2", full: "Placeholder Hospital Two", color: "#3f8a9d" },
  { abbr: "H3", title: "Hospital 3", full: "Placeholder Hospital Three", color: "#7b5ea7" },
  { abbr: "H4", title: "Hospital 4", full: "Placeholder Hospital Four", color: "#c99a2e" },
  { abbr: "H5", title: "Hospital 5", full: "Placeholder Hospital Five", color: "#4a8b6f" },
  { abbr: "H6", title: "Hospital 6", full: "Placeholder Hospital Six", color: "#b5443a" },
  { abbr: "H7", title: "Hospital 7", full: "Placeholder Hospital Seven", color: "#7b5ea7", fullWidth: true },
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

function rosterFor(roleKey, hospIndex) {
  const p = (a, b) => `(555) ${String(100 + hospIndex).padStart(3, "0")}-${a}${b}`;
  switch (roleKey) {
    case "IR":
      return [{ header: "IR — 5:00 PM – 7:00 AM", people: [{ name: "Dr. Placeholder One", time: "5p-7a", phone: p("00", "01") }] }];
    case "RES":
      return [{ header: "Resident On-Call", people: [{ name: "Dr. Placeholder Two", time: "5p-7a", phone: p("01", "02") }] }];
    case "IRRN":
      return [
        { header: "In-House IR RN — 7A-7:30P", people: [
          { name: "Nurse Placeholder A", time: "7a-7:30p", phone: p("02", "10") },
          { name: "Nurse Placeholder B", time: "7a-7:30p", phone: p("02", "11") },
          { name: "Nurse Placeholder C", time: "7a-7:30p", phone: p("02", "12") },
        ]},
        { header: "Primary IR RN", people: [{ name: "Nurse Placeholder D", time: "7a-7p", phone: p("02", "20") }] },
      ];
    case "IRTECH":
      return [{ header: "IR Tech — 7A-5P", people: [
        { name: "Tech Placeholder A", time: "7a-5p", phone: p("03", "30") },
        { name: "Tech Placeholder B", time: "7a-5p", phone: p("03", "31") },
      ]}];
    case "CTTECH":
      return [{ header: "CT Tech", people: [
        { name: "Tech Placeholder C", time: "7a-7p", phone: p("04", "40") },
        { name: "Tech Placeholder D", time: "7p-7a", phone: p("04", "41") },
      ]}];
    case "ANES":
      return [{ header: "Anesthesia", people: [{ name: "Dr. Placeholder Three", time: "On-call", phone: p("05", "50") }] }];
    case "TIE":
      return [{ header: "Tie Line Dialer", people: [
        { name: "Tie Line 1", time: "", phone: p("06", "60") },
        { name: "Tie Line 2", time: "", phone: p("06", "61") },
      ]}];
    case "OTHER":
      return [{ header: "Other Numbers", people: [
        { name: "Front Desk", time: "", phone: p("07", "70") },
        { name: "Reading Room", time: "", phone: p("07", "71") },
        { name: "Scheduling", time: "", phone: p("07", "72") },
      ]}];
    default:
      return [];
  }
}

function buildDays() {
  const names = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const longNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const mon = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const today = new Date();
  const out = [];
  for (let i = -3; i <= 3; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    out.push({
      dn: names[d.getDay()],
      dd: `${mon[d.getMonth()]} ${d.getDate()}`,
      isToday: i === 0,
      full: `${longNames[d.getDay()]}, ${mon[d.getMonth()]} ${d.getDate()}`,
    });
  }
  return out;
}

const tel = (n) => "tel:+1" + n.replace(/[^0-9]/g, "");
const sms = (n) => "sms:+1" + n.replace(/[^0-9]/g, "");

// ─────────────────────────── APP ───────────────────────────
export default function App() {
  const days = useMemo(buildDays, []);
  const [view, setView] = useState("home");
  const [curHosp, setCurHosp] = useState(0);
  const [curRole, setCurRole] = useState("IR");
  const [curDay, setCurDay] = useState(3);

  const theme = ROLES.find((r) => r.key === curRole).color;

  function openHosp(i) {
    setCurHosp(i);
    setCurRole("IR");
    setView("detail");
    window.scrollTo(0, 0);
  }
  function goHome() {
    setView("home");
    window.scrollTo(0, 0);
  }

  if (view === "home") {
    return (
      <div className="wrap">
        <div className="home">
          <div className="eyebrow">Interventional Radiology On-Call</div>
          <div className="logo">IROC</div>
          <div className="logo-underline"><span /><span /><span /></div>

          <div className="grid">
            {HOSPITALS.map((h, i) => (
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
            <button className="qbtn q-blue">🔗 Link One</button>
            <button className="qbtn q-lightblue">📄 Link Two</button>
            <button className="qbtn q-navy">☁️ Link Three</button>
          </div>

          <div className="divider" />

          <div className="suggest-box">
            <div className="suggest-title">💡 Suggest an Improvement</div>
            <textarea placeholder="Idea, issue, or feature request..." />
            <button className="send-sug">📨 Send Suggestion</button>
          </div>
        </div>
      </div>
    );
  }

  const hosp = HOSPITALS[curHosp];
  const day = days[curDay];
  const groups = rosterFor(curRole, curHosp);

  return (
    <div className="wrap" style={{ "--theme": theme }}>
      <div className="detail">
        <div className="topbar">
          <button className="pill-btn" onClick={goHome}>← Back</button>
          <h1>{hosp.title}</h1>
          <button className="pill-btn" onClick={() => alert("Navigate — placeholder")}>📍 Navigate</button>
        </div>

        <div className="detail-body">
          <div className="announce">
            <div className="announce-h">📢 Announcements</div>
            <div className="announce-t">Placeholder announcement text goes here.</div>
          </div>

          <div className="days">
            {days.map((d, i) => (
              <div key={i} className={`day${i === curDay ? " sel" : ""}`} onClick={() => setCurDay(i)}>
                <div className="dn">{d.dn}</div>
                <div className="dd">{d.dd}</div>
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
                    <b>{pp.name}</b>
                    {pp.time && <span className="meta"> · {pp.time}</span>} · 📞 <span className="ph">{pp.phone}</span>
                  </div>
                  <div className="ct-row">
                    <a className="ct ct-call" href={tel(pp.phone)}>📞 Call</a>
                    <a className="ct ct-text" href={sms(pp.phone)}>💬 Text</a>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
