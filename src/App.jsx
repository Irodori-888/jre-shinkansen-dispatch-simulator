import { useEffect, useMemo, useState } from 'react'
import './App.css'

const STATIONS = [
  {
    id: 'tokyo',
    name: '東京',
    x: 12,
    labelX: 12,
    stopX: 12,
    platforms: 2,
    tracks: [
      { id: 'tokyo20', number: '20', direction: 'down', role: '折返し・下り発車' },
      { id: 'tokyo21', number: '21', direction: 'down', role: '折返し・下り発車' },
      { id: 'tokyo22', number: '22', direction: 'down', role: '折返し・下り発車' },
      { id: 'tokyo23', number: '23', direction: 'down', role: '折返し・下り発車' },
    ],
  },
  {
    id: 'ueno',
    name: '上野',
    x: 38,
    labelX: 38,
    stopX: 38,
    platforms: 2,
    tracks: [
      { id: 'ueno19', number: '19', direction: 'down', role: '下り・大宮方面' },
      { id: 'ueno20', number: '20', direction: 'down', role: '下り・大宮方面' },
      { id: 'ueno21', number: '21', direction: 'up', role: '上り・東京方面' },
      { id: 'ueno22', number: '22', direction: 'up', role: '上り・東京方面' },
    ],
  },
  {
    id: 'omiya',
    name: '大宮',
    x: 75,
    labelX: 75,
    stopX: 75,
    platforms: 3,
    tracks: [
      { id: 'omiya13', number: '13', direction: 'up', role: '上り・東京方' },
      { id: 'omiya14', number: '14', direction: 'up', role: '上り・東京方' },
      { id: 'omiya15', number: '15', direction: 'up', role: '上り・東京方臨時' },
      { id: 'omiya16', number: '16', direction: 'down', role: '下り・小山・熊谷方臨時' },
      { id: 'omiya17', number: '17', direction: 'down', role: '下り・小山・熊谷方' },
      { id: 'omiya18', number: '18', direction: 'down', role: '下り・小山・熊谷方' },
    ],
  },
]

function stationLabelX(station) {
  return station.labelX ?? station.x
}

const TRACKS = [
  { id: 'up-main', name: '上り本線1・東京方面', shortName: '上り本線1', direction: 'up', y: 72 },
  { id: 'up-sub', name: '上り本線2・東京方面', shortName: '上り本線2', direction: 'up', y: 112 },
  { id: 'down-main', name: '下り本線1・大宮方面', shortName: '下り本線1', direction: 'down', y: 204 },
  { id: 'down-sub', name: '下り本線2・大宮方面', shortName: '下り本線2', direction: 'down', y: 252 },
]

const OMIYA_EXTRA_TRACKS = [
  { id: 'omiya-up-extra', name: '大宮上り副本線', shortName: '大宮上り副本線', direction: 'up', y: 152, startX: 63.7, endX: 85.2 },
  { id: 'omiya-down-extra', name: '大宮下り副本線', shortName: '大宮下り副本線', direction: 'down', y: 292, startX: 63.7, endX: 85.2 },
]

const ROUTE_TRACKS = [...TRACKS, ...OMIYA_EXTRA_TRACKS]

const SWITCH_POINTS = [
  { id: 'tokyo-terminal-crossover', label: '東京駅構内 本線間渡り', direction: 'terminal', x: 28, top: 72, height: 180 },

  { id: 'ueno-omiya-up', label: '上野〜大宮 上り渡り', direction: 'up', x: 50, top: 72, height: 40 },
  { id: 'ueno-omiya-down', label: '上野〜大宮 下り渡り', direction: 'down', x: 50, top: 204, height: 48 },

  { id: 'omiya-north-up-extra-in', label: '大宮以北 上り本線↔副本線 入口', direction: 'up', x: 64, top: 112, height: 40 },
  { id: 'omiya-north-up-extra-out', label: '大宮以北 上り本線↔副本線 出口', direction: 'up', x: 85, top: 112, height: 40 },
  { id: 'omiya-north-down-extra-in', label: '大宮以北 下り本線↔副本線 入口', direction: 'down', x: 64, top: 252, height: 40 },
  { id: 'omiya-north-down-extra-out', label: '大宮以北 下り本線↔副本線 出口', direction: 'down', x: 85, top: 252, height: 40 },
]

const INITIAL_TRAIN_COUNT = 8
const WAITING_TRAIN_COUNT = 9

const TRAIN_NUMBER_RULES = [
  { type: 'はやぶさ', start: 1, note: '標準' },
  { type: 'はやぶさ', start: 101, note: '仙台〜盛岡各駅停車' },
  { type: 'はやぶさ・こまち', start: 1, note: '併結' },
  { type: 'やまびこ', start: 50, note: '標準' },
  { type: 'やまびこ', start: 122, note: '東京〜仙台' },
  { type: 'やまびこ', start: 94, note: '仙台以北区間' },
  { type: 'やまびこ', start: 290, note: '仙台以南区間' },
  { type: 'なすの', start: 251, note: '標準' },
  { type: 'やまびこ・つばさ', start: 121, note: '併結' },
]

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pickRandom(items) {
  return items[randomInt(0, items.length - 1)]
}

function firstNumberWithDirectionParity(start, direction) {
  const shouldBeOdd = direction === 'down'
  const startIsOdd = start % 2 === 1
  return startIsOdd === shouldBeOdd ? start : start + 1
}

function makeTrainNumber(rule, direction, usedNumbers) {
  const first = firstNumberWithDirectionParity(rule.start, direction)
  let number = first

  for (let attempt = 0; attempt < 30; attempt += 1) {
    number = first + randomInt(0, 14) * 2
    const key = `${rule.type}${number}`
    if (!usedNumbers.has(key)) {
      usedNumbers.add(key)
      return number
    }
  }

  usedNumbers.add(`${rule.type}${number}`)
  return number
}

function colorClassForTrainType(type) {
  if (type.includes('はやぶさ') && type.includes('こまち')) return 'train-green-red'
  if (type.includes('やまびこ') && type.includes('つばさ')) return 'train-green-purple'
  if (type.includes('こまち')) return 'train-red-silver'
  if (type.includes('つばさ')) return 'train-purple-orange'
  if (type.includes('かがやき') || type.includes('はくたか')) return 'train-blue-gold'
  if (type.includes('はやぶさ') || type.includes('はやて') || type.includes('なすの')) return 'train-green-pink'
  if (type.includes('やまびこ')) return 'train-green-pink'
  return 'train-green-pink'
}

function speedForTrainType(type) {
  if (type.includes('はやぶさ') || type.includes('こまち')) return 0.5
  if (type.includes('やまびこ')) return 0.4
  if (type.includes('なすの')) return 0.34
  return 0.38
}

function platformsFor(stationId, direction) {
  const station = STATIONS.find((item) => item.id === stationId)
  return station?.tracks.filter((track) => track.direction === direction) ?? []
}

function anyTokyoPlatform() {
  return pickRandom(STATIONS.find((station) => station.id === 'tokyo')?.tracks ?? [])
}

function createTrainPlan(direction, assignedPlatform) {
  if (direction === 'down') {
    const uenoPlatform = pickRandom(platformsFor('ueno', 'down'))
    const omiyaPlatform = pickRandom(platformsFor('omiya', 'down'))
    return `東京${assignedPlatform.number}番線 → 上野${uenoPlatform.number}番線 → 大宮${omiyaPlatform.number}番線`
  }

  const uenoPlatform = pickRandom(platformsFor('ueno', 'up'))
  const tokyoPlatform = anyTokyoPlatform()
  return `大宮${assignedPlatform.number}番線 → 上野${uenoPlatform.number}番線 → 東京${tokyoPlatform.number}番線`
}

function generateInitialTrains(count = INITIAL_TRAIN_COUNT) {
  const usedNumbers = new Set()
  const tokyo = STATIONS.find((station) => station.id === 'tokyo')
  const tokyoStopX = tokyo?.stopX ?? tokyo?.labelX ?? tokyo?.x ?? 12
  const upPositions = [92, 84, 76]
  const downPositions = [26, 34, 42]

  const createTrain = ({ direction, track, x, index }) => {
    const rule = pickRandom(TRAIN_NUMBER_RULES)
    const trainNumber = makeTrainNumber(rule, direction, usedNumbers)
    const assignedPlatform =
      direction === 'down'
        ? pickRandom(platformsFor('tokyo', 'down'))
        : pickRandom(platformsFor('omiya', 'up'))

    return {
      id: `${rule.type}${trainNumber}`,
      type: rule.type,
      number: trainNumber,
      note: rule.note,
      dir: direction === 'down' ? 'right' : 'left',
      direction,
      x,
      track: track.id,
      assignedPlatform: assignedPlatform.id,
      speed: speedForTrainType(rule.type),
      delay: randomInt(0, 9),
      held: false,
      colorClass: colorClassForTrainType(rule.type),
      plan: createTrainPlan(direction, assignedPlatform),
      stoppedStations: index < TRACKS.length ? [] : undefined,
    }
  }

  const tokyoTerminalTrains = TRACKS.map((track, index) =>
    createTrain({
      direction: track.direction,
      track,
      x: tokyoStopX,
      index,
    }),
  )

  const remainingCount = Math.max(0, count - tokyoTerminalTrains.length)
  const remainingTrains = Array.from({ length: remainingCount }, (_, index) => {
    const direction = index % 2 === 0 ? 'up' : 'down'
    const candidateTracks = TRACKS.filter((item) => item.direction === direction)
    const track = pickRandom(candidateTracks)
    const baseX =
      direction === 'up'
        ? upPositions[index % upPositions.length]
        : downPositions[index % downPositions.length]
    const jitter = randomInt(-1, 1)

    return createTrain({
      direction,
      track,
      x: clamp(baseX + jitter, 0, 100),
      index: TRACKS.length + index,
    })
  })

  return [...tokyoTerminalTrains, ...remainingTrains]
}

function generateWaitingTrains(count = WAITING_TRAIN_COUNT) {
  const usedNumbers = new Set()
  const targetTracks = ['上り本線1', '上り本線2']
  const statuses = ['入線待ち', '前走列車待ち', '進路確認中', '大宮手前で抑止中']

  return Array.from({ length: count }, (_, index) => {
    const rule = pickRandom(TRAIN_NUMBER_RULES.filter((item) => item.type !== 'なすの'))
    const trainNumber = makeTrainNumber(rule, 'up', usedNumbers)
    const etaMinutes = 2 + index * 2 + randomInt(0, 1)

    return {
      id: `waiting-${rule.type}${trainNumber}`,
      name: `${rule.type}${trainNumber}`,
      direction: 'up',
      from: '大宮方面外',
      targetTrack: targetTracks[index % targetTracks.length],
      status: pickRandom(statuses),
      eta: `約${etaMinutes}分後`,
      colorClass: colorClassForTrainType(rule.type),
    }
  })
}

function displayTrainName(train) {
  return `${train.type}${train.number ?? ''}`
}

function trackLabel(trackId) {
  return ROUTE_TRACKS.find((t) => t.id === trackId)?.name ?? '不明な線路'
}

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
      if (isInTokyoTerminalArea(a.x) && isInTokyoTerminalArea(b.x)) continue

      const gap = Math.abs(a.x - b.x)

      if (gap < 8) risk += 3
      else if (gap < 14) risk += 1
    }
  }

  return Math.min(risk, 13)
}

function stationAt(x) {
  const found = STATIONS.find((s) => Math.abs(x - s.x) < 5)
  return found?.name ?? null
}

function stationObjectAt(x) {
  return STATIONS.find((s) => Math.abs(x - (s.stopX ?? s.x)) < 5) ?? null
}

function isFrontBlocked(train, trains) {
  return trains.some((other) => {
    if (other.id === train.id) return false
    if (other.track !== train.track) return false

    const gap = Math.abs(other.x - train.x)
    if (gap >= 10) return false

    if (train.dir === 'right') return other.x > train.x
    return other.x < train.x
  })
}

// --- Track helper functions ---
function routeTrackById(trackId) {
  return ROUTE_TRACKS.find((track) => track.id === trackId) ?? null
}

function isLimitedTrack(track) {
  return Number.isFinite(track?.startX) && Number.isFinite(track?.endX)
}

function isTokyoTerminalMainTrack(track) {
  return track && TRACKS.some((mainTrack) => mainTrack.id === track.id)
}

function isNearTokyoTerminal(train) {
  const tokyo = STATIONS.find((station) => station.id === 'tokyo')
  return Boolean(tokyo) && Math.abs(train.x - tokyo.x) <= 12
}


function isInTokyoTerminalArea(x) {
  const tokyo = STATIONS.find((station) => station.id === 'tokyo')
  return Boolean(tokyo) && Math.abs(x - tokyo.x) <= 8
}

function isTokyoTerminalTrackOccupied(trackId, x, trains, ignoreTrainId = null) {
  if (!isInTokyoTerminalArea(x)) return false

  return trains.some((train) => {
    if (train.id === ignoreTrainId) return false
    return train.track === trackId && isInTokyoTerminalArea(train.x)
  })
}

function canUseTrack(train, targetTrack) {
  if (!targetTrack) return false

  // 通常は同じ方向の線路だけ使える
  if (train.direction === targetTrack.direction) return true

  // 例外: 東京駅に到着する上り列車だけは、東京駅構内で全本線に入線可能
  return (
    train.direction === 'up' &&
    isTokyoTerminalMainTrack(targetTrack) &&
    isNearTokyoTerminal(train)
  )
}

function needsTokyoTerminalTransfer(train, currentStation, currentTrack) {
  return (
    train.direction === 'up' &&
    currentStation?.id === 'tokyo' &&
    currentTrack?.direction === 'up'
  )
}

function isAtLimitedTrackEnd(train, track) {
  if (!isLimitedTrack(track)) return false
  if (train.dir === 'right') return train.x >= track.endX
  return train.x <= track.startX
}

function clampToTrackRange(x, track) {
  if (!isLimitedTrack(track)) return clamp(x, 0, 100)
  return clamp(x, track.startX, track.endX)
}

function platformLabel(platformId) {
  for (const station of STATIONS) {
    const platform = station.tracks.find((track) => track.id === platformId)
    if (platform) {
      return `${station.name}${platform.number}番線（${platform.role}）`
    }
  }
  return '番線未設定'
}

function stationPlatformsForDirection(station, direction) {
  return station.tracks.filter((track) => track.direction === direction)
}

function platformSummary(station) {
  const up = stationPlatformsForDirection(station, 'up').map((track) => track.number).join('/')
  const down = stationPlatformsForDirection(station, 'down').map((track) => track.number).join('/')

  if (up && down) return `上り ${up} / 下り ${down}`
  if (up) return `上り ${up}`
  if (down) return `下り ${down}`
  return '番線未設定'
}

function nextTrainState(train, allTrains) {
  let nx = train.x
  let ndelay = train.delay
  const stoppedStations = train.stoppedStations ?? []
  const currentStation = stationObjectAt(train.x)
  const currentTrack = routeTrackById(train.track)

  // Insert Tokyo terminal transfer logic
  if (needsTokyoTerminalTransfer(train, currentStation, currentTrack)) {
    return {
      ...train,
      autoHeld: true,
      delay: Number((ndelay + 0.02).toFixed(1)),
    }
  }

  if (train.held) {
    return {
      ...train,
      delay: Number((ndelay + 0.02).toFixed(1)),
      autoHeld: false,
    }
  }

  if (isAtLimitedTrackEnd(train, currentTrack)) {
    return {
      ...train,
      x: clampToTrackRange(train.x, currentTrack),
      autoHeld: true,
      delay: Number((ndelay + 0.02).toFixed(1)),
    }
  }

  if (currentStation && !stoppedStations.includes(currentStation.id)) {
    const remaining = train.dwellRemaining ?? 30

    if (remaining > 0) {
      return {
        ...train,
        dwellRemaining: remaining - 1,
        autoHeld: false,
      }
    }

    if (isFrontBlocked(train, allTrains)) {
      return {
        ...train,
        autoHeld: true,
        delay: Number((ndelay + 0.02).toFixed(1)),
      }
    }

    return {
      ...train,
      dwellRemaining: null,
      autoHeld: false,
      stoppedStations: [...stoppedStations, currentStation.id],
    }
  }

  if (isFrontBlocked(train, allTrains)) {
    return {
      ...train,
      autoHeld: true,
      delay: Number((ndelay + 0.02).toFixed(1)),
    }
  }

  nx += train.dir === 'right' ? train.speed : -train.speed
  nx = clampToTrackRange(nx, currentTrack)
  if (Math.random() < 0.02) {
    ndelay = Math.max(0, ndelay - 0.1)
  }

  if (nx > 100 || nx < 0) {
    nx = train.dir === 'right' ? 0 : 100
    ndelay = Math.max(0, ndelay - 1.5)
    return {
      ...train,
      x: clamp(nx, 0, 100),
      delay: Number(ndelay.toFixed(1)),
      stoppedStations: [],
      dwellRemaining: null,
      autoHeld: false,
    }
  }

  return {
    ...train,
    x: clampToTrackRange(nx, currentTrack),
    delay: Number(ndelay.toFixed(1)),
    autoHeld: false,
  }
}

export default function App() {
  const [trains, setTrains] = useState(() => generateInitialTrains())
  const [waitingTrains, setWaitingTrains] = useState(() => generateWaitingTrains())
  const [running, setRunning] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [time, setTime] = useState(15 * 3600 + 23 * 60)
  const [pointsLocked, setPointsLocked] = useState(false)
  const [message, setMessage] = useState(
    '車両トラブルにより遅延が発生しています。上り・下りの本線/副本線を使い分け、遅延回復を目指しましょう。',
  )
  const [operationWarnings, setOperationWarnings] = useState({})
  const [score, setScore] = useState(1000)
  const [events, setEvents] = useState([
  ])

  const totalDelay = useMemo(
    () => trains.reduce((sum, t) => sum + t.delay, 0),
    [trains],
  )

  const risk = useMemo(() => riskLevel(trains), [trains])

  const formattedTime = `${String(Math.floor(time / 3600)).padStart(
    2,
    '0',
  )}:${String(Math.floor((time % 3600) / 60)).padStart(2, '0')}:${String(time % 60).padStart(2, '0')}`

 useEffect(() => {
  if (!running || gameOver) return undefined

    const intervalId = window.setInterval(() => {
      setTime((v) => v + 1)

      setTrains((prev) => {
        const next = prev.map((train) => nextTrainState(train, prev))
        const nextRisk = riskLevel(next)
        const nextTotalDelay = next.reduce((sum, t) => sum + t.delay, 0)

        if (nextRisk >= 13) {
  setRunning(false)
  setGameOver(true)
  setScore(0)
  setMessage(
    '列車事故発生。防護無線発報中。全列車の運転を停止します。',
  )
  addEvent(`${formattedTime} 列車事故発生: 安全リスク13到達`)
} else if (nextRisk >= 10) {
  setScore((s) => Math.max(0, s - 40))
  setMessage(
    '危険警告。安全リスクが10以上です。閉塞間隔が非常に詰まっています。直ちに抑止または転線を行ってください。',
  )
} else if (nextRisk >= 3) {
  setScore((s) => Math.max(0, s - 25))
  setMessage(
    '接近警報。閉塞間隔が詰まっています。抑止か待避線への転線を検討してください。',
  )
} else {
  setScore((s) => Math.max(0, s - Math.ceil(nextTotalDelay / 8)))
}

        return next
      })
    }, 1000)

    return () => window.clearInterval(intervalId)
  }, [running, gameOver, formattedTime])

  const addEvent = (text) => {
    setEvents((prev) => [text, ...prev].slice(0, 6))
  }

  const setOperationWarning = (trainId, text) => {
  setOperationWarnings((prev) => ({
    ...prev,
    [trainId]: text,
  }))
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
    const targetTrain = trains.find((t) => t.id === id)
    const targetTrack = ROUTE_TRACKS.find((t) => t.id === track)
    const trackName = targetTrack?.name ?? '不明な線路'
    if (
  targetTrain &&
  targetTrack &&
  isTokyoTerminalMainTrack(targetTrack) &&
  isTokyoTerminalTrackOccupied(targetTrack.id, targetTrain.x, trains, targetTrain.id)
) {
  const warning = `${trackName}には東京駅構内ですでに別の列車がいます。東京駅構内では各線に1編成しか入線できません。`
  setMessage(warning)
  setOperationWarning(id, warning)
  addEvent(`${formattedTime} ${id}: 東京駅構内の同一線重複を防止`)
  return
}

    if (pointsLocked) {
  const warning = 'ポイント操作中です。転換完了までお待ちください。'
  setMessage(warning)
  if (targetTrain) setOperationWarning(id, warning)
  return
}

    if (targetTrain && targetTrack && !canUseTrack(targetTrain, targetTrack)) {
      const directionLabel = targetTrain.direction === 'up' ? '上り' : '下り'
      const warning =
        targetTrain.direction === 'down'
          ? `${id}は東京発の下り列車です。逆線運転を避けるため、上り本線には進路を構成できません。`
          : `${id}は${directionLabel}列車です。東京駅構内以外では${trackName}へ進路を構成できません。`

      setMessage(warning)
      setOperationWarning(id, warning)
      addEvent(`${formattedTime} ${id}: 進路構成警告`)
      return
    }

    if (targetTrack?.id.includes('omiya') && targetTrain) {
     const nearOmiyaExtraSwitch = [64, 85].some((x) => Math.abs(targetTrain.x - x) <= 12)

      if (!nearOmiyaExtraSwitch) {
        const warning = `${id}は大宮以北の分岐点付近にいないため、${trackName}へ進路を構成できません。`
setMessage(warning)
setOperationWarning(id, warning)
addEvent(`${formattedTime} ${id}: 大宮副本線への進路構成不可`)
return
      }
    }

    setPointsLocked(true)
    setMessage(
      `${id}の進路を${trackName}へ構成中。10秒ほどお待ちください。`,
    )
    setOperationWarning(id, `${trackName}へ進路を構成中です。`)
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
      `${id}に優先通過を設定しました。他列車へのしわ寄せに注意しましょう。`,
    )
    addEvent(`${formattedTime} ${id}: 優先通過設定`)
  }

  const resetGame = () => {
    setTrains(generateInitialTrains())
    setWaitingTrains(generateWaitingTrains())
    setRunning(false)
    setGameOver(false)
    setTime(15 * 3600 + 23 * 60)
    setPointsLocked(false)
    setScore(1000)
    setMessage(
      'リセットしました。',
    )
    setEvents([
      '指令: 東京・上野・大宮の新幹線上下線に対して列車整理を行い、上下方向の進路競合を避けてください。',
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
    {gameOver && (
      <div className="game-over-overlay" role="alert">
        <div className="game-over-card">
<h2>列車事故発生</h2>
          <p>
            列車事故発生。防護無線を発報しました。全列車の運転を停止します。
          </p>
          <button className="secondary-button" onClick={resetGame}>
            ↻ リセットして再開
          </button>
        </div>
      </div>
    )}
      <header className="game-header">
        <div>
          <p className="version">Train Dispatch Simulator v1.0</p>
          <h1>JR東日本 新幹線 遅延回復
            シミュレーター</h1>
          <p className="lead">
            輸送指令として各列車の運転士たちに指示を送り、遅延回復を行いましょう。
      
          </p>
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
        <div className={`stat-card ${risk >= 13 ? 'danger' : risk >= 10 ? 'warning' : ''}`}>
          <span>安全リスク</span>
          <strong>{risk}/13</strong>
        </div>
        <div className="stat-card">
          <span>評価</span>
          <strong>{grade}</strong>
        </div>
        <div className="stats-actions">
  <button className="primary-button" onClick={() => !gameOver && setRunning((v) => !v)} disabled={gameOver}>
  {gameOver ? '運転停止中' : running ? '⏸ 一時停止' : '▶ 運転開始'}
</button>
  <button className="secondary-button" onClick={resetGame}>
    ↻ リセット
  </button>
</div>
      </section>

      <section className="main-layout">
        <div className="rail-panel">
          <div className="rail-map">
          <div className="stations">
  {STATIONS.map((station) => (
    <div
      className="station"
      key={station.id}
      style={{ left: `${stationLabelX(station)}%` }}
    >
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
            {OMIYA_EXTRA_TRACKS.map((track) => (
  <div
    className="omiya-extra-track-row"
    style={{
      top: track.y,
      left: `${track.startX}%`,
      width: `${track.endX - track.startX}%`,
    }}
    key={track.id}
    title={track.name}
  >
    <div className="track-line" />
    <span>{track.name}</span>
  </div>
))}

            <div className="direction-boundary" />

            {SWITCH_POINTS.map((point) => (
  <div
    className={`route-switch ${point.direction}`}
    key={point.id}
    title={point.label}
    aria-label={point.label}
    style={{
      left: `${point.x}%`,
      top: point.top,
      height: point.height,
    }}
  >
    <i />
  </div>
))}

            {trains.map((train) => {
              const stationName = stationAt(train.x)

              return (
                <div
                  className="train-wrap"
                  key={train.id}
                  style={{
                    left: `${train.x}%`,
                    top: routeTrackById(train.track)?.y - 23,
                  }}
                >
                  <div className={`train ${train.colorClass}`}>
                    <div className="train-top compact">
                      <strong>
                        {displayTrainName(train)} / {train.direction === 'up' ? '上り' : '下り'} / {train.dwellRemaining > 0 ? `停車${train.dwellRemaining}s` : train.autoHeld ? '進路待ち' : `+${train.delay.toFixed(1)}分`}
                      </strong>
                      {(train.held || train.autoHeld) && <span className="hold-mark">×</span>}
{!train.held && !train.autoHeld && train.dwellRemaining > 0 && <span>⏸</span>}
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

          <div className="waiting-panel">
            <div className="waiting-panel-head">
              <strong>後続列車</strong>
              <span>大宮方面 → 上り本線へ接近予定</span>
            </div>
            <div className="waiting-trains">
              {waitingTrains.map((train) => (
                <div className="waiting-train-card" key={train.id}>
                  <strong>{train.name}</strong>
                  <span>{train.direction === 'up' ? '上り' : '下り'} / {train.targetTrack}</span>
                  <p>{train.status}・{train.eta}</p>
                </div>
              ))}
            </div>
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
                    <strong>{displayTrainName(train)}</strong>
                    {(train.held || train.autoHeld) && <b className="control-hold-mark">× 抑止</b>}
                    <span>{train.direction === 'up' ? '上り' : '下り'} / +{train.delay.toFixed(1)}分 / {train.dwellRemaining > 0 ? `停車中 ${train.dwellRemaining}s` : train.autoHeld ? '進路待ち・自動抑止' : '走行可'}</span>
                    <p className="route-plan">{train.plan}</p>
                    <p className="compact-info">現在進路: {trackLabel(train.track)}</p>
                    <p className="compact-info">指定番線: {platformLabel(train.assignedPlatform)}</p>
                    {operationWarnings[train.id] && (
  <p className="operation-warning">⚠ {operationWarnings[train.id]}</p>
)}
                  </div>
                </div>

                <div className="track-buttons">
                 {ROUTE_TRACKS.map((track) => (
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
        遊び方: 全列車は東京・上野・大宮で30秒停車します。停車時間をうまく計算しながら列車のに指示を出しましょう。
        停車後、前方が詰まっていなければ自動で発車し、前方が詰まっている場合は自動で抑止されます。
        適切な進路を構成しながら遅延回復を目指してください。
      </p>
    </main>
  )
}
