import React, { useState } from "react";
import "./App.css";

export default function App() {
  const [runs, setRuns] = useState(0);
  const [wickets, setWickets] = useState(0);
  const [balls, setBalls] = useState(0);
  const [team, setTeam] = useState("SADEYA");
  const [opponent, setOpponent] = useState("KUDWA");
  const [batsman, setBatsman] = useState("Batsman 1");
  const [bowler, setBowler] = useState("Bowler 1");
  const [history, setHistory] = useState([]);

  const overs = `${Math.floor(balls / 6)}.${balls % 6}`;
  const runRate = balls ? (runs * 6 / balls).toFixed(2) : "0.00";

  function score(value, legal = true, wicket = false) {
    if (wickets >= 10) return;

    setHistory(old => [...old, { runs, wickets, balls }]);
    setRuns(old => old + value);
    if (wicket) setWickets(old => old + 1);
    if (legal) setBalls(old => old + 1);
  }

  function undo() {
    if (!history.length) return;
    const last = history[history.length - 1];
    setRuns(last.runs);
    setWickets(last.wickets);
    setBalls(last.balls);
    setHistory(old => old.slice(0, -1));
  }

  function reset() {
    if (!window.confirm("Reset the match score?")) return;
    setRuns(0);
    setWickets(0);
    setBalls(0);
    setHistory([]);
  }

  return (
    <div className="app">
      <header>
        <h1>MM PREMIER LEAGUE</h1>
        <p>MMPL 2026 | LIVE SCOREBOARD</p>
      </header>

      <section className="scoreboard">
        <h2>{team} VS {opponent}</h2>
        <h1>{runs}/{wickets}</h1>
        <h3>Overs: {overs}</h3>
        <p>Run Rate: {runRate}</p>
      </section>

      <section className="details">
        <label>Batting Team</label>
        <input value={team} onChange={e => setTeam(e.target.value)} />

        <label>Opponent</label>
        <input value={opponent} onChange={e => setOpponent(e.target.value)} />

        <label>Batsman</label>
        <input value={batsman} onChange={e => setBatsman(e.target.value)} />

        <label>Bowler</label>
        <input value={bowler} onChange={e => setBowler(e.target.value)} />
      </section>

      <section className="players">
        <p>🏏 Batsman: {batsman}</p>
        <p>⚾ Bowler: {bowler}</p>
      </section>

      <section className="controls">
        <h2>SCORING PANEL</h2>
        <div className="buttons">
          {[0, 1, 2, 3, 4, 6].map(n => (
            <button key={n} onClick={() => score(n)}>
              {n === 0 ? "DOT" : n}
            </button>
          ))}
          <button onClick={() => score(0, true, true)}>WICKET</button>
          <button onClick={() => score(1, false)}>WIDE</button>
          <button onClick={() => score(1, false)}>NO BALL</button>
        </div>

        <button className="undo" onClick={undo}>UNDO LAST BALL</button>
        <button className="reset" onClick={reset}>RESET MATCH</button>
      </section>

      <footer>
        MMPL 2026 | Powered by MMPL
      </footer>
    </div>
  );
}
