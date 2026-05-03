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

  { id: 'omiya-north-up-extra-in', label: '大宮以北 上り本線↔副本線 入口', direction: 'up', x: 64, top: 72, height: 80 },
  { id: 'omiya-north-up-extra-out', label: '大宮以北 上り本線↔副本線 出口', direction: 'up', x: 85, top: 72, height: 80 },
  { id: 'omiya-north-down-extra-in', label: '大宮以北 下り本線↔副本線 入口', direction: 'down', x: 64, top: 204, height: 88 },
  { id: 'omiya-north-down-extra-out', label: '大宮以北 下り本線↔副本線 出口', direction: 'down', x: 85, top: 204, height: 88 },
]

const TOKYO_TERMINAL_LIMIT_X = 30
const TOKYO_TERMINAL_DOWN_LIMIT_X = 24

const INITIAL_TRAIN_COUNT = 11
const WAITING_TRAIN_COUNT = 9
let tokyoTurnbacksSinceLastDeadhead = 0

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
  { type: 'とき', start: 300, note: '東京〜新潟' },
  { type: 'たにがわ', start: 400, note: '東京〜越後湯沢・ガーラ湯沢' },
  { type: 'たにがわ', start: 470, note: '東京〜高崎' },
  { type: 'かがやき', start: 500, note: '東京〜敦賀' },
  { type: 'はくたか', start: 550, note: '東京〜敦賀' },
  { type: 'あさま', start: 600, note: '東京〜長野' },
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
    number = first + randomInt(0, 35) * 2
    const key = `${rule.type}${number}`
    if (!usedNumbers.has(key)) {
      usedNumbers.add(key)
      return number
    }
  }

  usedNumbers.add(`${rule.type}${number}`)
  return number
}

function makeWaitingTrain(rule, direction, usedNumbers, index, etaSeconds) {
  const targetTracks = ['上り本線1', '上り本線2']
  const trainNumber = makeTrainNumber(rule, direction, usedNumbers)

  return {
    id: `waiting-${rule.type}${trainNumber}-${index}`,
    name: `${rule.type}${trainNumber}`,
    direction,
    from: '大宮方面外',
    targetTrack: targetTracks[index % targetTracks.length],
    status: etaSeconds > 0 ? '接近中' : '入線待ち',
    etaSeconds,
    eta: etaSeconds > 0 ? `約${Math.ceil(etaSeconds / 60)}分後` : '入線可能',
    delay: randomInt(0, 5),
    colorClass: colorClassForTrainType(rule.type),
  }
}

function colorClassForTrainType(type) {
  if (type.includes('はやぶさ') && type.includes('こまち')) return 'train-green-red'
  if (type.includes('やまびこ') && type.includes('つばさ')) return 'train-green-purple'
  if (type.includes('こまち')) return 'train-red-silver'
  if (type.includes('つばさ')) return 'train-purple-orange'
  if (type.includes('かがやき') || type.includes('はくたか') || type.includes('とき') || type.includes('たにがわ') || type.includes('あさま')) return 'train-blue-gold'
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
  const hayabusaKomachiRule = TRAIN_NUMBER_RULES.find((item) => item.type === 'はやぶさ・こまち')
  const yamabikoTsubasaRule = TRAIN_NUMBER_RULES.find((item) => item.type === 'やまびこ・つばさ')
  const otherRules = TRAIN_NUMBER_RULES.filter(
    (item) => item.type !== 'はやぶさ・こまち' && item.type !== 'やまびこ・つばさ',
  )
  const scheduledTrains = []

  for (let minutes = 3; scheduledTrains.length < count * 2; minutes += randomInt(1, 4)) {
    scheduledTrains.push({
      rule: pickRandom(otherRules),
      etaSeconds: minutes * 60 + randomInt(0, 45),
    })
  }

  for (let minutes = 18; minutes <= 180; minutes += 18) {
    if (hayabusaKomachiRule) {
      scheduledTrains.push({ rule: hayabusaKomachiRule, etaSeconds: minutes * 60 })
    }
  }

  for (let minutes = 30; minutes <= 180; minutes += 30) {
    if (yamabikoTsubasaRule) {
      scheduledTrains.push({ rule: yamabikoTsubasaRule, etaSeconds: minutes * 60 })
    }
  }

  return scheduledTrains
    .sort((a, b) => a.etaSeconds - b.etaSeconds)
    .slice(0, count)
    .map((item, index) => makeWaitingTrain(item.rule, 'up', usedNumbers, index, item.etaSeconds))
}

function generateAdditionalWaitingTrain(existingWaitingTrains = []) {
  const usedNumbers = new Set(
    existingWaitingTrains.map((train) => train.name),
  )
  const index = existingWaitingTrains.length + randomInt(1, 9999)
  const rule = pickRandom(TRAIN_NUMBER_RULES)
  const etaSeconds = randomInt(4, 10) * 60 + randomInt(0, 45)

  return makeWaitingTrain(rule, 'up', usedNumbers, index, etaSeconds)
}

function waitingTrainEtaLabel(train) {
  if (!Number.isFinite(train.etaSeconds) || train.etaSeconds <= 0) return '入線可能'

  const minutes = Math.floor(train.etaSeconds / 60)
  const seconds = train.etaSeconds % 60

  if (minutes <= 0) return `あと${seconds}秒`
  return `あと${minutes}分${String(seconds).padStart(2, '0')}秒`
}

function displayTrainName(train) {
  return `${train.type}${train.number ?? ''}`
}

function trainTypeColorClass(type) {
  if (type.includes('こまち')) return 'train-name-komachi'
  if (type.includes('つばさ')) return 'train-name-tsubasa'
  if (type.includes('かがやき') || type.includes('はくたか') || type.includes('あさま')) return 'train-name-blue-purple'
  if (type.includes('たにがわ') || type.includes('とき')) return 'train-name-beige-pink'
  if (type.includes('はやぶさ') || type.includes('やまびこ') || type.includes('なすの')) return 'train-name-green'
  return 'train-name-default'
}

function coloredTrainName(train) {
  const rawName = displayTrainName(train)
  const parts = train.type.split('・')
  const number = train.number ?? ''

  if (parts.length <= 1) {
    return <span className={trainTypeColorClass(train.type)}>{rawName}</span>
  }

  return (
    <span className="colored-train-name">
      {parts.map((part, index) => (
        <span className="colored-train-name-part" key={`${part}-${index}`}>
          <span className={trainTypeColorClass(part)}>{part}{number}</span>
          {index < parts.length - 1 && <span className="train-name-separator">・</span>}
        </span>
      ))}
    </span>
  )
}

function trainDirectionLabel(train) {
  return train.direction === 'up' ? '上り' : '下り'
}

function trainStatusLabel(train) {
  if (train.turnbackRemaining > 0) return `折返し準備${train.turnbackRemaining}s`
  if (train.dwellRemaining > 0) return `停車${train.dwellRemaining}s`
  if (train.held || train.autoHeld) return '抑止中'
  return '走行中'
}

function trainDisplayDetails(train) {
  return `${displayTrainName(train)} / ${trainDirectionLabel(train)} / ${trackLabel(train.track)} / +${train.delay.toFixed(1)}分 / ${trainStatusLabel(train)}`
}


function trackLabel(trackId) {
  return ROUTE_TRACKS.find((t) => t.id === trackId)?.name ?? '不明な線路'
}

// --- Helper functions for waiting trains ---
function trackByShortName(shortName) {
  return ROUTE_TRACKS.find((track) => track.shortName === shortName) ?? null
}

function parseWaitingTrainName(name) {
  const match = name.match(/^(.*?)(\d+)$/)
  return {
    type: match?.[1] ?? name,
    number: match ? Number(match[2]) : null,
  }
}

function canAdmitWaitingTrain(waitingTrain, activeTrains) {
  const targetTrack = trackByShortName(waitingTrain.targetTrack)
  if (!targetTrack) return false
  if ((waitingTrain.etaSeconds ?? 0) > 0) return false

  return !activeTrains.some((train) => {
    if (train.track !== targetTrack.id) return false
    return train.x >= 82
  })
}

function activeTrainFromWaitingTrain(waitingTrain) {
  const targetTrack = trackByShortName(waitingTrain.targetTrack) ?? routeTrackById('up-main')
  const parsed = parseWaitingTrainName(waitingTrain.name)
  const assignedPlatform = pickRandom(platformsFor('omiya', 'up'))

  return {
    id: `${waitingTrain.id}-active-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type: parsed.type,
    number: parsed.number,
    note: '後続列車',
    dir: 'left',
    direction: 'up',
    x: 100,
    track: targetTrack?.id ?? 'up-main',
    assignedPlatform: assignedPlatform?.id ?? 'omiya13',
    speed: speedForTrainType(parsed.type),
    delay: Number((waitingTrain.delay ?? randomInt(0, 5)).toFixed(1)),
    held: false,
    priority: false,
    autoHeld: false,
    dwellRemaining: null,
    turnbackRemaining: null,
    colorClass: colorClassForTrainType(parsed.type),
    plan: createTrainPlan('up', assignedPlatform),
    stoppedStations: [],
  }
}

function isUpRouteOpenBetweenOmiyaAndUeno(activeTrains) {
  const upTrackIds = new Set(['up-main', 'up-sub'])

  return !activeTrains.some((train) => {
    if (!upTrackIds.has(train.track)) return false
    return train.x >= 38 && train.x <= 82
  })
}

function reduceDelayForEarlyAdmission(train) {
  return {
    ...train,
    delay: Math.max(0, Number(((train.delay ?? 0) - 0.3).toFixed(1))),
  }
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
      if (isInTokyoTerminalAreaForTrack(a.x, a.track) && isInTokyoTerminalAreaForTrack(b.x, b.track)) continue
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

function stationStopX(station) {
  return station?.stopX ?? station?.x ?? 0
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
  return isInTokyoTerminalAreaForTrack(train.x, train.track)
}

function isInTokyoTerminalArea(x) {
  const tokyo = STATIONS.find((station) => station.id === 'tokyo')
  if (!tokyo) return false

  const leftEdge = tokyo.x - 4
  return x >= leftEdge && x <= TOKYO_TERMINAL_LIMIT_X
}
function isDownMainTrack(trackOrTrackId) {
  const track = typeof trackOrTrackId === 'string' ? routeTrackById(trackOrTrackId) : trackOrTrackId
  return track?.direction === 'down'
}

function isInTokyoTerminalAreaForTrack(x, trackOrTrackId) {
  const tokyo = STATIONS.find((station) => station.id === 'tokyo')
  if (!tokyo) return false

  const leftEdge = tokyo.x - 4
  const rightEdge = isDownMainTrack(trackOrTrackId)
    ? TOKYO_TERMINAL_DOWN_LIMIT_X
    : TOKYO_TERMINAL_LIMIT_X

  return x >= leftEdge && x <= rightEdge
}

function isTokyoTerminalTrackOccupied(trackId, x, trains, ignoreTrainId = null) {
  if (!isInTokyoTerminalAreaForTrack(x, trackId)) return false

  return trains.some((train) => {
    if (train.id === ignoreTrainId) return false
    return train.track === trackId && isInTokyoTerminalAreaForTrack(train.x, train.track)
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
  // 上り列車は東京駅の上り本線へ例外的に到着できる。
  // 到着後はその線内で折返し準備を行い、折返し下り列車として分岐器まで進んでから抑止する。
  // そのため、上り列車そのものは東京駅構内で自動抑止しない。
  return false
}

function firstOddNumber(number) {
  return number % 2 === 1 ? number : number + 1
}

function turnbackTypeFor(train) {
  const keepSameTypes = ['はやぶさ・こまち', 'やまびこ・つばさ']
  const joetsuHokurikuTurnbackTypes = ['はくたか', 'とき', 'かがやき', 'たにがわ']

  if (tokyoTurnbacksSinceLastDeadhead >= 10) {
    tokyoTurnbacksSinceLastDeadhead = 0
    return '回送'
  }

  tokyoTurnbacksSinceLastDeadhead += 1

  if (
    joetsuHokurikuTurnbackTypes.some((type) => train.type.includes(type)) ||
    train.type.includes('たにがわ')
  ) {
    return pickRandom(joetsuHokurikuTurnbackTypes)
  }

  if (keepSameTypes.some((type) => train.type.includes(type))) {
    return train.type
  }

  if (train.type.includes('なすの')) return 'なすの'
  if (train.type.includes('やまびこ')) return 'やまびこ'
  if (train.type.includes('はやぶさ')) return 'はやぶさ'

  return pickRandom(['なすの', 'やまびこ', 'はやぶさ'])
}

function turnbackAtTokyo(train, currentTrack) {
  const tokyo = STATIONS.find((station) => station.id === 'tokyo')
  const tokyoPlatform = pickRandom(platformsFor('tokyo', 'down'))
  const type = turnbackTypeFor(train)
  const number = firstOddNumber(train.number ?? 1)
  const arrivalTrack = currentTrack ?? routeTrackById(train.track)
  const needsDownTransfer = arrivalTrack?.direction === 'up'

  return {
    id: `${type}${number}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type,
    number,
    note: '東京折返し',
    direction: 'down',
    dir: 'right',
    x: tokyo?.stopX ?? tokyo?.x ?? train.x,
    track: arrivalTrack?.id ?? train.track,
    assignedPlatform: tokyoPlatform?.id ?? train.assignedPlatform,
    speed: speedForTrainType(type),
    delay: train.delay,
    colorClass: colorClassForTrainType(type),
    plan: createTrainPlan('down', tokyoPlatform),
    stoppedStations: ['tokyo'],
    dwellRemaining: 30,
    autoHeld: false,
    held: false,
    priority: false,
    turnbackRemaining: null,
    awaitingTokyoDownTransfer: needsDownTransfer,
    originalUpTrainId: train.id,
    originalArrivalTrack: train.arrivalTrack ?? train.track,
  }
}

function switchXsForTrack(targetTrack, train = null) {
  if (!targetTrack) return []

  const currentTrack = train ? routeTrackById(train.track) : null
  const isOmiyaSideTrack = targetTrack.id.includes('omiya') || currentTrack?.id.includes('omiya')

  if (isOmiyaSideTrack) return [64, 85]
  if (isTokyoTerminalMainTrack(targetTrack)) return [28, 50]
  return []
}

function canChangeTrackAtCurrentPosition(train, targetTrack) {
  if (!train || !targetTrack) return false
  if (train.track === targetTrack.id) return true

  const currentTrack = routeTrackById(train.track)
  const isOmiyaSideTrack = targetTrack.id.includes('omiya') || currentTrack?.id.includes('omiya')
  const switchXs = switchXsForTrack(targetTrack, train)
  const tolerance = isOmiyaSideTrack ? 18 : 10

  return switchXs.some((x) => Math.abs(train.x - x) <= tolerance)
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

// --- Helper: Main track for Omiya extra track ---
function mainTracksForExtraTrack(track) {
  if (!track?.id?.includes('omiya')) return []
  if (track.direction === 'up') return [routeTrackById('up-sub'), routeTrackById('up-main')].filter(Boolean)
  if (track.direction === 'down') return [routeTrackById('down-sub'), routeTrackById('down-main')].filter(Boolean)
  return []
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


function nextTrainState(train, allTrains) {
  let nx = train.x
  let ndelay = train.delay
  const stoppedStations = train.stoppedStations ?? []
  const currentStation = stationObjectAt(train.x)
  const currentTrack = routeTrackById(train.track)

  // --- Tokyo up-arrival turnback logic ---
  if (train.direction === 'up' && currentStation?.id === 'tokyo') {
    const stopX = stationStopX(currentStation)
    const turnbackRemaining = train.turnbackRemaining ?? 10
    const arrivalTrack = train.arrivalTrack ?? train.track

    if (turnbackRemaining > 0) {
      return {
        ...train,
        x: stopX,
        arrivalTrack,
        turnbackRemaining: turnbackRemaining - 1,
        dwellRemaining: null,
        autoHeld: false,
        held: false,
      }
    }

    return turnbackAtTokyo({ ...train, arrivalTrack }, currentTrack)
  }

  // --- Tokyo turnback train waiting to transfer from up-side track to down-side track ---
  if (train.direction === 'down' && train.awaitingTokyoDownTransfer) {
    const tokyo = STATIONS.find((station) => station.id === 'tokyo')
    const tokyoStopX = tokyo?.stopX ?? tokyo?.x ?? train.x
    const remaining = train.dwellRemaining ?? 30

    if (remaining > 0) {
      return {
        ...train,
        x: tokyoStopX,
        dwellRemaining: remaining - 1,
        autoHeld: false,
      }
    }

    if (currentTrack?.direction === 'down') {
      return {
        ...train,
        awaitingTokyoDownTransfer: false,
        autoHeld: false,
      }
    }

    const tokyoSwitchX = 28
    if (train.x >= tokyoSwitchX - 1) {
      return {
        ...train,
        x: tokyoSwitchX,
        autoHeld: true,
        delay: Number((ndelay + 0.02).toFixed(1)),
      }
    }
  }

  // Insert Tokyo terminal transfer logic
  if (needsTokyoTerminalTransfer(train, currentStation, currentTrack) && train.turnbackRemaining == null) {
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
    const mainTracks = mainTracksForExtraTrack(currentTrack)
    const mergeCandidate = mainTracks
      .map((mainTrack) => ({
        ...train,
        x: clampToTrackRange(train.x, currentTrack),
        track: mainTrack.id,
        autoHeld: false,
      }))
      .find((candidate) => !isFrontBlocked(candidate, allTrains))

    if (mergeCandidate) {
      return mergeCandidate
    }

    return {
      ...train,
      x: clampToTrackRange(train.x, currentTrack),
      autoHeld: true,
      delay: Number((ndelay + 0.02).toFixed(1)),
    }
  }

  if (currentStation && !stoppedStations.includes(currentStation.id)) {
    const stopX = stationStopX(currentStation)
    const remaining = train.dwellRemaining ?? 30

    if (remaining > 0) {
      return {
        ...train,
        x: stopX,
        dwellRemaining: remaining - 1,
        autoHeld: false,
      }
    }

    if (isFrontBlocked(train, allTrains)) {
      return {
        ...train,
        x: stopX,
        autoHeld: true,
        delay: Number((ndelay + 0.02).toFixed(1)),
      }
    }

    return {
      ...train,
      x: stopX,
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

  const rawNextX = train.x + (train.dir === 'right' ? train.speed : -train.speed)

  if (train.direction === 'down' && rawNextX > 100) {
    return null
  }

  if (train.direction === 'up' && rawNextX < 0) {
    if (currentTrack?.direction === 'down') {
      return turnbackAtTokyo(train, currentTrack)
    }

    return {
      ...train,
      x: STATIONS.find((station) => station.id === 'tokyo')?.stopX ?? 0,
      autoHeld: true,
      delay: Number((ndelay + 0.02).toFixed(1)),
    }
  }

  nx = clampToTrackRange(rawNextX, currentTrack)

  if (Math.random() < 0.02) {
    ndelay = Math.max(0, ndelay - 0.1)
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
  const [selectedTrainId, setSelectedTrainId] = useState(null)
  const [selectedTrainGroup, setSelectedTrainGroup] = useState(null)
  const [selectedWaitingTrain, setSelectedWaitingTrain] = useState(null)
  const [waitingListOpen, setWaitingListOpen] = useState(false)
  const [upRouteOpenSeconds, setUpRouteOpenSeconds] = useState(0)
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

  const selectedTrainGroupDetails = useMemo(() => {
    if (!selectedTrainGroup) return null

    const selectedTrains = selectedTrainGroup.trainIds
      .map((id) => trains.find((train) => train.id === id))
      .filter(Boolean)

    if (selectedTrains.length === 0) return null

    return {
      ...selectedTrainGroup,
      trains: selectedTrains,
    }
  }, [selectedTrainGroup, trains])

  useEffect(() => {
    if (!selectedTrainGroup) return

    const hasVisibleTrain = selectedTrainGroup.trainIds.some((id) =>
      trains.some((train) => train.id === id),
    )

    if (!hasVisibleTrain) {
      setSelectedTrainGroup(null)
    }
  }, [selectedTrainGroup, trains])
  const selectedWaitingTrainDetails = useMemo(() => {
  if (!selectedWaitingTrain) return null

  return waitingTrains.find((train) => train.id === selectedWaitingTrain.id) ?? selectedWaitingTrain
}, [selectedWaitingTrain, waitingTrains])

  const formattedTime = `${String(Math.floor(time / 3600)).padStart(
    2,
    '0',
  )}:${String(Math.floor((time % 3600) / 60)).padStart(2, '0')}:${String(time % 60).padStart(2, '0')}`

  useEffect(() => {
    if (!running || gameOver) return undefined

    const intervalId = window.setInterval(() => {
      setTime((v) => v + 1)

      setTrains((prev) => {
        let next = prev
          .map((train) => nextTrainState(train, prev))
          .filter(Boolean)

        const routeOpen = isUpRouteOpenBetweenOmiyaAndUeno(next)
        let earlyAdmissionTriggered = false

        setUpRouteOpenSeconds((seconds) => {
          const nextSeconds = routeOpen ? seconds + 1 : 0
          earlyAdmissionTriggered = nextSeconds >= 5
          return earlyAdmissionTriggered ? 0 : nextSeconds
        })

        setWaitingTrains((waitingPrev) => {
          const updatedWaitingTrains = waitingPrev.map((waitingTrain) => {
            const nextEtaSeconds = Math.max(0, (waitingTrain.etaSeconds ?? 0) - 1)
            return {
              ...waitingTrain,
              etaSeconds: nextEtaSeconds,
              status: nextEtaSeconds > 0 ? '接近中' : '入線待ち',
              eta: nextEtaSeconds > 0 ? `約${Math.ceil(nextEtaSeconds / 60)}分後` : '入線可能',
              delay: Math.max(0, Number(((waitingTrain.delay ?? 0) - (earlyAdmissionTriggered ? 0.3 : 0)).toFixed(1))),
            }
          })

          const admitIndex = earlyAdmissionTriggered
            ? updatedWaitingTrains
                .map((waitingTrain, index) => ({ waitingTrain, index }))
                .sort((a, b) => (a.waitingTrain.etaSeconds ?? 0) - (b.waitingTrain.etaSeconds ?? 0))
                .find(({ waitingTrain }) => {
                  const candidate = { ...waitingTrain, etaSeconds: 0 }
                  return canAdmitWaitingTrain(candidate, next)
                })?.index ?? -1
            : updatedWaitingTrains.findIndex((waitingTrain) =>
                canAdmitWaitingTrain(waitingTrain, next),
              )

          let remainingWaitingTrains = updatedWaitingTrains

          if (admitIndex !== -1) {
            const admittedWaitingTrain = {
              ...updatedWaitingTrains[admitIndex],
              etaSeconds: 0,
              status: '入線待ち',
              eta: '入線可能',
            }
            const admittedTrain = activeTrainFromWaitingTrain(admittedWaitingTrain)
            next = next.map((train) =>
              earlyAdmissionTriggered ? reduceDelayForEarlyAdmission(train) : train,
            )
            next.push(admittedTrain)
            addEvent(
              earlyAdmissionTriggered
                ? `${formattedTime} ${admittedWaitingTrain.name}: 上り進路開通により先行入線`
                : `${formattedTime} ${admittedWaitingTrain.name}: 大宮方面から入線`,
            )

            remainingWaitingTrains = updatedWaitingTrains.filter((_, index) => index !== admitIndex)
          }

          while (remainingWaitingTrains.length < WAITING_TRAIN_COUNT) {
            remainingWaitingTrains = [
              ...remainingWaitingTrains,
              generateAdditionalWaitingTrain(remainingWaitingTrains),
            ]
          }

          return remainingWaitingTrains
        })

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

  useEffect(() => {
    if (trains.length === 0) {
      setSelectedTrainId(null)
      return
    }

    if (!selectedTrainId || !trains.some((train) => train.id === selectedTrainId)) {
      setSelectedTrainId(trains[0].id)
    }
  }, [trains, selectedTrainId])

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

if (!canChangeTrackAtCurrentPosition(targetTrain, targetTrack)) {
  const switchList = switchXsForTrack(targetTrack, targetTrain).join(' / ')
  const warning = switchList
    ? `${id}は現在、分岐点付近にいません。${trackName}へ転線できる位置は x=${switchList} 付近です。`
    : `${id}は現在、分岐点付近にいないため、${trackName}へ転線できません。`

  setMessage(warning)
  setOperationWarning(id, warning)
  addEvent(`${formattedTime} ${id}: 分岐点外での転線を防止`)
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
      const nearOmiyaExtraSwitch = [64, 85].some((x) => Math.abs(targetTrain.x - x) <= 18)

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
        prev.map((t) =>
          t.id === id
            ? {
                ...t,
                track,
                arrivalTrack:
                  t.direction === 'up' && isInTokyoTerminalAreaForTrack(t.x, routeTrackById(t.track))
                    ? t.arrivalTrack ?? t.track
                    : t.arrivalTrack,
                awaitingTokyoDownTransfer:
                  t.awaitingTokyoDownTransfer && routeTrackById(track)?.direction === 'down'
                    ? false
                    : t.awaitingTokyoDownTransfer,
              }
            : t,
        ),
      )
      setPointsLocked(false)
    }, 900)
  }

  const priorityBoost = (id) => {
    const target = trains.find((t) => t.id === id)
    const willPrioritize = !target?.priority

    setTrains((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              priority: willPrioritize,
              delay: willPrioritize
                ? Math.max(0, Number((t.delay - 1.2).toFixed(1)))
                : t.delay,
              speed: willPrioritize
                ? Number(Math.min(t.speed + 0.03, 0.62).toFixed(2))
                : Number(Math.max(t.speed - 0.03, 0.3).toFixed(2)),
            }
          : t,
      ),
    )

    if (willPrioritize) {
      setScore((s) => Math.max(0, s - 30))
      setMessage(
        `${id}に優先通過を設定しました。他列車へのしわ寄せに注意しましょう。`,
      )
      addEvent(`${formattedTime} ${id}: 優先通過設定`)
    } else {
      setMessage(`${id}の優先通過を解除しました。`)
      addEvent(`${formattedTime} ${id}: 優先通過解除`)
    }
  }

  const resetGame = () => {
    setTrains(generateInitialTrains())
    setWaitingTrains(generateWaitingTrains())
    tokyoTurnbacksSinceLastDeadhead = 0
    setSelectedTrainId(null)
    setSelectedTrainGroup(null)
    setSelectedWaitingTrain(null)
    setWaitingListOpen(false)
    setUpRouteOpenSeconds(0)
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
          <p className="version">JRE Shinkansen Dispatch Simulator v2.0.0</p>
          <h1>
  <span className="title-main">JR東日本 新幹線</span>
  <span className="title-sub">遅延回復シミュレーター</span>
</h1>
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
          <p className="scroll-hint rail-scroll-hint">運行表示板は横にスクロールできます</p>

          <div className="rail-scroll">
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
  const trackY = routeTrackById(train.track)?.y ?? 0
  const popupHorizontalClass = train.x > 72 ? 'popup-left' : train.x < 24 ? 'popup-right' : 'popup-center'
  const popupVerticalClass = trackY > 230 ? 'popup-above' : 'popup-below'

  return (
    <button
      type="button"
      className={`train-wrap ${popupHorizontalClass} ${popupVerticalClass}`}
      key={train.id}
      style={{
        left: `${train.x}%`,
        top: trackY - 23,
      }}
      onClick={() =>
        setSelectedTrainGroup({
          title: '列車詳細',
          trainIds: [train.id],
        })
      }
    >
      <div className={`train ${train.colorClass}`}>
        <div className="train-top compact">
          <strong>
            {displayTrainName(train)} / {trainDirectionLabel(train)} / {trainStatusLabel(train)}
          </strong>
          {(train.held || train.autoHeld) && <span className="hold-mark">×</span>}
          {!train.held && !train.autoHeld && train.dwellRemaining > 0 && <span>⏸</span>}
        </div>
      </div>

      <div className="train-detail-popup" role="tooltip">
        <strong>列車詳細</strong>
        <ol>
          <li>{trainDisplayDetails(train)}</li>
        </ol>
      </div>

      {stationName && <p className="near-station">{stationName}付近</p>}
    </button>
  )
})}
            </div>
          </div>

          <div className="message">
            <span>⚠</span>
            <p>{message}</p>
          </div>

          <p className="scroll-hint waiting-scroll-hint">後続列車案内は横にスクロールできます</p>
          <div className="waiting-scroll">
            <div className="waiting-panel">
              <div className="waiting-panel-head">
                <strong>後続列車</strong>
                <span>大宮方面 → 上り本線へ接近予定</span>
              </div>
              <div className="waiting-trains waiting-trains-launcher">
                <button
                  type="button"
                  className="waiting-list-open-button"
                  onClick={() => setWaitingListOpen(true)}
                >
                  <strong>後続列車一覧を開く</strong>
                  <span>{waitingTrains.length}本が大宮方面から接近中</span>
                  <p>クリックして到着予定・入線先を確認</p>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <aside className="control-panel">
          <h2>⇄ 指令操作盤</h2>


          {pointsLocked && <p className="point-lock">ポイント転換中……</p>}

          <div className="train-controls">
            {trains.map((train) => (
              <div
  className={`train-control-card ${selectedTrainId === train.id ? 'mobile-selected' : ''}`}
  key={train.id}
>
                <div className="train-control-head">
                  <div>
                    <strong>{coloredTrainName(train)}</strong>
                    {(train.held || train.autoHeld) && <b className="control-hold-mark">× 抑止</b>}
                    <span>{train.direction === 'up' ? '上り' : '下り'} / +{train.delay.toFixed(1)}分 / {train.turnbackRemaining > 0 ? `折返し準備中 ${train.turnbackRemaining}s` : train.dwellRemaining > 0 ? `停車中 ${train.dwellRemaining}s` : train.autoHeld ? '進路待ち・自動抑止' : '走行可'}</span>
                    <p className="compact-info">現在進路: {trackLabel(train.track)}</p>
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
  <button
    className={train.held ? 'hold-button active' : 'hold-button'}
    onClick={() => toggleHold(train.id)}
  >
    {train.held ? '⏸ 解除' : '⏸ 抑止'}
  </button>
  <button
    className={train.priority ? 'priority-button active' : 'priority-button'}
    onClick={() => priorityBoost(train.id)}
  >
    {train.priority ? '⚡ 優先解除' : '⚡ 優先'}
  </button>
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
        遊び方: 全列車は東京・上野・大宮で30秒停車します。停車時間をうまく計算しながら列車に指示を出しましょう。
        停車後、前方が詰まっていなければ自動で発車し、前方が詰まっている場合は自動で抑止されます。
        上り本線が大宮〜上野間で5秒以上開通していると後続列車が先行入線します。適切な進路を構成しながら遅延回復を目指してください。
      </p>

      {waitingListOpen && (
        <div className="waiting-train-modal" role="dialog" aria-label="後続列車一覧">
          <div className="waiting-train-modal-card waiting-train-list-modal-card">
            <div className="waiting-train-modal-head">
              <div>
                <strong>後続列車一覧</strong>
                <span>大宮方面 → 上り本線へ接近予定</span>
              </div>
              <button
                type="button"
                aria-label="閉じる"
                onClick={() => {
                  setWaitingListOpen(false)
                  setSelectedWaitingTrain(null)
                }}
              >
                ×
              </button>
            </div>

            <div className="waiting-train-modal-list">
              {waitingTrains.map((train) => (
                <button
                  type="button"
                  className="waiting-train-modal-item"
                  key={train.id}
                  onClick={() => setSelectedWaitingTrain(train)}
                >
                  <strong>{train.name}</strong>
                  <span>{train.direction === 'up' ? '上り' : '下り'} / {train.targetTrack}</span>
                  <p>{train.status}・{waitingTrainEtaLabel(train)} / 想定遅延 +{(train.delay ?? 0).toFixed(1)}分</p>
                </button>
              ))}
            </div>

            {selectedWaitingTrainDetails && (
              <dl className="waiting-train-modal-details">
                <div>
                  <dt>選択中</dt>
                  <dd>{selectedWaitingTrainDetails.name}</dd>
                </div>
                <div>
                  <dt>方向</dt>
                  <dd>{selectedWaitingTrainDetails.direction === 'up' ? '上り' : '下り'}</dd>
                </div>
                <div>
                  <dt>入線予定</dt>
                  <dd>{waitingTrainEtaLabel(selectedWaitingTrainDetails)}</dd>
                </div>
                <div>
                  <dt>入線先</dt>
                  <dd>{selectedWaitingTrainDetails.targetTrack}</dd>
                </div>
                <div>
                  <dt>状態</dt>
                  <dd>{selectedWaitingTrainDetails.status}</dd>
                </div>
                <div>
                  <dt>想定遅延</dt>
                  <dd>+{(selectedWaitingTrainDetails.delay ?? 0).toFixed(1)}分</dd>
                </div>
              </dl>
            )}
          </div>
        </div>
      )}

      {selectedTrainGroupDetails && (
        <div className="pc-train-operation-modal" role="dialog" aria-label="PC版指令操作盤">
          <div className="pc-train-operation-card">
            <div className="pc-train-operation-head">
              <strong>指令操作盤</strong>
              <button
                type="button"
                aria-label="閉じる"
                onClick={() => setSelectedTrainGroup(null)}
              >
                ×
              </button>
            </div>

            <div className="pc-train-operation-list">
              {selectedTrainGroupDetails.trains.map((train) => (
                <section className="pc-train-operation-item" key={train.id}>
                  <div className="pc-operation-train-head">
                    <strong>{coloredTrainName(train)}</strong>
                    {(train.held || train.autoHeld) && <b className="control-hold-mark">× 抑止</b>}
                    <span>{trainDirectionLabel(train)} / +{train.delay.toFixed(1)}分 / {trainStatusLabel(train)}</span>
                    <p className="compact-info">現在進路: {trackLabel(train.track)}</p>
                    {operationWarnings[train.id] && (
                      <p className="operation-warning">⚠ {operationWarnings[train.id]}</p>
                    )}
                  </div>

                  <div className="pc-operation-section">
                    <strong>進路を構成</strong>
                    <div className="pc-track-buttons">
                      {ROUTE_TRACKS.map((track) => (
                        <button
                          type="button"
                          key={track.id}
                          className={train.track === track.id ? 'selected' : ''}
                          onClick={() => changeTrack(train.id, track.id)}
                        >
                          {track.shortName}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pc-operation-actions">
                    <button
                      type="button"
                      className={train.held ? 'hold-button active' : 'hold-button'}
                      onClick={() => toggleHold(train.id)}
                    >
                      {train.held ? '⏸ 解除' : '⏸ 抑止'}
                    </button>
                    <button
                      type="button"
                      className={train.priority ? 'priority-button active' : 'priority-button'}
                      onClick={() => priorityBoost(train.id)}
                    >
                      {train.priority ? '⚡ 優先解除' : '⚡ 優先'}
                    </button>
                  </div>
                </section>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedTrainGroupDetails && (
  <div className="mobile-train-group-panel" role="dialog" aria-label="スマホ版指令操作盤">
    <div className="mobile-train-group-card mobile-operation-card">
      <div className="mobile-train-group-head mobile-operation-head">
  <strong>指令操作盤</strong>
  <button
    type="button"
    className="mobile-operation-close"
    aria-label="閉じる"
    onClick={() => setSelectedTrainGroup(null)}
  >
    ×
  </button>
</div>

      <ol className="mobile-train-group-list mobile-operation-list">
        {selectedTrainGroupDetails.trains.map((train) => (
          <li key={train.id}>
            <div className="mobile-operation-train-head">
              <strong>{coloredTrainName(train)}</strong>
              <span>{trainDirectionLabel(train)} / +{train.delay.toFixed(1)}分 / {trainStatusLabel(train)}</span>
              <span>現在進路: {trackLabel(train.track)}</span>
              {operationWarnings[train.id] && (
                <span className="mobile-operation-warning">⚠ {operationWarnings[train.id]}</span>
              )}
            </div>

            <div className="mobile-operation-section">
              <strong>進路を構成</strong>
              <div className="mobile-track-buttons">
                {ROUTE_TRACKS.map((track) => (
                  <button
                    type="button"
                    key={track.id}
                    className={train.track === track.id ? 'selected' : ''}
                    onClick={() => changeTrack(train.id, track.id)}
                  >
                    {track.shortName}
                  </button>
                ))}
              </div>
            </div>

            <div className="mobile-train-group-actions mobile-operation-actions">
              <button
                type="button"
                className={train.held ? 'hold-button active' : 'hold-button'}
                onClick={() => toggleHold(train.id)}
              >
                {train.held ? '抑止解除' : '抑止'}
              </button>
              <button
                type="button"
                className={train.priority ? 'priority-button active' : 'priority-button'}
                onClick={() => priorityBoost(train.id)}
              >
                {train.priority ? '優先解除' : '優先'}
              </button>
            </div>
          </li>
        ))}
      </ol>
    </div>
    </div>
)}
    </main>
  )
}