import { useEffect, useMemo, useRef, useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { supabase } from './supabase'
import './App.css'

import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  sortableKeyboardCoordinates,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const STORAGE_BUCKET = 'clothes'
const LS_KEY = 'kisekae-app-save'
const DEFAULT_NICKNAME = 'ふれろっぷ'
const MAX_ACCESSORIES = 5

const assetUrl = (path) => `${import.meta.env.BASE_URL}${String(path).replace(/^\/+/, '')}`

const DEFAULT_BASE_CREATOR = 'はむまよろーる様'
const DEFAULT_BASE_CREATOR_URL = 'https://x.com/hamumayo_roll'

const DEFAULT_BASE_ITEMS = [
  {
    id: 'default-base-1',
    name: 'いつもの素体',
    category: 'base',
    imageUrl: assetUrl('images/base/body-default.png'),
    source: 'default',
    creatorName: DEFAULT_BASE_CREATOR,
    creatorUrl: DEFAULT_BASE_CREATOR_URL,
    qrShareable: false,
  },
]

const HOME_VOICE_URLS = [
  assetUrl('voices/home-1.mp3'),
  assetUrl('voices/home-2.mp3'),
  assetUrl('voices/home-3.mp3'),
]

const SPECIAL_VOICE_RULES = [
  {
    id: 'special-default-look',
    upperId: 'default-upper-1',
    lowerId: null,
    accessoryIds: ['default-accessory-2', 'default-accessory-1'],
    voiceUrl: assetUrl('voices/いつものふく.mp3'),
  },
  {
    id: 'special-detective',
    upperId: 'default-upper-3',
    lowerId: 'default-lower-2',
    accessoryIds: ['default-accessory-2'],
    voiceUrl: assetUrl('voices/執事ボイス.mp3'),
  },
  {
    id: 'special-pajama',
    upperId: 'default-upper-2',
    lowerId: 'default-lower-1',
    accessoryIds: ['default-accessory-11', 'default-accessory-12'],
    voiceUrl: assetUrl('voices/地雷ちゃん.mp3'),
  },
]

const DEFAULT_UPPER_ITEMS = [
  {
    id: 'default-upper-1',
    name: 'いつものふく',
    category: 'upper',
    imageUrl: assetUrl('images/tops/top-default-1.png'),
    source: 'default',
    creatorName: 'はむまよろーる様',
    creatorUrl: 'https://x.com/hamumayo_roll',
    qrShareable: false,
  },
  {
    id: 'default-upper-2',
    name: 'ピンクブラウス',
    category: 'upper',
    imageUrl: assetUrl('images/tops/top-default-2.png'),
    source: 'default',
    creatorName: 'はむまよろーる様',
    creatorUrl: 'https://x.com/hamumayo_roll',
    qrShareable: false,
  },
  {
    id: 'default-upper-3',
    name: '燕尾服上',
    category: 'upper',
    imageUrl: assetUrl('images/tops/top-default-3.png'),
    source: 'default',
    creatorName: 'はむまよろーる様',
    creatorUrl: 'https://x.com/hamumayo_roll',
    qrShareable: false,
  },
  {
    id: 'default-upper-4',
    name: 'ボーダートップス',
    category: 'upper',
    imageUrl: assetUrl('images/tops/top-default-4.png'),
    source: 'default',
    creatorName: 'ふれろっぷ',
    creatorUrl: 'https://x.com/hureroppu',
    qrShareable: false,
  },
  {
    id: 'default-upper-5',
    name: 'セーラー服',
    category: 'upper',
    imageUrl: assetUrl('images/tops/top-default-5.png'),
    source: 'default',
    creatorName: 'ふれろっぷ',
    creatorUrl: 'https://x.com/hureroppu',
    qrShareable: false,
  },
  {
    id: 'default-upper-6',
    name: 'パーカー緑',
    category: 'upper',
    imageUrl: assetUrl('images/tops/top-default-6.png'),
    source: 'default',
    creatorName: 'ふれろっぷ',
    creatorUrl: 'https://x.com/hureroppu',
    qrShareable: false,
  },
  {
    id: 'default-upper-7',
    name: '探偵服',
    category: 'upper',
    imageUrl: assetUrl('images/tops/top-default-7.png'),
    source: 'default',
    creatorName: 'ふれろっぷ',
    creatorUrl: 'https://x.com/hureroppu',
    qrShareable: false,
  },
  {
    id: 'default-upper-8',
    name: 'パジャマ上',
    category: 'upper',
    imageUrl: assetUrl('images/tops/top-default-8.png'),
    source: 'default',
    creatorName: 'ふれろっぷ',
    creatorUrl: 'https://x.com/hureroppu',
    qrShareable: false,
  },
]

const DEFAULT_LOWER_ITEMS = [
  {
    id: 'default-lower-1',
    name: 'ふりるスカート黒',
    category: 'lower',
    imageUrl: assetUrl('images/bottoms/bottom-default-1.png'),
    source: 'default',
    creatorName: 'はむまよろーる様',
    creatorUrl: 'https://x.com/hamumayo_roll',
    qrShareable: false,
  },
  {
    id: 'default-lower-2',
    name: '燕尾服下',
    category: 'lower',
    imageUrl: assetUrl('images/bottoms/bottom-default-2.png'),
    source: 'default',
    creatorName: 'はむまよろーる様',
    creatorUrl: 'https://x.com/hamumayo_roll',
    qrShareable: false,
  },
  {
    id: 'default-lower-4',
    name: 'サロペット',
    category: 'lower',
    imageUrl: assetUrl('images/bottoms/bottom-default-4.png'),
    source: 'default',
    creatorName: 'ふれろっぷ',
    creatorUrl: 'https://x.com/hureroppu',
    qrShareable: false,
  },
  {
    id: 'default-lower-5',
    name: 'セーラースカート',
    category: 'lower',
    imageUrl: assetUrl('images/bottoms/bottom-default-5.png'),
    source: 'default',
    creatorName: 'ふれろっぷ',
    creatorUrl: 'https://x.com/hureroppu',
    qrShareable: false,
  },
  {
    id: 'default-lower-6',
    name: 'サスペンダーズボン',
    category: 'lower',
    imageUrl: assetUrl('images/bottoms/bottom-default-6.png'),
    source: 'default',
    creatorName: 'ふれろっぷ',
    creatorUrl: 'https://x.com/hureroppu',
    qrShareable: false,
  },
  {
    id: 'default-lower-7',
    name: 'パジャマズボン',
    category: 'lower',
    imageUrl: assetUrl('images/bottoms/bottom-default-7.png'),
    source: 'default',
    creatorName: 'ふれろっぷ',
    creatorUrl: 'https://x.com/hureroppu',
    qrShareable: false,
  },
]

const DEFAULT_ACCESSORY_ITEMS = [
  {
    id: 'default-accessory-1',
    name: 'いつもの帽子',
    category: 'accessory',
    imageUrl: assetUrl('images/accessories/accessory-default-1.png'),
    source: 'default',
    creatorName: 'はむまよろーる様',
    creatorUrl: 'https://x.com/hamumayo_roll',
    qrShareable: false,
  },
  {
    id: 'default-accessory-2',
    name: 'モノクル',
    category: 'accessory',
    imageUrl: assetUrl('images/accessories/accessory-default-2.png'),
    source: 'default',
    creatorName: 'はむまよろーる様',
    creatorUrl: 'https://x.com/hamumayo_roll',
    qrShareable: false,
  },
  {
    id: 'default-accessory-3',
    name: 'リボン右',
    category: 'accessory',
    imageUrl: assetUrl('images/accessories/accessory-default-3.png'),
    source: 'default',
    creatorName: 'はむまよろーる様',
    creatorUrl: 'https://x.com/hamumayo_roll',
    qrShareable: false,
  },
  {
    id: 'default-accessory-4',
    name: 'リボン左',
    category: 'accessory',
    imageUrl: assetUrl('images/accessories/accessory-default-4.png'),
    source: 'default',
    creatorName: 'はむまよろーる様',
    creatorUrl: 'https://x.com/hamumayo_roll',
    qrShareable: false,
  },
  {
    id: 'default-accessory-11',
    name: 'リボン左右',
    category: 'accessory',
    imageUrl: assetUrl('images/accessories/accessory-default-11.png'),
    source: 'default',
    creatorName: 'はむまよろーる様',
    creatorUrl: 'https://x.com/hamumayo_roll',
    qrShareable: false,
  },
  {
    id: 'default-accessory-5',
    name: '編み上げリボン右',
    category: 'accessory',
    imageUrl: assetUrl('images/accessories/accessory-default-5.png'),
    source: 'default',
    creatorName: 'はむまよろーる様',
    creatorUrl: 'https://x.com/hamumayo_roll',
    qrShareable: false,
  },
  {
    id: 'default-accessory-6',
    name: '編み上げリボン左',
    category: 'accessory',
    imageUrl: assetUrl('images/accessories/accessory-default-6.png'),
    source: 'default',
    creatorName: 'はむまよろーる様',
    creatorUrl: 'https://x.com/hamumayo_roll',
    qrShareable: false,
  },
  {
    id: 'default-accessory-12',
    name: '編み上げリボン左右',
    category: 'accessory',
    imageUrl: assetUrl('images/accessories/accessory-default-12.png'),
    source: 'default',
    creatorName: 'はむまよろーる様',
    creatorUrl: 'https://x.com/hamumayo_roll',
    qrShareable: false,
  },
  {
    id: 'default-accessory-7',
    name: 'パーカー手',
    category: 'accessory',
    imageUrl: assetUrl('images/accessories/accessory-default-7.png'),
    source: 'default',
    creatorName: 'ふれろっぷ',
    creatorUrl: 'https://x.com/hureroppu',
    qrShareable: false,
  },
  {
    id: 'default-accessory-8',
    name: '悪魔の角と牙',
    category: 'accessory',
    imageUrl: assetUrl('images/accessories/accessory-default-8.png'),
    source: 'default',
    creatorName: 'ふれろっぷ',
    creatorUrl: 'https://x.com/hureroppu',
    qrShareable: false,
  },
  {
    id: 'default-accessory-9',
    name: '探偵帽子',
    category: 'accessory',
    imageUrl: assetUrl('images/accessories/accessory-default-9.png'),
    source: 'default',
    creatorName: 'ふれろっぷ',
    creatorUrl: 'https://x.com/hureroppu',
    qrShareable: false,
  },
  {
    id: 'default-accessory-10',
    name: '歯車のカバン',
    category: 'accessory',
    imageUrl: assetUrl('images/accessories/accessory-default-10.png'),
    source: 'default',
    creatorName: 'ふれろっぷ',
    creatorUrl: 'https://x.com/hureroppu',
    qrShareable: false,
  },
]

const DEFAULT_ITEMS = [
  ...DEFAULT_BASE_ITEMS,
  ...DEFAULT_UPPER_ITEMS,
  ...DEFAULT_LOWER_ITEMS,
  ...DEFAULT_ACCESSORY_ITEMS,
]

const DEFAULT_LAYER_ORDER = [
  'base',
  'lower',
  'upper',
  'accessory-1',
  'accessory-2',
  'accessory-3',
  'accessory-4',
  'accessory-5',
]

const DEFAULT_SAVE = {
  activeTab: 'home',
  closetTab: 'upper',
  settingsTab: 'profile',
  nickname: DEFAULT_NICKNAME,
  concept: '',
  customItems: [],
  equippedBaseId: 'default-base-1',
  equippedUpperId: 'default-upper-1',
  equippedLowerId: 'default-lower-1',
  equippedAccessoryIds: ['default-accessory-2', 'default-accessory-1'],
  favoriteUpperId: 'default-upper-1',
  favoriteLowerId: 'default-lower-1',
  favoriteAccessoryIds: ['default-accessory-2', 'default-accessory-1'],
  selectedQrItemId: null,
  equippedLayerOrder: DEFAULT_LAYER_ORDER,
}

function loadSaveData() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return DEFAULT_SAVE
    const parsed = JSON.parse(raw)

    return {
      ...DEFAULT_SAVE,
      ...parsed,
      customItems: Array.isArray(parsed?.customItems) ? parsed.customItems : [],
      equippedAccessoryIds: Array.isArray(parsed?.equippedAccessoryIds)
        ? parsed.equippedAccessoryIds
        : DEFAULT_SAVE.equippedAccessoryIds,
      favoriteAccessoryIds: Array.isArray(parsed?.favoriteAccessoryIds)
        ? parsed.favoriteAccessoryIds
        : DEFAULT_SAVE.favoriteAccessoryIds,
      equippedLayerOrder: Array.isArray(parsed?.equippedLayerOrder)
        ? parsed.equippedLayerOrder
        : DEFAULT_LAYER_ORDER,
    }
  } catch {
    return DEFAULT_SAVE
  }
}

function fileToSafePath(fileName) {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}-${fileName.replace(/[^\w.\-]/g, '_')}`
}

function normalizeImportedItem(item) {
  if (!item || typeof item !== 'object') return null
  if (!item.id || !item.name || !item.category || !item.imageUrl) return null
  if (!['upper', 'lower', 'accessory'].includes(item.category)) return null

  return {
    id: String(item.id),
    name: String(item.name),
    category: String(item.category),
    imageUrl: String(item.imageUrl),
    source: 'imported',
    creatorName: item.creatorName ? String(item.creatorName) : 'だれか',
    creatorUrl: item.creatorUrl ? String(item.creatorUrl) : '',
    qrShareable: false,
  }
}

function getRandomVoiceUrl() {
  if (!HOME_VOICE_URLS.length) return null
  const index = Math.floor(Math.random() * HOME_VOICE_URLS.length)
  return HOME_VOICE_URLS[index]
}

function normalizeIds(ids) {
  return [...(Array.isArray(ids) ? ids : [])].sort()
}

function findSpecialVoiceRule({ upperId, lowerId, accessoryIds }) {
  const currentAccessories = normalizeIds(accessoryIds)

  return (
    SPECIAL_VOICE_RULES.find((rule) => {
      const ruleAccessories = normalizeIds(rule.accessoryIds || [])
      return (
        (rule.upperId ?? null) === (upperId ?? null) &&
        (rule.lowerId ?? null) === (lowerId ?? null) &&
        JSON.stringify(ruleAccessories) === JSON.stringify(currentAccessories)
      )
    }) || null
  )
}

function roundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + width - radius, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
  ctx.lineTo(x + width, y + height - radius)
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  ctx.lineTo(x + radius, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
}

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 6) {
  const lines = []
  const paragraphs = String(text || '').split('\n')

  paragraphs.forEach((paragraph) => {
    if (!paragraph) {
      lines.push('')
      return
    }

    let current = ''
    for (const char of paragraph) {
      const test = current + char
      if (ctx.measureText(test).width > maxWidth && current) {
        lines.push(current)
        current = char
      } else {
        current = test
      }
    }
    if (current) lines.push(current)
  })

  lines.slice(0, maxLines).forEach((line, index) => {
    ctx.fillText(line, x, y + index * lineHeight)
  })
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`画像を読み込めなかったよ: ${src}`))
    img.src = src
  })
}

function downloadCanvas(canvas, fileName) {
  const link = document.createElement('a')
  link.download = fileName
  link.href = canvas.toDataURL('image/png')
  link.click()
}

async function drawAvatarCanvas({
  baseImageUrl,
  lowerImageUrl = '',
  upperImageUrl = '',
  accessoryImageUrls = [],
  size = 900,
}) {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')

  const grad = ctx.createLinearGradient(0, 0, 0, size)
  grad.addColorStop(0, '#dff1ff')
  grad.addColorStop(1, '#f3eefe')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, size, size)

  const urls = [baseImageUrl, lowerImageUrl, upperImageUrl, ...accessoryImageUrls].filter(Boolean)

  for (const url of urls) {
    const img = await loadImage(url)
    ctx.drawImage(img, 0, 0, size, size)
  }

  return canvas
}

async function createBaseOnlyCanvas({ baseImageUrl }) {
  return drawAvatarCanvas({
    baseImageUrl,
    lowerImageUrl: '',
    upperImageUrl: '',
    accessoryImageUrls: [],
    size: 1200,
  })
}

async function createHomeCanvas({
  nickname,
  concept,
  baseImageUrl,
  lowerImageUrl,
  upperImageUrl,
  accessoryImageUrls,
}) {
  const width = 1400
  const height = 1700
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)

  ctx.fillStyle = '#f7fbff'
  roundedRect(ctx, 60, 60, width - 120, height - 120, 42)
  ctx.fill()

  const avatarCanvas = await drawAvatarCanvas({
    baseImageUrl,
    lowerImageUrl,
    upperImageUrl,
    accessoryImageUrls,
    size: 860,
  })
  ctx.drawImage(avatarCanvas, 270, 110, 860, 860)

  ctx.fillStyle = '#ffffff'
  roundedRect(ctx, 450, 1010, 500, 90, 45)
  ctx.fill()

  ctx.fillStyle = '#5f6fc3'
  ctx.font = 'bold 42px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(nickname || DEFAULT_NICKNAME, 700, 1055)

  ctx.fillStyle = '#ffffff'
  roundedRect(ctx, 170, 1150, 1060, 360, 30)
  ctx.fill()

  ctx.fillStyle = '#6d7fd7'
  ctx.font = 'bold 34px sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  drawWrappedText(
    ctx,
    (concept && concept.trim()) || 'コンセプトはまだ未設定だよ',
    210,
    1195,
    980,
    54,
    5
  )

  return canvas
}

async function createQrCardCanvas({
  itemName,
  itemCategoryLabel,
  creatorName,
  nickname,
  baseImageUrl,
  qrItemUpperImageUrl = '',
  qrItemLowerImageUrl = '',
  qrItemAccessoryImageUrls = [],
  qrCanvas,
}) {
  const width = 1600
  const height = 1180
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)

  ctx.fillStyle = '#fbfdff'
  roundedRect(ctx, 40, 40, width - 80, height - 80, 40)
  ctx.fill()

  ctx.fillStyle = '#8fbfff'
  roundedRect(ctx, 90, 90, 190, 56, 28)
  ctx.fill()

  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 24px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('QR配布カード', 185, 118)

  ctx.fillStyle = '#5f6fc3'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.font = 'bold 54px sans-serif'
  ctx.fillText(itemName, 90, 185)

  ctx.fillStyle = '#98a7de'
  ctx.font = 'bold 28px sans-serif'
  ctx.fillText(`作った人：${creatorName}`, 90, 260)
  ctx.fillText(itemCategoryLabel, 90, 308)

  const avatarCanvas = await drawAvatarCanvas({
    baseImageUrl,
    lowerImageUrl: qrItemLowerImageUrl,
    upperImageUrl: qrItemUpperImageUrl,
    accessoryImageUrls: qrItemAccessoryImageUrls,
    size: 620,
  })
  ctx.drawImage(avatarCanvas, 120, 390, 620, 620)

  ctx.fillStyle = '#ffffff'
  roundedRect(ctx, 285, 1035, 290, 72, 36)
  ctx.fill()

  ctx.fillStyle = '#5f6fc3'
  ctx.font = 'bold 30px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(nickname || DEFAULT_NICKNAME, 430, 1071)

  ctx.fillStyle = '#ffffff'
  roundedRect(ctx, 980, 430, 420, 420, 30)
  ctx.fill()

  ctx.drawImage(qrCanvas, 1040, 490, 300, 300)

  ctx.fillStyle = '#98a7de'
  ctx.font = 'bold 24px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  ctx.fillText('読み込むとこの服を追加できるよ', 1190, 885)

  return canvas
}

function ensureLayerOrder(order) {
  const safe = Array.isArray(order) ? [...order] : []
  DEFAULT_LAYER_ORDER.forEach((key) => {
    if (!safe.includes(key)) safe.push(key)
  })
  return safe
}

function SortableLayerRow({ entry, index }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: entry.layerKey })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`layerRowDrag ${isDragging ? 'dragging' : ''}`}
    >
      <div className="layerRowDragLeft">
        <button
          type="button"
          className="dragHandle"
          aria-label={`${entry.item.name} をドラッグ`}
          {...attributes}
          {...listeners}
        >
          ⠿
        </button>

        <div className="layerRowNumberDrag">{index + 1}</div>

        <div className="layerRowTextDrag">
          <div className="layerRowNameDrag">{entry.item.name}</div>
          <div className="layerRowMetaDrag">
            {entry.layerKey === 'lower'
              ? '下の服'
              : entry.layerKey === 'upper'
              ? '上の服'
              : 'アクセサリー'}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const initialSaveRef = useRef(null)
  if (!initialSaveRef.current) {
    initialSaveRef.current = loadSaveData()
  }
  const initialSave = initialSaveRef.current

  const audioRef = useRef(null)
  const qrCanvasWrapRef = useRef(null)

  const [activeTab, setActiveTab] = useState(initialSave.activeTab)
  const [closetTab, setClosetTab] = useState(initialSave.closetTab)
  const [settingsTab, setSettingsTab] = useState(initialSave.settingsTab)
  const [nickname, setNickname] = useState(initialSave.nickname)
  const [concept, setConcept] = useState(initialSave.concept)

  const [customItems, setCustomItems] = useState(initialSave.customItems)

  const [equippedBaseId] = useState(initialSave.equippedBaseId)
  const [equippedUpperId, setEquippedUpperId] = useState(initialSave.equippedUpperId)
  const [equippedLowerId, setEquippedLowerId] = useState(initialSave.equippedLowerId)
  const [equippedAccessoryIds, setEquippedAccessoryIds] = useState(initialSave.equippedAccessoryIds)

  const [favoriteUpperId, setFavoriteUpperId] = useState(initialSave.favoriteUpperId)
  const [favoriteLowerId, setFavoriteLowerId] = useState(initialSave.favoriteLowerId)
  const [favoriteAccessoryIds, setFavoriteAccessoryIds] = useState(initialSave.favoriteAccessoryIds)

  const [selectedQrItemId, setSelectedQrItemId] = useState(initialSave.selectedQrItemId)
  const [equippedLayerOrder, setEquippedLayerOrder] = useState(
    ensureLayerOrder(initialSave.equippedLayerOrder)
  )

  const [uploadName, setUploadName] = useState('')
  const [uploadCategory, setUploadCategory] = useState('upper')
  const [uploadFile, setUploadFile] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isSavingHomeImage, setIsSavingHomeImage] = useState(false)
  const [isSavingQrImage, setIsSavingQrImage] = useState(false)
  const [isSavingBaseImage, setIsSavingBaseImage] = useState(false)

  const [qrMessage, setQrMessage] = useState('')

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 4 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const allItems = useMemo(() => [...DEFAULT_ITEMS, ...customItems], [customItems])

  const upperItems = useMemo(
    () => allItems.filter((item) => item.category === 'upper'),
    [allItems]
  )
  const lowerItems = useMemo(
    () => allItems.filter((item) => item.category === 'lower'),
    [allItems]
  )
  const accessoryItems = useMemo(
    () => allItems.filter((item) => item.category === 'accessory'),
    [allItems]
  )

  const qrShareableItems = useMemo(
    () => allItems.filter((item) => item.qrShareable),
    [allItems]
  )

  const equippedBase = useMemo(
    () => allItems.find((item) => item.id === equippedBaseId) || DEFAULT_BASE_ITEMS[0],
    [allItems, equippedBaseId]
  )
  const equippedUpper = useMemo(
    () => allItems.find((item) => item.id === equippedUpperId) || null,
    [allItems, equippedUpperId]
  )
  const equippedLower = useMemo(
    () => allItems.find((item) => item.id === equippedLowerId) || null,
    [allItems, equippedLowerId]
  )
  const equippedAccessories = useMemo(
    () => allItems.filter((item) => equippedAccessoryIds.includes(item.id)),
    [allItems, equippedAccessoryIds]
  )

  const selectedQrItem = useMemo(
    () => qrShareableItems.find((item) => item.id === selectedQrItemId) || null,
    [qrShareableItems, selectedQrItemId]
  )

  const layeredEquippedItems = useMemo(() => {
    const layers = {
      lower: equippedLower,
      upper: equippedUpper,
      'accessory-1': equippedAccessories[0] || null,
      'accessory-2': equippedAccessories[1] || null,
      'accessory-3': equippedAccessories[2] || null,
      'accessory-4': equippedAccessories[3] || null,
      'accessory-5': equippedAccessories[4] || null,
    }

    return ensureLayerOrder(equippedLayerOrder)
      .filter((layerKey) => layerKey !== 'base')
      .map((layerKey) => ({
        layerKey,
        item: layers[layerKey] || null,
      }))
      .filter((entry) => entry.item)
  }, [equippedLower, equippedUpper, equippedAccessories, equippedLayerOrder])

  const qrPreviewUpper = selectedQrItem?.category === 'upper' ? selectedQrItem : null
  const qrPreviewLower = selectedQrItem?.category === 'lower' ? selectedQrItem : null
  const qrPreviewAccessories = selectedQrItem?.category === 'accessory' ? [selectedQrItem] : []

  useEffect(() => {
    const saveData = {
      activeTab,
      closetTab,
      settingsTab,
      nickname,
      concept,
      customItems,
      equippedBaseId,
      equippedUpperId,
      equippedLowerId,
      equippedAccessoryIds,
      favoriteUpperId,
      favoriteLowerId,
      favoriteAccessoryIds,
      selectedQrItemId,
      equippedLayerOrder,
    }
    localStorage.setItem(LS_KEY, JSON.stringify(saveData))
  }, [
    activeTab,
    closetTab,
    settingsTab,
    nickname,
    concept,
    customItems,
    equippedBaseId,
    equippedUpperId,
    equippedLowerId,
    equippedAccessoryIds,
    favoriteUpperId,
    favoriteLowerId,
    favoriteAccessoryIds,
    selectedQrItemId,
    equippedLayerOrder,
  ])

  useEffect(() => {
    if (!selectedQrItemId && qrShareableItems.length > 0) {
      setSelectedQrItemId(qrShareableItems[0].id)
      return
    }

    if (selectedQrItemId && !qrShareableItems.some((item) => item.id === selectedQrItemId)) {
      setSelectedQrItemId(qrShareableItems[0]?.id ?? null)
    }
  }, [qrShareableItems, selectedQrItemId])

  useEffect(() => {
    if (activeTab !== 'home' && audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
  }, [activeTab])

  const isEquipped = (item) => {
    if (item.category === 'upper') return equippedUpperId === item.id
    if (item.category === 'lower') return equippedLowerId === item.id
    if (item.category === 'accessory') return equippedAccessoryIds.includes(item.id)
    return false
  }

  const isFavorite = (item) => {
    if (item.category === 'upper') return favoriteUpperId === item.id
    if (item.category === 'lower') return favoriteLowerId === item.id
    if (item.category === 'accessory') return favoriteAccessoryIds.includes(item.id)
    return false
  }

  const getDisplayCreatorName = (item) => {
    if (!item) return ''
    if (item.source === 'custom') return nickname || DEFAULT_NICKNAME
    return item.creatorName || '不明'
  }

  const handleCharacterClick = async () => {
    try {
      const matchedRule = findSpecialVoiceRule({
        upperId: equippedUpperId,
        lowerId: equippedLowerId,
        accessoryIds: equippedAccessoryIds,
      })

      const voiceUrl = matchedRule?.voiceUrl || getRandomVoiceUrl()
      if (!voiceUrl) return

      if (!audioRef.current) {
        audioRef.current = new Audio(voiceUrl)
      } else {
        audioRef.current.pause()
        audioRef.current.src = voiceUrl
      }

      audioRef.current.currentTime = 0
      await audioRef.current.play()
    } catch {
      // noop
    }
  }

  const handleSaveHomeImage = async () => {
    try {
      setIsSavingHomeImage(true)

      const accessoryUrlsInLayerOrder = layeredEquippedItems
        .filter((entry) => entry.layerKey.startsWith('accessory-'))
        .map((entry) => entry.item.imageUrl)

      const lowerUrl = layeredEquippedItems.find((entry) => entry.layerKey === 'lower')?.item?.imageUrl || ''
      const upperUrl = layeredEquippedItems.find((entry) => entry.layerKey === 'upper')?.item?.imageUrl || ''

      const canvas = await createHomeCanvas({
        nickname,
        concept,
        baseImageUrl: equippedBase?.imageUrl || DEFAULT_BASE_ITEMS[0].imageUrl,
        lowerImageUrl: lowerUrl,
        upperImageUrl: upperUrl,
        accessoryImageUrls: accessoryUrlsInLayerOrder,
      })

      downloadCanvas(canvas, `${nickname || DEFAULT_NICKNAME}-home-card.png`)
    } catch (error) {
      alert(`ホーム画像の保存に失敗したよ: ${error.message}`)
      console.error(error)
    } finally {
      setIsSavingHomeImage(false)
    }
  }

  const handleSaveBaseImage = async () => {
    try {
      setIsSavingBaseImage(true)

      const canvas = await createBaseOnlyCanvas({
        baseImageUrl: equippedBase?.imageUrl || DEFAULT_BASE_ITEMS[0].imageUrl,
      })

      downloadCanvas(canvas, `${nickname || DEFAULT_NICKNAME}-base-only.png`)
    } catch (error) {
      alert(`素体画像の保存に失敗したよ: ${error.message}`)
      console.error(error)
    } finally {
      setIsSavingBaseImage(false)
    }
  }

  const handleSaveQrImage = async () => {
    if (!selectedQrItem) return

    try {
      setIsSavingQrImage(true)

      const qrCanvas = qrCanvasWrapRef.current?.querySelector('canvas')
      if (!qrCanvas) {
        throw new Error('QRコードが見つからないよ')
      }

      const itemCategoryLabel =
        selectedQrItem.category === 'upper'
          ? '上の服'
          : selectedQrItem.category === 'lower'
          ? '下の服'
          : 'アクセサリー'

      const canvas = await createQrCardCanvas({
        itemName: selectedQrItem.name,
        itemCategoryLabel,
        creatorName: getDisplayCreatorName(selectedQrItem),
        nickname,
        baseImageUrl: equippedBase?.imageUrl || DEFAULT_BASE_ITEMS[0].imageUrl,
        qrItemUpperImageUrl: qrPreviewUpper?.imageUrl || '',
        qrItemLowerImageUrl: qrPreviewLower?.imageUrl || '',
        qrItemAccessoryImageUrls: qrPreviewAccessories.map((item) => item.imageUrl),
        qrCanvas,
      })

      downloadCanvas(canvas, `${selectedQrItem.name}-qr-card.png`)
    } catch (error) {
      alert(`QR画像の保存に失敗したよ: ${error.message}`)
      console.error(error)
    } finally {
      setIsSavingQrImage(false)
    }
  }

  const handleEquip = (item) => {
    if (item.category === 'upper') {
      setEquippedUpperId(item.id)
      return
    }

    if (item.category === 'lower') {
      setEquippedLowerId(item.id)
      return
    }

    if (item.category === 'accessory') {
      setEquippedAccessoryIds((prev) => {
        if (prev.includes(item.id)) {
          return prev.filter((id) => id !== item.id)
        }
        if (prev.length >= MAX_ACCESSORIES) {
          alert(`アクセサリーは最大${MAX_ACCESSORIES}個までだよ`)
          return prev
        }
        return [...prev, item.id]
      })
    }
  }

  const handleToggleFavorite = (item) => {
    if (item.category === 'upper') {
      setFavoriteUpperId((prev) => (prev === item.id ? null : item.id))
      return
    }

    if (item.category === 'lower') {
      setFavoriteLowerId((prev) => (prev === item.id ? null : item.id))
      return
    }

    if (item.category === 'accessory') {
      setFavoriteAccessoryIds((prev) => {
        if (prev.includes(item.id)) {
          return prev.filter((id) => id !== item.id)
        }
        if (prev.length >= MAX_ACCESSORIES) {
          alert(`お気に入りアクセは最大${MAX_ACCESSORIES}個までだよ`)
          return prev
        }
        return [...prev, item.id]
      })
    }
  }

  const handleApplyFavorites = () => {
    setEquippedUpperId(favoriteUpperId ?? null)
    setEquippedLowerId(favoriteLowerId ?? null)
    setEquippedAccessoryIds(Array.isArray(favoriteAccessoryIds) ? favoriteAccessoryIds : [])
  }

  const handleUnequipCategory = (category) => {
    if (category === 'upper') {
      setEquippedUpperId(null)
      return
    }
    if (category === 'lower') {
      setEquippedLowerId(null)
      return
    }
    if (category === 'accessory') {
      setEquippedAccessoryIds([])
    }
  }

  const handleUnequipAll = () => {
    setEquippedUpperId(null)
    setEquippedLowerId(null)
    setEquippedAccessoryIds([])
  }

  const handleUpload = async () => {
    if (!uploadName.trim()) {
      alert('名前を入れてね')
      return
    }
    if (!uploadFile) {
      alert('画像を選んでね')
      return
    }

    try {
      setIsUploading(true)

      const filePath = fileToSafePath(uploadFile.name)

      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, uploadFile, { upsert: false })

      if (uploadError) throw uploadError

      const { data: publicUrlData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(filePath)

      const newItem = {
        id: `custom-${Date.now()}`,
        name: uploadName.trim(),
        category: uploadCategory,
        imageUrl: publicUrlData.publicUrl,
        source: 'custom',
        creatorName: nickname || DEFAULT_NICKNAME,
        creatorUrl: '',
        qrShareable: true,
      }

      setCustomItems((prev) => [newItem, ...prev])
      handleEquip(newItem)
      setClosetTab(uploadCategory)
      setSelectedQrItemId(newItem.id)

      setUploadName('')
      setUploadCategory('upper')
      setUploadFile(null)

      alert('アップロードできたよ')
    } catch (error) {
      alert(`アップロード失敗: ${error.message}`)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDeleteCustomItem = (itemId) => {
    const target = customItems.find((item) => item.id === itemId)
    if (!target) return

    const ok = window.confirm(`「${target.name}」を削除する？`)
    if (!ok) return

    setCustomItems((prev) => prev.filter((item) => item.id !== itemId))

    if (equippedUpperId === itemId) setEquippedUpperId(null)
    if (equippedLowerId === itemId) setEquippedLowerId(null)
    if (favoriteUpperId === itemId) setFavoriteUpperId(null)
    if (favoriteLowerId === itemId) setFavoriteLowerId(null)

    if (equippedAccessoryIds.includes(itemId)) {
      setEquippedAccessoryIds((prev) => prev.filter((id) => id !== itemId))
    }
    if (favoriteAccessoryIds.includes(itemId)) {
      setFavoriteAccessoryIds((prev) => prev.filter((id) => id !== itemId))
    }
    if (selectedQrItemId === itemId) {
      setSelectedQrItemId(null)
    }
  }

  const handleLayerDragEnd = (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const visibleIds = layeredEquippedItems.map((entry) => entry.layerKey)
    const oldIndex = visibleIds.indexOf(String(active.id))
    const newIndex = visibleIds.indexOf(String(over.id))
    if (oldIndex < 0 || newIndex < 0) return

    const movedVisible = arrayMove(visibleIds, oldIndex, newIndex)
    setEquippedLayerOrder(['base', ...movedVisible])
  }

  const handleReadQrImage = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    setQrMessage('QRを読み取り中…')

    const objectUrl = URL.createObjectURL(file)
    const image = new Image()
    image.crossOrigin = 'anonymous'
    const reader = new BrowserMultiFormatReader()

    image.onload = async () => {
      try {
        const result = await reader.decodeFromImageElement(image)
        const text = result.getText()
        const parsed = JSON.parse(text)

        if (parsed?.app !== 'kisekae-web' || parsed?.kind !== 'cloth-item') {
          throw new Error('このQRは服データじゃないよ')
        }

        const importedItem = normalizeImportedItem(parsed.item)
        if (!importedItem) {
          throw new Error('QRのデータ形式が正しくないよ')
        }

        setCustomItems((prev) => {
          const exists = prev.some((item) => item.id === importedItem.id)
          if (exists) return prev
          return [importedItem, ...prev]
        })

        handleEquip(importedItem)
        setClosetTab(importedItem.category)
        setSelectedQrItemId(null)
        setQrMessage(`「${importedItem.name}」を読み込んだよ`)
      } catch (error) {
        setQrMessage(error.message || 'QRが読み取れなかったよ')
      } finally {
        URL.revokeObjectURL(objectUrl)
        event.target.value = ''
      }
    }

    image.onerror = () => {
      setQrMessage('画像が読み込めなかったよ')
      URL.revokeObjectURL(objectUrl)
      event.target.value = ''
    }

    image.src = objectUrl
  }

  const handleResetDress = () => {
    setEquippedUpperId(DEFAULT_SAVE.equippedUpperId)
    setEquippedLowerId(DEFAULT_SAVE.equippedLowerId)
    setEquippedAccessoryIds(DEFAULT_SAVE.equippedAccessoryIds)
    setEquippedLayerOrder(DEFAULT_LAYER_ORDER)
  }

  const handleResetSettings = () => {
    setNickname(DEFAULT_NICKNAME)
    setConcept('')
  }

  const handleClearCustomItems = () => {
    const ok = window.confirm('アップロードした服を全部消す？')
    if (!ok) return

    setCustomItems([])
    setEquippedUpperId(DEFAULT_SAVE.equippedUpperId)
    setEquippedLowerId(DEFAULT_SAVE.equippedLowerId)
    setEquippedAccessoryIds(DEFAULT_SAVE.equippedAccessoryIds)
    setFavoriteUpperId(DEFAULT_SAVE.favoriteUpperId)
    setFavoriteLowerId(DEFAULT_SAVE.favoriteLowerId)
    setFavoriteAccessoryIds(DEFAULT_SAVE.favoriteAccessoryIds)
    setSelectedQrItemId(null)
    setEquippedLayerOrder(DEFAULT_LAYER_ORDER)
  }

  const qrValue = selectedQrItem
    ? JSON.stringify({
        app: 'kisekae-web',
        kind: 'cloth-item',
        item: {
          id: selectedQrItem.id,
          name: selectedQrItem.name,
          category: selectedQrItem.category,
          imageUrl: selectedQrItem.imageUrl,
          creatorName: getDisplayCreatorName(selectedQrItem),
          creatorUrl: selectedQrItem.creatorUrl || '',
        },
      })
    : ''

  const renderAvatarLayers = (stageClassName = 'characterStage') => {
    const layerMap = {
      base: equippedBase,
      lower: equippedLower,
      upper: equippedUpper,
      'accessory-1': equippedAccessories[0] || null,
      'accessory-2': equippedAccessories[1] || null,
      'accessory-3': equippedAccessories[2] || null,
      'accessory-4': equippedAccessories[3] || null,
      'accessory-5': equippedAccessories[4] || null,
    }

    return (
      <div className={stageClassName}>
        {ensureLayerOrder(equippedLayerOrder).map((layerKey) => {
          const item = layerMap[layerKey]
          if (!item) return null
          return (
            <img
              key={`${layerKey}-${item.id}`}
              className="layerImage"
              src={item.imageUrl}
              alt={item.name}
              crossOrigin="anonymous"
            />
          )
        })}
      </div>
    )
  }

  const renderQrPreviewLayers = (stageClassName = 'qrAvatarStage') => (
    <div className={stageClassName}>
      <img
        className="layerImage"
        src={equippedBase?.imageUrl || DEFAULT_BASE_ITEMS[0].imageUrl}
        alt={equippedBase?.name || '素体'}
        crossOrigin="anonymous"
      />
      {qrPreviewLower && (
        <img
          className="layerImage"
          src={qrPreviewLower.imageUrl}
          alt={qrPreviewLower.name}
          crossOrigin="anonymous"
        />
      )}
      {qrPreviewUpper && (
        <img
          className="layerImage"
          src={qrPreviewUpper.imageUrl}
          alt={qrPreviewUpper.name}
          crossOrigin="anonymous"
        />
      )}
      {qrPreviewAccessories.map((item) => (
        <img
          key={item.id}
          className="layerImage"
          src={item.imageUrl}
          alt={item.name}
          crossOrigin="anonymous"
        />
      ))}
    </div>
  )

  const renderItemCard = (item) => {
    const equipped = isEquipped(item)

    return (
      <div key={item.id} className="itemCard">
        <div className="itemPreview">
          <img src={item.imageUrl} alt={item.name} crossOrigin="anonymous" />
          <div className="previewCreatorBadge">{getDisplayCreatorName(item)}</div>
        </div>

        <div className="itemInfo">
          <div className="itemName">{item.name}</div>

          <div className="itemMeta">
            <span
              className={`miniBadge ${
                item.source === 'default'
                  ? 'default'
                  : item.source === 'imported'
                  ? 'imported'
                  : 'custom'
              }`}
            >
              {item.source === 'default'
                ? '既存'
                : item.source === 'imported'
                ? '受け取り'
                : 'アップロード'}
            </span>

            {equipped && <span className="miniBadge equipped">着用中</span>}
            {isFavorite(item) && <span className="miniBadge favorite">お気に入り</span>}
          </div>
        </div>

        <div className="itemActions">
          <button
            className="primaryButton small"
            onClick={() => {
              if (item.category === 'upper') {
                if (equippedUpperId === item.id) {
                  handleUnequipCategory('upper')
                } else {
                  handleEquip(item)
                }
                return
              }

              if (item.category === 'lower') {
                if (equippedLowerId === item.id) {
                  handleUnequipCategory('lower')
                } else {
                  handleEquip(item)
                }
                return
              }

              if (item.category === 'accessory') {
                handleEquip(item)
              }
            }}
          >
            {item.category === 'upper'
              ? equippedUpperId === item.id
                ? '脱ぐ'
                : '着る'
              : item.category === 'lower'
              ? equippedLowerId === item.id
                ? '脱ぐ'
                : '着る'
              : equippedAccessoryIds.includes(item.id)
              ? 'はずす'
              : 'つける'}
          </button>

          <button className="secondaryButton small" onClick={() => handleToggleFavorite(item)}>
            {isFavorite(item) ? 'お気に入り解除' : 'お気に入り登録'}
          </button>

          {item.source === 'custom' && (
            <button className="secondaryButton small" onClick={() => setSelectedQrItemId(item.id)}>
              QRにする
            </button>
          )}

          {item.source !== 'default' && (
            <button className="dangerButton small" onClick={() => handleDeleteCustomItem(item.id)}>
              削除
            </button>
          )}
        </div>
      </div>
    )
  }

  const renderClosetBody = () => {
    if (closetTab === 'upper') {
      return (
        <div className="closetTabPanel">
          <div className="closetTabHeaderLine">
            <div className="closetTabTitle">上の服一覧</div>
            <div className="closetTabHint">着たいものを選んでね</div>
          </div>
          <div className="itemGrid">{upperItems.map(renderItemCard)}</div>
        </div>
      )
    }

    if (closetTab === 'lower') {
      return (
        <div className="closetTabPanel">
          <div className="closetTabHeaderLine">
            <div className="closetTabTitle">下の服一覧</div>
            <div className="closetTabHint">着たいものを選んでね</div>
          </div>
          <div className="itemGrid">{lowerItems.map(renderItemCard)}</div>
        </div>
      )
    }

    if (closetTab === 'accessory') {
      return (
        <div className="closetTabPanel">
          <div className="closetTabHeaderLine">
            <div className="closetTabTitle">アクセサリー一覧</div>
            <div className="closetTabHint">最大{MAX_ACCESSORIES}個まで付けられるよ</div>
          </div>
          <div className="itemGrid">{accessoryItems.map(renderItemCard)}</div>
        </div>
      )
    }

    return (
      <div className="layerManagerDrag">
        <p className="infoText">
          持ち手をつかんで上下に移動すると、重ね順を変えられるよ。
          <br />
          上にあるものほど奥、下にあるものほど手前に表示されるよ。
        </p>

        {layeredEquippedItems.length === 0 ? (
          <p className="emptyText">いま着ているものがないよ。</p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleLayerDragEnd}
          >
            <SortableContext
              items={layeredEquippedItems.map((entry) => entry.layerKey)}
              strategy={verticalListSortingStrategy}
            >
              <div className="layerListDrag">
                {layeredEquippedItems.map((entry, index) => (
                  <SortableLayerRow key={entry.layerKey} entry={entry} index={index} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    )
  }

  return (
    <div className="appShell">
      <div className="appFrame">
        <header className="topHeader">
          <div>
            <p className="subTitle">Hureroppu Closet</p>
            <h1 className="pageTitle">ろぷのクローゼット</h1>
          </div>

          <div className="tabRow">
            <button className={`tabButton ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>
              ホーム
            </button>
            <button className={`tabButton ${activeTab === 'closet' ? 'active' : ''}`} onClick={() => setActiveTab('closet')}>
              クローゼット
            </button>
            <button className={`tabButton ${activeTab === 'qr' ? 'active' : ''}`} onClick={() => setActiveTab('qr')}>
              QR
            </button>
            <button className={`tabButton ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
              設定
            </button>
          </div>
        </header>

        <main className="contentArea">
          {activeTab === 'home' && (
            <div className="homeSingleWrap">
              <section className="mainCard homeOnlyCard">
                <div className="homeCaptureCard">
                  <div className="homeCaptureInner">
                    <button className="homeAvatarButton" onClick={handleCharacterClick}>
                      {renderAvatarLayers('homeAvatarStage')}
                    </button>

                    <div className="homeNamePlate">{nickname || DEFAULT_NICKNAME}</div>

                    <div className="homeConceptOnly">
                      {concept?.trim() ? concept : 'コンセプトはまだ未設定だよ'}
                    </div>
                  </div>
                </div>

                <div className="homeSaveArea">
                  <button className="primaryButton" onClick={handleSaveHomeImage} disabled={isSavingHomeImage}>
                    {isSavingHomeImage ? '保存中…' : 'ホーム画像を保存'}
                  </button>
                  <p className="infoText">今見えているホームカードを、そのまま1枚画像で保存できるよ。</p>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'closet' && (
            <div className="closetLayout">
              <section className="leftColumn closetPreviewColumn">
                <div className="closetPreviewArea">
                  <div className="closetImageSticky">
                    <div className="mainCard previewCard previewImageCard">
                      {renderAvatarLayers('characterStage smallStage')}
                    </div>
                  </div>

                  <div className="mainCard closetUiNormal">
                    <div className="namePlate compact">{nickname || DEFAULT_NICKNAME}</div>

                    <div className="miniActions twoColumnActions">
                      <button className="secondaryButton" onClick={handleResetDress}>
                        デフォルトコーデに戻す
                      </button>
                      <button className="secondaryButton" onClick={handleUnequipAll}>
                        全部脱ぐ
                      </button>
                      <button className="primaryButton" onClick={handleApplyFavorites}>
                        お気に入りを着る
                      </button>
                      <button
                        className="secondaryButton"
                        onClick={handleSaveBaseImage}
                        disabled={isSavingBaseImage}
                      >
                        {isSavingBaseImage ? '保存中…' : '素体を保存'}
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              <section className="rightColumn">
                <div className="mainCard">
                  <div className="sectionHeader">
                    <h2 className="sectionTitle">クローゼット</h2>
                    {closetTab !== 'layer' && (
                      <button
                        className="ghostButton"
                        onClick={() =>
                          handleUnequipCategory(
                            closetTab === 'upper'
                              ? 'upper'
                              : closetTab === 'lower'
                              ? 'lower'
                              : 'accessory'
                          )
                        }
                      >
                        {closetTab === 'accessory' ? 'アクセを外す' : '脱ぐ'}
                      </button>
                    )}
                  </div>

                  <div className="closetTabRow">
                    <button className={`closetTabButton ${closetTab === 'upper' ? 'active' : ''}`} onClick={() => setClosetTab('upper')}>
                      上の服
                      <span className="closetTabCount">{upperItems.length}</span>
                    </button>

                    <button className={`closetTabButton ${closetTab === 'lower' ? 'active' : ''}`} onClick={() => setClosetTab('lower')}>
                      下の服
                      <span className="closetTabCount">{lowerItems.length}</span>
                    </button>

                    <button className={`closetTabButton ${closetTab === 'accessory' ? 'active' : ''}`} onClick={() => setClosetTab('accessory')}>
                      アクセ
                      <span className="closetTabCount">{accessoryItems.length}</span>
                    </button>

                    <button className={`closetTabButton ${closetTab === 'layer' ? 'active' : ''}`} onClick={() => setClosetTab('layer')}>
                      重ね順
                    </button>
                  </div>

                  {renderClosetBody()}
                </div>
              </section>
            </div>
          )}

          {activeTab === 'qr' && (
            <div className="qrLayout">
              <section className="mainCard">
                <h2 className="sectionTitle">服をQRで配る</h2>

                {qrShareableItems.length === 0 ? (
                  <p className="emptyText">アップロード服がまだないよ。先にこのQRタブの下から追加してね。</p>
                ) : (
                  <>
                    <label className="fieldLabel">
                      QRにする服
                      <select
                        className="textInput"
                        value={selectedQrItemId || ''}
                        onChange={(e) => setSelectedQrItemId(e.target.value)}
                      >
                        {qrShareableItems.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}（{item.category === 'upper' ? '上の服' : item.category === 'lower' ? '下の服' : 'アクセ'}）
                          </option>
                        ))}
                      </select>
                    </label>

                    {selectedQrItem && (
                      <>
                        <div className="qrCard">
                          <div className="qrCardHeader">
                            <span className="qrCardBadge">QR配布カード</span>
                            <div className="qrCardTitleBlock">
                              <div className="qrItemName">{selectedQrItem.name}</div>
                              <div className="creatorLine">作った人：{getDisplayCreatorName(selectedQrItem)}</div>
                              <div className="qrCardCategory">
                                {selectedQrItem.category === 'upper'
                                  ? '上の服'
                                  : selectedQrItem.category === 'lower'
                                  ? '下の服'
                                  : 'アクセサリー'}
                              </div>
                            </div>
                          </div>

                          <div className="qrCardMain">
                            <div className="qrPreviewPane">
                              <div className="qrPreviewAvatar">
                                {renderQrPreviewLayers('qrAvatarStage')}
                              </div>
                              <div className="namePlate compact">{nickname || DEFAULT_NICKNAME}</div>
                            </div>

                            <div className="qrCodePane">
                              <div ref={qrCanvasWrapRef} className="qrCanvasWrap">
                                <QRCodeCanvas value={qrValue} size={220} includeMargin />
                              </div>
                              <p className="qrHelpText">読み込むとこの服を追加できるよ</p>
                            </div>
                          </div>
                        </div>

                        <div className="qrSaveArea">
                          <button className="primaryButton" onClick={handleSaveQrImage} disabled={isSavingQrImage}>
                            {isSavingQrImage ? '保存中…' : 'QR画像を保存'}
                          </button>
                        </div>
                      </>
                    )}
                  </>
                )}
              </section>

              <section className="mainCard">
                <h2 className="sectionTitle">QR画像を読み込む</h2>

                <label className="fieldLabel">
                  QR画像
                  <input className="fileInput" type="file" accept="image/*" onChange={handleReadQrImage} />
                </label>

                <p className="infoText">{qrMessage || 'ここからQR画像を読み込めるよ'}</p>
              </section>

              <section className="mainCard">
                <h2 className="sectionTitle">服をアップロード</h2>

                <div className="formGrid">
                  <label className="fieldLabel">
                    名前
                    <input
                      className="textInput"
                      type="text"
                      value={uploadName}
                      onChange={(e) => setUploadName(e.target.value)}
                      placeholder="例：アイドル衣装"
                    />
                  </label>

                  <label className="fieldLabel">
                    カテゴリ
                    <select
                      className="textInput"
                      value={uploadCategory}
                      onChange={(e) => setUploadCategory(e.target.value)}
                    >
                      <option value="upper">上の服</option>
                      <option value="lower">下の服</option>
                      <option value="accessory">アクセサリー</option>
                    </select>
                  </label>

                  <label className="fieldLabel">
                    画像
                    <input
                      className="fileInput"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    />
                  </label>

                  <button className="primaryButton" onClick={handleUpload} disabled={isUploading}>
                    {isUploading ? 'アップロード中…' : 'アップロードする'}
                  </button>
                </div>

                <p className="infoText">個人でアップした服は、作った人が自動でニックネーム表記になるよ。</p>
              </section>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="settingsLayoutWide">
              <section className="mainCard">
                <div className="sectionHeader">
                  <h2 className="sectionTitle">設定</h2>
                </div>

                <div className="settingsTabRow">
                  <button className={`settingsTabButton ${settingsTab === 'profile' ? 'active' : ''}`} onClick={() => setSettingsTab('profile')}>
                    プロフィール
                  </button>
                  <button className={`settingsTabButton ${settingsTab === 'terms' ? 'active' : ''}`} onClick={() => setSettingsTab('terms')}>
                    利用規約
                  </button>
                  <button className={`settingsTabButton ${settingsTab === 'credits' ? 'active' : ''}`} onClick={() => setSettingsTab('credits')}>
                    クレジット
                  </button>
                </div>

                {settingsTab === 'profile' && (
                  <div className="settingsPanel">
                    <div className="formGrid">
                      <label className="fieldLabel">
                        名前
                        <input
                          className="textInput"
                          type="text"
                          value={nickname}
                          onChange={(e) => setNickname(e.target.value)}
                          placeholder="名前を入力"
                        />
                      </label>

                      <label className="fieldLabel">
                        コーデのコンセプト
                        <textarea
                          className="textArea"
                          value={concept}
                          onChange={(e) => setConcept(e.target.value)}
                          placeholder="例：いつものふれろっぷ / ちょっとおでかけ風 / お嬢様風"
                          rows={5}
                        />
                      </label>
                    </div>

                    <div className="settingsButtons">
                      <button className="secondaryButton" onClick={handleResetSettings}>
                        名前とコンセプトを初期化
                      </button>
                      <button className="dangerButton" onClick={handleClearCustomItems}>
                        アップロード服を全部消す
                      </button>
                    </div>
                  </div>
                )}

                {settingsTab === 'terms' && (
                  <div className="settingsPanel">
                    <div className="rulesBox">
                      <p className="rulesText">・既存の服や、ほかの人が作った服を自分で作ったことにしないでね。</p>
                      <p className="rulesText">・QRで受け取った服は、作った人の名前を消したり、自分の作品として再配布しないでね。</p>
                      <p className="rulesText">・配布するときは、相手や制作者さんが嫌がる使い方をしないでね。</p>
                      <p className="rulesText">・ここで保存したものはAIなどに取り込まないでね。</p>
                      <p className="rulesText">・著作権や利用条件がある素材は、それぞれのルールを守って使ってね。</p>
                      <p className="rulesText">・公序良俗に反するものは公開しないでください。</p>
                      <p className="rulesText">・こちらはふれろっぷ個ちゃむで制作してるよ。調査員等に問い合わせはしないでね。</p>
                      <p className="rulesText">・こちらのサイトでの個人間でのトラブルにおきましては当方は一切の責任等は取れないよ。</p>
                    </div>
                  </div>
                )}

                {settingsTab === 'credits' && (
                  <div className="settingsPanel creditsPanel">
                    <div className="creditCard">
                      <div className="summaryLabel">素体・洋服製作者様</div>
                      <div className="summaryValue">はむまよろーる様</div>
                      <div className="creditLinkWrap">
                        <a
                          href="https://x.com/hamumayo_roll"
                          target="_blank"
                          rel="noreferrer"
                          className="creditLink"
                        >
                          https://x.com/hamumayo_roll
                        </a>
                      </div>
                    </div>

                    <div className="creditCard">
                      <div className="summaryLabel">サイト制作</div>
                      <div className="summaryValue">ふれろっぷ</div>
                      <div className="creditLinkWrap">
                        <a
                          href="https://youtube.com/@hureroppu?si=WEKCPysvMjmOJvx4"
                          target="_blank"
                          rel="noreferrer"
                          className="creditLink"
                        >
                          https://youtube.com/@hureroppu?si=WEKCPysvMjmOJvx4
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}