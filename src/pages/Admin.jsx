import { useState } from 'react'
import { useApp } from '../lib/store.jsx'
import { useLanguage } from '../lib/language.jsx'
import { D } from '../lib/data.js'
import * as F from '../lib/firebase.js'

export default function Admin() {
  const { user, isAdmin, adminReservations, adminEvents, masterApplications, artistWorks, products, articles, isFirebase } = useApp()
    const { lang } = useLanguage()
  const [activeSection, setActiveSection] = useState('overview')
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
  const [productForm, setProductForm] = useState({
  name: '',
  nameRu: '',
  price: '',
  cat: 'bag',
  images: [''],
  desc: '',
  descRu: '',
  material: '',
  colors: [''],
  sizes: [''],
  published: true
})

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
    images: productForm.images.filter(Boolean),
    colors: productForm.colors.filter(Boolean),
    sizes: productForm.sizes.filter(Boolean),
        artist: 'a1',
    badges: [],
    soldOut: false,
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
      cat: 'bag',
      images: [''],
      desc: '',
      descRu: '',
      material: '',
      colors: [''],
      sizes: [''],
      published: true
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
    cat: product.cat || 'bag',
    images: product.images?.length ? product.images : [''],
    desc: product.desc || '',
    descRu: product.descRu || '',
    material: product.material || '',
    colors: product.colors?.length ? product.colors : [''],
    sizes: product.sizes?.length ? product.sizes : [''],
    published: product.published !== false
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
          { id: 'masters', ru: 'Мастера и их работы', ko: '작가 및 작품', icon: '✿' },
          { id: 'products', ru: 'Товары', ko: '상품 관리', icon: '▧' },
          { id: 'articles', ru: 'Статьи', ko: '아티클 관리', icon: '▤' },
          { id: 'schedule', ru: 'Расписание', ko: '수업 일정', icon: '▦' },
          { id: 'reservations', ru: 'Записи на занятия', ko: '수업 신청', icon: '☷' }
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
              { id: 'reservations', title: lang === 'ru' ? 'Записи' : '신청', count: adminReservations.length, note: lang === 'ru' ? 'Участники' : '신청자' }
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
      {activeSection === 'products' && <>
            <h2>{lang === 'ru' ? 'Управление товарами' : '상품 관리'}</h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, margin: '18px 0 24px' }}>
        <button type="button" className="btn" onClick={() => { setEditingProductId(null); setProductForm({ name: '', nameRu: '', price: '', cat: 'bag', images: [''], desc: '', descRu: '', material: '', colors: [''], sizes: [''], published: true }); setSelectedProductCategory('add') }}>
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
  {lang === 'ru' ? 'Цена (₩)' : '가격 (₩)'}
  <input
    type="number"
    value={productForm.price}
    onChange={(e) => updateProductField('price', e.target.value)}
    placeholder="100000"
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
                cat: 'bag',
                images: [''],
                desc: '',
                descRu: '',
                material: '',
                colors: [''],
                sizes: [''],
                published: true
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
