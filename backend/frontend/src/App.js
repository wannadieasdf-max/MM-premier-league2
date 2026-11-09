import React, { useEffect, useMemo, useState } from "react";

const API = (process.env.REACT_APP_BACKEND_URL || "https://mm-premier-league-by-hj.onrender.com").replace(/\/$/, "");
const initialTeams = Array.from({ length: 8 }, (_, i) => `Team ${i + 1}`);
const initialState = {
  teams: initialTeams,
  scores: Array.from({ length: 7 }, () => ({ aRuns: 0, aWkts: 0, aOvers: "0.0", bRuns: 0, bWkts: 0, bOvers: "0.0", winner: "" }))
};

const fixtures = [
  { id: 1, title: "Quarter Final 1", a: 0, b: 1 },
  { id: 2, title: "Quarter Final 2", a: 2, b: 3 },
  { id: 3, title: "Quarter Final 3", a: 4, b: 5 },
  { id: 4, title: "Quarter Final 4", a: 6, b: 7 },
  { id: 5, title: "Semi Final 1", from: [1, 2] },
  { id: 6, title: "Semi Final 2", from: [3, 4] },
  { id: 7, title: "FINAL", from: [5, 6] }
];

const styles = {
  page: { minHeight: "100vh", background: "#0b1220", color: "#f8fafc", padding: "20px 14px 40px", fontFamily: "Arial, sans-serif" },
  wrap: { maxWidth: 980, margin: "0 auto" },
  panel: { background: "#151f32", border: "1px solid #29364d", borderRadius: 14, padding: 16, marginTop: 16 },
  input: { width: "100%", boxSizing: "border-box", background: "#0b1220", color: "white", border: "1px solid #43516a", borderRadius: 8, padding: "10px", marginTop: 6 },
  button: { background: "#eab308", color: "#111827", border: 0, borderRadius: 8, padding: "10px 14px", fontWeight: 700, cursor: "pointer" },
  muted: { color: "#a8b4c7", fontSize: 13 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 12 }
};

export default function App() {
  const [data, setData] = useState(initialState);
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch(`${API}/api/state`)
      .then(r => { if (!r.ok) throw new Error("API response error"); return r.json(); })
      .then(s => setData({
        teams: Array.isArray(s.teams) && s.teams.length === 8 ? s.teams : initialTeams,
        scores: Array.isArray(s.scores) && s.scores.length === 7 ? s.scores : initialState.scores
      }))
      .catch(() => {
        const saved = localStorage.getItem("mmpl_state");
        if (saved) { try { setData(JSON.parse(saved)); } catch (_) {} }
        setMessage("Server se connection nahi hua. Local browser mode chal raha hai.");
      })
      .finally(() => setBusy(false));
  }, []);

  const matchTeams = useMemo(() => {
    const winner = id => data.scores[id - 1]?.winner || "";
    return fixtures.map(f => {
      if (f.a !== undefined) return { ...f, teamA: data.teams[f.a], teamB: data.teams[f.b] };
      const w1 = winner(f.from[0]), w2 = winner(f.from[1]);
      return { ...f, teamA: w1, teamB: w2 };
    });
  }, [data]);

  function updateTeam(index, value) {
    setData(old => ({ ...old, teams: old.teams.map((t, i) => i === index ? value : t) }));
  }

  function updateScore(matchIndex, field, value) {
    setData(old => {
      const scores = old.scores.map((s, i) => i === matchIndex ? { ...s, [field]: value } : s);
      // If a previous round winner changes, clear all downstream winners.
      if (matchIndex < 4) {
        const downstream = matchIndex < 2 ? [4, 6] : [5, 6];
        downstream.forEach(i => { scores[i] = { ...scores[i], winner: "" }; });
      } else if (matchIndex < 6) {
        scores[6] = { ...scores[6], winner: "" };
      }
      return { ...old, scores };
    });
  }

  async function save() {
    setMessage("Saving...");
    localStorage.setItem("mmpl_state", JSON.stringify(data));
    try {
      const r = await fetch(`${API}/api/state`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data)
      });
      if (!r.ok) throw new Error("Save failed");
      setMessage("Saved successfully. Sabhi viewers ko updated tournament dikhega.");
    } catch (_) {
      setMessage("Browser mein save hua. Server save nahi hua; backend URL/API check karein.");
    }
  }

  async function reset() {
    if (!window.confirm("Kya aap poora tournament reset karna chahte hain?")) return;
    const fresh = { teams: initialTeams, scores: initialState.scores.map(s => ({ ...s })) };
    setData(fresh);
    localStorage.removeItem("mmpl_state");
    try {
      await fetch(`${API}/api/reset`, { method: "POST" });
      setMessage("Tournament reset ho gaya.");
    } catch (_) { setMessage("Local tournament reset ho gaya."); }
  }

  const champion = data.scores[6]?.winner || "";
  return (
    <main style={styles.page}>
      <div style={styles.wrap}>
        <header style={{ textAlign: "center", padding: "12px 0 18px" }}>
          <div style={{ color: "#eab308", letterSpacing: 3, fontSize: 12, fontWeight: 800 }}>HAIDARNAGAR • CRICKET TOURNAMENT</div>
          <h1 style={{ margin: "8px 0", fontSize: 34 }}>MM PREMIER LEAGUE</h1>
          <div style={styles.muted}>8 Teams · 7 Matches · Knockout Format</div>
        </header>

        <section style={styles.panel}>
          <h2 style={{ marginTop: 0 }}>Team Management</h2>
          <div style={styles.grid}>
            {data.teams.map((team, i) => (
              <label key={i} style={styles.muted}>Team {i + 1}
                <input style={styles.input} value={team} onChange={e => updateTeam(i, e.target.value)} placeholder={`Team ${i + 1}`} />
              </label>
            ))}
          </div>
          <p style={styles.muted}>Yahan 8 teams ke naam edit karein, phir neeche Save Tournament dabayein.</p>
        </section>

        <section style={styles.panel}>
          <h2 style={{ marginTop: 0 }}>Knockout Fixtures & Live Score</h2>
          <p style={styles.muted}>Har match ka score bharein aur winner select karein. Winner agle round mein automatically aa jayega.</p>
          <div style={styles.grid}>
            {matchTeams.map((m, i) => {
              const s = data.scores[i];
              const ready = Boolean(m.teamA && m.teamB);
              return (
                <article key={m.id} style={{ background: "#0e1728", border: "1px solid #35435a", borderRadius: 12, padding: 13, opacity: ready ? 1 : 0.65 }}>
                  <div style={{ color: "#eab308", fontWeight: 800, fontSize: 12 }}>{m.title} · MATCH {m.id}</div>
                  <h3 style={{ margin: "10px 0 4px" }}>{m.teamA || "Winner pending"}</h3>
                  <div style={styles.muted}>VS</div>
                  <h3 style={{ margin: "4px 0 12px" }}>{m.teamB || "Winner pending"}</h3>
                  {ready ? <>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      <label style={styles.muted}>{m.teamA} Runs
                        <input type="number" min="0" style={styles.input} value={s.aRuns} onChange={e => updateScore(i, "aRuns", Number(e.target.value))} />
                      </label>
                      <label style={styles.muted}>Wickets
                        <input type="number" min="0" max="10" style={styles.input} value={s.aWkts} onChange={e => updateScore(i, "aWkts", Number(e.target.value))} />
                      </label>
                      <label style={styles.muted}>{m.teamB} Runs
                        <input type="number" min="0" style={styles.input} value={s.bRuns} onChange={e => updateScore(i, "bRuns", Number(e.target.value))} />
                      </label>
                      <label style={styles.muted}>Wickets
                        <input type="number" min="0" max="10" style={styles.input} value={s.bWkts} onChange={e => updateScore(i, "bWkts", Number(e.target.value))} />
                      </label>
                    </div>
                    <label style={{ ...styles.muted, display: "block", marginTop: 10 }}>Match Winner
                      <select style={styles.input} value={s.winner} onChange={e => updateScore(i, "winner", e.target.value)}>
                        <option value="">Select winner</option>
                        <option value={m.teamA}>{m.teamA}</option>
                        <option value={m.teamB}>{m.teamB}</option>
                      </select>
                    </label>
                  </> : <p style={styles.muted}>Pichhle match ka winner select hone ke baad teams yahan aayengi.</p>}
                </article>
              );
            })}
          </div>
        </section>

        <section style={{ ...styles.panel, textAlign: "center" }}>
          <h2 style={{ marginTop: 0 }}>🏆 Tournament Champion</h2>
          <div style={{ fontSize: 25, fontWeight: 800, color: champion ? "#facc15" : "#a8b4c7" }}>{champion || "Final match pending"}</div>
        </section>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
          <button style={styles.button} onClick={save}>Save Tournament</button>
          <button style={{ ...styles.button, background: "#334155", color: "white" }} onClick={reset}>Reset Tournament</button>
        </div>
        {busy && <p style={styles.muted}>Loading tournament...</p>}
        {message && <p style={{ ...styles.muted, marginTop: 12 }}>{message}</p>}
        <p style={{ ...styles.muted, textAlign: "center", marginTop: 24 }}>MMPL Live Scoring · Official Tournament Dashboard</p>
      </div>
    </main>
  );
}
