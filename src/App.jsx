import { useEffect, useMemo, useState } from 'react'
import './App.css'

const STATIONS = [
  { id: 'A', name: '北町', x: 4 },
  { id: 'B', name: '中央', x: 34 },
  { id: 'C', name: '南町', x: 66 },
  { id: 'D', name: '空港', x: 96 },
]

const TRACKS = [
  { id: 'up', name: '上り本線', shortName: '上り', y: 92 },
  { id: 'down', name: '下り本線', shortName: '下り', y: 176 },
  { id: 'siding', name: '待避線', shortName: '待避', y: 260 },
]

const initialTrains = [
  {
    id: 'R101',
    type: '快速',
    dir: 'right',
    x: 3,
    track: 'up',
    speed: 0.38,
    delay: 0,
    held: false,
    colorClass: 'train-dark',
    plan: '北町→空港 先着推奨',
  },
  {
    id: 'L203',
    type: '普通',
    dir: 'right',
    x: 21,
    track: 'up',
    speed: 0.27,
    delay: 2,
    held: false,
    colorClass: 'train-mid',
    plan: '中央で待避可能',
  },
  {
    id: 'E55',
    type: '特急',
    dir: 'left',
    x: 94,
    track: 'down',
    speed: 0.46,
    delay: 5,
    held: false,
    colorClass: 'train-express',
    plan: '空港→北町 優先度高',
  },
  {
    id: 'L318',
    type: '普通',
    dir: 'left',
    x: 73,
    track: 'down',
    speed: 0.28,
    delay: 1,
    held: false,
    colorClass: 'train-light',
    plan: '南町で抑止候補',
  },
]

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n))
}

function riskLevel(trains) {
  let risk = 0

  for (let i = 0; i < trains.length; i += 1) {
    for (let j = i + 1; j < trains.length; j += 1) {
      const a = trains[i]
      const b = trains[j]

      if (a.track !== b.track) continue

      const gap = Math.abs(a.x - b.x)

      if (gap < 8) risk += 3
      else if (gap < 14) risk += 1
    }
  }

  return risk
}

function stationAt(x) {
  const found = STATIONS.find((s) => Math.abs(x - s.x) < 5)
  return found?.name ?? null
}

function nextTrainState(train) {
  let nx = train.x
  let ndelay = train.delay

  if (!train.held) {
    nx += train.dir === 'right' ? train.speed : -train.speed

    if (Math.random() < 0.08) {
      ndelay = Math.max(0, ndelay - 0.2)
    }
  } else if (Math.random() < 0.2) {
    ndelay += 0.1
  }

  if (nx > 100 || nx < 0) {
    nx = train.dir === 'right' ? 0 : 100
    ndelay = Math.max(0, ndelay - 1.5)
  }

  return {
    ...train,
    x: clamp(nx, 0, 100),
    delay: Number(ndelay.toFixed(1)),
  }
}

export default function App() {
  const [trains, setTrains] = useState(initialTrains)
  const [running, setRunning] = useState(false)
  const [time, setTime] = useState(7 * 60 + 30)
  const [pointsLocked, setPointsLocked] = useState(false)
  const [message, setMessage] = useState(
    '07:30、朝ラッシュ開始。特急E55が5分遅れています。普通列車を待避させて回復を狙いましょう。',
  )
  const [score, setScore] = useState(1000)
  const [events, setEvents] = useState([
    '指令: 特急E55を優先しつつ、普通列車の遅延拡大を抑えてください。',
  ])

  const totalDelay = useMemo(
    () => trains.reduce((sum, t) => sum + t.delay, 0),
    [trains],
  )

  const risk = useMemo(() => riskLevel(trains), [trains])

  const formattedTime = `${String(Math.floor(time / 60)).padStart(
    2,
    '0',
  )}:${String(time % 60).padStart(2, '0')}`

  useEffect(() => {
    if (!running) return undefined

    const intervalId = window.setInterval(() => {
      setTime((v) => v + 1)

      setTrains((prev) => {
        const next = prev.map(nextTrainState)
        const nextRisk = riskLevel(next)
        const nextTotalDelay = next.reduce((sum, t) => sum + t.delay, 0)

        if (nextRisk >= 3) {
          setScore((s) => Math.max(0, s - 25))
          setMessage(
            '接近警報。閉塞間隔が詰まっています。抑止か待避線への転線を検討してください。',
          )
        } else {
          setScore((s) => Math.max(0, s - Math.ceil(nextTotalDelay / 8)))
        }

        return next
      })
    }, 700)

    return () => window.clearInterval(intervalId)
  }, [running])

  const addEvent = (text) => {
    setEvents((prev) => [text, ...prev].slice(0, 6))
  }

  const toggleHold = (id) => {
    const target = trains.find((t) => t.id === id)
    const willHold = !target?.held

    setTrains((prev) =>
      prev.map((t) => (t.id === id ? { ...t, held: willHold } : t)),
    )

    if (willHold) {
      setMessage(
        `${id}を抑止しました。後続・対向列車の進路を確保できますが、待たせすぎると遅延が増えます。`,
      )
      addEvent(`${formattedTime} ${id}: 抑止`)
    } else {
      setMessage(`${id}の抑止を解除しました。列車が再出発します。`)
      addEvent(`${formattedTime} ${id}: 抑止解除`)
    }
  }

  const changeTrack = (id, track) => {
    const trackName = TRACKS.find((t) => t.id === track)?.name ?? '不明な線路'

    if (pointsLocked) {
      setMessage('ポイント操作中です。転換完了まで少し待ってください。')
      return
    }

    setPointsLocked(true)
    setMessage(
      `${id}の進路を${trackName}へ構成中。ポイント転換には時間がかかります。`,
    )
    addEvent(`${formattedTime} ${id}: ${trackName}へ進路構成`)

    window.setTimeout(() => {
      setTrains((prev) =>
        prev.map((t) => (t.id === id ? { ...t, track } : t)),
      )
      setPointsLocked(false)
    }, 900)
  }

  const priorityBoost = (id) => {
    setTrains((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              delay: Math.max(0, Number((t.delay - 1.2).toFixed(1))),
              speed: Number(Math.min(t.speed + 0.03, 0.62).toFixed(2)),
            }
          : t,
      ),
    )

    setScore((s) => Math.max(0, s - 30))
    setMessage(
      `${id}に優先通過を設定しました。遅延は回復しやすくなりますが、他列車へのしわ寄せに注意。`,
    )
    addEvent(`${formattedTime} ${id}: 優先通過設定`)
  }

  const resetGame = () => {
    setTrains(initialTrains)
    setRunning(false)
    setTime(7 * 60 + 30)
    setPointsLocked(false)
    setScore(1000)
    setMessage(
      'リセットしました。特急E55の遅延回復を狙って、普通列車の抑止・待避を判断してください。',
    )
    setEvents([
      '指令: 特急E55を優先しつつ、普通列車の遅延拡大を抑えてください。',
    ])
  }

  const grade =
    score > 850 && totalDelay < 5
      ? 'S'
      : score > 700
        ? 'A'
        : score > 520
          ? 'B'
          : score > 300
            ? 'C'
            : 'D'

  return (
    <main className="game">
      <header className="game-header">
        <div>
          <p className="version">🚃 Prototype v0.3</p>
          <h1>過密ダイヤ遅延回復シミュレーター</h1>
          <p className="lead">
            ポイント転換・待避線・抑止・優先通過を使って、朝ラッシュの遅延をなるべく早く回復させる指令ゲームです。
          </p>
        </div>

        <div className="header-buttons">
          <button className="primary-button" onClick={() => setRunning((v) => !v)}>
            {running ? '⏸ 一時停止' : '▶ 運転開始'}
          </button>
          <button className="secondary-button" onClick={resetGame}>
            ↻ リセット
          </button>
        </div>
      </header>

      <section className="stats">
        <div className="stat-card">
          <span>時刻</span>
          <strong>{formattedTime}</strong>
        </div>
        <div className="stat-card">
          <span>総遅延</span>
          <strong>{totalDelay.toFixed(1)}分</strong>
        </div>
        <div className="stat-card">
          <span>安全リスク</span>
          <strong>{risk}</strong>
        </div>
        <div className="stat-card">
          <span>スコア</span>
          <strong>{score}</strong>
        </div>
        <div className="stat-card">
          <span>評価</span>
          <strong>{grade}</strong>
        </div>
      </section>

      <section className="main-layout">
        <div className="rail-panel">
          <div className="rail-map">
            <div className="stations">
              {STATIONS.map((station) => (
                <div className="station" key={station.id}>
                  <div className="station-dot" />
                  <span>{station.name}</span>
                </div>
              ))}
            </div>

            {TRACKS.map((track) => (
              <div className="track-row" style={{ top: track.y }} key={track.id}>
                <div className="track-line" />
                <span>{track.name}</span>
              </div>
            ))}

            <div className="switch switch-one" />
            <div className="switch switch-two" />

            {trains.map((train) => {
              const stationName = stationAt(train.x)

              return (
                <div
                  className="train-wrap"
                  key={train.id}
                  style={{
                    left: `${train.x}%`,
                    top: TRACKS.find((t) => t.id === train.track)?.y - 23,
                  }}
                >
                  <div className={`train ${train.colorClass}`}>
                    <div className="train-top">
                      <strong>{train.id}</strong>
                      {train.held && <span>⏸</span>}
                    </div>
                    <div className="train-meta">
                      {train.type} / +{train.delay.toFixed(1)}分
                    </div>
                  </div>
                  {stationName && <p className="near-station">{stationName}付近</p>}
                </div>
              )
            })}
          </div>

          <div className="message">
            <span>⚠</span>
            <p>{message}</p>
          </div>
        </div>

        <aside className="control-panel">
          <h2>⇄ 指令操作盤</h2>

          {pointsLocked && <p className="point-lock">ポイント転換中……</p>}

          <div className="train-controls">
            {trains.map((train) => (
              <div className="train-control-card" key={train.id}>
                <div className="train-control-head">
                  <div>
                    <strong>{train.id}</strong>
                    <span>{train.type}</span>
                    <p>{train.plan}</p>
                  </div>
                  <b>+{train.delay.toFixed(1)}分</b>
                </div>

                <div className="track-buttons">
                  {TRACKS.map((track) => (
                    <button
                      key={track.id}
                      className={train.track === track.id ? 'selected' : ''}
                      onClick={() => changeTrack(train.id, track.id)}
                    >
                      {track.shortName}
                    </button>
                  ))}
                </div>

                <div className="action-buttons">
                  <button onClick={() => toggleHold(train.id)}>
                    {train.held ? '⏸ 解除' : '⏸ 抑止'}
                  </button>
                  <button onClick={() => priorityBoost(train.id)}>⚡ 優先</button>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section className="log-panel">
        <h2>運転整理ログ</h2>
        <div className="logs">
          {events.map((event, index) => (
            <p key={`${event}-${index}`}>{event}</p>
          ))}
        </div>
      </section>

      <p className="help">
        遊び方: 特急や快速を先に通すために、普通列車を待避線へ入れたり、駅付近で抑止したりします。ただし、抑止しすぎるとその列車の遅延が増え、接近しすぎると安全リスクでスコアが下がります。
      </p>
    </main>
  )
}