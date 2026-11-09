import React, { useState } from "react";
import "./App.css";

export default function App() {
  const [runs, setRuns] = useState(0);
  const [wickets, setWickets] = useState(0);
  const [balls, setBalls] = useState(0);
  const [history, setHistory] = useState([]);

  const [team, setTeam] = useState("SADEYA");
  const [opponent, setOpponent] = useState("KUDWA");

  const [batsman, setBatsman] = useState("Batsman 1");
  const [bowler, setBowler] = useState("Bowler 1");

  const overs = `${Math.floor(balls / 6)}.${balls % 6}`;

  function addScore(value, extra = false, wicket = false) {
    setHistory(prev => [
      ...prev,
      { runs, wickets, balls }
    ]);

    setRuns(prev => prev + value);

    if (wicket) {
      setWickets(prev => prev + 1);
    }

    if (!extra) {
      setBalls(prev => prev + 1);
    }
  }

  function undo() {
    if (!history.length) return;

    const previous = history[history.length - 1];

    setRuns(previous.runs);
    setWickets(previous.wickets);
    setBalls(previous.balls);
    setHistory(prev => prev.slice(0, -1));
  }

  function reset() {
    if (!window.confirm("Reset match score?")) return;

    setRuns(0);
    setWickets(0);
    setBalls(0);
    setHistory([]);
  }

  return (
    <div className="app">
      <header>
        <h1>MM PREMIER LEAGUE</h1>
        <p>MMPL 2026 • LIVE SCORING</p>
      </header>

      <section className="scoreboard">
        <h2>{team} vs {opponent}</h2>

        <h1>{runs}/{wickets}</h1>

        <h3>Overs: {overs}</h3>

        <p>RUN RATE: {
          balls === 0 ? "0.00" :
          (runs / (balls / 6)).toFixed(2)
        }</p>
      </section>

      <section className="details">
        <label>Batting Team</label>
        <input value={team}
          onChange={e => setTeam(e.target.value)} />

        <label>Opponent Team</label>
        <input value={opponent}
          onChange={e => setOpponent(e.target.value)} />

        <label>Batsman</label>
        <input value={batsman}
          onChange={e => setBatsman(e.target.value)} />

        <label>Bowler</label>
        <input value={bowler}
          onChange={e => setBowler(e.target.value)} />
      </section>

      <section className="players">
        <p>🏏 Batsman: {batsman}</p>
        <p>⚾ Bowler: {bowler}</p>
      </section>

      <section className="controls">
        <h2>SCORING PANEL</h2>

        <div className="buttons">
          {[0, 1, 2, 3, 4, 6].map(n => (
            <button key={n}
              onClick={() => addScore(n)}>
              {n === 0 ? "DOT" : n}
            </button>
          ))}

          <button onClick={() => addScore(0, false, true)}>
            WICKET
          </button>

          <button onClick={() => addScore(1, true)}>
            WIDE
          </button>

          <button onClick={() => addScore(1, true)}>
            NO BALL
          </button>
        </div>

        <button className="undo" onClick={undo}>
          UNDO LAST BALL
        </button>

        <button className="reset" onClick={reset}>
          RESET MATCH
        </button>
      </section>

      <footer>
        <p>MMPL 2026 | Powered by MMPL Live Scoring</p>
      </footer>
    </div>
  );
}
