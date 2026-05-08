import { useEffect, useMemo, useState } from 'react'
import './App.css'

const UPPER_STATION_AREA_SWITCH_MARKERS = [27.5, 48.8, 66, 86.3]
const LOWER_STATION_AREA_SWITCH_MARKERS = [27.5, 48.8, 66, 86.3]
const STATION_LABEL_POSITIONS = {
  ueno: (UPPER_STATION_AREA_SWITCH_MARKERS[0] + UPPER_STATION_AREA_SWITCH_MARKERS[1]) / 2,
  omiya: (UPPER_STATION_AREA_SWITCH_MARKERS[2] + UPPER_STATION_AREA_SWITCH_MARKERS[3]) / 2,
}

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
    labelX: STATION_LABEL_POSITIONS.ueno,
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
    labelX: STATION_LABEL_POSITIONS.omiya,
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
  { id: 'up-main', name: '上り本線1 東京方面', shortName: '上り本線1', direction: 'up', y: 72, labelPosition: 'outer-top', labelY: 48, labelX: 50 },
  { id: 'up-sub', name: '上り本線2 東京方面', shortName: '上り本線2', direction: 'up', y: 112, labelPosition: 'outer-bottom', labelY: 132, labelX: 50 },
  { id: 'down-main', name: '下り本線1 大宮・熊谷方面', shortName: '下り本線1', direction: 'down', y: 204, labelPosition: 'outer-top', labelY: 180, labelX: 50 },
  { id: 'down-sub', name: '下り本線2 大宮・熊谷方面', shortName: '下り本線2', direction: 'down', y: 252, labelPosition: 'outer-bottom', labelY: 272, labelX: 50 },
]

const OMIYA_EXTRA_TRACKS = [
  { id: 'omiya-up-extra', name: '大宮上り副本線', shortName: '大宮上り副本線', direction: 'up', y: 152, startX: 63.7, endX: 85.3, labelPosition: 'outer-bottom', labelY: 162, labelX: 74.5 },
  { id: 'omiya-down-extra', name: '大宮下り副本線', shortName: '大宮下り副本線', direction: 'down', y: 292, startX: 63.7, endX: 85.3, labelPosition: 'outer-bottom', labelY: 312, labelX: 74.5 },
]


const ROUTE_TRACKS = [...TRACKS, ...OMIYA_EXTRA_TRACKS]

const OPERATION_TRACK_GROUPS = [
  ['up-main', 'down-main'],
  ['up-sub', 'down-sub'],
  ['omiya-up-extra', 'omiya-down-extra'],
]

const MOBILE_OPERATION_TRACK_GROUPS = [
  ['up-main', 'up-sub', 'omiya-up-extra'],
  ['down-main', 'down-sub', 'omiya-down-extra'],
]

const SWITCH_POINTS = [
  { id: 'tokyo-terminal-crossover', label: '東京駅構内 本線間渡り', direction: 'terminal', x: 28, top: 72, height: 180 },

  { id: 'ueno-omiya-up', label: '上野〜大宮 上り渡り', direction: 'up', x: 50, top: 72, height: 40 },
  { id: 'ueno-omiya-down', label: '上野〜大宮 下り渡り', direction: 'down', x: 50, top: 204, height: 48 },

  { id: 'omiya-north-up-extra-in', label: '大宮以北 上り本線↔副本線 入口', direction: 'up', x: 64, top: 72, height: 80 },
  { id: 'omiya-north-up-extra-out', label: '大宮以北 上り本線↔副本線 出口', direction: 'up', x: 85, top: 72, height: 80 },
  { id: 'omiya-north-down-extra-in', label: '大宮以北 下り本線↔副本線 入口', direction: 'down', x: 64, top: 204, height: 88 },
  { id: 'omiya-north-down-extra-out', label: '大宮以北 下り本線↔副本線 出口', direction: 'down', x: 85, top: 204, height: 88 },
]


const TOKYO_TERMINAL_LIMIT_X = 28
const TOKYO_TERMINAL_DOWN_LIMIT_X = 28

const INITIAL_TRAIN_COUNT = 12
const BEGINNER_INITIAL_TRAIN_COUNT = 8
const WAITING_TRAIN_COUNT = 9
const EARLY_ADMISSION_AFTER_OMIYA_DEPARTURE_SECONDS = 35
const TRAIN_SWITCH_ENTRY_OFFSET = 5
const HOLD_RISK_TRAIN_COUNT = 2
const LONG_HOLD_RISK_SECONDS = 60
let tokyoTurnbacksSinceLastDeadhead = 0

const TUTORIAL_STEPS = [
  {
    title: 'このゲームの目的',
    body: '車両トラブルの影響で、新幹線の運行に遅れが広がっています。あなたは輸送指令として、東京〜大宮間の列車に進路や抑止を指示し、安全を守りながら遅延回復を目指します。',
  },
  {
    title: '運行表示板',
    body: '列車の位置・方向・状態を確認できます。列車をクリックまたはタップすると指令操作盤が開きます。',
  },
  {
    title: '線路と進行方向',
    body: '上り列車は大宮方面から東京方面へ、下り列車は東京方面から大宮方面へ進みます。大宮付近には上り・下りそれぞれに副本線があり、列車を待避させたり進路を整理したりするときに活用できます。',
  },
  {
    title: '操作したい列車を選択する',
    body: '列車に表示される「+9.0分」は遅延時間です。遅れの大きい列車をクリックまたはタップして、指令操作盤を開きましょう。',
  },
  {
    title: '指令操作盤',
    body: '列車を選ぶと、列車名・遅延時間・列車の状態・現在進路を確認できます。進路を変える場合は分岐点付近で操作します。必要に応じて抑止と優先を使い分けましょう。',
  },
  {
    title: '抑止と優先',
    body: '抑止は列車を一時的に止め、他の列車の進路を確保したいときに使います。優先は選んだ列車の遅延回復を早めますが、ほかの列車への影響に注意しましょう。',
  },
  {
    title: '後続列車について',
    body: 'これから大宮方面から東京方面に向けて入線する列車です。後続列車一覧を開くと確認できます。',
  },
  {
    title: '安全リスク',
    body: '列車同士が近づきすぎると安全リスクが上がります。また、抑止中の列車が増えたり、ゲーム内時間で1分以上抑止される列車が出たりした場合も、安全リスクが上がります。安全リスクが13に達するとゲームオーバーです。',
  },
  {
    title: '評価のしくみ',
    body: '評価は、遅延回復までの速さ、安全リスクの低さ、優先使用の少なさによって変動します。安全を守りながら、できるだけ早く総遅延を減らすことが高評価につながります。',
  },
  {
    title: '難易度について',
    body: '「新入り指令員モード」では列車本数が少なめになり、危険な操作はシステム側で予防されます。「熟練指令員モード」では列車の本数が多めになり、危険な操作を行うと列車事故として即ゲームオーバーになります。',
  },
  {
    title: '始業前点呼',
    body: 'ここからは、あなたの判断が列車の流れを左右します。安全を守りながら、東京〜大宮間の運行を整理し、遅延回復に挑みましょう。',
  },
]


const PRACTICE_TUTORIAL_STEPS = [
  {
    title: '列車を選択しましょう',
    body: 'マークのついた列車をクリックまたはタップして、指令操作盤を開きましょう。必要に応じて画面をスクロールしてください。',
  },
  {
    title: '抑止を使ってみましょう',
    body: '指令操作盤の「抑止」を押すと、列車を一時的に止めることができます。',
  },
  {
    title: '抑止を解除しましょう',
    body: 'もう一度「抑止解除」を押すと、列車を再び走らせることができます。',
  },
  {
    title: '操作チュートリアル完了',
    body: '基本操作は完了です。分岐点付近では、明るく表示されている進路ボタンから列車の進路を変更できます。暗いボタンは現在の位置では操作できません。一度、指令操作盤を閉じ、運転開始を押して列車整理を開始してください。',
  },
]

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

function generateInitialTrains(mode = 'prevent', count = INITIAL_TRAIN_COUNT) {
  const initialCount = mode === 'prevent' ? BEGINNER_INITIAL_TRAIN_COUNT : count
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
      omiyaDepartureSeconds: null,
      earlyAdmissionTriggeredByOmiyaDeparture: false,
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

  const remainingCount = Math.max(0, initialCount - tokyoTerminalTrains.length)
  const remainingTrains = []
  const placedTrains = [...tokyoTerminalTrains]
  const minimumInitialGap = 9

  for (let index = 0; index < remainingCount; index += 1) {
    const direction = index % 2 === 0 ? 'up' : 'down'
    const candidateTracks = TRACKS.filter((item) => item.direction === direction)
    const candidatePositions = direction === 'up' ? upPositions : downPositions

    const candidates = candidateTracks.flatMap((track) =>
      candidatePositions.map((baseX, positionIndex) => ({
        track,
        baseX,
        positionIndex,
      })),
    )

    const availableCandidates = candidates.filter(({ track, baseX }) =>
      !placedTrains.some((train) =>
        train.track === track.id && Math.abs(train.x - baseX) < minimumInitialGap,
      ),
    )

    const selectedCandidate =
      availableCandidates[index % Math.max(availableCandidates.length, 1)] ??
      candidates.find(({ track, baseX }) =>
        !placedTrains.some((train) => train.track === track.id && Math.abs(train.x - baseX) < 5),
      ) ??
      candidates[index % candidates.length]

    const jitter = randomInt(-1, 1)
    const newTrain = createTrain({
      direction,
      track: selectedCandidate.track,
      x: clamp(selectedCandidate.baseX + jitter, 0, 100),
      index: TRACKS.length + index,
    })

    remainingTrains.push(newTrain)
    placedTrains.push(newTrain)
  }

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

function coloredTrainNameText(name) {
  const rawName = String(name ?? '')
  const parts = rawName.split('・')

  return (
    <span className="colored-train-name">
      {parts.map((part, index) => {
        const match = part.match(/^(.*?)(\d+)$/)
        const type = match ? match[1] : part
        const number = match ? match[2] : ''

        return (
          <span className="colored-train-name-part" key={`${part}-${index}`}>
            <span className={trainTypeColorClass(type)}>{type}{number}</span>
            {index < parts.length - 1 && <span className="train-name-separator">・</span>}
          </span>
        )
      })}
    </span>
  )
}

function waitingTrainNameBadge(name) {
  return coloredTrainNameText(name)
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

function holdTimeLabel(train) {
  const seconds = Math.floor(train.holdSeconds ?? 0)
  if (seconds <= 0) return '0秒'

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  if (minutes <= 0) return `${remainingSeconds}秒`
  if (remainingSeconds === 0) return `${minutes}分`
  return `${minutes}分${String(remainingSeconds).padStart(2, '0')}秒`
}

function trainDisplayDetails(train) {
  return `${displayTrainName(train)} / ${trainDirectionLabel(train)} / ${operationTrackLabel(train)} / +${train.delay.toFixed(1)}分 / ${trainStatusLabel(train)}`
}


function trackLabel(trackId) {
  return ROUTE_TRACKS.find((t) => t.id === trackId)?.name ?? '不明な線路'
}

// --- Tokyo Terminal Track Label Helpers ---
function tokyoTerminalTrackLabel(trackId) {
  const labels = {
    'up-main': '東京20番線',
    'up-sub': '東京21番線',
    'down-main': '東京22番線',
    'down-sub': '東京23番線',
  }

  return labels[trackId] ?? null
}

function tokyoTerminalTrackButtonLabel(trackId) {
  const labels = {
    'up-main': '20番線',
    'up-sub': '21番線',
    'down-main': '22番線',
    'down-sub': '23番線',
  }

  return labels[trackId] ?? null
}

function shouldUseTokyoTerminalTrackLabels(train) {
  return Boolean(
    train &&
    isInTokyoTerminalAreaForTrack(train.x, train.track) &&
    isTokyoTerminalMainTrack(routeTrackById(train.track)),
  )
}

function operationTrackLabel(train) {
  if (shouldUseTokyoTerminalTrackLabels(train)) {
    return tokyoTerminalTrackLabel(train.track) ?? trackLabel(train.track)
  }

  return trackLabel(train.track)
}

function operationTrackButtonLabel(track, train) {
  if (shouldUseTokyoTerminalTrackLabels(train) && train.direction !== 'down') {
    return tokyoTerminalTrackButtonLabel(track.id) ?? track.shortName
  }

  return track.shortName
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

function isTrackBlockedNearOmiyaEntry(trackId, activeTrains) {
  return activeTrains.some((train) => train.track === trackId && train.x >= 82)
}

function availableUpAdmissionTrackShortName(activeTrains) {
  const candidates = ['上り本線1', '上り本線2']

  return candidates.find((shortName) => {
    const track = trackByShortName(shortName)
    if (!track) return false
    return !isTrackBlockedNearOmiyaEntry(track.id, activeTrains)
  }) ?? null
}

function isOmiyaUpAdmissionSourceTrack(trackId) {
  return ['up-main', 'up-sub', 'omiya-up-extra'].includes(trackId)
}

function hasDepartedOmiyaOnUpTrack(train) {
  const omiya = STATIONS.find((station) => station.id === 'omiya')
  const omiyaStopX = omiya?.stopX ?? omiya?.x ?? 75

  return (
    train?.direction === 'up' &&
    isOmiyaUpAdmissionSourceTrack(train.track) &&
    train.stoppedStations?.includes('omiya') &&
    train.x < omiyaStopX - 1
  )
}

function updateOmiyaDepartureTimer(train) {
  if (!hasDepartedOmiyaOnUpTrack(train)) {
    return {
      ...train,
      omiyaDepartureSeconds: null,
      earlyAdmissionTriggeredByOmiyaDeparture: false,
    }
  }

  return {
    ...train,
    omiyaDepartureSeconds: (train.omiyaDepartureSeconds ?? 0) + 1,
  }
}

function hasOmiyaDepartureEarlyAdmissionTrigger(activeTrains) {
  return activeTrains.some(
    (train) =>
      hasDepartedOmiyaOnUpTrack(train) &&
      !train.earlyAdmissionTriggeredByOmiyaDeparture &&
      (train.omiyaDepartureSeconds ?? 0) >= EARLY_ADMISSION_AFTER_OMIYA_DEPARTURE_SECONDS,
  )
}

function markOmiyaDepartureEarlyAdmissionUsed(activeTrains) {
  return activeTrains.map((train) =>
    hasDepartedOmiyaOnUpTrack(train) &&
    !train.earlyAdmissionTriggeredByOmiyaDeparture &&
    (train.omiyaDepartureSeconds ?? 0) >= EARLY_ADMISSION_AFTER_OMIYA_DEPARTURE_SECONDS
      ? { ...train, earlyAdmissionTriggeredByOmiyaDeparture: true }
      : train,
  )
}

function canEarlyAdmitWaitingTrain(waitingTrain, activeTrains) {
  if (!waitingTrain) return false
  return Boolean(availableUpAdmissionTrackShortName(activeTrains))
}

function canAdmitWaitingTrain(waitingTrain, activeTrains) {
  const targetTrack = trackByShortName(waitingTrain.targetTrack)
  if (!targetTrack) return false
  if ((waitingTrain.etaSeconds ?? 0) > 0) return false

  return !isTrackBlockedNearOmiyaEntry(targetTrack.id, activeTrains)
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
    holdSeconds: 0,
    dwellRemaining: null,
    turnbackRemaining: null,
    colorClass: colorClassForTrainType(parsed.type),
    plan: createTrainPlan('up', assignedPlatform),
    stoppedStations: [],
    omiyaDepartureSeconds: null,
    earlyAdmissionTriggeredByOmiyaDeparture: false,
  }
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

  const heldTrains = trains.filter((train) => train.held || train.autoHeld)
  const hasLongHeldTrain = heldTrains.some(
    (train) => (train.holdSeconds ?? 0) >= LONG_HOLD_RISK_SECONDS,
  )

  if (heldTrains.length >= HOLD_RISK_TRAIN_COUNT || hasLongHeldTrain) {
    risk += 1
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

// --- Switch Conflict Helper Functions ---
function trainFrontX(train) {
  return train.dir === 'right'
    ? train.x + TRAIN_SWITCH_ENTRY_OFFSET
    : train.x - TRAIN_SWITCH_ENTRY_OFFSET
}

function trainRearX(train) {
  return train.dir === 'right'
    ? train.x - TRAIN_SWITCH_ENTRY_OFFSET
    : train.x + TRAIN_SWITCH_ENTRY_OFFSET
}

function hasTrainFullyClearedSwitch(train, switchX) {
  const rearX = trainRearX(train)
  return train.dir === 'right' ? rearX > switchX : rearX < switchX
}

function isTrainStillClearingSwitch(train, switchX, tolerance = 18) {
  const frontX = trainFrontX(train)
  const rearX = trainRearX(train)
  const bodyMinX = Math.min(frontX, rearX)
  const bodyMaxX = Math.max(frontX, rearX)
  const isSwitchBetweenFrontAndRear = switchX >= bodyMinX && switchX <= bodyMaxX
  const isNearSwitch =
    Math.abs(train.x - switchX) <= tolerance ||
    Math.abs(frontX - switchX) <= tolerance ||
    Math.abs(rearX - switchX) <= tolerance

  return !hasTrainFullyClearedSwitch(train, switchX) && (isSwitchBetweenFrontAndRear || isNearSwitch)
}

function switchConflictTrainOnTargetTrack(train, targetTrack, trains, ignoreTrainId = null) {
  if (!train || !targetTrack) return null

  const switchXs = switchXsForTrack(targetTrack, train)
  if (switchXs.length === 0) return null

  return trains.find((other) => {
    if (other.id === ignoreTrainId || other.id === train.id) return false
    if (other.track !== targetTrack.id) return false
    if ((other.dwellRemaining ?? 0) > 0 || (other.turnbackRemaining ?? 0) > 0) return false

    return switchXs.some((switchX) => {
      const trainNearSwitch = isTrainInSwitchRange(train, switchX, 18)
      const otherStillClearingSwitch = isTrainStillClearingSwitch(other, switchX, 18)

      return trainNearSwitch && otherStillClearingSwitch
    })
  }) ?? null
}

function switchConflictMessage(conflictTrain, targetTrack) {
  const conflictTrainName = conflictTrain ? displayTrainName(conflictTrain) : '別の列車'
  const targetTrackName = targetTrack?.name ?? '転線先の線路'
  return `${targetTrackName}の分岐器付近に${conflictTrainName}が在線している状態で、後続列車を転線させました。`
}

function targetTrainCanUseTokyoTerminalCheck(train, targetTrack) {
  return Boolean(
    train &&
    targetTrack &&
    isTokyoTerminalMainTrack(targetTrack) &&
    isInTokyoTerminalAreaForTrack(train.x, targetTrack.id),
  )
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
    holdSeconds: 0,
    priority: false,
    turnbackRemaining: null,
    awaitingTokyoDownTransfer: needsDownTransfer,
    originalUpTrainId: train.id,
    originalArrivalTrack: train.arrivalTrack ?? train.track,
    omiyaDepartureSeconds: null,
    earlyAdmissionTriggeredByOmiyaDeparture: false,
  }
}

function switchXsForTrack(targetTrack, train = null) {
  if (!targetTrack) return []

  const currentTrack = train ? routeTrackById(train.track) : null
  const isOmiyaSideTrack = targetTrack.id.includes('omiya') || currentTrack?.id.includes('omiya')
  const isNearOmiyaArea = Number.isFinite(train?.x) && train.x >= 56 && train.x <= 90
  const isSameDirectionMainlineTransfer =
    currentTrack &&
    targetTrack &&
    currentTrack.direction === targetTrack.direction &&
    !currentTrack.id.includes('omiya') &&
    !targetTrack.id.includes('omiya') &&
    currentTrack.id !== targetTrack.id

  if (isOmiyaSideTrack || (isNearOmiyaArea && isSameDirectionMainlineTransfer)) return [64, 85]
  if (isTokyoTerminalMainTrack(targetTrack) || isTokyoTerminalMainTrack(currentTrack)) return [28, 50]
  return []
}

function isTrainInSwitchRange(train, switchX, tolerance) {
  if (!train || !Number.isFinite(train.x)) return false

  const frontX = train.dir === 'right'
    ? train.x + TRAIN_SWITCH_ENTRY_OFFSET
    : train.x - TRAIN_SWITCH_ENTRY_OFFSET

  return (
    Math.abs(train.x - switchX) <= tolerance ||
    Math.abs(frontX - switchX) <= tolerance
  )
}

function canChangeTrackAtCurrentPosition(train, targetTrack) {
  if (!train || !targetTrack) return false
  if (train.track === targetTrack.id) return true

  const currentTrack = routeTrackById(train.track)
  const isOmiyaSideTrack = targetTrack.id.includes('omiya') || currentTrack?.id.includes('omiya')
  const isNearOmiyaArea = Number.isFinite(train?.x) && train.x >= 56 && train.x <= 90
  const isSameDirectionMainlineTransfer =
    currentTrack &&
    targetTrack &&
    currentTrack.direction === targetTrack.direction &&
    !currentTrack.id.includes('omiya') &&
    !targetTrack.id.includes('omiya') &&
    currentTrack.id !== targetTrack.id
  const isTokyoUenoMainTrackTransfer =
    isTokyoTerminalMainTrack(targetTrack) || isTokyoTerminalMainTrack(currentTrack)
  const switchXs = switchXsForTrack(targetTrack, train)
  const tolerance = isOmiyaSideTrack || (isNearOmiyaArea && isSameDirectionMainlineTransfer)
    ? 18
    : isTokyoUenoMainTrackTransfer
      ? 16
      : 10

  return switchXs.some((x) => isTrainInSwitchRange(train, x, tolerance))
}


// --- Helper: Can operate track button ---
function trackOperationUnavailableReason(train, targetTrack, trains, conflictMode = 'prevent') {
  if (!train || !targetTrack) return '列車または進路情報を取得できません。'
  if ((train.dwellRemaining ?? 0) > 0 || (train.turnbackRemaining ?? 0) > 0) {
    return '停車中または折返し準備中のため、発車後に操作できます。'
  }
  if (train.track === targetTrack.id) return ''

  const isTokyoTerminalOccupied =
    targetTrainCanUseTokyoTerminalCheck(train, targetTrack) &&
    isTokyoTerminalTrackOccupied(targetTrack.id, train.x, trains, train.id)

  if (isTokyoTerminalOccupied) {
    return '東京駅構内では各線に1編成しか入線できないため、現在は選択できません。'
  }

  const switchConflictTrain = switchConflictTrainOnTargetTrack(train, targetTrack, trains, train.id)
  if (switchConflictTrain && conflictMode !== 'strict') {
    return `${targetTrack.name}の分岐器付近に${displayTrainName(switchConflictTrain)}がいるため、現在は転線できません。`
  }

  if (!canUseTrack(train, targetTrack)) {
    return train.direction === 'down'
      ? '東京発の下り列車のため、上り本線には進路を構成できません。'
      : `${trackLabel(targetTrack.id)}は、東京駅構内にいる上り列車だけが使用できます。`
  }

  if (!canChangeTrackAtCurrentPosition(train, targetTrack)) {
    const switchList = switchXsForTrack(targetTrack, train).join(' / ')
    return switchList
      ? `分岐点付近にいないため、現在は転線できません。操作可能位置は x=${switchList} 付近です。`
      : '分岐点付近にいないため、現在は転線できません。'
  }

  if (targetTrack.id.includes('omiya')) {
    const nearOmiyaExtraSwitch = [64, 85].some((x) => Math.abs(train.x - x) <= 18)
    if (!nearOmiyaExtraSwitch) {
      return '大宮以北の分岐点付近にいないため、副本線へ進路を構成できません。'
    }
  }

  return ''
}

function canOperateTrackButton(train, targetTrack, trains, conflictMode = 'prevent') {
  return trackOperationUnavailableReason(train, targetTrack, trains, conflictMode) === ''
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



function nextTrainState(train, allTrains) {
  let nx = train.x
  let ndelay = train.delay
  const stoppedStations = train.stoppedStations ?? []
  const currentStation = stationObjectAt(train.x)
  const currentTrack = routeTrackById(train.track)
  const nextHoldSeconds = (train.held || train.autoHeld) ? (train.holdSeconds ?? 0) + 1 : 0

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
        holdSeconds: 0,
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
        holdSeconds: 0,
      }
    }

    if (currentTrack?.direction === 'down') {
      return {
        ...train,
        awaitingTokyoDownTransfer: false,
        autoHeld: false,
        holdSeconds: 0,
      }
    }

    const tokyoSwitchX = 28
    if (train.x >= tokyoSwitchX - 1) {
      return {
        ...train,
        autoHeld: true,
        holdSeconds: nextHoldSeconds,
        delay: Number((ndelay + 0.02).toFixed(1)),
      }
    }
  }



  if (train.held) {
    return {
      ...train,
      delay: Number((ndelay + 0.02).toFixed(1)),
      autoHeld: false,
      holdSeconds: nextHoldSeconds,
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
        holdSeconds: 0,
      }))
      .find((candidate) => !isFrontBlocked(candidate, allTrains))

    if (mergeCandidate) {
      return mergeCandidate
    }

    return {
      ...train,
      autoHeld: true,
      holdSeconds: nextHoldSeconds,
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
        holdSeconds: 0,
      }
    }

    if (isFrontBlocked(train, allTrains)) {
      return {
        ...train,
        autoHeld: true,
        holdSeconds: nextHoldSeconds,
        delay: Number((ndelay + 0.02).toFixed(1)),
      }
    }

    return {
      ...train,
      x: stopX,
      dwellRemaining: null,
      autoHeld: false,
      holdSeconds: 0,
      stoppedStations: [...stoppedStations, currentStation.id],
    }
  }

  if (isFrontBlocked(train, allTrains)) {
    return {
      ...train,
      autoHeld: true,
      holdSeconds: nextHoldSeconds,
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
      autoHeld: true,
      holdSeconds: nextHoldSeconds,
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
    holdSeconds: 0,
  }
}

export default function App() {
  const [trains, setTrains] = useState(() => generateInitialTrains('prevent'))
  const [waitingTrains, setWaitingTrains] = useState(() => generateWaitingTrains())
  const [selectedTrainGroup, setSelectedTrainGroup] = useState(null)
  const [waitingListOpen, setWaitingListOpen] = useState(false)
  const [difficultyMenuOpen, setDifficultyMenuOpen] = useState(false)
  const [upRouteOpenSeconds, setUpRouteOpenSeconds] = useState(0)
  const [running, setRunning] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [gameClear, setGameClear] = useState(false)
  const [gameOverReason, setGameOverReason] = useState('列車事故発生。防護無線を発報しました。全列車の運転を停止します。')
  const [gameOverAdvice, setGameOverAdvice] = useState('次回は列車同士の間隔と進路の重複に注意しながら、早めに抑止や進路変更を行いましょう。')
  const [tokyoTerminalConflictMode, setTokyoTerminalConflictMode] = useState('prevent')
  const [time, setTime] = useState(15 * 3600 + 23 * 60)
  const [pointsLocked, setPointsLocked] = useState(false)
  const [message, setMessage] = useState(
    '車両トラブルにより遅延が発生しています。上り・下りの本線/副本線を使い分け、遅延回復を目指しましょう。',
  )
  const [tutorialOpen, setTutorialOpen] = useState(() => {
    if (typeof window === 'undefined') return true
    return window.localStorage.getItem('tutorialSeen') !== 'true'
  })
  const [tutorialStep, setTutorialStep] = useState(0)
  const [practiceTutorialPromptOpen, setPracticeTutorialPromptOpen] = useState(false)
  const [practiceTutorialOpen, setPracticeTutorialOpen] = useState(false)
  const [practiceTutorialStep, setPracticeTutorialStep] = useState(0)
  const [practiceTutorialTrainId, setPracticeTutorialTrainId] = useState(null)
  const [operationWarnings, setOperationWarnings] = useState({})
  const [score, setScore] = useState(1000)
  const [events, setEvents] = useState([])

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
      setOperationWarnings({})
    }
  }, [selectedTrainGroup, trains])

  const currentTutorialStep = TUTORIAL_STEPS[tutorialStep] ?? TUTORIAL_STEPS[0]
  const isLastTutorialStep = tutorialStep === TUTORIAL_STEPS.length - 1
  const currentPracticeTutorialStep = PRACTICE_TUTORIAL_STEPS[practiceTutorialStep] ?? PRACTICE_TUTORIAL_STEPS[0]
  const isPracticeTutorialComplete = practiceTutorialStep === PRACTICE_TUTORIAL_STEPS.length - 1
  const tokyoTerminalConflictModeLabel =
    tokyoTerminalConflictMode === 'strict' ? '熟練指令員モード' : '新入り指令員モード'
  const tokyoTerminalConflictModeShortLabel =
    tokyoTerminalConflictMode === 'strict' ? '熟練指令員' : '新入り指令員'

  const tokyoTerminalConflictMessage = (train, targetTrack) => {
    const terminalTrackName = tokyoTerminalTrackLabel(targetTrack?.id) ?? targetTrack?.name ?? '不明な番線'
    return `すでに列車がいる${terminalTrackName}に後続列車を入線させました。`
  }

  const applyDifficultyMode = (nextMode) => {
    if (running && typeof window !== 'undefined') {
      const shouldChangeMode = window.confirm(
        '難易度を変更すると、現在の運転整理はリセットされます。変更しますか？',
      )

      if (!shouldChangeMode) return
    }
    setDifficultyMenuOpen(false)
    setTokyoTerminalConflictMode(nextMode)
    setTrains(generateInitialTrains(nextMode))
    setWaitingTrains(generateWaitingTrains())
    tokyoTurnbacksSinceLastDeadhead = 0
    setSelectedTrainGroup(null)
    setWaitingListOpen(false)
    setUpRouteOpenSeconds(0)
    setRunning(false)
    setGameOver(false)
    setGameClear(false)
    setGameOverReason('列車事故発生。防護無線を発報しました。全列車の運転を停止します。')
    setGameOverAdvice('次回は列車同士の間隔と進路の重複に注意しながら、早めに抑止や進路変更を行いましょう。')
    setTime(15 * 3600 + 23 * 60)
    setPointsLocked(false)
    setScore(1000)
    setOperationWarnings({})
    setPracticeTutorialOpen(false)
    setPracticeTutorialPromptOpen(false)
    setPracticeTutorialStep(0)
    setPracticeTutorialTrainId(null)
    setMessage(
      nextMode === 'strict'
        ? '熟練指令員モードに切り替えました。整理する列車の本数が増加しました。'
        : '新入り指令員モードに切り替えました。',
    )
    setEvents([])
  }

  const closeTutorial = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('tutorialSeen', 'true')
    }
    setTutorialOpen(false)
    setTutorialStep(0)
  }

  // --- Practice Tutorial Functions ---
  const finishTextTutorial = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('tutorialSeen', 'true')
    }
    setTutorialOpen(false)
    setTutorialStep(0)
    setPracticeTutorialPromptOpen(true)
  }

  // --- Practice Tutorial Target Helper Section ---
  function practiceTutorialTargetScore(train) {
    if (!train) return -Infinity
    // Prefer up trains at Omiya, not held, not dwell/turnback, highest delay
    if (
      train.direction === 'up' &&
      train.x === 75 &&
      train.track === 'up-main' &&
      !train.held &&
      !train.autoHeld &&
      (train.dwellRemaining ?? 0) <= 0 &&
      (train.turnbackRemaining ?? 0) <= 0
    ) {
      return 10000 + (train.delay ?? 0)
    }
    // Up trains at Omiya, not held
    if (
      train.direction === 'up' &&
      train.x === 75 &&
      train.track === 'up-main' &&
      !train.held &&
      !train.autoHeld
    ) {
      return 6000 + (train.delay ?? 0)
    }
    // Up trains at Omiya
    if (train.direction === 'up' && train.x === 75 && train.track === 'up-main') {
      return 4000 + (train.delay ?? 0)
    }
    // Up trains not held, not dwell/turnback
    if (
      train.direction === 'up' &&
      !train.held &&
      !train.autoHeld &&
      (train.dwellRemaining ?? 0) <= 0 &&
      (train.turnbackRemaining ?? 0) <= 0
    ) {
      return 2000 + (train.delay ?? 0)
    }
    // Any up train
    if (train.direction === 'up') {
      return 1000 + (train.delay ?? 0)
    }
    // Otherwise, deprioritize
    return -Infinity
  }

  function findPracticeTutorialTargetTrain(trains) {
    return trains
      .filter((train) => practiceTutorialTargetScore(train) > -Infinity)
      .sort((a, b) => practiceTutorialTargetScore(b) - practiceTutorialTargetScore(a))[0] ?? null
  }

  function makePracticeTutorialReadyTrain(train) {
    if (!train) return null

    return {
      ...train,
      direction: 'up',
      dir: 'left',
      track: 'up-main',
      x: 75,
      held: false,
      autoHeld: false,
      holdSeconds: 0,
      dwellRemaining: null,
      turnbackRemaining: null,
      awaitingTokyoDownTransfer: false,
      stoppedStations: Array.from(new Set([...(train.stoppedStations ?? []), 'omiya'])),
      omiyaDepartureSeconds: null,
      earlyAdmissionTriggeredByOmiyaDeparture: false,
    }
  }

  const startPracticeTutorial = () => {
    const existingTargetTrain = findPracticeTutorialTargetTrain(trains)
    const fallbackTrain = trains
      .filter((train) => (train.dwellRemaining ?? 0) <= 0 && (train.turnbackRemaining ?? 0) <= 0)
      .sort((a, b) => (b.delay ?? 0) - (a.delay ?? 0))[0] ?? trains[0]
    const targetTrain = existingTargetTrain ?? makePracticeTutorialReadyTrain(fallbackTrain)

    if (targetTrain) {
      setTrains((prev) =>
        prev.map((train) => (train.id === targetTrain.id ? targetTrain : train)),
      )
    }

    setPracticeTutorialTrainId(targetTrain?.id ?? null)
    setPracticeTutorialStep(0)
    setPracticeTutorialPromptOpen(false)
    setPracticeTutorialOpen(true)
    setMessage('操作チュートリアルを開始します。まずは遅れている列車を選択しましょう。')
  }

  const skipPracticeTutorial = () => {
    setPracticeTutorialPromptOpen(false)
    setPracticeTutorialOpen(false)
    setPracticeTutorialStep(0)
    setPracticeTutorialTrainId(null)
  }

  const completePracticeTutorial = () => {
    setPracticeTutorialOpen(false)
    setPracticeTutorialStep(0)
    setPracticeTutorialTrainId(null)
    setMessage('操作チュートリアルが完了しました。左上の「▶ 運転開始」を押して、運転整理を始めましょう。')
  }

  const openTutorial = () => {
    setTutorialStep(0)
    setTutorialOpen(true)
  }

  const closeTrainOperationPanel = () => {
    setSelectedTrainGroup(null)
    setOperationWarnings({})
  }

  const formattedTime = `${String(Math.floor(time / 3600)).padStart(
    2,
    '0',
  )}:${String(Math.floor((time % 3600) / 60)).padStart(2, '0')}:${String(time % 60).padStart(2, '0')}`

  useEffect(() => {
    if (!running || gameOver || gameClear) return undefined

    const intervalId = window.setInterval(() => {
      setTime((v) => v + 1)

      setTrains((prev) => {
        let next = prev
          .map((train) => nextTrainState(train, prev))
          .filter(Boolean)
          .map((train) => updateOmiyaDepartureTimer(train))

        const earlyAdmissionTriggered = hasOmiyaDepartureEarlyAdmissionTrigger(next)

        setUpRouteOpenSeconds(0)

        const updatedWaitingTrains = waitingTrains.map((waitingTrain) => {
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
              .find(({ waitingTrain }) => canEarlyAdmitWaitingTrain(waitingTrain, next))?.index ?? -1
          : updatedWaitingTrains.findIndex((waitingTrain) =>
              canAdmitWaitingTrain(waitingTrain, next),
            )

        let remainingWaitingTrains = updatedWaitingTrains
        let admittedEventText = null

        if (admitIndex !== -1) {
          const earlyAdmissionTrack = earlyAdmissionTriggered
            ? availableUpAdmissionTrackShortName(next)
            : null
          const admittedWaitingTrain = {
            ...updatedWaitingTrains[admitIndex],
            targetTrack: earlyAdmissionTrack ?? updatedWaitingTrains[admitIndex].targetTrack,
            etaSeconds: 0,
            status: '入線待ち',
            eta: '入線可能',
          }
          const admittedTrain = activeTrainFromWaitingTrain(admittedWaitingTrain)
          next = markOmiyaDepartureEarlyAdmissionUsed(next)
          next = earlyAdmissionTriggered
            ? next.map((train) => reduceDelayForEarlyAdmission(train))
            : next

          const alreadyAdmitted = next.some((train) => train.id === admittedTrain.id)
          if (!alreadyAdmitted) {
            next = [...next, admittedTrain]
            admittedEventText = earlyAdmissionTriggered
              ? `${formattedTime} ${admittedWaitingTrain.name}: 上り進路開通により先行入線`
              : `${formattedTime} ${admittedWaitingTrain.name}: 大宮方面から入線`
          }

          remainingWaitingTrains = updatedWaitingTrains.filter((_, index) => index !== admitIndex)
        }

        while (remainingWaitingTrains.length < WAITING_TRAIN_COUNT) {
          remainingWaitingTrains = [
            ...remainingWaitingTrains,
            generateAdditionalWaitingTrain(remainingWaitingTrains),
          ]
        }

        setWaitingTrains(remainingWaitingTrains)
        if (admittedEventText) {
          addEvent(admittedEventText)
        }

        const nextRisk = riskLevel(next)
        const nextTotalDelay = next.reduce((sum, t) => sum + t.delay, 0)
        const heldTrains = next.filter((train) => train.held || train.autoHeld)
        const hasLongHeldTrain = heldTrains.some(
          (train) => (train.holdSeconds ?? 0) >= LONG_HOLD_RISK_SECONDS,
        )
        const hasManyHeldTrains = heldTrains.length >= HOLD_RISK_TRAIN_COUNT

        if (nextRisk >= 13) {
          const accidentReason = '既に列車がいる線路に転線したため、列車事故が発生しました。'
          setRunning(false)
          setGameOver(true)
          setGameOverReason(accidentReason)
          setGameOverAdvice('次回は列車同士の間隔が詰まりすぎる前に、抑止や転線で進路を分散させましょう。')
          setScore(0)
          setMessage(
            `列車事故発生。${accidentReason}防護無線発報中。全列車の運転を停止します。`,
          )
          addEvent(`${formattedTime} 列車事故発生: 安全リスク13到達`)
        } else if (nextTotalDelay <= 0) {
          setRunning(false)
          setGameClear(true)
          setMessage('表示中の全列車の遅延が回復しました。運転整理完了です。お疲れ様でした。')
          addEvent(`${formattedTime} 運転整理完了: 表示中の全列車の遅延が回復`)
        } else if (nextRisk >= 10) {
          setScore((s) => Math.max(0, s - 18))
          setMessage(
            hasLongHeldTrain
              ? '危険警告。1分以上抑止されている列車があります。運転再開または進路整理を検討してください。'
              : hasManyHeldTrains
                ? '危険警告。抑止中の列車が増えています。運転再開または進路整理を検討してください。'
                : '危険警告。安全リスクが10以上です。閉塞間隔が非常に詰まっています。直ちに抑止または転線を行ってください。',
          )
        } else if (nextRisk >= 3) {
          setScore((s) => Math.max(0, s - 8))
          setMessage(
            hasLongHeldTrain
              ? '注意。1分以上抑止されている列車があります。抑止解除や進路変更を検討してください。'
              : hasManyHeldTrains
                ? '注意。抑止中の列車が増えています。列車を待たせすぎないよう進路を整理してください。'
                : '接近警報。閉塞間隔が詰まっています。抑止か待避線への転線を検討してください。',
          )
        } else {
          setScore((s) => Math.max(0, s - Math.ceil(nextTotalDelay / 20)))
        }

        return next
      })
    }, 1000)

    return () => window.clearInterval(intervalId)
  }, [running, gameOver, gameClear, formattedTime, upRouteOpenSeconds, waitingTrains])


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

    // --- Practice Tutorial Step Logic ---
    if (practiceTutorialOpen && practiceTutorialTrainId === id) {
      if (practiceTutorialStep === 1 && willHold) {
        setPracticeTutorialStep(2)
      } else if (practiceTutorialStep === 2 && !willHold) {
        setPracticeTutorialStep(3)
      }
    }

    setTrains((prev) =>
      prev.map((t) => (t.id === id ? { ...t, held: willHold } : t)),
    )

    if (willHold) {
      setMessage(
        `${id}を抑止しました。`,
      )
      addEvent(`${formattedTime} ${id}: 抑止`)
    } else {
      setMessage(`${id}の抑止を解除しました。列車が出発します。`)
      addEvent(`${formattedTime} ${id}: 抑止解除`)
    }
  }

    const changeTrack = (id, track) => {
    const targetTrain = trains.find((t) => t.id === id)
    const targetTrack = ROUTE_TRACKS.find((t) => t.id === track)
    const trackName = targetTrack?.name ?? '不明な線路'
    if (pointsLocked) {
      const warning = 'ポイント操作中です。転換完了までお待ちください。'
      setMessage(warning)
      if (targetTrain) setOperationWarning(id, warning)
      return
    }

    const hasTokyoTerminalConflict =
      targetTrainCanUseTokyoTerminalCheck(targetTrain, targetTrack) &&
      isTokyoTerminalTrackOccupied(targetTrack.id, targetTrain.x, trains, targetTrain.id)

    if (hasTokyoTerminalConflict && tokyoTerminalConflictMode === 'strict') {
      const accidentReason = tokyoTerminalConflictMessage(targetTrain, targetTrack)
      setRunning(false)
      setGameOver(true)
      setGameOverReason(accidentReason)
      setGameOverAdvice('次回は東京駅構内で在線中の番線を確認し、空いている番線へ進路を構成しましょう。')
      setScore(0)
      setMessage(`列車事故発生。${accidentReason}防護無線発報中。全列車の運転を停止します。`)
      setOperationWarning(id, `重大インシデント: ${accidentReason}`)
      addEvent(`${formattedTime} 列車事故発生: ${accidentReason}`)
      return
    }

    const switchConflictTrain = switchConflictTrainOnTargetTrack(targetTrain, targetTrack, trains, targetTrain?.id)
    if (switchConflictTrain && tokyoTerminalConflictMode === 'strict') {
      const accidentReason = switchConflictMessage(switchConflictTrain, targetTrack)
      setRunning(false)
      setGameOver(true)
      setGameOverReason(accidentReason)
      setGameOverAdvice('次回は転線先の列車が分岐器を完全に通過したことを確認してから、後続列車の進路を構成しましょう。')
      setScore(0)
      setMessage(`列車事故発生。${accidentReason}防護無線発報中。全列車の運転を停止します。`)
      setOperationWarning(id, `重大インシデント: ${accidentReason}`)
      addEvent(`${formattedTime} 列車事故発生: ${accidentReason}`)
      return
    }

    const unavailableReason = trackOperationUnavailableReason(targetTrain, targetTrack, trains, tokyoTerminalConflictMode)
    if (unavailableReason) {
      const warning = `${id}: ${trackName}を選択できません。${unavailableReason}`
      setMessage(warning)
      setOperationWarning(id, warning)
      addEvent(`${formattedTime} ${id}: 進路ボタン選択不可`)
      return
    }

    setPointsLocked(true)
    setMessage(
      `${id}の進路を${trackName}へ構成中。`,
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
              speed: willPrioritize
                ? Number(Math.min(t.speed + 0.03, 0.62).toFixed(2))
                : Number(Math.max(t.speed - 0.03, 0.3).toFixed(2)),
            }
          : t,
      ),
    )

    if (willPrioritize) {
      setScore((s) => Math.max(0, s - 15))
      setMessage(
        `${id}に優先通過を設定しました。`,
      )
      addEvent(`${formattedTime} ${id}: 優先通過設定`)
    } else {
      setMessage(`${id}の優先通過を解除しました。`)
      addEvent(`${formattedTime} ${id}: 優先通過解除`)
    }
  }

  const resetGame = () => {
    setTrains(generateInitialTrains(tokyoTerminalConflictMode))
    setWaitingTrains(generateWaitingTrains())
    tokyoTurnbacksSinceLastDeadhead = 0
    setSelectedTrainGroup(null)
    setWaitingListOpen(false)
    setUpRouteOpenSeconds(0)
    setRunning(false)
    setGameOver(false)
    setGameClear(false)
    setGameOverReason('列車事故発生。防護無線を発報しました。全列車の運転を停止します。')
    setGameOverAdvice('次回は列車同士の間隔と進路の重複に注意しながら、早めに抑止や進路変更を行いましょう。')
    setTime(15 * 3600 + 23 * 60)
    setPointsLocked(false)
    setScore(1000)
    setMessage(
      'リセットしました。',
    )
    setEvents([])
  }

  const grade =
    score > 760 && totalDelay < 5
      ? 'S'
      : score > 620
        ? 'A'
        : score > 420
          ? 'B'
          : score > 220
            ? 'C'
            : 'D'

  const clearEvaluationComments = [
    totalDelay <= 0
      ? '表示中の全列車の遅延を回復できました。'
      : `残り遅延は${totalDelay.toFixed(1)}分でした。`,
    risk <= 2
      ? '安全リスクを低く抑えたまま運転整理できました。'
      : risk <= 6
        ? '安全リスクを大きく悪化させずに整理できました。'
        : '安全リスクが高めだったため、抑止や進路整理のタイミングに改善の余地があります。',
    score >= 760
      ? '優先や抑止に頼りすぎず、効率よく列車を流せました。'
      : score >= 420
        ? '必要な操作を行いながら、一定のスコアを維持できました。'
        : '操作による減点が大きかったため、次回は安全を保ちつつ操作回数を絞ると評価が上がります。',
  ]

  return (
  <main className="game">
    {tutorialOpen && (
  <div className="tutorial-overlay" role="dialog" aria-label="チュートリアル">
    <div className="tutorial-card">
      <div className="tutorial-head">
        <span>STEP {tutorialStep + 1} / {TUTORIAL_STEPS.length}</span>
        <button type="button" aria-label="チュートリアルを閉じる" onClick={closeTutorial}>×</button>
      </div>

      <div className="tutorial-body">
        <strong>{currentTutorialStep.title}</strong>
        <p>{currentTutorialStep.body}</p>
      </div>

      <div className="tutorial-progress" aria-hidden="true">
        {TUTORIAL_STEPS.map((step, index) => (
          <span className={index === tutorialStep ? 'active' : ''} key={step.title} />
        ))}
      </div>

      <div className="tutorial-actions">
        <button
          type="button"
          className="secondary-button"
          onClick={() => setTutorialStep((step) => Math.max(0, step - 1))}
          disabled={tutorialStep === 0}
        >
          戻る
        </button>
        <button type="button" className="secondary-button" onClick={closeTutorial}>
          スキップ
        </button>
        <button
          type="button"
          className="primary-button"
          onClick={() => {
            if (isLastTutorialStep) {
              finishTextTutorial()
              return
            }
            setTutorialStep((step) => Math.min(TUTORIAL_STEPS.length - 1, step + 1))
          }}
        >
          {isLastTutorialStep ? 'はじめる' : '次へ'}
        </button>
      </div>
    </div>
  </div>
)}

    {practiceTutorialPromptOpen && (
      <div className="tutorial-overlay" role="dialog" aria-label="操作チュートリアルの確認">
        <div className="tutorial-card practice-tutorial-prompt-card">
          <div className="tutorial-body">
            <strong>操作チュートリアルをプレイしますか？</strong>
            <p>実際に列車を操作しながら練習できます。</p>
          </div>

          <div className="tutorial-actions practice-tutorial-prompt-actions">
            <button type="button" className="secondary-button" onClick={skipPracticeTutorial}>
              いいえ
            </button>
            <button type="button" className="primary-button" onClick={startPracticeTutorial}>
              はい
            </button>
          </div>
        </div>
      </div>
    )}

    {practiceTutorialOpen && (practiceTutorialStep === 0 || isPracticeTutorialComplete) && (
      <div
        className={`practice-tutorial-guide practice-tutorial-guide-step-${practiceTutorialStep}`}
        role="status"
        aria-live="polite"
      >
        <span>操作チュートリアル STEP {practiceTutorialStep + 1} / {PRACTICE_TUTORIAL_STEPS.length}</span>
        <strong>{currentPracticeTutorialStep.title}</strong>
        <p>{currentPracticeTutorialStep.body}</p>
        <div className="practice-tutorial-actions">
          {isPracticeTutorialComplete ? (
            <button type="button" className="primary-button" onClick={completePracticeTutorial}>
              本番へ進む
            </button>
          ) : (
            <button type="button" className="secondary-button" onClick={skipPracticeTutorial}>
              チュートリアルを終了
            </button>
          )}
        </div>
      </div>
    )}

    {gameOver && (
      <div className="game-over-overlay" role="alert">
        <div className="game-over-card">
          <h2>列車事故発生</h2>
          <p>
            {gameOverReason}
          </p>
          <div className="game-over-advice">
            <strong>次回のポイント</strong>
            <p>{gameOverAdvice}</p>
          </div>
          <button className="secondary-button" onClick={resetGame}>
            ↻ リセットして再開
          </button>
        </div>
      </div>
    )}
    {gameClear && (
      <div className="game-over-overlay game-clear-overlay" role="alert">
        <div className="game-over-card game-clear-card">
          <h2>運転整理完了</h2>
          <p>
            表示中の全列車の遅延が回復しました。東京〜大宮間の運行は平常状態へ戻りました。
          </p>
          <div className="clear-summary">
            <div className="clear-result">
              <span>最終評価</span>
              <strong>{grade}</strong>
            </div>
            <div className="clear-result clear-result-small">
              <span>整理完了時刻</span>
              <strong>{formattedTime}</strong>
            </div>
            <div className="clear-result clear-result-small">
              <span>最終スコア</span>
              <strong>{score}</strong>
            </div>
            <div className="clear-result clear-result-small">
              <span>安全リスク</span>
              <strong>{risk}/13</strong>
            </div>
          </div>
          <div className="clear-evaluation-comments">
            <strong>評価ポイント</strong>
            <ul>
              {clearEvaluationComments.map((comment) => (
                <li key={comment}>{comment}</li>
              ))}
            </ul>
          </div>
          <button className="secondary-button" onClick={resetGame}>
            ↻ もう一度プレイ
          </button>
        </div>
      </div>
    )}
      <header className="game-header">
        <div>
          <p className="version">JRE Shinkansen Dispatch Simulator v4.0.0</p>
          <h1>
  <span className="title-main">JR東日本 新幹線</span>
  <span className="title-sub">遅延回復シミュレーター</span>
</h1>
          <p className="lead">
            輸送指令として各列車の運転士たちに指示を送り、遅延回復を目指しましょう。
      
          </p>
        </div>

  <div className="header-tutorial-actions">
    <button className="tutorial-open-button" type="button" onClick={openTutorial}>
      遊び方
    </button>
    <button className="practice-tutorial-open-button" type="button" onClick={startPracticeTutorial}>
      操作を練習（指令訓練）
    </button>
    <button
      className="difficulty-toggle-button"
      type="button"
      onClick={() => setDifficultyMenuOpen(true)}
    >
      <span className="difficulty-toggle-main">難易度変更</span>
    </button>
  </div>
      </header>

      {difficultyMenuOpen && (
        <div className="tutorial-overlay" role="dialog" aria-label="難易度変更">
          <div className="tutorial-card difficulty-menu-card">
            <div className="tutorial-head">
              <span>難易度変更</span>
              <button
                type="button"
                aria-label="難易度変更を閉じる"
                onClick={() => setDifficultyMenuOpen(false)}
              >
                ×
              </button>
            </div>

            <div className="tutorial-body difficulty-menu-body">
              <strong>プレイするモードを選択してください</strong>
              <p>現在のモード: {tokyoTerminalConflictModeLabel}</p>
            </div>

            <div className="difficulty-mode-actions">
              <button
                type="button"
                className={tokyoTerminalConflictMode === 'prevent' ? 'difficulty-mode-button active' : 'difficulty-mode-button'}
                onClick={() => applyDifficultyMode('prevent')}
              >
                <strong>新入り指令員モード</strong>
                <span>列車本数が少なくなり、落ち着いて操作できます。</span>
              </button>
              <button
                type="button"
                className={tokyoTerminalConflictMode === 'strict' ? 'difficulty-mode-button active' : 'difficulty-mode-button'}
                onClick={() => applyDifficultyMode('strict')}
              >
                <strong>熟練指令員モード</strong>
                <span>列車本数が増加し、操作精度が求められます。</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="stats">
        <div className="stat-card">
          <span>モード</span>
          <strong>{tokyoTerminalConflictModeShortLabel}</strong>
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
  <button className="primary-button" onClick={() => !gameOver && !gameClear && setRunning((v) => !v)} disabled={gameOver || gameClear}>
  {gameOver ? '運転停止中' : gameClear ? '整理完了' : running ? '⏸ 一時停止' : '▶ 運転開始'}
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
                {UPPER_STATION_AREA_SWITCH_MARKERS.map((x) => (
                  <div
                    className="station-switch-marker"
                    key={`station-switch-marker-${x}`}
                    aria-hidden="true"
                    style={{ left: `${x}%` }}
                  />
                ))}

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
                <div
                  className="track-row"
                  style={{ top: track.y }}
                  key={track.id}
                >
                  <div className="track-line" />
                </div>
              ))}

              {TRACKS.map((track) => (
                <div
                  className="track-terminal-end tokyo-terminal-end"
                  key={`${track.id}-tokyo-terminal-end`}
                  aria-hidden="true"
                  style={{ top: track.y }}
                />
              ))}

              {TRACKS.map((track, index) => (
                <span
                  className="tokyo-terminal-track-number"
                  key={`${track.id}-tokyo-terminal-number`}
                  aria-hidden="true"
                  style={{ top: track.y }}
                >
                  {20 + index}
                </span>
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
                </div>
              ))}

              {[...TRACKS, ...OMIYA_EXTRA_TRACKS].map((track) => (
                <span
                  className={`track-name-label track-label-${track.labelPosition}`}
                  key={`${track.id}-label`}
                  style={{
                    top: track.labelY,
                    left: `${track.labelX}%`,
                  }}
                >
                  {track.name}
                </span>
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
  // const stationName = stationAt(train.x)
  const trackY = routeTrackById(train.track)?.y ?? 0
  const popupHorizontalClass = train.x > 72 ? 'popup-left' : train.x < 24 ? 'popup-right' : 'popup-center'
  const popupVerticalClass = trackY > 230 ? 'popup-above' : 'popup-below'

  return (
    <button
      type="button"
      className={`train-wrap ${popupHorizontalClass} ${popupVerticalClass} ${practiceTutorialOpen && practiceTutorialStep === 0 && (!practiceTutorialTrainId || practiceTutorialTrainId === train.id) ? 'practice-target' : ''}`.trim()}
      key={train.id}
      style={{
        left: `${train.x}%`,
        top: trackY - 23,
      }}
      onClick={() => {
        setSelectedTrainGroup({
          title: '列車詳細',
          trainIds: [train.id],
        })

        if (practiceTutorialOpen && practiceTutorialStep === 0) {
          setPracticeTutorialTrainId(train.id)
          setPracticeTutorialStep(1)
        }
      }}
    >
      <div className={`train ${train.colorClass}`}>
        <div className="train-top compact">
          <strong>
            {displayTrainName(train)} / +{train.delay.toFixed(1)}分 / {trainStatusLabel(train)}
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

      {/* {stationName && <p className="near-station">{stationName}付近</p>} */}
    </button>
  )
})}

              <div className="lower-station-switch-markers" aria-hidden="true">
                {LOWER_STATION_AREA_SWITCH_MARKERS.map((x) => (
                  <div
                    className="lower-station-switch-marker"
                    key={`lower-station-switch-marker-${x}`}
                    style={{ left: `${x}%` }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="message">
            <span>⚠</span>
            <p>{message}</p>
          </div>
        </div>

        <div className="waiting-board">
          <div className="waiting-scroll">
            <div className="waiting-panel">
              <div className="waiting-panel-head">
                <strong>後続列車</strong>
              </div>
              <div className="waiting-trains waiting-trains-launcher">
                <button
                  type="button"
                  className="waiting-list-open-button"
                  onClick={() => setWaitingListOpen(true)}
                >
                  <strong>後続列車一覧を開く</strong>
                  <span>{waitingTrains.length}本が大宮方面から接近中</span>
                  <p>タップ/クリックして到着予定・入線先を確認</p>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="log-panel">
        <h2>運転整理ログ</h2>
        <div className="logs">
          {events.length === 0 ? (
            <p className="log-placeholder">操作を行うと、ここに記録されます。</p>
          ) : (
            events.map((event, index) => (
              <p key={`${event}-${index}`}>{event}</p>
            ))
          )}
        </div>
      </section>

      <p className="help">
  遊び方: 全列車は東京・上野・大宮で30秒停車します。停車時間をうまく計算しながら列車に指示を出しましょう。
  停車後、前方が詰まっていなければ自動で発車し、前方が詰まっている場合は自動で抑止されます。
  大宮駅の上り本線1・上り本線2・大宮上り副本線にいた列車が大宮駅を発車して35秒経過すると、後続列車が上り本線1または上り本線2へ先行入線します。抑止中の列車が増えたり、1分以上抑止される列車が出たりすると安全リスクが上がります。評価は、遅延回復までの速さ・安全リスクの低さ・優先使用の少なさによって変動します。適切な進路を構成しながら遅延回復を目指してください。
</p>

      {waitingListOpen && (
        <div className="waiting-train-modal" role="dialog" aria-label="後続列車一覧">
          <div className="waiting-train-modal-card waiting-train-list-modal-card">
            <div className="waiting-train-modal-head">
              <div>
                <strong>後続列車一覧</strong>
                <span>大宮方面から上り本線へ入線する列車です</span>
              </div>
              <button
                type="button"
                aria-label="閉じる"
                onClick={() => setWaitingListOpen(false)}
              >
                ×
              </button>
            </div>

            <div className="waiting-train-modal-list">
              {waitingTrains.map((train) => (
                <div
                  className="waiting-train-modal-item"
                  key={train.id}
                >
                  <strong>{waitingTrainNameBadge(train.name)}</strong>
                  <span>{train.direction === 'up' ? '上り' : '下り'} / {train.targetTrack}</span>
                  <p>{train.status}・{waitingTrainEtaLabel(train)} / 想定遅延 +{(train.delay ?? 0).toFixed(1)}分</p>
                </div>
              ))}
            </div>


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
                onClick={closeTrainOperationPanel}
              >
                ×
              </button>
            </div>

            {practiceTutorialOpen && practiceTutorialStep > 0 && !isPracticeTutorialComplete && (
              <div
                className={`practice-tutorial-guide practice-tutorial-guide-in-panel practice-tutorial-guide-step-${practiceTutorialStep}`}
                role="status"
                aria-live="polite"
              >
                <span>操作チュートリアル STEP {practiceTutorialStep + 1} / {PRACTICE_TUTORIAL_STEPS.length}</span>
                <strong>{currentPracticeTutorialStep.title}</strong>
                <p>{currentPracticeTutorialStep.body}</p>
                <div className="practice-tutorial-actions">
                  <button type="button" className="secondary-button" onClick={skipPracticeTutorial}>
                    チュートリアルを終了
                  </button>
                </div>
              </div>
            )}

            <div className="pc-train-operation-list">
              {selectedTrainGroupDetails.trains.map((train) => (
                <section className="pc-train-operation-item" key={train.id}>
                  <div className="pc-operation-train-head">
                    <strong>{coloredTrainName(train)}</strong>
                    {(train.held || train.autoHeld) && <b className="control-hold-mark">× 抑止</b>}
                    <span>{trainDirectionLabel(train)} / +{train.delay.toFixed(1)}分 / {trainStatusLabel(train)}</span>
                    {(train.held || train.autoHeld) && (
                      <p className="compact-info hold-time-info">抑止時間: {holdTimeLabel(train)}</p>
                    )}
                    <p className="compact-info">現在進路: {operationTrackLabel(train)}</p>
                    {operationWarnings[train.id] && (
                      <p className="operation-warning">⚠ {operationWarnings[train.id]}</p>
                    )}
                  </div>

                  <div className="pc-operation-section">
                    <strong>進路を構成</strong>
                    <div className="pc-track-buttons">
                      {OPERATION_TRACK_GROUPS.map((group, groupIndex) => (
                        <div className="operation-track-column" key={`pc-track-group-${groupIndex}`}>
                          {group.map((trackId) => {
                            const track = routeTrackById(trackId)
                            if (!track) return null

                            const isSelectedTrack = train.track === track.id
                            const canOperateTrack = canOperateTrackButton(train, track, trains, tokyoTerminalConflictMode)
                            const unavailableReason = trackOperationUnavailableReason(train, track, trains, tokyoTerminalConflictMode)
                            const isStoppedForOperation = (train.dwellRemaining ?? 0) > 0 || (train.turnbackRemaining ?? 0) > 0
                            const shouldShowUnavailable = tokyoTerminalConflictMode === 'strict'
                              ? isStoppedForOperation
                              : !canOperateTrack
                            const buttonLabel = operationTrackButtonLabel(track, train)
                            const buttonTitle = unavailableReason
                              ? `${buttonLabel}: ${unavailableReason}`
                              : `${buttonLabel}: 進路を構成できます。`

                            return (
                              <button
                                type="button"
                                key={track.id}
                                className={`${isSelectedTrack ? 'selected' : ''} ${shouldShowUnavailable ? 'unavailable' : ''}`.trim()}
                                disabled={pointsLocked}
                                title={buttonTitle}
                                aria-label={buttonTitle}
                                onClick={() => changeTrack(train.id, track.id)}
                              >
                                {buttonLabel}
                              </button>
                            )
                          })}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pc-operation-actions">
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
    onClick={closeTrainOperationPanel}
  >
    ×
  </button>
</div>

      {practiceTutorialOpen && practiceTutorialStep > 0 && !isPracticeTutorialComplete && (
        <div
          className={`practice-tutorial-guide practice-tutorial-guide-in-panel practice-tutorial-guide-step-${practiceTutorialStep}`}
          role="status"
          aria-live="polite"
        >
          <span>操作チュートリアル STEP {practiceTutorialStep + 1} / {PRACTICE_TUTORIAL_STEPS.length}</span>
          <strong>{currentPracticeTutorialStep.title}</strong>
          <p>{currentPracticeTutorialStep.body}</p>
          <div className="practice-tutorial-actions">
            <button type="button" className="secondary-button" onClick={skipPracticeTutorial}>
              チュートリアルを終了
            </button>
          </div>
        </div>
      )}

      <ol className="mobile-train-group-list mobile-operation-list">
        {selectedTrainGroupDetails.trains.map((train) => (
          <li key={train.id}>
            <div className="mobile-operation-train-head">
              <strong>{coloredTrainName(train)}</strong>
              <span>{trainDirectionLabel(train)} / +{train.delay.toFixed(1)}分 / {trainStatusLabel(train)}</span>
              {(train.held || train.autoHeld) && (
                <p className="compact-info hold-time-info">抑止時間: {holdTimeLabel(train)}</p>
              )}
              <p className="compact-info">現在進路: {operationTrackLabel(train)}</p>
              {operationWarnings[train.id] && (
                <span className="mobile-operation-warning">⚠ {operationWarnings[train.id]}</span>
              )}
            </div>

            <div className="mobile-operation-section">
              <strong>進路を構成</strong>
              <div className="mobile-track-buttons">
                {MOBILE_OPERATION_TRACK_GROUPS.map((group, groupIndex) => (
                  <div className="operation-track-column" key={`mobile-track-group-${groupIndex}`}>
                    {group.map((trackId) => {
                      const track = routeTrackById(trackId)
                      if (!track) return null

                      const isSelectedTrack = train.track === track.id
                      const canOperateTrack = canOperateTrackButton(train, track, trains, tokyoTerminalConflictMode)
                      const unavailableReason = trackOperationUnavailableReason(train, track, trains, tokyoTerminalConflictMode)
                      const isStoppedForOperation = (train.dwellRemaining ?? 0) > 0 || (train.turnbackRemaining ?? 0) > 0
                      const shouldShowUnavailable = tokyoTerminalConflictMode === 'strict'
                        ? isStoppedForOperation
                        : !canOperateTrack
                      const buttonLabel = operationTrackButtonLabel(track, train)
                      const buttonTitle = unavailableReason
                        ? `${buttonLabel}: ${unavailableReason}`
                        : `${buttonLabel}: 進路を構成できます。`

                      return (
                        <button
                          type="button"
                          key={track.id}
                          className={`${isSelectedTrack ? 'selected' : ''} ${shouldShowUnavailable ? 'unavailable' : ''}`.trim()}
                          disabled={pointsLocked}
                          title={buttonTitle}
                          aria-label={buttonTitle}
                          onClick={() => changeTrack(train.id, track.id)}
                        >
                          {buttonLabel}
                        </button>
                      )
                    })}
                  </div>
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
