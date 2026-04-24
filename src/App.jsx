import { useEffect, useMemo, useRef, useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { supabase } from './supabase'
import './App.css'

const STORAGE_BUCKET = 'clothes'
const LS_KEY = 'kisekae-app-save'
const DEFAULT_NICKNAME = 'ふれろっぷ'
const BASE_IMAGE_URL = '/images/base/body-default.png'
const MAX_ACCESSORIES = 5

// =========================
// 音声ファイルを増やす場所
// =========================
const HOME_VOICE_URLS = [
  '/voices/home-1.mp3',
  '/voices/home-2.mp3',
  '/voices/home-3.mp3',
]

// =========================
// デフォルト服を増やす場所
// =========================
const DEFAULT_UPPER_ITEMS = [
  {
    id: 'default-upper-1',
    name: 'いつものふく',
    category: 'upper',
    imageUrl: '/images/tops/top-default-1.png',
    source: 'default',
    qrShareable: false,
  },
  {
    id: 'default-upper-2',
    name: 'ピンクブラウス',
    category: 'upper',
    imageUrl: '/images/tops/top-default-2.png',
    source: 'default',
    qrShareable: false,
  },
  {
    id: 'default-upper-3',
    name: '燕尾服上',
    category: 'upper',
    imageUrl: '/images/tops/top-default-3.png',
    source: 'default',
    qrShareable: false,
  },

  // ここに上の服を追加する
  // {
  //   id: 'default-upper-4',
  //   name: 'いちごミルクトップス',
  //   category: 'upper',
  //   imageUrl: '/images/tops/top-default-4.png',
  //   source: 'default',
  //   qrShareable: false,
  // },
]

const DEFAULT_LOWER_ITEMS = [
  {
    id: 'default-lower-1',
    name: 'ふりるスカート黒',
    category: 'lower',
    imageUrl: '/images/bottoms/bottom-default-1.png',
    source: 'default',
    qrShareable: false,
  },
  {
    id: 'default-lower-2',
    name: '燕尾服下',
    category: 'lower',
    imageUrl: '/images/bottoms/bottom-default-2.png',
    source: 'default',
    qrShareable: false,
  },
  {
    id: 'default-lower-3',
    name: 'プリーツスカート黄色',
    category: 'lower',
    imageUrl: '/images/bottoms/bottom-default-3.png',
    source: 'default',
    qrShareable: false,
  },

  // ここに下の服を追加する
  // {
  //   id: 'default-lower-4',
  //   name: 'ふりふりスカート',
  //   category: 'lower',
  //   imageUrl: '/images/bottoms/bottom-default-4.png',
  //   source: 'default',
  //   qrShareable: false,
  // },
]

const DEFAULT_ACCESSORY_ITEMS = [
  {
    id: 'default-accessory-1',
    name: 'いつもの帽子',
    category: 'accessory',
    imageUrl: '/images/accessories/accessory-default-1.png',
    source: 'default',
    qrShareable: false,
  },
  {
    id: 'default-accessory-2',
    name: 'モノクル',
    category: 'accessory',
    imageUrl: '/images/accessories/accessory-default-2.png',
    source: 'default',
    qrShareable: false,
  },
  {
    id: 'default-accessory-3',
    name: 'リボン右',
    category: 'accessory',
    imageUrl: '/images/accessories/accessory-default-3.png',
    source: 'default',
    qrShareable: false,
  },
  
  {
   id: 'default-accessory-4',
   name: 'リボン左',
   category: 'accessory',
   imageUrl: '/images/accessories/accessory-default-4.png',
   source: 'default',
    qrShareable: false,
  },
    {
   id: 'default-accessory-5',
   name: '編み上げリボン右',
   category: 'accessory',
   imageUrl: '/images/accessories/accessory-default-5.png',
   source: 'default',
    qrShareable: false,
  },
      {
   id: 'default-accessory-6',
   name: '編み上げリボン左',
   category: 'accessory',
   imageUrl: '/images/accessories/accessory-default-6.png',
   source: 'default',
    qrShareable: false,
  },
  // ここにアクセサリーを追加する
  // {
  //   id: 'default-accessory-7',
  //   name: 'ハートアクセ',
  //   category: 'accessory',
  //   imageUrl: '/images/accessories/accessory-default-7.png',
  //   source: 'default',
  //   qrShareable: false,
  // },
]

const DEFAULT_ITEMS = [
  ...DEFAULT_UPPER_ITEMS,
  ...DEFAULT_LOWER_ITEMS,
  ...DEFAULT_ACCESSORY_ITEMS,
]

const DEFAULT_SAVE = {
  nickname: DEFAULT_NICKNAME,
  customItems: [],
  equippedUpperId: 'default-upper-1',
  equippedAccessoryIds: ['default-accessory-2', 'default-accessory-1'],
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
        : [],
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

// QRから読み込んだ服を整える
// imported にして、再配布できないよう qrShareable: false にする
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

  const [activeTab, setActiveTab] = useState(initialSave.activeTab)
  const [nickname, setNickname] = useState(initialSave.nickname)
  const [concept, setConcept] = useState(initialSave.concept)

  const [customItems, setCustomItems] = useState(initialSave.customItems)
  const [equippedUpperId, setEquippedUpperId] = useState(initialSave.equippedUpperId)
  const [equippedLowerId, setEquippedLowerId] = useState(initialSave.equippedLowerId)
  const [equippedAccessoryIds, setEquippedAccessoryIds] = useState(
    initialSave.equippedAccessoryIds
  )
  const [selectedQrItemId, setSelectedQrItemId] = useState(initialSave.selectedQrItemId)

  const [uploadName, setUploadName] = useState('')
  const [uploadCategory, setUploadCategory] = useState('upper')
  const [uploadFile, setUploadFile] = useState(null)
  const [isUploading, setIsUploading] = useState(false)

  const [qrMessage, setQrMessage] = useState('')

  const allItems = useMemo(() => {
    return [...DEFAULT_ITEMS, ...customItems]
  }, [customItems])

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

  // QRを作れるのは qrShareable: true のものだけ
  const qrShareableItems = useMemo(
    () => allItems.filter((item) => item.qrShareable),
    [allItems]
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

  useEffect(() => {
    const saveData = {
      activeTab,
      nickname,
      concept,
      customItems,
      equippedUpperId,
      equippedLowerId,
      equippedAccessoryIds,
      selectedQrItemId,
    }

    localStorage.setItem(LS_KEY, JSON.stringify(saveData))
  }, [
    activeTab,
    nickname,
    concept,
    customItems,
    equippedUpperId,
    equippedLowerId,
    equippedAccessoryIds,
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

  const handleUpload = async () => {
    if (!uploadName.trim()) {
      alert('服の名前を入れてね')
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
        qrShareable: true,
      }

      setCustomItems((prev) => [newItem, ...prev])
      handleEquip(newItem)
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

    if (equippedUpperId === itemId) {
      setEquippedUpperId(null)
    }

    if (equippedLowerId === itemId) {
      setEquippedLowerId(null)
    }

    if (equippedAccessoryIds.includes(itemId)) {
      setEquippedAccessoryIds((prev) => prev.filter((id) => id !== itemId))
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
    setSelectedQrItemId(null)
  }

  // 自分でアップした服だけ creatorName を入れてQR化する
  const qrValue = selectedQrItem
    ? JSON.stringify({
        app: 'kisekae-web',
        kind: 'cloth-item',
        item: {
          id: selectedQrItem.id,
          name: selectedQrItem.name,
          category: selectedQrItem.category,
          imageUrl: selectedQrItem.imageUrl,
          creatorName: nickname || DEFAULT_NICKNAME,
        },
      })
    : ''

  const renderItemCard = (item) => (
    <div key={item.id} className="itemCard">
      <div className="itemPreview">
        <img src={item.imageUrl} alt={item.name} />
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
              ? '既存服'
              : item.source === 'imported'
              ? `${item.creatorName || 'だれか'}の服`
              : 'アップロード服'}
          </span>
          {isEquipped(item) && <span className="miniBadge equipped">着用中</span>}
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

        {item.source === 'custom' && (
          <>
            <button className="secondaryButton small" onClick={() => setSelectedQrItemId(item.id)}>
              QRにする
            </button>
            <button className="dangerButton small" onClick={() => handleDeleteCustomItem(item.id)}>
              削除
            </button>
          </>
        )}

        {item.source === 'imported' && (
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
            <div className="homeLayout">
              <section className="mainCard">
                <button className="characterButton" onClick={handleCharacterClick}>
                  <div className="characterStage">
                    <img className="layerImage" src={BASE_IMAGE_URL} alt="素体" />
                    {equippedLower && (
                      <img className="layerImage" src={equippedLower.imageUrl} alt={equippedLower.name} />
                    )}
                    {equippedUpper && (
                      <img className="layerImage" src={equippedUpper.imageUrl} alt={equippedUpper.name} />
                    )}
                    {equippedAccessories.map((item) => (
                      <img key={item.id} className="layerImage" src={item.imageUrl} alt={item.name} />
                    ))}
                  </div>

                  <div className="namePlate">{nickname || DEFAULT_NICKNAME}</div>
                </button>
              </section>

              <aside className="sideCard">
                <h2 className="sectionTitle">いまのコーデ</h2>

                <div className="summaryBlock">
                  <div className="summaryLabel">上の服</div>
                  <div className="summaryValue">{equippedUpper?.name || 'なし'}</div>
                </div>

                <div className="summaryBlock">
                  <div className="summaryLabel">下の服</div>
                  <div className="summaryValue">{equippedLower?.name || 'なし'}</div>
                </div>

                <div className="summaryBlock">
                  <div className="summaryLabel">アクセ</div>
                  <div className="summaryValue">
                    {equippedAccessories.length > 0
                      ? equippedAccessories.map((item) => item.name).join(' / ')
                      : 'なし'}
                  </div>
                </div>

                <div className="summaryBlock">
                  <div className="summaryLabel">コンセプト</div>
                  <div className="summaryValue">{concept?.trim() ? concept : '未設定'}</div>
                </div>
              </aside>
            </div>
          )}

          {activeTab === 'closet' && (
            <div className="closetLayout">
              <section className="leftColumn">
                <div className="mainCard previewCard">
                  <div className="characterStage smallStage">
                    <img className="layerImage" src={BASE_IMAGE_URL} alt="素体" />
                    {equippedLower && (
                      <img className="layerImage" src={equippedLower.imageUrl} alt={equippedLower.name} />
                    )}
                    {equippedUpper && (
                      <img className="layerImage" src={equippedUpper.imageUrl} alt={equippedUpper.name} />
                    )}
                    {equippedAccessories.map((item) => (
                      <img key={item.id} className="layerImage" src={item.imageUrl} alt={item.name} />
                    ))}
                  </div>

                  <div className="namePlate compact">{nickname || DEFAULT_NICKNAME}</div>

                  <div className="miniActions">
                    <button className="secondaryButton" onClick={handleResetDress}>
                      デフォルトコーデに戻す
                    </button>
                    <button className="secondaryButton" onClick={() => handleUnequipCategory('accessory')}>
                      アクセを全部はずす
                    </button>
                  </div>
                </div>

                <div className="mainCard">
                  <h2 className="sectionTitle">服をアップロード</h2>

                  <div className="formGrid">
                    <label className="fieldLabel">
                      服の名前
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
                </div>
              </section>

              <section className="rightColumn">
                <div className="mainCard">
                  <div className="sectionHeader">
                    <h2 className="sectionTitle">上の服</h2>
                    <button className="ghostButton" onClick={() => handleUnequipCategory('upper')}>
                      全部脱ぐ
                    </button>
                  </div>
                  <div className="itemGrid">{upperItems.map(renderItemCard)}</div>
                </div>

                <div className="mainCard">
                  <div className="sectionHeader">
                    <h2 className="sectionTitle">下の服</h2>
                    <button className="ghostButton" onClick={() => handleUnequipCategory('lower')}>
                      全部脱ぐ
                    </button>
                  </div>
                  <div className="itemGrid">{lowerItems.map(renderItemCard)}</div>
                </div>

                <div className="mainCard">
                  <div className="sectionHeader">
                    <h2 className="sectionTitle">アクセサリー</h2>
                    <button className="ghostButton" onClick={() => handleUnequipCategory('accessory')}>
                      全部はずす
                    </button>
                  </div>
                  <div className="itemGrid">{accessoryItems.map(renderItemCard)}</div>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'qr' && (
            <div className="qrLayout">
              <section className="mainCard">
                <h2 className="sectionTitle">服をQRで配る</h2>

                {qrShareableItems.length === 0 ? (
                  <p className="emptyText">アップロード服がまだないよ。先にクローゼットから追加してね。</p>
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
                      <div className="qrCard">
                        <div className="qrPreview">
                          <img src={selectedQrItem.imageUrl} alt={selectedQrItem.name} />
                        </div>

                        <div className="qrCanvasWrap">
                          <QRCodeCanvas value={qrValue} size={190} includeMargin />
                        </div>

                        <div className="qrItemName">{selectedQrItem.name}</div>
                      </div>
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
            <div className="settingsLayout">
              <section className="mainCard">
                <h2 className="sectionTitle">プロフィール設定</h2>

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
              </section>

              <section className="mainCard">
                <h2 className="sectionTitle">現在の保存内容</h2>

                <div className="summaryBlock">
                  <div className="summaryLabel">名前</div>
                  <div className="summaryValue">{nickname || DEFAULT_NICKNAME}</div>
                </div>

                <div className="summaryBlock">
                  <div className="summaryLabel">コンセプト</div>
                  <div className="summaryValue">{concept?.trim() ? concept : '未設定'}</div>
                </div>

                <div className="summaryBlock">
                  <div className="summaryLabel">アップロード服</div>
                  <div className="summaryValue">{customItems.length}件</div>
                </div>
              </section>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default App