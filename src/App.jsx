import { useState, useEffect } from "react";

const MCP_SERVERS = [
  { type: "url", url: "https://gmailmcp.googleapis.com/mcp/v1", name: "gmail-mcp" },
  { type: "url", url: "https://calendarmcp.googleapis.com/mcp/v1", name: "calendar-mcp" }
];

async function callClaude(prompt, systemPrompt = "") {
  const body = {
    model: "claude-sonnet-4-20250514",
    max_tokens: 1000,
    messages: [{ role: "user", content: prompt }],
    mcp_servers: MCP_SERVERS,
  };
  if (systemPrompt) body.system = systemPrompt;
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

function extractJSON(data) {
  if (!data?.content) return null;
  const text = data.content.filter(b => b.type === "text").map(b => b.text).join("\n");
  const match = text.match(/```json\n?([\s\S]*?)```/) || text.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
  if (match) { try { return JSON.parse(match[1] || match[0]); } catch {} }
  try { return JSON.parse(text); } catch {}
  return null;
}

const PROJECTS = [
  { name: "AI Audit Product", tag: "🧠", color: "#00d4aa", status: "In Progress", note: "Using Swan as live test case" },
  { name: "AI Made Simple", tag: "▶️", color: "#ff6b35", status: "Active", note: "YouTube channel" },
  { name: "LeadFlow App", tag: "📍", color: "#4e9af1", status: "Live", note: "Vercel deployed" },
  { name: "RoofBlock", tag: "🏠", color: "#a78bfa", status: "On Hold", note: "Contractor pitch deck ready" },
  { name: "Swan Dust Control", tag: "💼", color: "#fbbf24", status: "Day Job", note: "S. Ontario territory" },
];

const QUICK_LINKS = [
  { label: "Gmail", url: "https://mail.google.com", icon: "📧" },
  { label: "Google Calendar", url: "https://calendar.google.com", icon: "📅" },
  { label: "Questrade", url: "https://questrade.com", icon: "📈" },
  { label: "LeadFlow", url: "https://leads-seven-olive.vercel.app", icon: "🗺️" },
  { label: "YouTube Studio", url: "https://studio.youtube.com", icon: "🎬" },
  { label: "Claude.ai", url: "https://claude.ai", icon: "🤖" },
];

function Clock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const h = time.getHours() % 12 || 12;
  const m = String(time.getMinutes()).padStart(2, "0");
  const s = String(time.getSeconds()).padStart(2, "0");
  const ampm = time.getHours() >= 12 ? "PM" : "AM";
  const day = time.toLocaleDateString("en-CA", { weekday: "long", month: "long", day: "numeric" });
  return (
    <div style={{ textAlign: "center", marginBottom: 8 }}>
      <div style={{ fontSize: 52, fontFamily: "'Bebas Neue', cursive", letterSpacing: 4, color: "#00d4aa", lineHeight: 1 }}>
        {h}:{m}<span style={{ fontSize: 28, color: "#666", marginLeft: 4 }}>{s}</span>
        <span style={{ fontSize: 22, color: "#888", marginLeft: 8 }}>{ampm}</span>
      </div>
      <div style={{ fontSize: 13, color: "#888", letterSpacing: 2, textTransform: "uppercase", marginTop: 2 }}>{day}</div>
    </div>
  );
}

function Card({ title, icon, children, style = {} }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "18px 20px", ...style }}>
      <div style={{ fontSize: 11, letterSpacing: 3, color: "#555", textTransform: "uppercase", marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
        <span>{icon}</span> {title}
      </div>
      {children}
    </div>
  );
}

function Loader({ label }) {
  return (
    <div style={{ color: "#444", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</span> {label}
    </div>
  );
}

function EmailPanel() {
  const [emails, setEmails] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      try {
        const data = await callClaude("Search my Gmail inbox for the 5 most recent unread emails. Return ONLY a JSON array with objects: {from, subject, snippet, time}. No extra text.", "Return ONLY a valid JSON array. No markdown, no explanation.");
        const json = extractJSON(data);
        setEmails(Array.isArray(json) ? json.slice(0, 5) : []);
      } catch { setEmails([]); }
      setLoading(false);
    })();
  }, []);
  return (
    <Card title="Inbox" icon="📧">
      {loading ? <Loader label="Fetching emails..." /> :
        !emails || emails.length === 0 ? <div style={{ color: "#444", fontSize: 13 }}>No unread emails found.</div> :
        emails.map((e, i) => (
          <div key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: 10, marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
              <span style={{ fontSize: 12, color: "#00d4aa", fontWeight: 600 }}>{e.from?.split("<")[0].trim().slice(0, 22)}</span>
              <span style={{ fontSize: 10, color: "#444" }}>{e.time || ""}</span>
            </div>
            <div style={{ fontSize: 13, color: "#ccc", fontWeight: 500, marginBottom: 2 }}>{e.subject?.slice(0, 42)}</div>
            <div style={{ fontSize: 11, color: "#555" }}>{e.snippet?.slice(0, 70)}…</div>
          </div>
        ))
      }
    </Card>
  );
}

function CalendarPanel() {
  const [events, setEvents] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      try {
        const today = new Date().toISOString().split("T")[0];
        const data = await callClaude(`Fetch my Google Calendar events for today and the next 3 days starting from ${today}. Return ONLY a JSON array with objects: {title, start, end, date}. No extra text.`, "Return ONLY a valid JSON array. No markdown, no explanation.");
        const json = extractJSON(data);
        setEvents(Array.isArray(json) ? json.slice(0, 7) : []);
      } catch { setEvents([]); }
      setLoading(false);
    })();
  }, []);
  return (
    <Card title="Upcoming" icon="📅">
      {loading ? <Loader label="Loading calendar..." /> :
        !events || events.length === 0 ? <div style={{ color: "#444", fontSize: 13 }}>No upcoming events found.</div> :
        events.map((e, i) => (
          <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 12 }}>
            <div style={{ background: "rgba(0,212,170,0.1)", border: "1px solid rgba(0,212,170,0.2)", borderRadius: 8, padding: "4px 8px", minWidth: 48, textAlign: "center" }}>
              <div style={{ fontSize: 10, color: "#00d4aa", letterSpacing: 1 }}>{(e.date || e.start || "").slice(5, 10)}</div>
              <div style={{ fontSize: 11, color: "#888" }}>{(e.start || "").slice(11, 16) || "All day"}</div>
            </div>
            <div>
              <div style={{ fontSize: 13, color: "#ddd", fontWeight: 500 }}>{e.title?.slice(0, 38)}</div>
              {e.end && <div style={{ fontSize: 11, color: "#555" }}>Until {e.end?.slice(11, 16)}</div>}
            </div>
          </div>
        ))
      }
    </Card>
  );
}

function TodoPanel() {
  const [todos, setTodos] = useState(() => {
    try { return JSON.parse(localStorage.getItem("dash_todos") || "[]"); } catch { return []; }
  });
  const [input, setInput] = useState("");
  const save = (list) => { setTodos(list); try { localStorage.setItem("dash_todos", JSON.stringify(list)); } catch {} };
  const add = () => { if (!input.trim()) return; save([{ text: input.trim(), done: false, id: Date.now() }, ...todos]); setInput(""); };
  const toggle = (id) => save(todos.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const remove = (id) => save(todos.filter(t => t.id !== id));
  return (
    <Card title="Today's Priorities" icon="🎯">
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && add()} placeholder="Add a priority..."
          style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "7px 12px", color: "#ccc", fontSize: 13, outline: "none" }} />
        <button onClick={add} style={{ background: "#00d4aa", border: "none", borderRadius: 8, color: "#000", fontSize: 18, width: 34, cursor: "pointer", fontWeight: 700 }}>+</button>
      </div>
      {todos.length === 0 && <div style={{ color: "#444", fontSize: 13 }}>Nothing yet — add something above.</div>}
      {todos.map(t => (
        <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <div onClick={() => toggle(t.id)} style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${t.done ? "#00d4aa" : "#444"}`, background: t.done ? "#00d4aa" : "transparent", cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {t.done && <span style={{ fontSize: 10, color: "#000" }}>✓</span>}
          </div>
          <span style={{ flex: 1, fontSize: 13, color: t.done ? "#444" : "#ccc", textDecoration: t.done ? "line-through" : "none" }}>{t.text}</span>
          <span onClick={() => remove(t.id)} style={{ color: "#333", cursor: "pointer", fontSize: 14, paddingLeft: 4 }}>×</span>
        </div>
      ))}
    </Card>
  );
}

export default function Dashboard() {
  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#ccc", fontFamily: "'DM Sans', sans-serif", padding: "24px 20px", boxSizing: "border-box" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input::placeholder { color: #444; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #222; border-radius: 4px; }
      `}</style>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ fontSize: 10, letterSpacing: 4, color: "#444", textTransform: "uppercase", marginBottom: 8 }}>Dan's Command Center</div>
        <Clock />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <EmailPanel />
          <Card title="Quick Links" icon="🔗">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {QUICK_LINKS.map((l, i) => (
                <a key={i} href={l.url} target="_blank" rel="noreferrer"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "8px 10px", textDecoration: "none", color: "#bbb", fontSize: 12, display: "flex", alignItems: "center", gap: 6, transition: "background 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(0,212,170,0.08)"}
                  onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}>
                  <span>{l.icon}</span> {l.label}
                </a>
              ))}
            </div>
          </Card>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <CalendarPanel />
          <TodoPanel />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Card title="Active Projects" icon="🚀">
            {PROJECTS.map((p, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 12 }}>
                <div style={{ width: 3, borderRadius: 4, background: p.color, alignSelf: "stretch", flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, color: "#ddd", fontWeight: 500 }}>{p.tag} {p.name}</span>
                    <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 10, background: `${p.color}22`, color: p.color, letterSpacing: 1 }}>{p.status}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>{p.note}</div>
                </div>
              </div>
            ))}
          </Card>
          <Card title="Focus Mode" icon="🔥" style={{ background: "rgba(255,107,53,0.05)", borderColor: "rgba(255,107,53,0.15)" }}>
            <div style={{ fontSize: 12, color: "#888", marginBottom: 10 }}>What's the ONE thing today?</div>
            <textarea placeholder="Type your main focus for today..." style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "10px 12px", color: "#ccc", fontSize: 13, resize: "none", height: 80, outline: "none", fontFamily: "inherit" }} />
            <div style={{ fontSize: 11, color: "#444", marginTop: 8 }}>💡 Nail this one thing and the day wins.</div>
          </Card>
          <Card title="Territory Snapshot" icon="📍">
            {[
              { area: "Hamilton / Burlington", status: "🟢 Active" },
              { area: "Niagara Region", status: "🟡 Follow-up" },
              { area: "KW / Cambridge", status: "🟢 Active" },
              { area: "London", status: "🔴 Prospect" },
            ].map((r, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 12 }}>
                <span style={{ color: "#bbb" }}>{r.area}</span>
                <span style={{ color: "#666" }}>{r.status}</span>
              </div>
            ))}
          </Card>
        </div>
      </div>
      <div style={{ textAlign: "center", marginTop: 24, fontSize: 10, color: "#2a2a2a", letterSpacing: 2 }}>DAN'S COMMAND CENTER — BRANTFORD, ON</div>
    </div>
  );
}
