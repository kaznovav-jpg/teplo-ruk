import { useEffect, useState } from 'react'
import { useApp } from '../lib/store.jsx'
import { useLanguage } from '../lib/language.jsx'
import { D } from '../lib/data.js'
import * as F from '../lib/firebase.js'

export default function Admin() {
  const { user, isAdmin, adminReservations, adminOrders, confirmOrderPayment, updateOrderFulfillment, reviewOrderCancellation, updateOrderStatus, deleteOrder, adminEvents, masterApplications, artistWorks, products, articles, classes, artists, artistCollections, customOrders = [], posts = [], isFirebase } = useApp()
    const { lang } = useLanguage()
  const [activeSection, setActiveSection] = useState('overview')
  const [orderToDelete, setOrderToDelete] = useState(null)
  const [communitySearch, setCommunitySearch] = useState('')
  const [selectedCommunityAuthor, setSelectedCommunityAuthor] = useState(null)
  const [bankForm, setBankForm] = useState({ bank: '신한은행 / Shinhan Bank', account: '110 318 981600', holder: '가즈노바빅토리아' })
  const [bankSaving, setBankSaving] = useState(false)
  const [supportForm, setSupportForm] = useState({ phone: '010-5175-2515', email: 'vic-kaznova@narod.ru', hoursRu: 'будни 10:00–17:00', hoursKo: '평일 10:00~17:00', breakRu: 'Обед 12:30–13:30 · Выходные и праздники — выходные', breakKo: '점심 12:30~13:30 · 주말/공휴일 휴무' })
  const [supportSaving, setSupportSaving] = useState(false)
  const [footerForm, setFooterForm] = useState({"descriptionRu":"Мы делимся теплом вещей ручной работы и знаниями, созданными с душой.","descriptionKo":"한 땀 한 땀 손으로 만든 따뜻한 물건과 배움을 전합니다.","instagram":"","blog":"","youtube":"","termsLabelRu":"Условия использования","termsLabelKo":"이용약관","privacyLabelRu":"Политика конфиденциальности","privacyLabelKo":"개인정보처리방침","shippingLabelRu":"Доставка и обмен","shippingLabelKo":"배송·교환 안내","termsUrl":"/info?t=이용약관","privacyUrl":"/info?t=개인정보처리방침","shippingUrl":"/info?t=배송·교환 안내","companyNameRu":"Тепло Рук","companyNameKo":"손길의 온기","representative":"홍길동","businessNumber":"000-00-00000","ecommerceNumber":"제0000-경기-0000호","addressRu":"Кёнгидо, г. Хвасон (пример адреса)","addressKo":"경기도 화성시 (샘플 주소)","copyrightRu":"© 2026 Handmade. Все права защищены.","copyrightKo":"© 2026 Handmade. All rights reserved."})
  const [footerSaving, setFooterSaving] = useState(false)
  const [customOrderReplies, setCustomOrderReplies] = useState({})
  const [sendingCustomOrderId, setSendingCustomOrderId] = useState(null)
  // Удаляем только заранее известные демонстрационные записи, созданные шаблоном сайта.
  // Публикации пользователей, заявки, регистрации и заказы не затрагиваются.
  useEffect(() => {
    if (!isFirebase || !isAdmin) return
    const demoIds = {
      products: Array.from({ length: 12 }, (_, i) => 'p' + String(i + 1).padStart(2, '0')),
      articles: ['t1', 't2', 't3', 't4', 't5', 't6'],
      classes: ['c1', 'c2', 'c3', 'c4', 'c5', 'c6'],
      artists: ['a1', 'a2', 'a3', 'a4'],
      artistCollections: ['k1', 'k2'],
      events: ['e1', 'e2', 'e3', 'e4', 'e5', 'e6', 'e7', 'e8']
    }
    Promise.all(Object.entries(demoIds).flatMap(([collection, ids]) =>
      ids.map((id) => F.deleteDoc(F.doc(F.db, collection, id)))
    )).catch((error) => console.error('Demo content cleanup error:', error))
  }, [isFirebase, isAdmin])
  useEffect(() => {
    if (!isFirebase) return
    F.getDoc(F.doc(F.db, 'siteSettings', 'payment')).then((snap) => {
      if (snap.exists()) setBankForm((prev) => ({ ...prev, ...snap.data() }))
    }).catch((error) => console.error('Bank settings load error:', error))
  }, [isFirebase])
  useEffect(() => {
    if (!isFirebase) return
    F.getDoc(F.doc(F.db, 'siteSettings', 'support')).then((snap) => {
      if (snap.exists()) setSupportForm((prev) => ({ ...prev, ...snap.data() }))
    }).catch((error) => console.error('Support settings load error:', error))
  }, [isFirebase])
  useEffect(() => {
    if (!isFirebase) return
    F.getDoc(F.doc(F.db, 'siteSettings', 'footer')).then((snap) => {
      if (snap.exists()) setFooterForm((prev) => ({ ...prev, ...snap.data() }))
    }).catch((error) => console.error('Footer settings load error:', error))
  }, [isFirebase])
  const saveFooterDetails = async () => {
    if (!isFirebase) { alert('Firebase 연결이 필요합니다.'); return }
    setFooterSaving(true)
    try {
      await F.setDoc(F.doc(F.db, 'siteSettings', 'footer'), footerForm, { merge: true })
      alert(lang === 'ru' ? 'Данные нижнего блока сайта сохранены.' : '사이트 하단 정보가 저장되었습니다.')
    } catch (error) {
      console.error('Footer settings save error:', error)
      alert(lang === 'ru' ? 'Не удалось сохранить данные нижнего блока.' : '사이트 하단 정보 저장에 실패했습니다.')
    } finally { setFooterSaving(false) }
  }
  const saveSupportDetails = async () => {
    if (!supportForm.phone.trim() || !supportForm.email.trim()) {
      alert(lang === 'ru' ? 'Укажите телефон и электронную почту.' : '전화번호와 이메일을 입력해 주세요.')
      return
    }
    if (!isFirebase) { alert('Firebase 연결이 필요합니다.'); return }
    setSupportSaving(true)
    try {
      await F.setDoc(F.doc(F.db, 'siteSettings', 'support'), supportForm, { merge: true })
      alert(lang === 'ru' ? 'Данные службы поддержки сохранены.' : '고객센터 정보가 저장되었습니다.')
    } catch (error) {
      console.error('Support settings save error:', error)
      alert(lang === 'ru' ? 'Не удалось сохранить данные службы поддержки.' : '고객센터 정보 저장에 실패했습니다.')
    } finally { setSupportSaving(false) }
  }
  const saveBankDetails = async () => {
    if (!bankForm.bank.trim() || !bankForm.account.trim() || !bankForm.holder.trim()) {
      alert(lang === 'ru' ? 'Заполните все банковские реквизиты.' : '은행 정보를 모두 입력해 주세요.')
      return
    }
    if (!isFirebase) { alert('Firebase 연결이 필요합니다.'); return }
    setBankSaving(true)
    try {
      await F.setDoc(F.doc(F.db, 'siteSettings', 'payment'), bankForm, { merge: true })
      alert(lang === 'ru' ? 'Банковские реквизиты сохранены.' : '입금 계좌 정보가 저장되었습니다.')
    } catch (error) {
      console.error('Bank settings save error:', error)
      alert(lang === 'ru' ? 'Не удалось сохранить реквизиты.' : '계좌 정보 저장에 실패했습니다.')
    } finally { setBankSaving(false) }
  }
  const sendCustomOrderReply = async (request) => {
    const message = String(customOrderReplies[request.id] || '').trim()
    if (!request.email) {
      alert(lang === 'ru' ? 'У этой заявки нет адреса электронной почты.' : '이 문의에는 이메일 주소가 없습니다.')
      return
    }
    if (!message) {
      alert(lang === 'ru' ? 'Напишите текст ответа.' : '답변 내용을 입력해 주세요.')
      return
    }
    if (!user || !isFirebase) {
      alert(lang === 'ru' ? 'Необходимо войти в аккаунт администратора.' : '관리자 계정 로그인이 필요합니다.')
      return
    }
    setSendingCustomOrderId(request.id)
    try {
      const token = await user.getIdToken()
      const response = await fetch('/api/send-custom-order-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ requestId: request.id, message })
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.error || 'EMAIL_SEND_FAILED')
      setCustomOrderReplies((prev) => ({ ...prev, [request.id]: '' }))
      alert(lang === 'ru' ? 'Письмо успешно отправлено клиенту.' : '고객에게 이메일을 성공적으로 보냈습니다.')
    } catch (error) {
      console.error('Custom order reply error:', error)
      alert(lang === 'ru'
        ? `Не удалось отправить письмо: ${error.message}`
        : `이메일 전송 실패: ${error.message}`)
    } finally {
      setSendingCustomOrderId(null)
    }
  }

  const [selectedMasterUid, setSelectedMasterUid] = useState(null)
  const [eventForm, setEventForm] = useState({
  ymd: '',
  time: '',
  type: '수업',
  title: '',
  titleRu: '',
  place: '',
  images: [],
  cap: 8,
  online: false
})
  const [editingEventId, setEditingEventId] = useState(null)
  const [selectedScheduleYear, setSelectedScheduleYear] = useState(String(new Date().getFullYear()))
  const [selectedScheduleMonth, setSelectedScheduleMonth] = useState(String(new Date().getMonth() + 1).padStart(2, '0'))
  const [showScheduleForm, setShowScheduleForm] = useState(false)
  const [previewWork, setPreviewWork] = useState(null)
  const [editingArtistWork, setEditingArtistWork] = useState(null)
  const [productForm, setProductForm] = useState({
  name: '',
  nameRu: '',
  price: '',
  stock: '0',
  cat: 'bag',
  images: [''],
  desc: '',
  descRu: '',
  material: '',
  colors: [''],
  sizes: [''],
  published: true,
  artist: 'a1'
})

const [classForm, setClassForm] = useState({ title:'', titleRu:'', intro:'', introRu:'', artist:'a2', price:'0', field:'뜨개질', fieldRu:'Вязание', level:'초급', levelRu:'Начальный', minutes:'60', type:'무료', typeRu:'Бесплатно', thumb:'', kind:'동영상', kindRu:'Видео', cat:'knit', kit:false, materialsText:'', lessonsText:'Подготовка и инструменты|10' })
const [artistForm, setArtistForm] = useState({ id:'', name:'', field:'', fieldRu:'', bio:'', bioRu:'', cover:'', story:'', storyRu:'', followers:'0', newsText:'' })
const [editingArtistId, setEditingArtistId] = useState(null)
const [collectionForm, setCollectionForm] = useState({ id:'', title:'', titleRu:'', desc:'', descRu:'', productIds:'' })
const [editingCollectionId, setEditingCollectionId] = useState(null)
const [editingClassId, setEditingClassId] = useState(null)
const [selectedMasterclassView, setSelectedMasterclassView] = useState('cards')
const [editingProductId, setEditingProductId] = useState(null)
  const [selectedProductCategory, setSelectedProductCategory] = useState('add')
  const [previewProduct, setPreviewProduct] = useState(false)
  const [articleForm, setArticleForm] = useState({
  title: '',
  titleRu: '',
  tag: '정보',
  date: new Date().toISOString().slice(0, 10),
  excerpt: '',
  excerptRu: '',
  thumb: '',
  images: [],  
  body: [{
  heading: '',
  text: '',
  headingRu: '',
  textRu: ''
}],
  published: true
})
const [editingArticleId, setEditingArticleId] = useState(null)
const [selectedArticleView, setSelectedArticleView] = useState('menu')
const [previewArticle, setPreviewArticle] = useState(false)
  const uploadImage = async (file) => {
  if (!file) return ''

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', 'teplo_ruk_upload')

  try {
    const response = await fetch(
      'https://api.cloudinary.com/v1_1/sfnfmwiv/image/upload',
      {
        method: 'POST',
        body: formData
      }
    )

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error?.message || 'Upload failed')
    }

    alert('Фотография успешно загружена!')
    return result.secure_url
  } catch (error) {
    console.error('Image upload error:', error)
    alert('Не удалось загрузить фотографию: ' + error.message)
    return ''
  }
}
  const saveProduct = async () => {
  if (!productForm.name || !productForm.nameRu || !productForm.price) {
    alert('Введите название на двух языках и цену.')
    return
  }

  if (!isFirebase) {
    alert('Firebase 연결이 필요합니다.')
    return
  }

  const data = {
    ...productForm,
    price: Number(productForm.price),
    stock: Math.max(0, Math.floor(Number(productForm.stock || 0))),
    images: productForm.images.filter(Boolean),
    colors: productForm.colors.filter(Boolean),
    sizes: productForm.sizes.filter(Boolean),
        artist: productForm.artist || 'a1',
    badges: [],
    soldOut: Number(productForm.stock || 0) <= 0,
    published: productForm.published !== false
  }

  try {
    if (editingProductId) {
      await F.setDoc(F.doc(F.db, 'products', editingProductId), data, { merge: true })
      alert('Товар обновлён.')
    } else {
      await F.addDoc(F.collection(F.db, 'products'), data)
      alert('Новый товар добавлен.')
    }

    setProductForm({
      name: '',
      nameRu: '',
      price: '',
      stock: '0',
      cat: 'bag',
      images: [''],
      desc: '',
      descRu: '',
      material: '',
      colors: [''],
      sizes: [''],
      published: true,
      artist: 'a1'
    })
    setEditingProductId(null)
  } catch (error) {
    console.error('Product save error:', error)
    alert('Не удалось сохранить товар.')
  }
}
  const deleteProduct = async (product) => {
  if (!window.confirm(`Удалить товар "${product.name}"?`)) return

  try {
    await F.deleteDoc(F.doc(F.db, 'products', product.id))
    alert('Товар удалён.')
  } catch (error) {
    console.error('Product delete error:', error)
    alert('Не удалось удалить товар.')
  }
}
  const resetClassForm = () => {
    setClassForm({ title:'', titleRu:'', intro:'', introRu:'', artist:'a2', price:'0', field:'뜨개질', fieldRu:'Вязание', level:'초급', levelRu:'Начальный', minutes:'60', type:'무료', typeRu:'Бесплатно', thumb:'', kind:'동영상', kindRu:'Видео', cat:'knit', kit:false, materialsText:'', lessonsText:'Подготовка и инструменты|10' })
    setEditingClassId(null)
  }
  const editClass = (item) => {
    setSelectedMasterclassView('add')
    setEditingClassId(item.id)
    setClassForm({ title:item.title||'', titleRu:item.titleRu||'', intro:item.intro||'', introRu:item.introRu||'', artist:item.artist||'a2', price:String(item.price??0), field:item.field||'', fieldRu:item.fieldRu||'', level:item.level||'초급', levelRu:item.levelRu||'Начальный', minutes:String(item.minutes||60), type:item.type||'무료', typeRu:item.typeRu||'Бесплатно', thumb:item.thumb||'', kind:item.kind||'동영상', kindRu:item.kindRu||'Видео', cat:item.cat||'knit', kit:!!item.kit, materialsText:(item.materials||[]).join('\n'), lessonsText:(item.lessons||[]).map(x=>x.join('|')).join('\n') })
    window.scrollTo({top:0,behavior:'smooth'})
  }
  const saveClass = async () => {
    if (!classForm.title.trim() || !classForm.titleRu.trim()) { alert('Введите название мастер-класса на русском и корейском языках.'); return }
    if (!isFirebase) { alert('Firebase 연결이 필요합니다.'); return }
    const data = { title:classForm.title.trim(), titleRu:classForm.titleRu.trim(), intro:classForm.intro||'', introRu:classForm.introRu||'', artist:classForm.artist, price:Math.max(0,Number(classForm.price||0)), field:classForm.field, fieldRu:classForm.fieldRu, level:classForm.level, levelRu:classForm.levelRu, minutes:Math.max(1,Number(classForm.minutes||60)), type:classForm.type, typeRu:classForm.typeRu, thumb:classForm.thumb.trim(), kind:classForm.kind, kindRu:classForm.kindRu, cat:classForm.cat, kit:!!classForm.kit, materials:classForm.materialsText.split('\n').map(x=>x.trim()).filter(Boolean), lessons:classForm.lessonsText.split('\n').map(line=>{const p=line.split('|');return [p[0]?.trim()||'',Math.max(1,Number(p[1]||10))]}).filter(x=>x[0]) }
    try { if(editingClassId) await F.setDoc(F.doc(F.db,'classes',editingClassId),data,{merge:true}); else await F.addDoc(F.collection(F.db,'classes'),data); resetClassForm(); alert('Мастер-класс сохранён. Каталог обновится автоматически.') }
    catch(error) { console.error('Class save error:',error); alert('Не удалось сохранить мастер-класс.') }
  }

  const resetArtistForm = () => { setArtistForm({ id:'', name:'', field:'', fieldRu:'', bio:'', bioRu:'', cover:'', story:'', storyRu:'', followers:'0', newsText:'' }); setEditingArtistId(null) }
  const editArtist = (artist) => {
    setEditingArtistId(artist.id)
    setArtistForm({ id:artist.id, name:artist.name||'', field:artist.field||'', fieldRu:artist.fieldRu||'', bio:artist.bio||'', bioRu:artist.bioRu||'', cover:artist.cover||'', story:artist.story||'', storyRu:artist.storyRu||'', followers:String(artist.followers||0), newsText:(artist.news||[]).map((item)=>item.join('|')).join('\n') })
    window.scrollTo({top:0,behavior:'smooth'})
  }
  const saveArtist = async () => {
    if (!artistForm.name.trim()) { alert('Введите имя мастера.'); return }
    if (!isFirebase) { alert('Firebase 연결이 필요합니다.'); return }
    const id = editingArtistId || artistForm.id.trim() || 'artist-' + Date.now()
    const data = { name:artistForm.name.trim(), field:artistForm.field, fieldRu:artistForm.fieldRu, bio:artistForm.bio, bioRu:artistForm.bioRu, cover:artistForm.cover.trim(), story:artistForm.story, storyRu:artistForm.storyRu, followers:Math.max(0,Number(artistForm.followers||0)), news:artistForm.newsText.split('\n').map(x=>x.split('|').map(v=>v.trim())).filter(x=>x.length>1&&x[0]&&x[1]) }
    try { await F.setDoc(F.doc(F.db,'artists',id),data,{merge:true}); resetArtistForm(); alert('Профиль мастера сохранён.') }
    catch(error) { console.error('Artist save error:',error); alert('Не удалось сохранить профиль мастера.') }
  }
  const deleteArtist = async (artist) => {
    if (!window.confirm('Удалить профиль мастера «'+artist.name+'»?')) return
    try { await F.deleteDoc(F.doc(F.db,'artists',artist.id)); alert('Профиль мастера удалён.') }
    catch(error) { console.error('Artist delete error:',error); alert('Не удалось удалить профиль мастера.') }
  }
  const resetCollectionForm = () => { setCollectionForm({ id:'', title:'', titleRu:'', desc:'', descRu:'', productIds:'' }); setEditingCollectionId(null) }
  const editCollection = (item) => {
    setEditingCollectionId(item.id)
    setCollectionForm({ id:item.id, title:item.title||'', titleRu:item.titleRu||'', desc:item.desc||'', descRu:item.descRu||'', productIds:(item.products||[]).join(', ') })
    window.scrollTo({top:0,behavior:'smooth'})
  }
  const saveCollection = async () => {
    if (!collectionForm.title.trim()) { alert('Введите название коллекции.'); return }
    if (!isFirebase) { alert('Firebase 연결이 필요합니다.'); return }
    const id = editingCollectionId || collectionForm.id.trim() || 'collection-' + Date.now()
    const data = { title:collectionForm.title.trim(), titleRu:collectionForm.titleRu.trim(), desc:collectionForm.desc, descRu:collectionForm.descRu, products:collectionForm.productIds.split(',').map(x=>x.trim()).filter(Boolean) }
    try { await F.setDoc(F.doc(F.db,'artistCollections',id),data,{merge:true}); resetCollectionForm(); alert('Сезонная коллекция сохранена.') }
    catch(error) { console.error('Collection save error:',error); alert('Не удалось сохранить коллекцию.') }
  }
  const deleteCollection = async (item) => {
    if (!window.confirm('Удалить коллекцию «'+item.title+'»?')) return
    try { await F.deleteDoc(F.doc(F.db,'artistCollections',item.id)); alert('Коллекция удалена.') }
    catch(error) { console.error('Collection delete error:',error); alert('Не удалось удалить коллекцию.') }
  }

  const deleteClass = async (item) => {
    if(!window.confirm('Удалить мастер-класс «'+(item.titleRu||item.title)+'»?')) return
    try { await F.deleteDoc(F.doc(F.db,'classes',item.id)); alert('Мастер-класс удалён.') }
    catch(error) { console.error('Class delete error:',error); alert('Не удалось удалить мастер-класс.') }
  }

  const saveArticle = async () => {
  if (!articleForm.title || !articleForm.titleRu) {
    alert('Введите название статьи на двух языках.')
    return
  }

  if (!isFirebase) {
    alert('Firebase 연결이 필요합니다.')
    return
  }

  const { body, ...articleFields } = articleForm

const data = {
  ...articleFields,
  thumb: articleForm.images?.[0] || articleForm.thumb || '',
  images: articleForm.images?.length
    ? articleForm.images
    : (articleForm.thumb ? [articleForm.thumb] : []),
  body: body
  .filter((s) => s.heading || s.text || s.headingRu || s.textRu)
  .map((s) => ({
    heading: s.heading || '',
    text: s.text || '',
    headingRu: s.headingRu || '',
    textRu: s.textRu || ''
  })),
  related: [],
  thread: [],
  published: articleForm.published !== false
}

  try {
    if (editingArticleId) {
      await F.setDoc(F.doc(F.db, 'articles', editingArticleId), data, { merge: true })
      alert('Статья обновлена.')
    } else {
      await F.addDoc(F.collection(F.db, 'articles'), data)
      alert('Новая статья добавлена.')
    }

    setArticleForm({
      title: '',
      titleRu: '',
      tag: '정보',
      date: new Date().toISOString().slice(0, 10),
      excerpt: '',
      excerptRu: '',
      thumb: '',
      body: [{
  heading: '',
  text: '',
  headingRu: '',
  textRu: ''
}],
      published: true
    })
    setEditingArticleId(null)
  } catch (error) {
    console.error('Article save error:', error)
    alert('Не удалось сохранить статью.')
  }
}
  const editProduct = (product) => {
  setSelectedProductCategory('add')
  setEditingProductId(product.id)

  setProductForm({
    name: product.name || '',
    nameRu: product.nameRu || '',
    price: product.price || '',
    stock: String(Math.max(0, Number(product.stock || 0))),
    cat: product.cat || 'bag',
    images: product.images?.length ? product.images : [''],
    desc: product.desc || '',
    descRu: product.descRu || '',
    material: product.material || '',
    colors: product.colors?.length ? product.colors : [''],
    sizes: product.sizes?.length ? product.sizes : [''],
    published: product.published !== false,
    artist: product.artist || 'a1'
  })

  window.scrollTo({ top: 0, behavior: 'smooth' })
}
  const editArticle = (article) => {
  setSelectedArticleView('add')
  setEditingArticleId(article.id)

  setArticleForm({
    title: article.title || '',
    titleRu: article.titleRu || '',
    tag: article.tag || '정보',
    date: article.date || '',
    excerpt: article.excerpt || '',
    excerptRu: article.excerptRu || '',
    thumb: article.thumb || '',
    images: article.images || (article.thumb ? [article.thumb] : []),
    body: article.body?.length
  ? article.body.map((s) => Array.isArray(s)
      ? {
          heading: s[0] || '',
          text: s[1] || '',
          headingRu: '',
          textRu: ''
        }
      : {
          heading: s.heading || '',
          text: s.text || '',
          headingRu: s.headingRu || '',
          textRu: s.textRu || ''
        })
  : [{
      heading: '',
      text: '',
      headingRu: '',
      textRu: ''
    }],
    published: article.published !== false
  })

  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const deleteArticle = async (article) => {
  if (!window.confirm(`Удалить статью "${article.title}"?`)) return

  try {
    await F.deleteDoc(F.doc(F.db, 'articles', article.id))
    alert('Статья удалена.')
  } catch (error) {
    console.error('Article delete error:', error)
    alert('Не удалось удалить статью.')
  }
}
 const addEvent = async () => {
  if (!eventForm.ymd || !eventForm.time || !eventForm.title) {
    alert('날짜, 시간, 수업명을 입력해 주세요.')
    return
  }

  if (!isFirebase) {
    alert('Firebase 연결이 필요합니다.')
    return
  }

 const [year, month, day] = eventForm.ymd.split('-')

  try {
    await F.addDoc(F.collection(F.db, 'events'), {
      ...eventForm,
      date: `${month}/${day}`,
      cap: Number(eventForm.cap),
      joined: 0,
      cls: ''
    })

    setEventForm({
      ymd: '',
      time: '',
      type: '수업',
      title: '',
      titleRu: '',
      place: '',
      images: [],
      cap: 8,
      online: false
    })

    alert('수업이 저장되었습니다.')
  } catch (error) {
    console.error('Event save error:', error)
    alert('저장에 실패했습니다.')
  }
} 
  const updateEvent = async () => {
  if (!editingEventId) return

  if (!eventForm.ymd || !eventForm.time || !eventForm.title) {
    alert('날짜, 시간, 수업명을 입력해 주세요.')
    return
  }

  try {
    const [year, month, day] = eventForm.ymd.split('-')

    await F.setDoc(F.doc(F.db, 'events', editingEventId), {
      ...eventForm,
      date: `${month}/${day}`,
      cap: Number(eventForm.cap)
    }, { merge: true })

    setEditingEventId(null)
    setEventForm({
      ymd: '',
      time: '',
      type: '수업',
      title: '',
      titleRu: '',
      place: '',
      images: [],
      cap: 8,
      online: false
    })

    alert('수업 일정이 수정되었습니다.')
  } catch (error) {
    console.error('Event update error:', error)
    alert('수정에 실패했습니다.')
  }
}
  const editEvent = (event) => {
  setEditingEventId(event.id)

  setEventForm({
    ymd: event.ymd || '',
    time: event.time || '',
    type: event.type || '수업',
    title: event.title || '',
    titleRu: event.titleRu || '',
    place: event.place || '',
    cap: event.cap || 8,
    online: event.online || false
  })

  window.scrollTo({ top: 0, behavior: 'smooth' })
}
    const deleteArtistWork = async (work) => {
    const confirmed = window.confirm(lang === 'ru'
      ? `Удалить работу «${work.titleRu || work.title || 'Без названия'}»? Она исчезнет из каталога мастеров.`
      : `‘${work.title || work.titleRu || '제목 없음'}’ 작품을 삭제하시겠습니까? 작가 작품 목록에서 사라집니다.`)
    if (!confirmed) return

    try {
      await F.deleteDoc(F.doc(F.db, 'artistWorks', work.id))
      if (previewWork?.id === work.id) setPreviewWork(null)
      alert(lang === 'ru' ? 'Работа удалена.' : '작품이 삭제되었습니다.')
    } catch (error) {
      console.error('Artist work delete error:', error)
      alert(lang === 'ru' ? 'Не удалось удалить работу.' : '작품 삭제에 실패했습니다.')
    }
  }

  const deleteEvent = async (event) => {
    if (!window.confirm(`Удалить занятие "${event.title}"?`)) return

    try {
      await F.deleteDoc(F.doc(F.db, 'events', event.id))
      alert('수업 일정이 삭제되었습니다.')
    } catch (error) {
      console.error('Event delete error:', error)
      alert('삭제에 실패했습니다.')
    }
  }

  if (!user || !isAdmin) {
    return (
      <main className="page">
        <h1>관리자 전용 페이지</h1>
        <p>관리자만 접근할 수 있습니다.</p>
      </main>
    )
  }

  const events = adminEvents
  const masterDirectory = Array.from(new Map(
    [
      ...masterApplications.map((master) => [master.uid, {
        uid: master.uid,
        name: master.name || master.email || master.uid,
        email: master.email || ''
      }]),
      ...artistWorks.map((work) => [work.artistUid, {
        uid: work.artistUid,
        name: work.artistName || work.artistUid,
        email: ''
      }])
    ].filter(([uid]) => uid)
  ).values()).sort((a, b) => a.name.localeCompare(b.name, lang === 'ru' ? 'ru' : 'ko'))
  const selectedMaster = masterDirectory.find((master) => master.uid === selectedMasterUid)
  const selectedMasterWorks = artistWorks.filter((work) => work.artistUid === selectedMasterUid)
    const updateProductField = (field, value) => {
    setProductForm((prev) => ({ ...prev, [field]: value }))
  }
  return (
    <main className="page admin-page" style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px' }}>
      <h1>{lang === 'ru' ? 'Панель администратора' : '관리자 페이지'}</h1>
      <p style={{ color: '#746b63', marginTop: 6, marginBottom: 22 }}>
        {lang === 'ru' ? 'Выберите раздел, которым хотите управлять.' : '관리할 메뉴를 선택하세요.'}
      </p>

      <nav aria-label={lang === 'ru' ? 'Меню администратора' : '관리자 메뉴'} style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
        gap: 10,
        marginBottom: 28
      }}>
        {[
          { id: 'overview', ru: 'Обзор', ko: '대시보드', icon: '⌂' },
          { id: 'orders', ru: 'Заказы и оплата', ko: '주문 및 결제', icon: '₩' },
          { id: 'masters', ru: 'Мастера и их работы', ko: '작가 및 작품', icon: '✿' },
          { id: 'artistCatalog', ru: 'Страница «Работы мастеров»', ko: '작가 작품 페이지 관리', icon: '▧' },
          { id: 'community', ru: 'Публикации сообщества', ko: '커뮤니티 게시글', icon: '✎' },
          { id: 'products', ru: 'Товары', ko: '상품 관리', icon: '▧' },
          { id: 'articles', ru: 'Статьи', ko: '아티클 관리', icon: '▤' },
          { id: 'masterclasses', ru: 'Мастер-классы', ko: '마스터클래스 관리', icon: '✿' },
          { id: 'schedule', ru: 'Расписание', ko: '수업 일정', icon: '▦' },
          { id: 'reservations', ru: 'Записи на занятия', ko: '수업 신청', icon: '☷' },
          { id: 'customOrders', ru: 'Индивидуальные заказы', ko: '주문제작 문의', icon: '✉' },
          { id: 'bank', ru: 'Банковские реквизиты', ko: '입금 계좌 관리', icon: '₩' },
          { id: 'support', ru: 'Служба поддержки', ko: '고객센터 정보', icon: '☎' },
          { id: 'footer', ru: 'Нижняя часть сайта', ko: '사이트 하단 정보', icon: '▤' }
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setActiveSection(item.id)
              if (item.id === 'articles') setSelectedArticleView('menu')
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            aria-current={activeSection === item.id ? 'page' : undefined}
            style={{
              minHeight: 58,
              padding: '13px 15px',
              borderRadius: 10,
              border: activeSection === item.id ? '2px solid #B8593B' : '1px solid #E5DCD2',
              background: activeSection === item.id ? '#F7EEE8' : '#fff',
              color: '#2F2B28',
              textAlign: 'left',
              cursor: 'pointer',
              fontWeight: activeSection === item.id ? 700 : 500
            }}
          >
            <span style={{ marginRight: 9, color: '#B8593B' }}>{item.icon}</span>
            {lang === 'ru' ? item.ru : item.ko}
          </button>
        ))}
      </nav>

      {activeSection === 'overview' && (
        <section>
          <h2>{lang === 'ru' ? 'Добро пожаловать в панель управления' : '관리자 대시보드'}</h2>
          <p>{lang === 'ru' ? 'Все инструменты сайта теперь собраны по отдельным разделам.' : '사이트 관리 기능이 메뉴별로 정리되어 있습니다.'}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12, marginTop: 20 }}>
            {[
              { id: 'masters', title: lang === 'ru' ? 'Заявки мастеров' : '작가 신청', count: masterApplications.filter((x) => x.status === 'pending').length + artistWorks.filter((x) => x.status !== 'approved').length, note: lang === 'ru' ? 'Требуют проверки' : '검토 필요' },
              { id: 'products', title: lang === 'ru' ? 'Товары' : '상품', count: products.length, note: lang === 'ru' ? 'В каталоге' : '등록됨' },
              { id: 'articles', title: lang === 'ru' ? 'Статьи' : '아티클', count: articles.length, note: lang === 'ru' ? 'Материалы' : '콘텐츠' },
              { id: 'schedule', title: lang === 'ru' ? 'Занятия' : '수업 일정', count: adminEvents.length, note: lang === 'ru' ? 'В расписании' : '등록됨' },
              { id: 'reservations', title: lang === 'ru' ? 'Записи' : '신청', count: adminReservations.length, note: lang === 'ru' ? 'Участники' : '신청자' },
              { id: 'customOrders', title: lang === 'ru' ? 'Индивидуальные заказы' : '주문제작 문의', count: customOrders.filter((x) => x.status === 'new').length, note: lang === 'ru' ? 'Новые запросы' : '새 문의' }
            ].map((item) => (
              <button key={item.id} type="button" onClick={() => setActiveSection(item.id)} style={{
                padding: 18, border: '1px solid #E5DCD2', borderRadius: 10,
                background: '#fff', textAlign: 'left', cursor: 'pointer', color: '#2F2B28'
              }}>
                <strong>{item.title}</strong>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#B8593B', margin: '8px 0 2px' }}>{item.count}</div>
                <small style={{ color: '#746b63' }}>{item.note}</small>
              </button>
            ))}
          </div>
        </section>
      )}

      {activeSection === 'orders' && <>
        <h2>{lang === 'ru' ? 'Заказы и подтверждение оплаты' : '주문 및 입금 확인'}</h2>
        <p className="muted">{lang === 'ru' ? 'После фактического поступления денег на счёт подтвердите оплату заказа. Покупатель увидит обновление в личном кабинете.' : '계좌 입금 확인 후 결제를 승인해 주세요. 고객 마이페이지에 상태가 반영됩니다.'}</p>
        {!isFirebase && <p>{lang === 'ru' ? 'Для управления заказами необходимо подключение Firebase.' : '주문 관리를 위해 Firebase 연결이 필요합니다.'}</p>}
        <p>{lang === 'ru' ? 'Всего заказов:' : '전체 주문:'} {adminOrders.length} · {lang === 'ru' ? 'Ожидают оплаты:' : '입금 대기:'} {adminOrders.filter((o) => o.paymentStatus !== 'paid' && o.orderStatus !== 'cancelled').length}</p>
        {adminOrders.length === 0 ? <p>{lang === 'ru' ? 'Заказов пока нет.' : '아직 주문이 없습니다.'}</p> : <div style={{ display: 'grid', gap: 14 }}>
          {adminOrders.map((o) => {
            const isBank = o.pay === '무통장입금'
            const isPaid = o.paymentStatus === 'paid'
            const isCancelled = o.orderStatus === 'cancelled'
            return <div className="box" key={o.id} style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                <strong>{o.no || o.id}</strong>
                <span className="badge line">{isPaid ? (lang === 'ru' ? 'Оплата завершена' : '결제 완료') : (lang === 'ru' ? 'Ожидание оплаты' : '결제 대기')}</span>
              </div>
              <label style={{ display: 'grid', gap: 6, maxWidth: 320, marginTop: 12 }}>
                <span>{lang === 'ru' ? 'Изменить статус заказа вручную' : '주문 상태 직접 변경'}</span>
                <select className="field" value={isCancelled ? 'cancelled' : (o.fulfillmentStatus || (isPaid ? 'paid' : 'awaiting_payment'))} onChange={async (e) => {
                  const nextStatus = e.target.value
                  if (!window.confirm(lang === 'ru' ? 'Изменить статус этого заказа?' : '이 주문 상태를 변경하시겠습니까?')) return
                  try {
                    await updateOrderStatus(o.id, nextStatus)
                    alert(lang === 'ru' ? 'Статус заказа обновлён.' : '주문 상태가 업데이트되었습니다.')
                  } catch (error) {
                    console.error('Manual order status update error:', error)
                    alert(lang === 'ru' ? (error.message || 'Не удалось изменить статус заказа.') : '주문 상태 변경에 실패했습니다.')
                  }
                }}>
                  <option value="awaiting_payment">{lang === 'ru' ? 'Ожидает оплаты' : '입금 대기'}</option>
                  <option value="paid">{lang === 'ru' ? 'Оплата завершена' : '결제 완료'}</option>
                  <option value="preparing">{lang === 'ru' ? 'Изготавливается' : '제작중'}</option>
                  <option value="shipped">{lang === 'ru' ? 'В пути' : '배송중'}</option>
                  <option value="delivered">{lang === 'ru' ? 'Доставлено' : '배송완료'}</option>
                  <option value="cancelled">{lang === 'ru' ? 'Заказ отменён' : '주문 취소'}</option>
                </select>
              </label>
              <p style={{ margin: '8px 0 4px' }}>{o.name || '-'} · {o.email || '-'} · {o.tel || '-'}</p>
              <p style={{ margin: '4px 0' }}><b>{Number(o.total || 0).toLocaleString('ko-KR')}원</b> · {o.pay || '-'} · {o.depositor ? (lang === 'ru' ? 'Отправитель: ' : '입금자: ') + o.depositor : ''}</p>
              <p className="muted" style={{ margin: '4px 0' }}>{o.addr || ''} {o.addr2 || ''}</p>
              {o.items?.map((item, index) => <p key={index} style={{ margin: '3px 0' }}>{lang === 'ru' ? (item.nameRu || item.name) : item.name} ({item.opt}) × {item.qty}</p>)}
              {o.cancellationRequest?.status === 'pending' && <div className="box" style={{ marginTop: 12, border: '1px solid #B8593B' }}>
                <strong>{lang === 'ru' ? 'Запрос на отмену заказа' : '주문 취소 요청'}</strong>
                <p style={{ whiteSpace: 'pre-wrap' }}>{o.cancellationRequest.reason}</p>
                <p className="muted">{o.cancellationRequest.submittedAt ? new Date(o.cancellationRequest.submittedAt).toLocaleString(lang === 'ru' ? 'ru-RU' : 'ko-KR') : ''}</p>
                <div className="acts">
                  <button type="button" className="btn" onClick={async () => {
                    if (!window.confirm(lang === 'ru' ? 'Подтвердить отмену этого заказа?' : '이 주문의 취소를 승인하시겠습니까?')) return
                    try { await reviewOrderCancellation(o.id, 'approved'); alert(lang === 'ru' ? 'Заказ отменён.' : '주문이 취소되었습니다.') }
                    catch (error) { console.error(error); alert(lang === 'ru' ? 'Не удалось подтвердить отмену.' : '취소 승인에 실패했습니다.') }
                  }}>{lang === 'ru' ? 'Подтвердить отмену' : '취소 승인'}</button>
                  <button type="button" className="btn ghost" onClick={async () => {
                    if (!window.confirm(lang === 'ru' ? 'Отклонить запрос на отмену?' : '취소 요청을 거절하시겠습니까?')) return
                    try { await reviewOrderCancellation(o.id, 'rejected'); alert(lang === 'ru' ? 'Запрос отклонён.' : '요청이 거절되었습니다.') }
                    catch (error) { console.error(error); alert(lang === 'ru' ? 'Не удалось отклонить запрос.' : '요청 거절에 실패했습니다.') }
                  }}>{lang === 'ru' ? 'Отклонить' : '거절'}</button>
                </div>
              </div>}
              {o.orderStatus === 'cancelled' && <p className="badge line" style={{ marginTop: 10 }}>{lang === 'ru' ? 'Заказ отменён' : '주문 취소 완료'}</p>}
              {!isCancelled && !isPaid && <button type="button" className="btn" style={{ marginTop: 10 }} onClick={async () => {
                if (!window.confirm(lang === 'ru' ? 'Подтвердить, что деньги по этому заказу поступили на счёт?' : '이 주문의 입금이 완료된 것을 확인하시겠습니까?')) return
                try {
                  await confirmOrderPayment(o.id)
                  alert(lang === 'ru' ? 'Оплата подтверждена. Статус заказа обновлён.' : '입금이 확인되었고 주문 상태가 업데이트되었습니다.')
                } catch (error) {
                  console.error('Order payment confirmation error:', error)
                  alert(lang === 'ru' ? 'Не удалось подтвердить оплату.' : '입금 확인에 실패했습니다.')
                }
              }}>{lang === 'ru' ? 'Подтвердить фактическое получение оплаты' : '실제 결제 확인 및 완료 처리'}</button>}
              {isPaid && o.paidAt && <p className="muted" style={{ marginTop: 8 }}>{lang === 'ru' ? 'Оплата подтверждена:' : '입금 확인:'} {new Date(o.paidAt).toLocaleString(lang === 'ru' ? 'ru-RU' : 'ko-KR')}</p>}
              {isPaid && !isCancelled && (() => {
                const stages = [
                  { id: 'preparing', ru: 'Изготавливается', ko: '제작중' },
                  { id: 'shipped', ru: 'В пути', ko: '배송중' },
                  { id: 'delivered', ru: 'Доставлено', ko: '배송완료' }
                ]
                const current = stages.findIndex((stage) => stage.id === o.fulfillmentStatus)
                return <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                  {stages.map((stage, index) => (
                    <button key={stage.id} type="button" className={current >= index ? 'btn ghost' : 'btn'} disabled={index > current + 1 || current >= index} onClick={async () => {
                      if (!window.confirm(lang === 'ru' ? `Изменить статус заказа на «${stage.ru}»?` : `주문 상태를 ‘${stage.ko}’(으)로 변경하시겠습니까?`)) return
                      try {
                        await updateOrderFulfillment(o.id, stage.id)
                        alert(lang === 'ru' ? 'Статус заказа обновлён.' : '주문 상태가 업데이트되었습니다.')
                      } catch (error) {
                        console.error('Order fulfillment update error:', error)
                        alert(lang === 'ru' ? 'Не удалось изменить статус заказа.' : '주문 상태 변경에 실패했습니다.')
                      }
                    }}>{lang === 'ru' ? stage.ru : stage.ko}</button>
                  ))}
                </div>
              })()}
              <div style={{ marginTop: 14 }}>
                <button type="button" className="btn ghost" onClick={() => setOrderToDelete(orderToDelete === o.id ? null : o.id)}>
                  {lang === 'ru' ? 'Удалить заказ' : '주문 삭제'}
                </button>
                {orderToDelete === o.id && <div className="box" style={{ marginTop: 10, border: '1px solid #B8593B', display: 'grid', gap: 8 }}>
                  <strong>{lang === 'ru' ? 'Как поступить с остатками товаров?' : '상품 재고를 어떻게 처리할까요?'}</strong>
                  <p className="muted" style={{ margin: 0 }}>{lang === 'ru' ? 'Выберите, вернуть ли количество товаров из этого заказа на склад.' : '이 주문의 상품 수량을 재고에 복원할지 선택해 주세요.'}</p>
                  <button type="button" className="btn" onClick={async () => {
                    if (!window.confirm(lang === 'ru' ? 'Удалить заказ и вернуть все его товары в остаток на складе?' : '주문을 삭제하고 모든 상품 수량을 재고에 복원하시겠습니까?')) return
                    try {
                      await deleteOrder(o.id, true)
                      setOrderToDelete(null)
                      alert(lang === 'ru' ? 'Заказ удалён, товары возвращены в остаток.' : '주문이 삭제되고 상품 재고가 복원되었습니다.')
                    } catch (error) {
                      console.error('Order deletion error:', error)
                      alert(lang === 'ru' ? (error.message || 'Не удалось удалить заказ.') : '주문 삭제에 실패했습니다.')
                    }
                  }}>{lang === 'ru' ? 'Удалить и вернуть товары на склад' : '삭제 후 재고 복원'}</button>
                  <button type="button" className="btn ghost" onClick={async () => {
                    if (!window.confirm(lang === 'ru' ? 'Удалить заказ без изменения остатков товаров?' : '재고 변경 없이 주문을 삭제하시겠습니까?')) return
                    try {
                      await deleteOrder(o.id, false)
                      setOrderToDelete(null)
                      alert(lang === 'ru' ? 'Заказ удалён. Остатки товаров не изменены.' : '주문이 삭제되었습니다. 재고는 변경되지 않았습니다.')
                    } catch (error) {
                      console.error('Order deletion error:', error)
                      alert(lang === 'ru' ? (error.message || 'Не удалось удалить заказ.') : '주문 삭제에 실패했습니다.')
                    }
                  }}>{lang === 'ru' ? 'Удалить без возврата товаров' : '재고 복원 없이 삭제'}</button>
                  <button type="button" className="btn ghost" onClick={() => setOrderToDelete(null)}>{lang === 'ru' ? 'Не удалять' : '취소'}</button>
                </div>}
              </div>
            </div>
          })}
        </div>}
      </>}
      {activeSection === 'artistCatalog' && <>
        <h2>{lang === 'ru' ? 'Страница «Работы мастеров»' : '작가 작품 페이지 관리'}</h2>
        <p className="muted">{lang === 'ru' ? 'Профили мастеров и сезонные подборки. Карточки товаров редактируются в разделе «Товары», независимые работы — в разделе «Мастера и их работы».' : '작가 프로필과 시즌 컬렉션을 관리합니다. 상품 카드는 상품 관리에서, 독립 작가 작품은 작가 및 작품에서 관리합니다.'}</p>
        <section className="box" style={{padding:18,margin:'18px 0'}}>
          <h3>{lang === 'ru' ? (editingArtistId ? 'Редактировать профиль мастера' : 'Добавить профиль мастера') : (editingArtistId ? '작가 프로필 수정' : '작가 프로필 추가')}</h3>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:10}}>
            {[['name','Имя мастера'],['field','Направление (KO)'],['fieldRu','Направление (RU)'],['bio','Краткое описание (KO)'],['bioRu','Краткое описание (RU)'],['cover','URL обложки'],['story','История мастера (KO)'],['storyRu','История мастера (RU)'],['followers','Количество подписчиков']].map(([key,label])=><label key={key} style={{display:'grid',gap:5}}><span>{label}</span><input className="field" value={artistForm[key]} onChange={e=>setArtistForm(p=>({...p,[key]:e.target.value}))} /></label>)}
          </div>
          <label style={{display:'grid',gap:5,marginTop:10}}><span>{lang === 'ru' ? 'Новости мастера (каждая строка: дата|текст)' : '작가 소식 (한 줄에 날짜|내용)'}</span><textarea className="field" rows={4} value={artistForm.newsText} onChange={e=>setArtistForm(p=>({...p,newsText:e.target.value}))}/></label>
          <div className="acts" style={{marginTop:12}}><button className="btn" type="button" onClick={saveArtist}>{lang === 'ru' ? 'Сохранить профиль' : '프로필 저장'}</button>{editingArtistId && <button className="btn ghost" type="button" onClick={resetArtistForm}>{lang === 'ru' ? 'Отмена' : '취소'}</button>}</div>
        </section>
        <h3>{lang === 'ru' ? 'Профили мастеров на странице' : '페이지의 작가 프로필'}</h3>
        <div style={{display:'grid',gap:8}}>{(artists?.length?artists:D.artists).map(a=><div className="box" key={a.id} style={{padding:12,display:'flex',justifyContent:'space-between',alignItems:'center',gap:10,flexWrap:'wrap'}}><strong>{a.name} · {a.fieldRu||a.field}</strong><div className="acts"><button className="btn ghost" type="button" onClick={()=>editArtist(a)}>{lang === 'ru'?'Редактировать':'수정'}</button><button className="btn ghost" type="button" onClick={()=>deleteArtist(a)}>{lang === 'ru'?'Удалить':'삭제'}</button></div></div>)}</div>
        <section className="box" style={{padding:18,margin:'24px 0'}}>
          <h3>{lang === 'ru' ? (editingCollectionId ? 'Редактировать сезонную коллекцию' : 'Добавить сезонную коллекцию') : (editingCollectionId ? '시즌 컬렉션 수정' : '시즌 컬렉션 추가')}</h3>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:10}}>{[['title','Название (KO)'],['titleRu','Название (RU)'],['desc','Описание (KO)'],['descRu','Описание (RU)'],['productIds','ID товаров через запятую']].map(([key,label])=><label key={key} style={{display:'grid',gap:5}}><span>{label}</span><input className="field" value={collectionForm[key]} onChange={e=>setCollectionForm(p=>({...p,[key]:e.target.value}))}/></label>)}</div>
          <div className="acts" style={{marginTop:12}}><button className="btn" type="button" onClick={saveCollection}>{lang === 'ru' ? 'Сохранить коллекцию' : '컬렉션 저장'}</button>{editingCollectionId && <button className="btn ghost" type="button" onClick={resetCollectionForm}>{lang === 'ru'?'Отмена':'취소'}</button>}</div>
        </section>
        <h3>{lang === 'ru' ? 'Сезонные коллекции' : '시즌 컬렉션'}</h3>
        <div style={{display:'grid',gap:8}}>{(artistCollections?.length?artistCollections:D.extras.collections).map(k=><div className="box" key={k.id} style={{padding:12,display:'flex',justifyContent:'space-between',alignItems:'center',gap:10,flexWrap:'wrap'}}><span><strong>{k.titleRu||k.title}</strong><small style={{display:'block',color:'#746b63'}}>{(k.products||[]).join(', ')}</small></span><div className="acts"><button className="btn ghost" type="button" onClick={()=>editCollection(k)}>{lang === 'ru'?'Редактировать':'수정'}</button><button className="btn ghost" type="button" onClick={()=>deleteCollection(k)}>{lang === 'ru'?'Удалить':'삭제'}</button></div></div>)}</div>
      </>}
      {activeSection === 'masters' && <>
      <h2>{lang === 'ru' ? 'Заявки мастеров' : '작가 신청 관리'}</h2>
      {!selectedMasterUid && <>
      {(() => {
        const newApplications = masterApplications.filter((application) => application.status === 'pending')
        const newWorkRequests = artistWorks.filter((work) => work.status === 'pending')
        const notificationCount = newApplications.length + newWorkRequests.length
        return (
          <section style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
              <h3 style={{ margin: 0 }}>{lang === 'ru' ? 'Новые уведомления' : '새 알림'}</h3>
              <span style={{ borderRadius: 20, padding: '4px 10px', background: notificationCount ? '#F7EEE8' : '#F1F1F1', color: notificationCount ? '#B8593B' : '#746b63', fontWeight: 700 }}>
                {notificationCount}
              </span>
            </div>
            {notificationCount === 0 ? (
              <p className="muted">{lang === 'ru' ? 'Новых заявок и запросов на добавление товаров нет.' : '새 작가 신청 및 작품 등록 요청이 없습니다.'}</p>
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                {newApplications.map((application) => (
                  <div key={application.id} className="box" style={{ padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <div>
                      <strong>{lang === 'ru' ? 'Новая заявка мастера' : '새 작가 신청'}</strong>
                      <p style={{ margin: '5px 0 0' }}>{application.name || application.email} · {application.craft || (lang === 'ru' ? 'Направление не указано' : '분야 미입력')}</p>
                    </div>
                    <button className="btn" type="button" onClick={() => { setSelectedMasterUid(application.uid); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
                      {lang === 'ru' ? 'Открыть мастера' : '작가 관리 열기'}
                    </button>
                  </div>
                ))}
                {newWorkRequests.map((work) => (
                  <div key={work.id} className="box" style={{ padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <div>
                      <strong>{lang === 'ru' ? 'Запрос на добавление товара' : '새 작품 등록 요청'}</strong>
                      <p style={{ margin: '5px 0 0' }}>{work.artistName || work.artistUid} · {lang === 'ru' ? (work.titleRu || work.title || 'Без названия') : (work.title || work.titleRu || '제목 없음')}</p>
                    </div>
                    <button className="btn" type="button" onClick={() => { setSelectedMasterUid(work.artistUid); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
                      {lang === 'ru' ? 'Проверить товар' : '작품 검토'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )
      })()}
      <h3>{lang === 'ru' ? 'Все заявки мастеров' : '전체 작가 신청'}</h3>
      {masterDirectory.length === 0 ? (
        <p>{lang === 'ru' ? 'Заявок пока нет.' : '작가 신청이 없습니다.'}</p>
      ) : (
        <div style={{ display: 'grid', gap: 8, marginBottom: 28 }}>
          {masterDirectory.map((master) => {
            const application = masterApplications.find((item) => item.uid === master.uid)
            const works = artistWorks.filter((work) => work.artistUid === master.uid)
            const waiting = works.filter((work) => work.status === 'pending').length
            return (
              <button key={master.uid} type="button" onClick={() => { setSelectedMasterUid(master.uid); window.scrollTo({ top: 0, behavior: 'smooth' }) }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, width: '100%', padding: '13px 16px', border: '1px solid #E5DCD2', borderRadius: 9, background: '#fff', color: '#2F2B28', textAlign: 'left', cursor: 'pointer' }}>
                <span><strong>{master.name}</strong>{master.email && <small style={{ display: 'block', color: '#746b63', marginTop: 3 }}>{master.email}</small>}</span>
                <span style={{ textAlign: 'right', whiteSpace: 'nowrap' }}><small>{application?.status || (lang === 'ru' ? 'Мастер' : '작가')}</small><small style={{ display: 'block', color: waiting ? '#B8593B' : '#746b63' }}>{lang === 'ru' ? 'Новых работ: ' : '새 작품: '}{waiting}</small></span>
                <span aria-hidden="true" style={{ color: '#B8593B', fontSize: 22 }}>›</span>
              </button>
            )
          })}
        </div>
      )}
      </>}
      {selectedMasterUid && <>
        <section style={{ marginTop: 18 }}>
          <button className="btn ghost" type="button" onClick={() => setSelectedMasterUid(null)} style={{ marginBottom: 18 }}>← {lang === 'ru' ? 'К списку заявок мастеров' : '작가 신청 목록으로'}</button>
          <h2 style={{ marginTop: 0 }}>{selectedMaster?.name || selectedMasterUid}</h2>
          {selectedMaster?.email && <p className="muted">{selectedMaster.email}</p>}
          {(() => {
            const application = masterApplications.find((item) => item.uid === selectedMasterUid)
            const isApproved = application?.status === 'approved'
            return (
              <div className="box" style={{ padding: 16, margin: '16px 0', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <strong style={{ width: '100%' }}>{lang === 'ru' ? 'Статус мастера' : '작가 상태'}: {application?.status || (lang === 'ru' ? 'Профиль мастера' : '작가 프로필')}</strong>
                {application && !isApproved && (
                  <button className="btn" type="button" onClick={async () => {
                    try {
                      await F.setDoc(F.doc(F.db, 'masterProfiles', application.uid), {
                        uid: application.uid,
                        name: application.name || '',
                        email: application.email || '',
                        craft: application.craft || '',
                        bio: application.bio || '',
                        portfolio: application.portfolio || '',
                        status: 'approved',
                        approvedAt: new Date().toISOString()
                      })
                      await F.setDoc(F.doc(F.db, 'masterApplications', application.uid), { status: 'approved', reviewedAt: new Date().toISOString() }, { merge: true })
                      alert(lang === 'ru' ? 'Мастер одобрен.' : '작가가 승인되었습니다.')
                    } catch (error) {
                      console.error('Master approval error:', error)
                      alert(lang === 'ru' ? 'Не удалось одобрить заявку.' : '승인에 실패했습니다.')
                    }
                  }}>{lang === 'ru' ? 'Одобрить мастера' : '작가 승인'}</button>
                )}
                {application?.status === 'pending' && (
                  <button className="btn ghost" type="button" onClick={async () => {
                    try {
                      await F.setDoc(F.doc(F.db, 'masterApplications', application.uid), { status: 'rejected', reviewedAt: new Date().toISOString() }, { merge: true })
                      alert(lang === 'ru' ? 'Заявка отклонена.' : '신청이 거절되었습니다.')
                    } catch (error) {
                      console.error('Master rejection error:', error)
                      alert(lang === 'ru' ? 'Не удалось отклонить заявку.' : '거절에 실패했습니다.')
                    }
                  }}>{lang === 'ru' ? 'Отклонить заявку' : '신청 거절'}</button>
                )}
                {isApproved && (
                  <button className="btn ghost" type="button" onClick={async () => {
                    const confirmed = window.confirm(lang === 'ru'
                      ? `Удалить мастера «${application.name || application.email}»? Доступ к кабинету мастера будет закрыт.`
                      : `‘${application.name || application.email}’ 작가 권한을 해제하시겠습니까?`)
                    if (!confirmed) return
                    try {
                      await F.deleteDoc(F.doc(F.db, 'masterProfiles', application.uid))
                      await F.setDoc(F.doc(F.db, 'masterApplications', application.uid), { status: 'removed', reviewedAt: new Date().toISOString() }, { merge: true })
                      alert(lang === 'ru' ? 'Статус мастера удалён. Заявку можно подать повторно.' : '작가 권한이 해제되었습니다.')
                    } catch (error) {
                      console.error('Master removal error:', error)
                      alert(lang === 'ru' ? 'Не удалось удалить статус мастера.' : '작가 권한 해제에 실패했습니다.')
                    }
                  }}>{lang === 'ru' ? 'Удалить мастера' : '작가 권한 해제'}</button>
                )}
              </div>
            )
          })()}
          <p>{lang === 'ru' ? 'Всего работ: ' : '전체 작품: '}{selectedMasterWorks.length}</p>
          {selectedMasterWorks.length === 0 ? <p className="muted">{lang === 'ru' ? 'У этого мастера пока нет работ.' : '이 작가가 등록한 작품이 없습니다.'}</p> :
            <div style={{ display: 'grid', gap: 14 }}>
              {selectedMasterWorks.map((work) => <div className="box" key={work.id} style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 14, padding: 16 }}>
                {work.image && <img src={work.image} alt={work.title || ''} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 8 }} />}
                <div>
                  <b>{lang === 'ru' ? (work.titleRu || work.title) : (work.title || work.titleRu)}</b>
                  <p>{lang === 'ru' ? (work.descriptionRu || work.description) : (work.description || work.descriptionRu)}</p>
                  <p>{Number(work.price || 0).toLocaleString('ko-KR')} ₩</p>
                  <p className="muted">{lang === 'ru' ? 'Статус: ' : '상태: '}{work.status === 'approved' ? (lang === 'ru' ? 'Опубликована' : '공개') : work.status === 'rejected' ? (lang === 'ru' ? 'Отклонена' : '수정 요청') : (lang === 'ru' ? 'На проверке' : '검토 중')}</p>
                  <div className="acts">
                    <button className="btn ghost" onClick={() => setPreviewWork(work)}>{lang === 'ru' ? 'Предпросмотр' : '미리보기'}</button>
                    <button className="btn ghost" type="button" onClick={() => setEditingArtistWork(work)}>{lang === 'ru' ? 'Редактировать' : '수정'}</button>
                    {work.status !== 'approved' && <button className="btn" onClick={async () => { try { await F.setDoc(F.doc(F.db, 'artistWorks', work.id), { status: 'approved', reviewedAt: new Date().toISOString() }, { merge: true }); alert(lang === 'ru' ? 'Работа опубликована.' : '작품이 공개되었습니다.') } catch (error) { console.error(error); alert(lang === 'ru' ? 'Не удалось одобрить работу.' : '승인에 실패했습니다.') } }}>{lang === 'ru' ? 'Одобрить и опубликовать' : '승인 및 공개'}</button>}
                    {work.status === 'approved' && <button className="btn ghost" onClick={async () => { try { await F.setDoc(F.doc(F.db, 'artistWorks', work.id), { status: 'rejected', reviewedAt: new Date().toISOString() }, { merge: true }); alert(lang === 'ru' ? 'Работа снята с публикации.' : '작품 공개가 중단되었습니다.') } catch (error) { console.error(error); alert(lang === 'ru' ? 'Не удалось изменить статус.' : '상태 변경에 실패했습니다.') } }}>{lang === 'ru' ? 'Снять с публикации' : '공개 중단'}</button>}
                    {work.status !== 'rejected' && <button className="btn ghost" onClick={async () => { try { await F.setDoc(F.doc(F.db, 'artistWorks', work.id), { status: 'rejected', reviewedAt: new Date().toISOString() }, { merge: true }); alert(lang === 'ru' ? 'Работа возвращена на доработку.' : '수정 요청으로 변경되었습니다.') } catch (error) { console.error(error); alert(lang === 'ru' ? 'Не удалось изменить статус.' : '상태 변경에 실패했습니다.') } }}>{lang === 'ru' ? 'Отклонить' : '수정 요청'}</button>}
                    <button className="btn ghost" onClick={() => deleteArtistWork(work)}>{lang === 'ru' ? 'Удалить работу' : '작품 삭제'}</button>
                  </div>
                </div>
              </div>)}
            </div>
          }
        </section>
      )}
      </>}
      {editingArtistWork && (
        <div role="dialog" aria-modal="true" aria-label={lang === 'ru' ? 'Редактирование работы' : '작품 수정'} style={{ position: 'fixed', inset: 0, zIndex: 1001, background: 'rgba(30,25,22,.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18, overflowY: 'auto' }}>
          <form className="box" onSubmit={async (event) => {
            event.preventDefault()
            const form = event.currentTarget
            const changes = { title: form.title.value.trim(), titleRu: form.titleRu.value.trim(), description: form.description.value.trim(), descriptionRu: form.descriptionRu.value.trim(), price: Number(form.price.value || 0), category: form.category.value, image: form.image.value.trim() }
            if (!changes.title || !changes.image || !Number.isFinite(changes.price) || changes.price < 0) { alert(lang === 'ru' ? 'Проверьте название, фото и цену.' : '제목, 사진, 가격을 확인해 주세요.'); return }
            try {
              await F.setDoc(F.doc(F.db, 'artistWorks', editingArtistWork.id), { ...changes, updatedAt: new Date().toISOString() }, { merge: true })
              setEditingArtistWork(null)
              alert(lang === 'ru' ? 'Работа обновлена.' : '작품이 수정되었습니다.')
            } catch (error) { console.error(error); alert(lang === 'ru' ? 'Не удалось сохранить работу.' : '작품 저장에 실패했습니다.') }
          }} style={{ width: '100%', maxWidth: 620, maxHeight: '92vh', overflowY: 'auto', padding: 22, background: '#fff' }}>
            <h2>{lang === 'ru' ? 'Редактирование работы мастера' : '작가 작품 수정'}</h2>
            <label>{lang === 'ru' ? 'Название (корейский/основное)' : '작품명'}<input className="field" name="title" defaultValue={editingArtistWork.title || ''} required /></label>
            <label>{lang === 'ru' ? 'Название на русском' : '러시아어 작품명'}<input className="field" name="titleRu" defaultValue={editingArtistWork.titleRu || ''} /></label>
            <label>{lang === 'ru' ? 'Описание' : '설명'}<textarea className="field" name="description" rows={3} defaultValue={editingArtistWork.description || ''} /></label>
            <label>{lang === 'ru' ? 'Описание на русском' : '러시아어 설명'}<textarea className="field" name="descriptionRu" rows={3} defaultValue={editingArtistWork.descriptionRu || ''} /></label>
            <label>{lang === 'ru' ? 'Цена (₩)' : '가격 (₩)'}<input className="field" name="price" type="number" min="0" defaultValue={editingArtistWork.price || 0} /></label>
            <label>{lang === 'ru' ? 'Категория' : '카테고리'}<select className="field" name="category" defaultValue={editingArtistWork.category || 'accessory'}>{[['accessory','Аксессуары / 액세서리'],['bag','Сумки / 가방'],['home','Для дома / 홈'],['clothes','Одежда / 의류'],['knit','Вязание / 뜨개'],['embroidery','Вышивка / 자수']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></label>
            <label>{lang === 'ru' ? 'Ссылка на фотографию' : '사진 URL'}<input className="field" name="image" defaultValue={editingArtistWork.image || ''} required /></label>
            <div className="acts" style={{ marginTop: 16 }}><button className="btn">{lang === 'ru' ? 'Сохранить' : '저장'}</button><button className="btn ghost" type="button" onClick={() => setEditingArtistWork(null)}>{lang === 'ru' ? 'Отмена' : '취소'}</button></div>
          </form>
        </div>
      )}
      {previewWork && (
        <div role="dialog" aria-modal="true" aria-label={lang === 'ru' ? 'Предпросмотр публикации' : '게시 미리보기'} onClick={() => setPreviewWork(null)} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(30, 25, 22, .65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, overflowY: 'auto' }}>
          <div className="box" onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', padding: 22, background: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <h2 style={{ margin: 0 }}>{lang === 'ru' ? 'Предпросмотр публикации' : '게시 미리보기'}</h2>
              <button className="btn ghost" onClick={() => setPreviewWork(null)}>{lang === 'ru' ? 'Закрыть' : '닫기'}</button>
            </div>
            <p className="muted" style={{ marginBottom: 12 }}>{lang === 'ru' ? 'Так работа будет выглядеть в разделе «Работы мастеров».' : '작가 작품 페이지에 표시될 모습입니다.'}</p>
            <article className="box" style={{ padding: 14 }}>
              <img src={previewWork.image} alt={lang === 'ru' ? previewWork.titleRu : previewWork.title} style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', borderRadius: 8 }} />
              <h3 style={{ marginTop: 10 }}>{lang === 'ru' ? (previewWork.titleRu || previewWork.title) : (previewWork.title || previewWork.titleRu)}</h3>
              <p className="muted" style={{ marginTop: 8, marginBottom: 6 }}>{lang === 'ru' ? 'Описание' : '설명'}</p>
              <p>{lang === 'ru' ? (previewWork.descriptionRu || previewWork.description || 'Описание не добавлено') : (previewWork.description || previewWork.descriptionRu || '설명이 없습니다')}</p>
              <p className="muted" style={{ marginTop: 10 }}>{lang === 'ru' ? 'Категория' : '카테고리'}: {{
                accessory: lang === 'ru' ? 'Аксессуары' : '액세서리',
                bag: lang === 'ru' ? 'Сумки и шитьё' : '가방·바느질',
                home: lang === 'ru' ? 'Для дома' : '홈 인테리어',
                clothes: lang === 'ru' ? 'Одежда' : '의류',
                knit: lang === 'ru' ? 'Вязание' : '뜨개질',
                embroidery: lang === 'ru' ? 'Вышивка' : '자수'
              }[previewWork.category] || previewWork.category || '—'}</p>
              <b>{Number(previewWork.price || 0).toLocaleString('ko-KR')} ₩</b>
              <p className="muted">{previewWork.artistName || previewWork.artistUid}</p>
            </article>
            <div className="acts" style={{ marginTop: 16 }}>
              <button className="btn ghost" onClick={() => setPreviewWork(null)}>{lang === 'ru' ? 'Вернуться к проверке' : '검토로 돌아가기'}</button>
            </div>
          </div>
        </div>
      )}
      </>}
      {activeSection === 'community' && <>
        <h2>{lang === 'ru' ? 'Публикации сообщества' : '커뮤니티 게시글 관리'}</h2>
        <div style={{ margin: '14px 0' }}>
          <input
            className="field"
            type="search"
            value={communitySearch}
            onChange={(e) => { setCommunitySearch(e.target.value); setSelectedCommunityAuthor(null) }}
            placeholder={lang === 'ru' ? 'Поиск по имени или публикации' : '작성자 이름 또는 게시글 검색'}
            aria-label={lang === 'ru' ? 'Поиск по имени или публикации' : '작성자 이름 또는 게시글 검색'}
          />
        </div>
        {(() => {
          const query = communitySearch.trim().toLocaleLowerCase()
          const getAuthorName = (post) => post.author || post.authorName || post.uid || (lang === 'ru' ? 'Пользователь' : '사용자')
          const getAuthorKey = (post) => String(post.uid || post.authorUid || getAuthorName(post))
          const authors = Object.values(posts.reduce((groups, post) => {
            const key = getAuthorKey(post)
            if (!groups[key]) groups[key] = { key, name: getAuthorName(post), posts: [] }
            groups[key].posts.push(post)
            return groups
          }, {}))
            .filter((author) => !query ||
              author.name.toLocaleLowerCase().includes(query) ||
              author.posts.some((post) => [post.title, post.body, ...(post.tags || [])].join(' ').toLocaleLowerCase().includes(query)))
            .sort((a, b) => a.name.localeCompare(b.name, lang === 'ru' ? 'ru' : 'ko'))
          const selectedAuthor = authors.find((author) => author.key === selectedCommunityAuthor)
          const visiblePosts = selectedAuthor ? selectedAuthor.posts.filter((post) =>
            !query || selectedAuthor.name.toLocaleLowerCase().includes(query) ||
            [post.title, post.body, ...(post.tags || [])].join(' ').toLocaleLowerCase().includes(query)
          ) : []
          return !posts.length ? (
            <p className="muted">{lang === 'ru' ? 'Публикаций пока нет.' : '게시글이 없습니다.'}</p>
          ) : selectedAuthor ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
                <button type="button" className="btn ghost" onClick={() => setSelectedCommunityAuthor(null)}>
                  {lang === 'ru' ? '← Все авторы' : '← 전체 작성자'}
                </button>
                <h3 style={{ margin: 0 }}>{selectedAuthor.name}</h3>
              </div>
              {!visiblePosts.length ? <p className="muted">{lang === 'ru' ? 'Публикаций не найдено.' : '게시글이 없습니다.'}</p> : (
                <div style={{ display: 'grid', gap: 12 }}>
                  {visiblePosts.map((post) => <div className="box" key={post.id} style={{ padding: 16 }}>
                    <b>{post.title || (lang === 'ru' ? 'Без заголовка' : '제목 없음')}</b>
                    <p className="muted">{post.author || post.uid} · {post.board || ''}</p>
                    <p style={{ whiteSpace: 'pre-wrap' }}>{(post.body || '').slice(0, 260)}</p>
                    {post.images?.length > 0 && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{post.images.map((src, i) => <img key={i} src={src} alt="" style={{ width: 76, height: 76, objectFit: 'cover', borderRadius: 7 }} />)}</div>}
                    <div className="acts" style={{ marginTop: 10 }}>
                      <button className="btn ghost" type="button" onClick={async () => {
                        if (!window.confirm(lang === 'ru' ? 'Удалить эту публикацию? Это действие нельзя отменить.' : '이 게시글을 삭제하시겠습니까?')) return
                        try {
                          await F.deleteDoc(F.doc(F.db, 'posts', post.id))
                          setSelectedCommunityAuthor(null)
                          alert(lang === 'ru' ? 'Публикация удалена.' : '게시글이 삭제되었습니다.')
                        } catch (error) {
                          console.error(error)
                          alert(lang === 'ru' ? 'Не удалось удалить публикацию.' : '게시글 삭제에 실패했습니다.')
                        }
                      }}>{lang === 'ru' ? 'Удалить публикацию' : '게시글 삭제'}</button>
                    </div>
                  </div>)}
                </div>
              )}
            </div>
          ) : (
            <div>
              <p className="muted">{lang === 'ru' ? 'Авторы по алфавиту' : '작성자 이름순'}</p>
              {!authors.length ? <p className="muted">{lang === 'ru' ? 'Ничего не найдено.' : '검색 결과가 없습니다.'}</p> : (
                <ul className="list">
                  {authors.map((author) => <li key={author.key} style={{ padding: '10px 0' }}>
                    <button type="button" className="btn ghost" style={{ border: 0, width: '100%', justifyContent: 'flex-start' }} onClick={() => setSelectedCommunityAuthor(author.key)}>
                      {author.name}
                    </button>
                  </li>)}
                </ul>
              )}
            </div>
          )
        })()}
      </>}
      {activeSection === 'products' && <>
            <h2>{lang === 'ru' ? 'Управление товарами' : '상품 관리'}</h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, margin: '18px 0 24px' }}>
        <button type="button" className="btn" onClick={() => { setEditingProductId(null); setProductForm({ name: '', nameRu: '', price: '', stock: '0', cat: 'bag', images: [''], desc: '', descRu: '', material: '', colors: [''], sizes: [''], published: true, artist: 'a1' }); setSelectedProductCategory('add') }}>
          {lang === 'ru' ? '+ Добавить товар' : '+ 상품 추가'}
        </button>
        {[
          ['bag', 'Сумки и шитьё', '가방·바느질'],
          ['knit', 'Вязание', '뜨개질'],
          ['felt', 'Фетр и валяние', '펠트·양모펠트'],
          ['clothes', 'Одежда ручной работы', '수제 옷'],
          ['deco', 'Декор и декупаж', '데코·데코파주'],
          ['accessory', 'Аксессуары', '액세서리'],
          ['home', 'Для дома', '홈 인테리어']
        ].map(([id, ruName, koName]) => (
          <button key={id} type="button" className={selectedProductCategory === id ? 'btn' : 'btn ghost'} onClick={() => { setSelectedProductCategory(id); setEditingProductId(null) }}>
            {lang === 'ru' ? ruName : koName}
          </button>
        ))}
      </div>
      {selectedProductCategory === 'add' ? (
<div style={{ display: 'grid', gap: 10, maxWidth: 500, marginBottom: 30 }}>
<label>
  {lang === 'ru' ? 'Название товара (한국어)' : '상품명 (한국어)'}
  <input
    value={productForm.name}
    onChange={(e) => updateProductField('name', e.target.value)}
    placeholder="상품명"
  />
</label>

<label>
  {lang === 'ru' ? 'Название товара (русский)' : '상품명 (러시아어)'}
  <input
    value={productForm.nameRu}
    onChange={(e) => updateProductField('nameRu', e.target.value)}
    placeholder="Название товара"
  />
</label>

<label>
  {lang === 'ru' ? 'Мастер' : '작가'}
  <select className="field" value={productForm.artist || 'a1'} onChange={(e) => updateProductField('artist', e.target.value)}>
    {(artists?.length ? artists : D.artists).map((artist) => <option key={artist.id} value={artist.id}>{artist.name}</option>)}
  </select>
</label>

<label>
  {lang === 'ru' ? 'Цена (₩)' : '가격 (₩)'}
  <input
    type="number"
    value={productForm.price}
    onChange={(e) => updateProductField('price', e.target.value)}
    placeholder="100000"
  />
</label>

<label>
  {lang === 'ru' ? 'Количество на складе' : '재고 수량'}
  <input
    type="number"
    min="0"
    step="1"
    required
    value={productForm.stock}
    onChange={(e) => updateProductField('stock', e.target.value)}
    placeholder="0"
  />
</label>

<label>
  {lang === 'ru' ? 'Категория' : '카테고리'}
  <select
    value={productForm.cat}
    onChange={(e) => updateProductField('cat', e.target.value)}
  >
    <option value="bag">{lang === 'ru' ? 'Сумки и шитьё' : '가방·바느질'}</option>
    <option value="knit">{lang === 'ru' ? 'Вязание' : '뜨개질'}</option>
    <option value="felt">{lang === 'ru' ? 'Фетр и валяние' : '펠트·양모펠트'}</option>
    <option value="clothes">{lang === 'ru' ? 'Одежда ручной работы' : '수제 옷'}</option>
    <option value="deco">{lang === 'ru' ? 'Декор и декупаж' : '데코·데코파주'}</option>
    <option value="accessory">{lang === 'ru' ? 'Аксессуары' : '액세서리'}</option>
    <option value="home">{lang === 'ru' ? 'Для дома' : '홈 인테리어'}</option>
  </select>
</label>

<label>
  {lang === 'ru' ? 'Фотографии товара' : '상품 사진'}

  <input
    type="url"
    className="field"
    value={productForm.images[0] || ''}
    onChange={(e) => setProductForm((prev) => ({
      ...prev,
      images: [e.target.value, ...(prev.images || []).slice(1)]
    }))}
    placeholder={lang === 'ru' ? 'Ссылка на первую фотографию' : '첫 번째 사진 URL'}
  />

  <span>
    {lang === 'ru' ? 'Или выберите несколько фотографий с компьютера:' : '또는 컴퓨터에서 사진 여러 장 선택:'}
  </span>

  <input
    type="file"
    className="field"
    accept="image/png,image/jpeg,image/webp"
    multiple
    onChange={async (e) => {
      const files = Array.from(e.target.files || [])
      if (!files.length) return

      const urls = await Promise.all(
        files.map((file) => uploadImage(file))
      )

      setProductForm((prev) => ({
        ...prev,
        images: [
          ...(prev.images || []).filter(Boolean),
          ...urls.filter(Boolean)
        ]
      }))

      e.target.value = ''
    }}
  />

  <div style={{
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12
  }}>
    {(productForm.images || []).filter(Boolean).map((url, index) => (
      <div key={index} style={{ position: 'relative' }}>
        <img
          src={url}
          alt=""
          style={{
            width: 90,
            height: 90,
            objectFit: 'cover',
            borderRadius: 8
          }}
        />

        <button
          type="button"
          onClick={() => setProductForm((prev) => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
          }))}
        >
          ×
        </button>
      </div>
    ))}
  </div>
</label>

<label>
  {lang === 'ru' ? 'Описание товара (한국어)' : '상품 설명 (한국어)'}
  <textarea
    value={productForm.desc}
    onChange={(e) => updateProductField('desc', e.target.value)}
    placeholder="상품 설명"
  />
</label>

<label>
  {lang === 'ru' ? 'Описание товара (русский)' : '상품 설명 (러시아어)'}
  <textarea
    value={productForm.descRu}
    onChange={(e) => updateProductField('descRu', e.target.value)}
    placeholder="Описание товара"
  />
</label>

<label>
  {lang === 'ru' ? 'Материал' : '소재'}
  <input
    value={productForm.material}
    onChange={(e) => updateProductField('material', e.target.value)}
    placeholder="면, 린넨, 울 등"
  />
</label>

<label>
  {lang === 'ru' ? 'Цвета (перечислите через запятую)' : '색상 (쉼표로 구분)'}
  <input
    value={productForm.colors.join(', ')}
    onChange={(e) => setProductForm({
      ...productForm,
      colors: e.target.value.split(',').map((x) => x.trim())
    })}
    placeholder={lang === 'ru' ? 'Бежевый, белый, коричневый' : '베이지, 흰색, 갈색'}
  />
</label>

<label>
  {lang === 'ru' ? 'Размеры (через запятую)' : '사이즈 (쉼표로 구분)'}
  <input
    value={productForm.sizes.join(', ')}
    onChange={(e) => setProductForm({
      ...productForm,
      sizes: e.target.value.split(',').map((x) => x.trim())
    })}
    placeholder="S, M, L 또는 20×15 см"
  />
</label>

<button type="button" className="btn ghost" onClick={() => setPreviewProduct(true)}>
  {lang === 'ru' ? 'Предпросмотр товара' : '상품 미리보기'}
</button>

<button className="btn" onClick={saveProduct}>
  {editingProductId
    ? (lang === 'ru' ? 'Сохранить изменения' : '수정 사항 저장')
    : (lang === 'ru' ? 'Добавить товар' : '상품 추가')}
</button>


        {editingProductId && (
          <button
            className="btn ghost"
            onClick={() => {
              setEditingProductId(null)
              setProductForm({
                name: '',
                nameRu: '',
                price: '',
                stock: '0',
                cat: 'bag',
                images: [''],
                desc: '',
                descRu: '',
                material: '',
                colors: [''],
                sizes: [''],
                published: true,
                artist: 'a1'
              })
            }}
          >
            Отмена
          </button>
        )}
        {previewProduct && (
          <div role="dialog" aria-modal="true" aria-label={lang === 'ru' ? 'Предпросмотр товара' : '상품 미리보기'} onClick={() => setPreviewProduct(false)} style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(30, 25, 22, .65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, overflowY: 'auto' }}>
            <div className="box" onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', padding: 22, background: '#fff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <h2 style={{ margin: 0 }}>{lang === 'ru' ? 'Предпросмотр товара' : '상품 미리보기'}</h2>
                <button type="button" className="btn ghost" onClick={() => setPreviewProduct(false)}>{lang === 'ru' ? 'Закрыть' : '닫기'}</button>
              </div>
              <p className="muted">{lang === 'ru' ? 'Так товар будет выглядеть в каталоге магазина. Это предварительный просмотр — товар ещё не сохранён.' : '쇼핑몰 카탈로그에 표시될 모습입니다. 미리보기이며 상품은 아직 저장되지 않았습니다.'}</p>
              <article className="box" style={{ padding: 14 }}>
                {productForm.images?.filter(Boolean).length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8 }}>
                    {productForm.images.filter(Boolean).map((url, index) => <img key={index} src={url} alt={lang === 'ru' ? productForm.nameRu : productForm.name} style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', borderRadius: 8 }} />)}
                  </div>
                ) : <div style={{ aspectRatio: '4/3', display: 'grid', placeItems: 'center', background: '#F3EEE8', borderRadius: 8, color: '#766B62' }}>{lang === 'ru' ? 'Фотография товара' : '상품 사진'}</div>}
                <h3 style={{ marginTop: 14 }}>{lang === 'ru' ? (productForm.nameRu || productForm.name || 'Название товара') : (productForm.name || productForm.nameRu || '상품명')}</h3>
                <p style={{ whiteSpace: 'pre-wrap' }}>{lang === 'ru' ? (productForm.descRu || productForm.desc || 'Описание пока не добавлено') : (productForm.desc || productForm.descRu || '설명이 아직 없습니다')}</p>
                <p className="muted">{lang === 'ru' ? 'Категория' : '카테고리'}: {{ bag: lang === 'ru' ? 'Сумки и шитьё' : '가방·바느질', knit: lang === 'ru' ? 'Вязание' : '뜨개질', felt: lang === 'ru' ? 'Фетр и валяние' : '펠트·양모펠트', clothes: lang === 'ru' ? 'Одежда ручной работы' : '수제 옷', deco: lang === 'ru' ? 'Декор и декупаж' : '데코·데코파주', home: lang === 'ru' ? 'Для дома' : '홈 인테리어', accessory: lang === 'ru' ? 'Аксессуары' : '액세서리' }[productForm.cat] || productForm.cat || '—'}</p>
                <b style={{ fontSize: 20 }}>{productForm.price ? Number(productForm.price).toLocaleString('ko-KR') : '—'} ₩</b>
                {productForm.material && <p className="muted">{lang === 'ru' ? 'Материал' : '소재'}: {productForm.material}</p>}
                {productForm.colors?.filter(Boolean).length > 0 && <p className="muted">{lang === 'ru' ? 'Цвета' : '색상'}: {productForm.colors.filter(Boolean).join(', ')}</p>}
                {productForm.sizes?.filter(Boolean).length > 0 && <p className="muted">{lang === 'ru' ? 'Размеры' : '사이즈'}: {productForm.sizes.filter(Boolean).join(', ')}</p>}
              </article>
              <div style={{ marginTop: 16 }}><button type="button" className="btn" onClick={() => setPreviewProduct(false)}>{lang === 'ru' ? 'Вернуться к заполнению' : '작성으로 돌아가기'}</button></div>
            </div>
          </div>
        )}
            </div>
      ) : (
        <section>
          <h3>{({
            bag: lang === 'ru' ? 'Сумки и шитьё' : '가방·바느질',
            knit: lang === 'ru' ? 'Вязание' : '뜨개질',
            felt: lang === 'ru' ? 'Фетр и валяние' : '펠트·양모펠트',
            clothes: lang === 'ru' ? 'Одежда ручной работы' : '수제 옷',
            deco: lang === 'ru' ? 'Декор и декупаж' : '데코·데코파주'
          })[selectedProductCategory]}</h3>
          <div style={{ display: 'grid', gap: 12, marginBottom: 30 }}>
            {products.filter((product) => product.cat === selectedProductCategory).map((product) => (
              <div key={product.id} className="box" style={{ padding: 14, display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
                {product.images?.[0] && <img src={product.images[0]} alt={product.name} style={{ width: 90, height: 90, objectFit: 'cover', borderRadius: 8 }} />}
                <div style={{ flex: 1, minWidth: 160 }}>
                  <strong>{lang === 'ru' ? (product.nameRu || product.name) : product.name}</strong>
                  <p style={{ margin: '5px 0' }}>{Number(product.price || 0).toLocaleString('ko-KR')} ₩</p>
                  <p style={{ margin: '5px 0', color: Number(product.stock || 0) > 0 ? '#54734A' : '#B8593B', fontWeight: 600 }}>{lang === 'ru' ? 'Остаток: ' : '재고: '}{Number(product.stock || 0)}{lang === 'ru' ? ' шт.' : '개'}{Number(product.stock || 0) <= 0 ? (lang === 'ru' ? ' · Нет в наличии' : ' · 품절') : ''}</p>
                </div>
                <button className="btn" type="button" onClick={() => editProduct(product)}>{lang === 'ru' ? 'Редактировать' : '수정'}</button>
                <button className="btn ghost" type="button" onClick={() => deleteProduct(product)}>{lang === 'ru' ? 'Удалить' : '삭제'}</button>
              </div>
            ))}
            {products.filter((product) => product.cat === selectedProductCategory).length === 0 && <p className="muted">{lang === 'ru' ? 'В этой категории пока нет товаров.' : '이 카테고리에 등록된 상품이 없습니다.'}</p>}
          </div>
        </section>
      )}
      </>}
      {activeSection === 'masterclasses' && <>
        <h2>{lang === 'ru' ? 'Управление каталогом мастер-классов' : '마스터클래스 카탈로그 관리'}</h2>
        <p className="muted">{lang === 'ru' ? 'Здесь редактируются карточки на странице «Мастер-классы». Расписание занятий находится в отдельном разделе.' : '마스터클래스 페이지에 표시되는 카드 정보를 관리합니다. 수업 일정은 별도 메뉴에서 관리합니다.'}</p>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))',gap:12,margin:'18px 0 24px'}}>
          <button type="button" onClick={()=>{setSelectedMasterclassView('cards');setEditingClassId(null);window.scrollTo({top:0,behavior:'smooth'})}} style={{minHeight:76,padding:16,border:'1px solid #E5DCD2',borderRadius:10,background:selectedMasterclassView==='cards'?'#FAF7F2':'#fff',color:'#2F2B28',textAlign:'left',cursor:'pointer',fontWeight:600}}>
            <span style={{color:'#B8593B',marginRight:9}}>▤</span>{lang==='ru'?'Карточки мастер-классов':'마스터클래스 카드'}
            <div style={{fontSize:13,fontWeight:400,color:'#746b63',marginTop:6}}>{lang==='ru'?'Просмотреть и изменить существующие карточки':'등록된 마스터클래스 보기 및 수정'}</div>
          </button>
          <button type="button" onClick={()=>{resetClassForm();setSelectedMasterclassView('add');window.scrollTo({top:0,behavior:'smooth'})}} style={{minHeight:76,padding:16,border:'1px solid #E5DCD2',borderRadius:10,background:selectedMasterclassView==='add'?'#FAF7F2':'#fff',color:'#2F2B28',textAlign:'left',cursor:'pointer',fontWeight:600}}>
            <span style={{color:'#B8593B',marginRight:9}}>＋</span>{lang==='ru'?'Добавить мастер-класс':'마스터클래스 추가'}
            <div style={{fontSize:13,fontWeight:400,color:'#746b63',marginTop:6}}>{lang==='ru'?'Создать новую карточку':'새 마스터클래스 등록'}</div>
          </button>
        </div>
        {selectedMasterclassView === 'add' ? (
          <>
            <button type="button" className="btn ghost" onClick={()=>{setSelectedMasterclassView('cards');resetClassForm()}} style={{marginBottom:16}}>{lang==='ru'?'← К карточкам мастер-классов':'← 마스터클래스 카드로'}</button>
        <section style={{display:'grid',gap:12,maxWidth:820,margin:'18px 0 28px',padding:18,border:'1px solid #E5DCD2',borderRadius:12,background:'#fff'}}>
          <h3>{editingClassId?'Редактировать мастер-класс':'Добавить мастер-класс'}</h3>
          <label>Название (русский)<input className="field" value={classForm.titleRu} onChange={e=>setClassForm(p=>({...p,titleRu:e.target.value}))}/></label>
          <label>Название (корейский)<input className="field" value={classForm.title} onChange={e=>setClassForm(p=>({...p,title:e.target.value}))}/></label>
          <label>Описание (русский)<textarea className="field" rows={3} value={classForm.introRu} onChange={e=>setClassForm(p=>({...p,introRu:e.target.value}))}/></label>
          <label>Описание (корейский)<textarea className="field" rows={3} value={classForm.intro} onChange={e=>setClassForm(p=>({...p,intro:e.target.value}))}/></label>
          <label>Ссылка на фотографию<input className="field" value={classForm.thumb} onChange={e=>setClassForm(p=>({...p,thumb:e.target.value}))} placeholder="https://..."/></label>
          {classForm.thumb&&<img src={classForm.thumb} alt="" style={{width:180,maxHeight:130,objectFit:'cover',borderRadius:8}}/>}
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:10}}>
            <label>Цена (₩)<input className="field" type="number" min="0" value={classForm.price} onChange={e=>setClassForm(p=>({...p,price:e.target.value}))}/></label>
            <label>Длительность (мин.)<input className="field" type="number" min="1" value={classForm.minutes} onChange={e=>setClassForm(p=>({...p,minutes:e.target.value}))}/></label>
            <label>Мастер (ID из каталога)<input className="field" value={classForm.artist} onChange={e=>setClassForm(p=>({...p,artist:e.target.value}))}/></label>
            <label>Категория<select className="field" value={classForm.cat} onChange={e=>setClassForm(p=>({...p,cat:e.target.value}))}>{[['bag','Сумки и шитьё'],['knit','Вязание'],['felt','Фетр и валяние'],['clothes','Одежда'],['deco','Декор'],['home','Для дома'],['accessory','Аксессуары']].map(x=><option key={x[0]} value={x[0]}>{x[1]}</option>)}</select></label>
            <label>Вид рукоделия (RU)<input className="field" value={classForm.fieldRu} onChange={e=>setClassForm(p=>({...p,fieldRu:e.target.value}))}/></label>
            <label>Вид рукоделия (KO)<input className="field" value={classForm.field} onChange={e=>setClassForm(p=>({...p,field:e.target.value}))}/></label>
            <label>Уровень<select className="field" value={classForm.level} onChange={e=>setClassForm(p=>({...p,level:e.target.value,levelRu:e.target.value==='중급'?'Средний':'Начальный'}))}><option value="초급">Начальный</option><option value="중급">Средний</option></select></label>
            <label>Тип оплаты<select className="field" value={classForm.type} onChange={e=>setClassForm(p=>({...p,type:e.target.value,typeRu:e.target.value==='무료'?'Бесплатно':e.target.value==='패키지'?'Набор материалов':'Платно'}))}><option value="무료">Бесплатно</option><option value="유료">Платно</option><option value="패키지">Набор материалов</option></select></label>
            <label>Формат<select className="field" value={classForm.kind} onChange={e=>setClassForm(p=>({...p,kind:e.target.value,kindRu:e.target.value==='오프라인'?'Очно':'Видео'}))}><option value="동영상">Видео</option><option value="오프라인">Очно</option></select></label>
          </div>
          <label style={{display:'flex',gap:8,alignItems:'center'}}><input type="checkbox" checked={classForm.kit} onChange={e=>setClassForm(p=>({...p,kit:e.target.checked}))}/>Включён набор материалов</label>
          <label>Материалы (каждый с новой строки)<textarea className="field" rows={3} value={classForm.materialsText} onChange={e=>setClassForm(p=>({...p,materialsText:e.target.value}))}/></label>
          <label>Уроки: название|минуты (каждый с новой строки)<textarea className="field" rows={4} value={classForm.lessonsText} onChange={e=>setClassForm(p=>({...p,lessonsText:e.target.value}))}/></label>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}><button type="button" className="btn" onClick={saveClass}>{editingClassId?'Сохранить изменения':'Добавить мастер-класс'}</button>{editingClassId&&<button type="button" className="btn ghost" onClick={resetClassForm}>Отмена</button>}</div>
        </section>
          </>
        ) : (
          <>
        <h3>Карточки мастер-классов ({classes.length})</h3>
        <div style={{display:'grid',gap:12}}>{classes.map(item=><article key={item.id} style={{display:'flex',gap:14,alignItems:'center',flexWrap:'wrap',padding:12,border:'1px solid #E5DCD2',borderRadius:10,background:'#fff'}}>
          {item.thumb&&<img src={item.thumb} alt="" style={{width:100,height:76,objectFit:'cover',borderRadius:8}}/>}
          <div style={{flex:1,minWidth:180}}><strong>{item.titleRu||item.title}</strong><p className="muted">{item.title}</p><small>{Number(item.price||0).toLocaleString('ko-KR')} ₩ · {item.minutes||0} мин.</small></div>
          <button type="button" className="btn" onClick={()=>editClass(item)}>Редактировать</button><button type="button" className="btn ghost" onClick={()=>deleteClass(item)}>Удалить</button>
        </article>)}{!classes.length&&<p className="muted">Мастер-классов пока нет.</p>}</div>

          </>
        )}
      </>}
      {activeSection === 'articles' && <>
      <h2>{lang === 'ru' ? 'Управление статьями' : '아티클 관리'}</h2>
      {selectedArticleView === 'menu' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12, marginBottom: 28 }}>
          {[
            { id: 'add', ru: 'Добавить статью', ko: '아티클 추가', icon: '+' },
            { id: '정보', ru: 'Информация', ko: '정보', icon: '▤' },
            { id: '트렌드', ru: 'Тренды', ko: '트렌드', icon: '✦' },
            { id: '리뷰', ru: 'Обзоры', ko: '리뷰', icon: '☆' }
          ].map((item) => (
            <button key={item.id} type="button" onClick={() => {
              setSelectedArticleView(item.id)
              if (item.id === 'add') {
                setEditingArticleId(null)
                setArticleForm({
                  title: '', titleRu: '', tag: '정보',
                  date: new Date().toISOString().slice(0, 10),
                  excerpt: '', excerptRu: '', thumb: '', images: [],
                  body: [{ heading: '', text: '', headingRu: '', textRu: '' }],
                  published: true
                })
              }
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }} style={{
              minHeight: 82, padding: 18, border: '1px solid #E5DCD2',
              borderRadius: 10, background: '#fff', color: '#2F2B28',
              textAlign: 'left', cursor: 'pointer', fontWeight: 600
            }}>
              <span style={{ color: '#B8593B', marginRight: 10 }}>{item.icon}</span>
              {lang === 'ru' ? item.ru : item.ko}
              <div style={{ color: '#746b63', fontSize: 13, fontWeight: 400, marginTop: 7 }}>
                {item.id === 'add'
                  ? (lang === 'ru' ? 'Создать новый материал' : '새 콘텐츠 작성')
                  : (lang === 'ru' ? 'Открыть статьи этого раздела' : '해당 카테고리 아티클 보기')}
              </div>
            </button>
          ))}
        </div>
      ) : (
        <>
          <button type="button" className="btn ghost" onClick={() => {
            setSelectedArticleView('menu')
            setEditingArticleId(null)
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }} style={{ marginBottom: 18 }}>
            {lang === 'ru' ? '← К разделам статей' : '← 아티클 메뉴로'}
          </button>
          {selectedArticleView === 'add' ? (
            <>
<div style={{ display: 'grid', gap: 10, marginBottom: 30 }}>
  <label>
  {lang === 'ru' ? 'Название статьи (한국어)' : '아티클 제목 (한국어)'}
  <input
    className="field"
    value={articleForm.title}
    onChange={(e) => setArticleForm({ ...articleForm, title: e.target.value })}
  />
</label>

<label>
  {lang === 'ru' ? 'Название статьи (Русский)' : '아티클 제목 (러시아어)'}
  <input
    className="field"
    value={articleForm.titleRu}
    onChange={(e) => setArticleForm({ ...articleForm, titleRu: e.target.value })}
  />
</label>

<label>
  {lang === 'ru' ? 'Категория' : '카테고리'}
  <select
    className="field"
    value={articleForm.tag}
    onChange={(e) => setArticleForm({ ...articleForm, tag: e.target.value })}
  >
    <option value="정보">{lang === 'ru' ? 'Информация' : '정보'}</option>
    <option value="트렌드">{lang === 'ru' ? 'Тренды' : '트렌드'}</option>
    <option value="리뷰">{lang === 'ru' ? 'Обзоры' : '리뷰'}</option>
  </select>
</label>

<label>
  {lang === 'ru' ? 'Дата публикации' : '게시 날짜'}
  <input
    className="field"
    type="date"
    value={articleForm.date}
    onChange={(e) => setArticleForm({ ...articleForm, date: e.target.value })}
  />
</label>

<label>
  {lang === 'ru' ? 'Краткое описание (한국어)' : '간단한 설명 (한국어)'}
  <textarea
    className="field"
    value={articleForm.excerpt}
    onChange={(e) => setArticleForm({ ...articleForm, excerpt: e.target.value })}
  />
</label>

<label>
  {lang === 'ru' ? 'Краткое описание (Русский)' : '간단한 설명 (러시아어)'}
  <textarea
    className="field"
    value={articleForm.excerptRu}
    onChange={(e) => setArticleForm({ ...articleForm, excerptRu: e.target.value })}
  />
</label>

<label>
  {lang === 'ru' ? 'Фотографии статьи' : '아티클 사진'}

  <input
    className="field"
    type="file"
    accept="image/png,image/jpeg,image/webp"
    multiple
    onChange={async (e) => {
      const files = Array.from(e.target.files || [])
      if (!files.length) return

      const urls = await Promise.all(
        files.map((file) => uploadImage(file))
      )

      setArticleForm((prev) => {
        const images = [
          ...(prev.images || (prev.thumb ? [prev.thumb] : [])),
          ...urls.filter(Boolean)
        ]

        return {
          ...prev,
          images,
          thumb: images[0] || ''
        }
      })

      e.target.value = ''
    }}
  />

  <div style={{
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12
  }}>
    {(articleForm.images || (articleForm.thumb ? [articleForm.thumb] : [])).map((url, index) => (
      <div key={index} style={{ position: 'relative' }}>
        <img
          src={url}
          alt=""
          style={{
            width: 90,
            height: 90,
            objectFit: 'cover',
            borderRadius: 8
          }}
        />

        <button
          type="button"
          onClick={() => {
            setArticleForm((prev) => {
              const images = (prev.images || []).filter((_, i) => i !== index)

              return {
                ...prev,
                images,
                thumb: images[0] || ''
              }
            })
          }}
        >
          ×
        </button>
      </div>
    ))}
  </div>
</label>

{articleForm.body.map((section, index) => (
  <div key={index} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12, display: 'grid', gap: 10 }}>
    <strong>{lang === 'ru' ? `Раздел ${index + 1}` : `섹션 ${index + 1}`}</strong>

    <label>{lang === 'ru' ? 'Заголовок (한국어)' : '제목 (한국어)'}
      <input className="field" value={section.heading || ''} onChange={(e) => {
        const body = [...articleForm.body]
        body[index] = { ...section, heading: e.target.value }
        setArticleForm({ ...articleForm, body })
      }} />
    </label>

    <label>{lang === 'ru' ? 'Текст (한국어)' : '본문 (한국어)'}
      <textarea className="field" rows={5} value={section.text || ''} onChange={(e) => {
        const body = [...articleForm.body]
        body[index] = { ...section, text: e.target.value }
        setArticleForm({ ...articleForm, body })
      }} />
    </label>

    <label>{lang === 'ru' ? 'Заголовок (Русский)' : '제목 (러시아어)'}
      <input className="field" value={section.headingRu || ''} onChange={(e) => {
        const body = [...articleForm.body]
        body[index] = { ...section, headingRu: e.target.value }
        setArticleForm({ ...articleForm, body })
      }} />
    </label>

    <label>{lang === 'ru' ? 'Текст (Русский)' : '본문 (러시아어)'}
      <textarea className="field" rows={5} value={section.textRu || ''} onChange={(e) => {
        const body = [...articleForm.body]
        body[index] = { ...section, textRu: e.target.value }
        setArticleForm({ ...articleForm, body })
      }} />
    </label>

    {articleForm.body.length > 1 && (
      <button type="button" className="btn ghost" onClick={() => {
        const body = articleForm.body.filter((_, i) => i !== index)
        setArticleForm({ ...articleForm, body })
      }}>
        {lang === 'ru' ? 'Удалить раздел' : '섹션 삭제'}
      </button>
    )}
  </div>
))}

<button
  type="button"
  className="btn ghost"
  onClick={() => setArticleForm({
    ...articleForm,
    body: [
      ...articleForm.body,
      {
        heading: '',
        text: '',
        headingRu: '',
        textRu: ''
      }
    ]
  })}
>
  {lang === 'ru' ? '+ Добавить раздел' : '+ 섹션 추가'}
</button>

<div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
<button
  type="button"
  className="btn ghost"
  onClick={() => setPreviewArticle(true)}
>
  {lang === 'ru' ? 'Предпросмотр статьи' : '아티클 미리보기'}
</button>
<button
  type="button"
  className="btn"
  onClick={saveArticle}
>
  {editingArticleId
    ? (lang === 'ru' ? 'Сохранить изменения' : '수정 사항 저장')
    : (lang === 'ru' ? 'Добавить статью' : '아티클 추가')}
</button>
</div>
</div>
            </>
          ) : (
            <>
      <h2>{lang === 'ru' ? 'Статьи: ' : '아티클: '}{({
        '정보': lang === 'ru' ? 'Информация' : '정보',
        '트렌드': lang === 'ru' ? 'Тренды' : '트렌드',
        '리뷰': lang === 'ru' ? 'Обзоры' : '리뷰'
      })[selectedArticleView]}</h2>

<div style={{ display: 'grid', gap: 12, marginBottom: 30 }}>
  {articles.filter((article) => article.tag === selectedArticleView).map((article) => (
    <div
      key={article.id}
      style={{
        padding: 12,
        border: '1px solid #ddd',
        borderRadius: 8
      }}
    >
      {article.thumb && (
        <img
          src={article.thumb}
          alt={article.title}
          style={{
            width: 100,
            height: 100,
            objectFit: 'cover',
            borderRadius: 8
          }}
        />
      )}

      <strong>{article.title}</strong>
      <p>{article.titleRu || ''}</p>
      <p>{article.tag} · {article.date}</p>

      <button
        className="btn"
        onClick={() => editArticle(article)}
      >
        {lang === 'ru' ? 'Редактировать' : '수정'}
      </button>

      <button
        className="btn ghost"
        onClick={() => deleteArticle(article)}
      >
        {lang === 'ru' ? 'Удалить' : '삭제'}
      </button>
    </div>
  ))}
</div>
            </>
          )}
        </>
      )}
      </>}
      {previewArticle && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={lang === 'ru' ? 'Предпросмотр статьи' : '아티클 미리보기'}
          onClick={(e) => { if (e.target === e.currentTarget) setPreviewArticle(false) }}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(25, 20, 16, 0.68)', overflowY: 'auto',
            padding: '24px 14px', display: 'flex', justifyContent: 'center', alignItems: 'flex-start'
          }}
        >
          <article style={{
            width: '100%', maxWidth: 780, background: '#FAF7F2',
            borderRadius: 14, padding: '24px clamp(16px, 4vw, 38px)',
            color: '#2F2B28', margin: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 18 }}>
              <strong>{lang === 'ru' ? 'Предпросмотр — статья ещё не опубликована' : '미리보기 — 아직 게시되지 않았습니다'}</strong>
              <button type="button" className="btn ghost" onClick={() => setPreviewArticle(false)}>
                {lang === 'ru' ? 'Закрыть' : '닫기'} ×
              </button>
            </div>
            {(articleForm.images || (articleForm.thumb ? [articleForm.thumb] : [])).map((url, index) => (
              <img key={index} src={url} alt="" style={{
                width: '100%', maxHeight: 420, objectFit: 'contain',
                background: '#EDE3D3', borderRadius: 10, marginBottom: 12
              }} />
            ))}
            <p style={{ color: '#B8593B', marginBottom: 8 }}>
              {({ '정보': lang === 'ru' ? 'Информация' : '정보', '트렌드': lang === 'ru' ? 'Тренды' : '트렌드', '리뷰': lang === 'ru' ? 'Обзоры' : '리뷰' })[articleForm.tag] || articleForm.tag}
              {' · '}{articleForm.date}
            </p>
            <h1 style={{ fontSize: 'clamp(24px, 4vw, 34px)', lineHeight: 1.3, margin: '0 0 14px' }}>
              {lang === 'ru' ? (articleForm.titleRu || articleForm.title || 'Название статьи') : (articleForm.title || articleForm.titleRu || '아티클 제목')}
            </h1>
            {(lang === 'ru' ? articleForm.excerptRu : articleForm.excerpt) && (
              <p style={{ fontSize: 17, lineHeight: 1.7, color: '#746b63', whiteSpace: 'pre-wrap', marginBottom: 24 }}>
                {lang === 'ru' ? articleForm.excerptRu : articleForm.excerpt}
              </p>
            )}
            {(articleForm.body || []).filter((s) => s.heading || s.text || s.headingRu || s.textRu).map((section, index) => (
              <section key={index} style={{ margin: '24px 0' }}>
                {(lang === 'ru' ? section.headingRu || section.heading : section.heading || section.headingRu) && (
                  <h2 style={{ fontSize: 21, marginBottom: 10 }}>
                    {lang === 'ru' ? section.headingRu || section.heading : section.heading || section.headingRu}
                  </h2>
                )}
                <p style={{ lineHeight: 1.85, whiteSpace: 'pre-wrap', margin: 0 }}>
                  {lang === 'ru' ? section.textRu || section.text : section.text || section.textRu}
                </p>
              </section>
            ))}
            <div style={{ borderTop: '1px solid #E5DCD2', paddingTop: 18, marginTop: 28 }}>
              <button type="button" className="btn" onClick={() => setPreviewArticle(false)}>
                {lang === 'ru' ? 'Вернуться к редактированию' : '편집으로 돌아가기'}
              </button>
            </div>
          </article>
        </div>
      )}
      {activeSection === 'schedule' && <>
<h2>{lang === 'ru' ? 'Управление расписанием занятий' : '수업 일정 관리'}</h2>

{(() => {
  const monthNamesRu = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']
  const monthNamesKo = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']
  const getEventParts = (event) => {
    const iso = String(event.ymd || '')
    if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return { year: iso.slice(0, 4), month: iso.slice(5, 7) }
    const legacy = String(event.date || '').match(/^(\d{1,2})\/(\d{1,2})$/)
    if (legacy) return { year: String(new Date().getFullYear()), month: legacy[1].padStart(2, '0') }
    return null
  }
  const years = Array.from(new Set([
    String(new Date().getFullYear()),
    ...events.map(getEventParts).filter(Boolean).map((parts) => parts.year)
  ])).sort((a, b) => Number(b) - Number(a))
  const monthEvents = events.filter((event) => {
    const parts = getEventParts(event)
    return parts && parts.year === selectedScheduleYear && parts.month === selectedScheduleMonth
  }).sort((a, b) => String(a.ymd || '').localeCompare(String(b.ymd || '')) || String(a.time || '').localeCompare(String(b.time || '')))
  return <section style={{ marginTop: 28 }}>
    <h2>{lang === 'ru' ? 'Расписание по годам и месяцам' : '연도별·월별 수업 일정'}</h2>
    <p className="muted">{lang === 'ru' ? 'Выберите год, затем месяц — здесь будут отображаться все добавленные и изменённые занятия.' : '연도를 선택한 다음 월을 선택하면 등록되거나 수정된 수업 일정이 표시됩니다.'}</p>
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '14px 0' }}>
      {years.map((year) => <button key={year} type="button" className={selectedScheduleYear === year ? 'btn' : 'btn ghost'} onClick={() => setSelectedScheduleYear(year)}>{year}</button>)}
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(105px, 1fr))', gap: 8, marginBottom: 22 }}>
      {monthNamesRu.map((month, index) => {
        const value = String(index + 1).padStart(2, '0')
        const count = events.filter((event) => {
          const parts = getEventParts(event)
          return parts && parts.year === selectedScheduleYear && parts.month === value
        }).length
        return <button key={value} type="button" onClick={() => setSelectedScheduleMonth(value)} style={{
          padding: '12px 10px', minHeight: 58, borderRadius: 9,
          border: selectedScheduleMonth === value ? '2px solid #B8593B' : '1px solid #E5DCD2',
          background: selectedScheduleMonth === value ? '#F7EEE8' : '#fff',
          color: '#2F2B28', cursor: 'pointer', textAlign: 'left'
        }}>
          <strong>{lang === 'ru' ? month : monthNamesKo[index]}</strong>
          <div style={{ fontSize: 12, color: '#746b63', marginTop: 4 }}>{count} {lang === 'ru' ? (count === 1 ? 'занятие' : 'занятий') : '개 일정'}</div>
        </button>
      })}
    </div>
    <h3>{lang === 'ru' ? monthNamesRu[Number(selectedScheduleMonth) - 1] : monthNamesKo[Number(selectedScheduleMonth) - 1]} {selectedScheduleYear}</h3>
    <div style={{ display: 'grid', gap: 10, marginBottom: 30 }}>
      {monthEvents.length === 0 ? <p className="muted">{lang === 'ru' ? 'В этом месяце пока нет занятий.' : '이 달에 등록된 수업 일정이 없습니다.'}</p> : monthEvents.map((event) => (
        <div key={event.id} style={{ padding: 16, border: '1px solid #E5DCD2', borderRadius: 10, background: '#fff' }}>
          {(event.images?.[0] || event.image) && <img src={event.images?.[0] || event.image} alt="" style={{ width: '100%', maxWidth: 260, maxHeight: 150, objectFit: 'cover', borderRadius: 8, marginBottom: 10 }} />}
          <strong>{lang === 'ru' ? (event.titleRu || event.title) : (event.titleKo || event.title)}</strong>
          <p style={{ margin: '7px 0' }}>{event.ymd || event.date} · {event.time}</p>
          <p style={{ margin: '0 0 12px' }}>{event.place || '-'} · {lang === 'ru' ? 'Мест' : '모집'} {event.cap}{lang === 'ru' ? '' : '명'}</p>
          <button className="btn" onClick={() => {
            editEvent(event)
            const parts = getEventParts(event)
            if (parts) { setSelectedScheduleYear(parts.year); setSelectedScheduleMonth(parts.month) }
          }}>{lang === 'ru' ? 'Редактировать' : '수정'}</button>
          <button className="btn ghost" onClick={() => deleteEvent(event)}>{lang === 'ru' ? 'Удалить' : '삭제'}</button>
        </div>
      ))}
    </div>
  <div style={{ marginTop: 24, marginBottom: 30 }}>
  <button type="button" className="btn ghost" onClick={() => setShowScheduleForm((value) => !value)}>
    {showScheduleForm ? (lang === 'ru' ? 'Скрыть добавление расписания' : '일정 추가 닫기') : (lang === 'ru' ? '+ Добавить расписание' : '+ 일정 추가')}
  </button>
  {showScheduleForm && (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: 'grid', gap: 10, maxWidth: 500, marginBottom: 30 }}>
  <label>
    {lang === 'ru' ? 'Дата' : '날짜'}
    <input type="date" value={eventForm.ymd} onChange={(e) => {
      const value = e.target.value
      setEventForm({ ...eventForm, ymd: value })
      if (value) {
        const [year, month] = value.split('-')
        setSelectedScheduleYear(year)
        setSelectedScheduleMonth(month)
      }
    }} />
  </label>
  <label>
    {lang === 'ru' ? 'Время' : '시간'}
    <input type="text" placeholder="14:00-16:00" value={eventForm.time} onChange={(e) => setEventForm({ ...eventForm, time: e.target.value })} />
  </label>
  <label>
    {lang === 'ru' ? 'Название занятия' : '수업명'}
    <input type="text" value={eventForm.title} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })} />
  </label>
  <label>
    {lang === 'ru' ? 'Название по-русски' : '러시아어 제목'}
    <input type="text" value={eventForm.titleRu} onChange={(e) => setEventForm({ ...eventForm, titleRu: e.target.value })} placeholder={lang === 'ru' ? 'Введите русское название' : '러시아어 제목을 입력하세요'} />
  </label>
  <label>
    {lang === 'ru' ? 'Фотографии занятия' : '수업 사진'}
    <input
      type="file"
      className="field"
      accept="image/png,image/jpeg,image/webp"
      multiple
      onChange={async (e) => {
        const files = Array.from(e.target.files || [])
        if (!files.length) return
        const urls = await Promise.all(files.map((file) => uploadImage(file)))
        setEventForm((prev) => ({ ...prev, images: [...(prev.images || []), ...urls.filter(Boolean)] }))
        e.target.value = ''
      }}
    />
    <span className="muted">{lang === 'ru' ? 'Можно выбрать несколько фотографий.' : '사진을 여러 장 선택할 수 있습니다.'}</span>
    {(eventForm.images || []).length > 0 && (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 12 }}>
        {eventForm.images.map((url, index) => (
          <div key={url + index} style={{ position: 'relative' }}>
            <img src={url} alt="" style={{ width: 100, height: 85, objectFit: 'cover', borderRadius: 8 }} />
            <button type="button" className="btn ghost" onClick={() => setEventForm((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }))}>
              {lang === 'ru' ? 'Удалить' : '삭제'}
            </button>
          </div>
        ))}
      </div>
    )}
  </label>
  <label>
    {lang === 'ru' ? 'Место проведения' : '장소'}
    <input type="text" value={eventForm.place} onChange={(e) => setEventForm({ ...eventForm, place: e.target.value })} />
  </label>
  <label>
    {lang === 'ru' ? 'Количество мест' : '모집 인원'}
    <input type="number" min="1" value={eventForm.cap} onChange={(e) => setEventForm({ ...eventForm, cap: e.target.value })} />
  </label>
  <button className="btn" onClick={editingEventId ? updateEvent : addEvent}>
    {editingEventId ? (lang === 'ru' ? 'Сохранить изменения' : '수정 완료') : (lang === 'ru' ? 'Сохранить расписание' : '일정 저장')}
  </button>
  {editingEventId && <button className="btn ghost" onClick={() => {
    setEditingEventId(null)
    setEventForm({ ymd: '', time: '', type: '수업', title: '', titleRu: '', place: '', images: [], cap: 8, online: false })
  }}>{lang === 'ru' ? 'Отмена' : '취소'}</button>}
</div>
    </div>
  )}
</div>
</section>

})()}
      </>}
      {activeSection === 'bank' && <section style={{ maxWidth: 620 }}>
        <h2>{lang === 'ru' ? 'Банковские реквизиты получателя' : '입금 계좌 정보 관리'}</h2>
        <p className="muted">{lang === 'ru' ? 'Эти данные будут показаны покупателям при выборе банковского перевода.' : '무통장 입금을 선택한 고객에게 표시되는 정보입니다.'}</p>
        <div style={{ display: 'grid', gap: 14, marginTop: 18 }}>
          <label>{lang === 'ru' ? 'Название банка' : '은행명'}
            <input className="field" value={bankForm.bank} onChange={(e) => setBankForm((prev) => ({ ...prev, bank: e.target.value }))} />
          </label>
          <label>{lang === 'ru' ? 'Номер счёта' : '계좌번호'}
            <input className="field" value={bankForm.account} onChange={(e) => setBankForm((prev) => ({ ...prev, account: e.target.value }))} />
          </label>
          <label>{lang === 'ru' ? 'Имя получателя / владельца счёта' : '예금주'}
            <input className="field" value={bankForm.holder} onChange={(e) => setBankForm((prev) => ({ ...prev, holder: e.target.value }))} />
          </label>
          <button type="button" className="btn" disabled={bankSaving} onClick={saveBankDetails}>{bankSaving ? (lang === 'ru' ? 'Сохранение…' : '저장 중…') : (lang === 'ru' ? 'Сохранить реквизиты' : '계좌 정보 저장')}</button>
        </div>
      </section>}
      {activeSection === 'footer' && <section style={{ maxWidth: 720 }}>
        <h2>{lang === 'ru' ? 'Редактирование нижней части сайта' : '사이트 하단 정보 관리'}</h2>
        <p className="muted">{lang === 'ru' ? 'Изменения сразу отобразятся внизу сайта на русском и корейском языках.' : '저장한 정보는 사이트 하단에 러시아어와 한국어로 표시됩니다.'}</p>
        <div style={{ display: 'grid', gap: 12, marginTop: 18 }}>
          <h3>{lang === 'ru' ? 'Описание и социальные сети' : '소개 및 소셜 링크'}</h3>
          <label>{lang === 'ru' ? 'Описание (русский)' : '소개 (러시아어)'}<textarea className="field" rows={3} value={footerForm.descriptionRu} onChange={(e) => setFooterForm((p) => ({ ...p, descriptionRu: e.target.value }))} /></label>
          <label>{lang === 'ru' ? 'Описание (корейский)' : '소개 (한국어)'}<textarea className="field" rows={3} value={footerForm.descriptionKo} onChange={(e) => setFooterForm((p) => ({ ...p, descriptionKo: e.target.value }))} /></label>
          <label>Instagram URL<input className="field" value={footerForm.instagram} onChange={(e) => setFooterForm((p) => ({ ...p, instagram: e.target.value }))} placeholder="https://www.instagram.com/..." /></label>
          <label>{lang === 'ru' ? 'Ссылка на блог' : '블로그 링크'}<input className="field" value={footerForm.blog} onChange={(e) => setFooterForm((p) => ({ ...p, blog: e.target.value }))} placeholder="https://..." /></label>
          <label>YouTube URL<input className="field" value={footerForm.youtube} onChange={(e) => setFooterForm((p) => ({ ...p, youtube: e.target.value }))} placeholder="https://www.youtube.com/..." /></label>
          <h3>{lang === 'ru' ? 'Информация для пользователей' : '이용 안내 링크'}</h3>
          <label>{lang === 'ru' ? 'Название ссылки «Условия использования»' : '이용약관 링크 이름 (러시아어)'}<input className="field" value={footerForm.termsLabelRu} onChange={(e) => setFooterForm((p) => ({ ...p, termsLabelRu: e.target.value }))} /></label>
          <label>{lang === 'ru' ? 'Название ссылки (корейский)' : '이용약관 링크 이름 (한국어)'}<input className="field" value={footerForm.termsLabelKo} onChange={(e) => setFooterForm((p) => ({ ...p, termsLabelKo: e.target.value }))} /></label>
          <label>{lang === 'ru' ? 'Адрес страницы условий' : '이용약관 페이지 주소'}<input className="field" value={footerForm.termsUrl} onChange={(e) => setFooterForm((p) => ({ ...p, termsUrl: e.target.value }))} /></label>
          <label>{lang === 'ru' ? 'Название ссылки «Политика конфиденциальности»' : '개인정보처리방침 링크 이름 (러시아어)'}<input className="field" value={footerForm.privacyLabelRu} onChange={(e) => setFooterForm((p) => ({ ...p, privacyLabelRu: e.target.value }))} /></label>
          <label>{lang === 'ru' ? 'Название ссылки (корейский)' : '개인정보처리방침 링크 이름 (한국어)'}<input className="field" value={footerForm.privacyLabelKo} onChange={(e) => setFooterForm((p) => ({ ...p, privacyLabelKo: e.target.value }))} /></label>
          <label>{lang === 'ru' ? 'Адрес страницы политики' : '개인정보처리방침 페이지 주소'}<input className="field" value={footerForm.privacyUrl} onChange={(e) => setFooterForm((p) => ({ ...p, privacyUrl: e.target.value }))} /></label>
          <label>{lang === 'ru' ? 'Название ссылки «Доставка и обмен»' : '배송·교환 링크 이름 (러시아어)'}<input className="field" value={footerForm.shippingLabelRu} onChange={(e) => setFooterForm((p) => ({ ...p, shippingLabelRu: e.target.value }))} /></label>
          <label>{lang === 'ru' ? 'Название ссылки (корейский)' : '배송·교환 링크 이름 (한국어)'}<input className="field" value={footerForm.shippingLabelKo} onChange={(e) => setFooterForm((p) => ({ ...p, shippingLabelKo: e.target.value }))} /></label>
          <label>{lang === 'ru' ? 'Адрес страницы доставки и обмена' : '배송·교환 페이지 주소'}<input className="field" value={footerForm.shippingUrl} onChange={(e) => setFooterForm((p) => ({ ...p, shippingUrl: e.target.value }))} /></label>
          <h3>{lang === 'ru' ? 'Реквизиты компании и адрес' : '사업자 정보 및 주소'}</h3>
          <label>{lang === 'ru' ? 'Название компании (русский)' : '상호 (러시아어)'}<input className="field" value={footerForm.companyNameRu} onChange={(e) => setFooterForm((p) => ({ ...p, companyNameRu: e.target.value }))} /></label>
          <label>{lang === 'ru' ? 'Название компании (корейский)' : '상호 (한국어)'}<input className="field" value={footerForm.companyNameKo} onChange={(e) => setFooterForm((p) => ({ ...p, companyNameKo: e.target.value }))} /></label>
          <label>{lang === 'ru' ? 'Представитель' : '대표자'}<input className="field" value={footerForm.representative} onChange={(e) => setFooterForm((p) => ({ ...p, representative: e.target.value }))} /></label>
          <label>{lang === 'ru' ? 'Регистрационный номер компании' : '사업자등록번호'}<input className="field" value={footerForm.businessNumber} onChange={(e) => setFooterForm((p) => ({ ...p, businessNumber: e.target.value }))} /></label>
          <label>{lang === 'ru' ? 'Номер регистрации интернет-торговли' : '통신판매업 신고번호'}<input className="field" value={footerForm.ecommerceNumber} onChange={(e) => setFooterForm((p) => ({ ...p, ecommerceNumber: e.target.value }))} /></label>
          <label>{lang === 'ru' ? 'Адрес (русский)' : '주소 (러시아어)'}<input className="field" value={footerForm.addressRu} onChange={(e) => setFooterForm((p) => ({ ...p, addressRu: e.target.value }))} /></label>
          <label>{lang === 'ru' ? 'Адрес (корейский)' : '주소 (한국어)'}<input className="field" value={footerForm.addressKo} onChange={(e) => setFooterForm((p) => ({ ...p, addressKo: e.target.value }))} /></label>
          <label>{lang === 'ru' ? 'Текст об авторских правах (русский)' : '저작권 문구 (러시아어)'}<input className="field" value={footerForm.copyrightRu} onChange={(e) => setFooterForm((p) => ({ ...p, copyrightRu: e.target.value }))} /></label>
          <label>{lang === 'ru' ? 'Текст об авторских правах (корейский)' : '저작권 문구 (한국어)'}<input className="field" value={footerForm.copyrightKo} onChange={(e) => setFooterForm((p) => ({ ...p, copyrightKo: e.target.value }))} /></label>
          <button type="button" className="btn" disabled={footerSaving} onClick={saveFooterDetails}>{footerSaving ? (lang === 'ru' ? 'Сохранение…' : '저장 중…') : (lang === 'ru' ? 'Сохранить нижнюю часть сайта' : '사이트 하단 정보 저장')}</button>
        </div>
      </section>}
      {activeSection === 'support' && <section style={{ maxWidth: 620 }}>
        <h2>{lang === 'ru' ? 'Данные службы поддержки' : '고객센터 정보 관리'}</h2>
        <p className="muted">{lang === 'ru' ? 'Эти данные отображаются внизу сайта. После сохранения они обновятся для посетителей.' : '저장한 정보는 사이트 하단에 표시됩니다.'}</p>
        <div style={{ display: 'grid', gap: 14, marginTop: 18 }}>
          <label>{lang === 'ru' ? 'Телефон службы поддержки' : '고객센터 전화번호'}
            <input className="field" type="tel" value={supportForm.phone} onChange={(e) => setSupportForm((prev) => ({ ...prev, phone: e.target.value }))} />
          </label>
          <label>{lang === 'ru' ? 'Электронная почта' : '고객센터 이메일'}
            <input className="field" type="email" value={supportForm.email} onChange={(e) => setSupportForm((prev) => ({ ...prev, email: e.target.value }))} />
          </label>
          <label>{lang === 'ru' ? 'Часы работы (русский)' : '운영 시간 (러시아어)'}
            <input className="field" value={supportForm.hoursRu} onChange={(e) => setSupportForm((prev) => ({ ...prev, hoursRu: e.target.value }))} />
          </label>
          <label>{lang === 'ru' ? 'Часы работы (корейский)' : '운영 시간 (한국어)'}
            <input className="field" value={supportForm.hoursKo} onChange={(e) => setSupportForm((prev) => ({ ...prev, hoursKo: e.target.value }))} />
          </label>
          <label>{lang === 'ru' ? 'Обед и выходные (русский)' : '점심 및 휴무일 (러시아어)'}
            <input className="field" value={supportForm.breakRu} onChange={(e) => setSupportForm((prev) => ({ ...prev, breakRu: e.target.value }))} />
          </label>
          <label>{lang === 'ru' ? 'Обед и выходные (корейский)' : '점심 및 휴무일 (한국어)'}
            <input className="field" value={supportForm.breakKo} onChange={(e) => setSupportForm((prev) => ({ ...prev, breakKo: e.target.value }))} />
          </label>
          <button type="button" className="btn" disabled={supportSaving} onClick={saveSupportDetails}>{supportSaving ? (lang === 'ru' ? 'Сохранение…' : '저장 중…') : (lang === 'ru' ? 'Сохранить данные поддержки' : '고객센터 정보 저장')}</button>
        </div>
      </section>}
      {activeSection === 'customOrders' && <>
        <h2>{lang === 'ru' ? 'Запросы на индивидуальный заказ' : '주문제작 문의 목록'}</h2>
        <p>{lang === 'ru' ? 'Всего запросов:' : '전체 문의:'} {customOrders.length}</p>
        {customOrders.length === 0 ? (
          <p>{lang === 'ru' ? 'Пока запросов нет.' : '아직 접수된 문의가 없습니다.'}</p>
        ) : (
          <div style={{ display: 'grid', gap: 14 }}>
            {customOrders.map((request) => (
              <article key={request.id} style={{ border: '1px solid #E5DCD2', borderRadius: 10, padding: 16, background: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <strong>{request.name}</strong>
                  <small>{request.at ? new Date(request.at).toLocaleString(lang === 'ru' ? 'ru-RU' : 'ko-KR') : '-'}</small>
                </div>
                <p style={{ margin: '8px 0' }}>{lang === 'ru' ? 'Телефон:' : '연락처:'} {request.phone}</p>
                <p style={{ margin: '8px 0' }}>{lang === 'ru' ? 'Электронная почта:' : '이메일:'} {request.email || '-'}</p>
                <p style={{ whiteSpace: 'pre-wrap', margin: '8px 0 14px' }}>{request.details}</p>
                <div style={{ display: 'grid', gap: 8, margin: '14px 0' }}>
                  <label>
                    {lang === 'ru' ? 'Ваш ответ клиенту' : '고객에게 보낼 답변'}
                    <textarea
                      className="field"
                      rows={4}
                      value={customOrderReplies[request.id] || ''}
                      onChange={(e) => setCustomOrderReplies((prev) => ({ ...prev, [request.id]: e.target.value }))}
                      placeholder={lang === 'ru' ? 'Напишите ответ клиенту…' : '고객에게 보낼 답변을 입력하세요…'}
                      maxLength={5000}
                      style={{ width: '100%', marginTop: 6, resize: 'vertical' }}
                    />
                  </label>
                  <button
                    type="button"
                    className="btn"
                    disabled={!request.email || sendingCustomOrderId === request.id || !(customOrderReplies[request.id] || '').trim()}
                    onClick={() => sendCustomOrderReply(request)}
                    style={{ justifySelf: 'start' }}
                  >
                    {sendingCustomOrderId === request.id
                      ? (lang === 'ru' ? 'Отправка…' : '전송 중…')
                      : (lang === 'ru' ? 'Отправить письмо клиенту' : '고객에게 이메일 보내기')}
                  </button>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {lang === 'ru' ? 'Статус:' : '상태:'}
                  <select className="field" style={{ maxWidth: 220 }} value={request.status || 'new'} onChange={async (e) => {
                    try {
                      await F.setDoc(F.doc(F.db, 'customOrders', request.id), { status: e.target.value, updatedAt: new Date().toISOString() }, { merge: true })
                    } catch (error) {
                      console.error('Custom order status update error:', error)
                      alert(lang === 'ru' ? 'Не удалось изменить статус.' : '상태 변경에 실패했습니다.')
                    }
                  }}>
                    <option value="new">{lang === 'ru' ? 'Новая' : '신규'}</option>
                    <option value="contacted">{lang === 'ru' ? 'Связались' : '연락 완료'}</option>
                    <option value="in_progress">{lang === 'ru' ? 'В работе' : '진행 중'}</option>
                    <option value="completed">{lang === 'ru' ? 'Завершена' : '완료'}</option>
                    <option value="cancelled">{lang === 'ru' ? 'Отменена' : '취소'}</option>
                  </select>
                </label>
              </article>
            ))}
          </div>
        )}
      </>}
      {activeSection === 'reservations' && <>
<h2>{lang === 'ru' ? 'Список записей на занятия' : '수업 신청 목록'}</h2>

{!isFirebase && (
  <p>{lang === 'ru' ? 'Необходимо подключение Firebase.' : 'Firebase 연결이 필요합니다.'}</p>
)}

<p>
  {lang === 'ru' ? 'Всего заявок:' : '전체 신청:'} {adminReservations.length}
  {lang === 'ru' ? '' : '명'}
</p>

{adminReservations.length === 0 ? (
  <p>{lang === 'ru' ? 'Пока нет записавшихся.' : '아직 신청자가 없습니다.'}</p>
) : (
  <div style={{ overflowX: 'auto' }}>
    <table>
      <thead>
        <tr>
          <th>{lang === 'ru' ? 'Занятие' : '수업'}</th>
          <th>{lang === 'ru' ? 'Имя' : '이름'}</th>
          <th>{lang === 'ru' ? 'Электронная почта' : '이메일'}</th>
          <th>{lang === 'ru' ? 'Контакт' : '연락처'}</th>
          <th>{lang === 'ru' ? 'Дата записи' : '신청일'}</th>
        </tr>
      </thead>
      <tbody>
        {adminReservations.map((r) => {
          const event = events.find((e) => e.id === r.eventId)

          return (
            <tr key={r.id}>
              <td>
                {r.eventTitle ||
                  event?.title ||
                  D.extras.events.find((e) => e.id === r.eventId)?.title ||
                  r.eventId}
              </td>
              <td>{r.name || '-'}</td>
              <td>{r.email || '-'}</td>
              <td>{r.phone || '-'}</td>
              <td>
                {r.at ? new Date(r.at).toLocaleString(lang === 'ru' ? 'ru-RU' : 'ko-KR') : '-'}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
   </div>
)}

      </>}
</main>
  )
}
