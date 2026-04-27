import { useEffect, useMemo, useRef, useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { toPng } from 'html-to-image'
import { supabase } from './supabase'
import './App.css'

const STORAGE_BUCKET = 'clothes'
const LS_KEY = 'kisekae-app-save'
const DEFAULT_NICKNAME = 'ふれろっぷ'
const MAX_ACCESSORIES = 5

const DEFAULT_BASE_CREATOR = 'はむまよろーる様'
const DEFAULT_BASE_CREATOR_URL = 'https://x.com/hamumayo_roll'

// 今は1つだけ使う素体
const DEFAULT_BASE_ITEMS = [
  {
    id: 'default-base-1',
    name: 'いつもの素体',
    category: 'base',
    imageUrl: '/images/base/body-default.png',
    source: 'default',
    creatorName: DEFAULT_BASE_CREATOR,
    creatorUrl: DEFAULT_BASE_CREATOR_URL,
    qrShareable: false,
  },
]

const HOME_VOICE_URLS = [
  '/voices/home-1.mp3',
  '/voices/home-2.mp3',
  '/voices/home-3.mp3',
]

const DEFAULT_UPPER_ITEMS = [
  {
    id: 'default-upper-1',
    name: 'いつものふく',
    category: 'upper',
    imageUrl: '/images/tops/top-default-1.png',
    source: 'default',
    creatorName: 'はむまよろーる様',
    creatorUrl: 'https://x.com/hamumayo_roll',
    qrShareable: false,
  },
  {
    id: 'default-upper-2',
    name: 'ピンクブラウス',
    category: 'upper',
    imageUrl: '/images/tops/top-default-2.png',
    source: 'default',
    creatorName: 'はむまよろーる様',
    creatorUrl: 'https://x.com/hamumayo_roll',
    qrShareable: false,
  },
  {
    id: 'default-upper-3',
    name: '燕尾服上',
    category: 'upper',
    imageUrl: '/images/tops/top-default-3.png',
    source: 'default',
    creatorName: 'はむまよろーる様',
    creatorUrl: 'https://x.com/hamumayo_roll',
    qrShareable: false,
  },
]

const DEFAULT_LOWER_ITEMS = [
  {
    id: 'default-lower-1',
    name: 'ふりるスカート黒',
    category: 'lower',
    imageUrl: '/images/bottoms/bottom-default-1.png',
    source: 'default',
    creatorName: 'はむまよろーる様',
    creatorUrl: 'https://x.com/hamumayo_roll',
    qrShareable: false,
  },
  {
    id: 'default-lower-2',
    name: '燕尾服下',
    category: 'lower',
    imageUrl: '/images/bottoms/bottom-default-2.png',
    source: 'default',
    creatorName: 'はむまよろーる様',
    creatorUrl: 'https://x.com/hamumayo_roll',
    qrShareable: false,
  },
  {
    id: 'default-lower-3',
    name: 'プリーツスカート黄色',
    category: 'lower',
    imageUrl: '/images/bottoms/bottom-default-3.png',
    source: 'default',
    creatorName: 'はむまよろーる様',
    creatorUrl: 'https://x.com/hamumayo_roll',
    qrShareable: false,
  },
]

const DEFAULT_ACCESSORY_ITEMS = [
  {
    id: 'default-accessory-1',
    name: 'いつもの帽子',
    category: 'accessory',
    imageUrl: '/images/accessories/accessory-default-1.png',
    source: 'default',
    creatorName: 'はむまよろーる様',
    creatorUrl: 'https://x.com/hamumayo_roll',
    qrShareable: false,
  },
  {
    id: 'default-accessory-2',
    name: 'モノクル',
    category: 'accessory',
    imageUrl: '/images/accessories/accessory-default-2.png',
    source: 'default',
    creatorName: 'はむまよろーる様',
    creatorUrl: 'https://x.com/hamumayo_roll',
    qrShareable: false,
  },
  {
    id: 'default-accessory-3',
    name: 'リボン右',
    category: 'accessory',
    imageUrl: '/images/accessories/accessory-default-3.png',
    source: 'default',
    creatorName: 'はむまよろーる様',
    creatorUrl: 'https://x.com/hamumayo_roll',
    qrShareable: false,
  },
  {
    id: 'default-accessory-4',
    name: 'リボン左',
    category: 'accessory',
    imageUrl: '/images/accessories/accessory-default-4.png',
    source: 'default',
    creatorName: 'はむまよろーる様',
    creatorUrl: 'https://x.com/hamumayo_roll',
    qrShareable: false,
  },
  {
    id: 'default-accessory-5',
    name: '編み上げリボン右',
    category: 'accessory',
    imageUrl: '/images/accessories/accessory-default-5.png',
    source: 'default',
    creatorName: 'はむまよろーる様',
    creatorUrl: 'https://x.com/hamumayo_roll',
    qrShareable: false,
  },
  {
    id: 'default-accessory-6',
    name: '編み上げリボン左',
    category: 'accessory',
    imageUrl: '/images/accessories/accessory-default-6.png',
    source: 'default',
    creatorName: 'はむまよろーる様',
    creatorUrl: 'https://x.com/hamumayo_roll',
    qrShareable: false,
  },
]

const DEFAULT_ITEMS = [
  ...DEFAULT_BASE_ITEMS,
  ...DEFAULT_UPPER_ITEMS,
  ...DEFAULT_LOWER_ITEMS,
  ...DEFAULT_ACCESSORY_ITEMS,
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
    }
  } catch {
    return DEFAULT_SAVE
  }
}

function fileToSafePath(fileName) {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}-${fileName.replace(
    /[^\w.\-]/g,
    '_'
  )}`
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

function App() {
  const initialSaveRef = useRef(null)
  if (!initialSaveRef.current) {
    initialSaveRef.current = loadSaveData()
  }
  const initialSave = initialSaveRef.current

  const audioRef = useRef(null)
  const homeCardRef = useRef(null)
  const qrCardRef = useRef(null)

  const [activeTab, setActiveTab] = useState(initialSave.activeTab)
  const [closetTab, setClosetTab] = useState(initialSave.closetTab)
  const [settingsTab, setSettingsTab] = useState(initialSave.settingsTab)
  const [nickname, setNickname] = useState(initialSave.nickname)
  const [concept, setConcept] = useState(initialSave.concept)

  const [customItems, setCustomItems] = useState(initialSave.customItems)

  const [equippedBaseId] = useState(initialSave.equippedBaseId)
  const [equippedUpperId, setEquippedUpperId] = useState(initialSave.equippedUpperId)
  const [equippedLowerId, setEquippedLowerId] = useState(initialSave.equippedLowerId)
  const [equippedAccessoryIds, setEquippedAccessoryIds] = useState(
    initialSave.equippedAccessoryIds
  )

  const [favoriteUpperId, setFavoriteUpperId] = useState(initialSave.favoriteUpperId)
  const [favoriteLowerId, setFavoriteLowerId] = useState(initialSave.favoriteLowerId)
  const [favoriteAccessoryIds, setFavoriteAccessoryIds] = useState(
    initialSave.favoriteAccessoryIds
  )

  const [selectedQrItemId, setSelectedQrItemId] = useState(initialSave.selectedQrItemId)

  const [uploadName, setUploadName] = useState('')
  const [uploadCategory, setUploadCategory] = useState('upper')
  const [uploadFile, setUploadFile] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isSavingHomeImage, setIsSavingHomeImage] = useState(false)
  const [isSavingQrImage, setIsSavingQrImage] = useState(false)

  const [qrMessage, setQrMessage] = useState('')

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

  const currentClosetItems = useMemo(() => {
    if (closetTab === 'upper') return upperItems
    if (closetTab === 'lower') return lowerItems
    return accessoryItems
  }, [closetTab, upperItems, lowerItems, accessoryItems])

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

  const buildPngFromRef = async (ref, filename) => {
    if (!ref.current) return

    const dataUrl = await toPng(ref.current, {
      cacheBust: true,
      pixelRatio: 3,
      backgroundColor: '#ffffff',
      skipFonts: true,
    })

    const link = document.createElement('a')
    link.download = filename
    link.href = dataUrl
    link.click()
  }

  const renderAvatarLayers = (stageClassName = 'characterStage') => (
    <div className={stageClassName}>
      <img
        className="layerImage"
        src={equippedBase?.imageUrl || DEFAULT_BASE_ITEMS[0].imageUrl}
        alt={equippedBase?.name || '素体'}
        crossOrigin="anonymous"
      />
      {equippedLower && (
        <img
          className="layerImage"
          src={equippedLower.imageUrl}
          alt={equippedLower.name}
          crossOrigin="anonymous"
        />
      )}
      {equippedUpper && (
        <img
          className="layerImage"
          src={equippedUpper.imageUrl}
          alt={equippedUpper.name}
          crossOrigin="anonymous"
        />
      )}
      {equippedAccessories.map((item) => (
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

  const handleCharacterClick = async () => {
    try {
      const randomVoiceUrl = getRandomVoiceUrl()
      if (!randomVoiceUrl) return

      if (!audioRef.current) {
        audioRef.current = new Audio(randomVoiceUrl)
      } else {
        audioRef.current.pause()
        audioRef.current.src = randomVoiceUrl
      }

      audioRef.current.currentTime = 0
      await audioRef.current.play()
    } catch {
      // 失敗しても何もしない
    }
  }

  const handleSaveHomeImage = async () => {
    try {
      setIsSavingHomeImage(true)
      await buildPngFromRef(homeCardRef, `${nickname || DEFAULT_NICKNAME}-home-card.png`)
    } catch (error) {
      alert(`ホーム画像の保存に失敗したよ: ${error.message}`)
    } finally {
      setIsSavingHomeImage(false)
    }
  }

  const handleSaveQrImage = async () => {
    if (!selectedQrItem) return

    try {
      setIsSavingQrImage(true)
      await buildPngFromRef(qrCardRef, `${selectedQrItem.name}-qr-card.png`)
    } catch (error) {
      alert(`QR画像の保存に失敗したよ: ${error.message}`)
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
        .upload(filePath, uploadFile, {
          upsert: false,
        })

      if (uploadError) {
        throw uploadError
      }

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

  const renderItemCard = (item) => (
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

          {isEquipped(item) && <span className="miniBadge equipped">着用中</span>}
          {isFavorite(item) && <span className="miniBadge favorite">お気に入り</span>}
        </div>
      </div>

      <div className="itemActions">
        <button className="primaryButton small" onClick={() => handleEquip(item)}>
          {item.category === 'accessory'
            ? equippedAccessoryIds.includes(item.id)
              ? 'はずす'
              : 'つける'
            : '着る'}
        </button>

        {item.category === 'upper' && isEquipped(item) && (
          <button className="secondaryButton small" onClick={() => handleUnequipCategory('upper')}>
            脱ぐ
          </button>
        )}

        {item.category === 'lower' && isEquipped(item) && (
          <button className="secondaryButton small" onClick={() => handleUnequipCategory('lower')}>
            脱ぐ
          </button>
        )}

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

  return (
    <div className="appShell">
      <div className="appFrame">
        <header className="topHeader">
          <div>
            <p className="subTitle">Pastel Kisekae</p>
            <h1 className="pageTitle">着せ替えアプリ</h1>
          </div>

          <div className="tabRow">
            <button
              className={`tabButton ${activeTab === 'home' ? 'active' : ''}`}
              onClick={() => setActiveTab('home')}
            >
              ホーム
            </button>
            <button
              className={`tabButton ${activeTab === 'closet' ? 'active' : ''}`}
              onClick={() => setActiveTab('closet')}
            >
              クローゼット
            </button>
            <button
              className={`tabButton ${activeTab === 'qr' ? 'active' : ''}`}
              onClick={() => setActiveTab('qr')}
            >
              QR
            </button>
            <button
              className={`tabButton ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              設定
            </button>
          </div>
        </header>

        <main className="contentArea">
          {activeTab === 'home' && (
            <div className="homeSingleWrap">
              <section className="mainCard homeOnlyCard">
                <div ref={homeCardRef} className="homeCaptureCard">
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
                  <button
                    className="primaryButton"
                    onClick={handleSaveHomeImage}
                    disabled={isSavingHomeImage}
                  >
                    {isSavingHomeImage ? '保存中…' : 'ホーム画像を保存'}
                  </button>
                  <p className="infoText">
                    今見えているホームカードを、そのまま1枚画像で保存できるよ。
                  </p>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'closet' && (
            <div className="closetLayout">
              <section className="leftColumn">
                <div className="mainCard previewCard">
                  {renderAvatarLayers('characterStage smallStage')}

                  <div className="namePlate compact">{nickname || DEFAULT_NICKNAME}</div>

                  <div className="miniActions">
                    <button className="secondaryButton" onClick={handleResetDress}>
                      デフォルトコーデに戻す
                    </button>
                    <button className="secondaryButton" onClick={handleUnequipAll}>
                      全部脱ぐ
                    </button>
                    <button className="primaryButton" onClick={handleApplyFavorites}>
                      お気に入りを着る
                    </button>
                  </div>
                </div>

                <div className="mainCard">
                  <h2 className="sectionTitle">服をアップロード</h2>

                  <div className="formGrid">
                    <label className="fieldLabel">
                      名前
                      <input
                        className="textInput"
                        type="text"
                        value={uploadName}
                        onChange={(e) => setUploadName(e.target.value)}
                        placeholder="例：しゅわしゅわトップス"
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

                  <p className="infoText">
                    個人でアップした服は、作った人が自動でニックネーム表記になるよ。
                  </p>
                </div>
              </section>

              <section className="rightColumn">
                <div className="mainCard">
                  <div className="sectionHeader">
                    <h2 className="sectionTitle">クローゼット</h2>
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
                  </div>

                  <div className="closetTabRow">
                    <button
                      className={`closetTabButton ${closetTab === 'upper' ? 'active' : ''}`}
                      onClick={() => setClosetTab('upper')}
                    >
                      上の服
                      <span className="closetTabCount">{upperItems.length}</span>
                    </button>

                    <button
                      className={`closetTabButton ${closetTab === 'lower' ? 'active' : ''}`}
                      onClick={() => setClosetTab('lower')}
                    >
                      下の服
                      <span className="closetTabCount">{lowerItems.length}</span>
                    </button>

                    <button
                      className={`closetTabButton ${closetTab === 'accessory' ? 'active' : ''}`}
                      onClick={() => setClosetTab('accessory')}
                    >
                      アクセ
                      <span className="closetTabCount">{accessoryItems.length}</span>
                    </button>
                  </div>

                  <div className="closetTabPanel">
                    <div className="closetTabHeaderLine">
                      <div className="closetTabTitle">
                        {closetTab === 'upper'
                          ? '上の服一覧'
                          : closetTab === 'lower'
                          ? '下の服一覧'
                          : 'アクセサリー一覧'}
                      </div>
                      <div className="closetTabHint">
                        {closetTab === 'accessory'
                          ? `最大${MAX_ACCESSORIES}個まで付けられるよ`
                          : '着たいものを選んでね'}
                      </div>
                    </div>

                    <div className="itemGrid">{currentClosetItems.map(renderItemCard)}</div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'qr' && (
            <div className="qrLayout">
              <section className="mainCard">
                <h2 className="sectionTitle">服をQRで配る</h2>

                {qrShareableItems.length === 0 ? (
                  <p className="emptyText">
                    アップロード服がまだないよ。先にクローゼットから追加してね。
                  </p>
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
                            {item.name}（
                            {item.category === 'upper'
                              ? '上の服'
                              : item.category === 'lower'
                              ? '下の服'
                              : 'アクセ'}
                            ）
                          </option>
                        ))}
                      </select>
                    </label>

                    {selectedQrItem && (
                      <>
                        <div ref={qrCardRef} className="qrCard">
                          <div className="qrCardHeader">
                            <span className="qrCardBadge">QR配布カード</span>
                            <div className="qrCardTitleBlock">
                              <div className="qrItemName">{selectedQrItem.name}</div>
                              <div className="creatorLine">
                                作った人：{getDisplayCreatorName(selectedQrItem)}
                              </div>
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
                                {renderAvatarLayers('qrAvatarStage')}
                              </div>
                              <div className="namePlate compact">
                                {nickname || DEFAULT_NICKNAME}
                              </div>
                            </div>

                            <div className="qrCodePane">
                              <div className="qrCanvasWrap">
                                <QRCodeCanvas value={qrValue} size={220} includeMargin />
                              </div>
                              <p className="qrHelpText">
                                読み込むとこの服を追加できるよ
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="qrSaveArea">
                          <button
                            className="primaryButton"
                            onClick={handleSaveQrImage}
                            disabled={isSavingQrImage}
                          >
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
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="settingsLayoutWide">
              <section className="mainCard">
                <div className="sectionHeader">
                  <h2 className="sectionTitle">設定</h2>
                </div>

                <div className="settingsTabRow">
                  <button
                    className={`settingsTabButton ${settingsTab === 'profile' ? 'active' : ''}`}
                    onClick={() => setSettingsTab('profile')}
                  >
                    プロフィール
                  </button>
                  <button
                    className={`settingsTabButton ${settingsTab === 'terms' ? 'active' : ''}`}
                    onClick={() => setSettingsTab('terms')}
                  >
                    利用規約
                  </button>
                  <button
                    className={`settingsTabButton ${settingsTab === 'credits' ? 'active' : ''}`}
                    onClick={() => setSettingsTab('credits')}
                  >
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
                          placeholder="例：配信向けのふんわりパステル衣装 / ちょっとおでかけ風 / キラキラVTuber感"
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
                      <p className="rulesText">
                        ・既存の服や、ほかの人が作った服を自分で作ったことにしないでね。
                      </p>
                      <p className="rulesText">
                        ・QRで受け取った服は、作った人の名前を消したり、自分の作品として再配布しないでね。
                      </p>
                      <p className="rulesText">
                        ・配布するときは、相手や制作者さんが嫌がる使い方をしないでね。
                      </p>
                      <p className="rulesText">
                        ・著作権や利用条件がある素材は、それぞれのルールを守って使ってね。
                      </p>
                    </div>
                  </div>
                )}

                {settingsTab === 'credits' && (
                  <div className="settingsPanel creditsPanel">
                    <div className="creditCard">
                      <div className="summaryLabel">素体</div>
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
                      <div className="summaryLabel">既存服メイン制作者</div>
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

export default App