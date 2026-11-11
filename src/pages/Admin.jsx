import { useState } from 'react'
import { useApp } from '../lib/store.jsx'
import { useLanguage } from '../lib/language.jsx'
import { D } from '../lib/data.js'
import * as F from '../lib/firebase.js'

export default function Admin() {
  const { user, isAdmin, adminReservations, adminEvents, products, articles, isFirebase } = useApp()
    const { lang } = useLanguage()
  const [eventForm, setEventForm] = useState({
  ymd: '',
  time: '',
  type: '수업',
  title: '',
  place: '',
  cap: 8,
  online: false
})
  const [editingEventId, setEditingEventId] = useState(null)
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
      place: '',
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
      place: '',
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
    place: event.place || '',
    cap: event.cap || 8,
    online: event.online || false
  })

  window.scrollTo({ top: 0, behavior: 'smooth' })
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
    const updateProductField = (field, value) => {
    setProductForm((prev) => ({ ...prev, [field]: value }))
  }
  return (
    <main className="page" style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px' }}>
      <h1>{lang === 'ru' ? 'Панель администратора' : '관리자 페이지'}</h1>
            <h2>{lang === 'ru' ? 'Управление товарами' : '상품 관리'}</h2>

      <div style={{ display: 'grid', gap: 10, maxWidth: 500, marginBottom: 30 }}>
        <label>
          Название товара (한국어)
          <input
            value={productForm.name}
            onChange={(e) => updateProductField('name', e.target.value)}
            placeholder="상품명"
          />
        </label>

        <label>
          Название товара (русский)
          <input
            value={productForm.nameRu}
            onChange={(e) => updateProductField('nameRu', e.target.value)}
            placeholder="Название товара"
          />
        </label>

        <label>
          Цена (₩)
          <input
            type="number"
            value={productForm.price}
            onChange={(e) => updateProductField('price', e.target.value)}
            placeholder="100000"
          />
        </label>

        <label>
          Категория
          <select
            value={productForm.cat}
            onChange={(e) => updateProductField('cat', e.target.value)}
          >
            <option value="bag">Сумки</option>
            <option value="home">Для дома</option>
            <option value="accessory">Аксессуары</option>
            <option value="clothes">Одежда</option>
          </select>
        </label>
               <label>
  Фотографии товара

  <input
    type="url"
    className="field"
    value={productForm.images[0] || ''}
    onChange={(e) => setProductForm((prev) => ({
      ...prev,
      images: [e.target.value, ...(prev.images || []).slice(1)]
    }))}
    placeholder="Ссылка на первую фотографию"
  />

  <span>Или выберите несколько фотографий с компьютера:</span>

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
          Описание товара (한국어)
          <textarea
            value={productForm.desc}
            onChange={(e) => updateProductField('desc', e.target.value)}
            placeholder="상품 설명"
          />
        </label>

        <label>
          Описание товара (русский)
          <textarea
            value={productForm.descRu}
            onChange={(e) => updateProductField('descRu', e.target.value)}
            placeholder="Описание товара"
          />
        </label>
                <label>
          Материал
          <input
            value={productForm.material}
            onChange={(e) => updateProductField('material', e.target.value)}
            placeholder="면, 린넨, 울 등"
          />
        </label>
                <label>
          Цвета (перечисли через запятую)
          <input
            value={productForm.colors.join(', ')}
            onChange={(e) => setProductForm({
              ...productForm,
              colors: e.target.value.split(',').map((x) => x.trim())
            })}
            placeholder="Бежевый, белый, коричневый"
          />
        </label>
                <label>
          Размеры (через запятую)
          <input
            value={productForm.sizes.join(', ')}
            onChange={(e) => setProductForm({
              ...productForm,
              sizes: e.target.value.split(',').map((x) => x.trim())
            })}
            placeholder="S, M, L или 20×15 см"
          />
        </label>
                <button className="btn" onClick={saveProduct}>
          {editingProductId ? 'Сохранить изменения' : 'Добавить товар'}
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
            </div>

      <h2>{lang === 'ru' ? 'Управление статьями' : '아티클 관리'}</h2>

<div style={{ display: 'grid', gap: 10, marginBottom: 30 }}>
  <label>
    Название статьи (한국어)
    <input
      className="field"
      value={articleForm.title}
      onChange={(e) => setArticleForm({ ...articleForm, title: e.target.value })}
    />
  </label>

  <label>
    Название статьи (Русский)
    <input
      className="field"
      value={articleForm.titleRu}
      onChange={(e) => setArticleForm({ ...articleForm, titleRu: e.target.value })}
    />
  </label>

  <label>
    Категория
    <select
      className="field"
      value={articleForm.tag}
      onChange={(e) => setArticleForm({ ...articleForm, tag: e.target.value })}
    >
      <option value="정보">Информация</option>
      <option value="트렌드">Тренды</option>
      <option value="리뷰">Обзоры</option>
    </select>
  </label>

  <label>
    Дата публикации
    <input
      className="field"
      type="date"
      value={articleForm.date}
      onChange={(e) => setArticleForm({ ...articleForm, date: e.target.value })}
    />
  </label>

  <label>
    Краткое описание (한국어)
    <textarea
      className="field"
      value={articleForm.excerpt}
      onChange={(e) => setArticleForm({ ...articleForm, excerpt: e.target.value })}
    />
  </label>

  <label>
    Краткое описание (Русский)
    <textarea
      className="field"
      value={articleForm.excerptRu}
      onChange={(e) => setArticleForm({ ...articleForm, excerptRu: e.target.value })}
    />
  </label>

  <label>
  Фотографии статьи

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
    <strong>Раздел {index + 1}</strong>

    <label>Заголовок (한국어)
      <input className="field" value={section.heading || ''} onChange={(e) => {
        const body = [...articleForm.body]
        body[index] = { ...section, heading: e.target.value }
        setArticleForm({ ...articleForm, body })
      }} />
    </label>

    <label>Текст (한국어)
      <textarea className="field" rows={5} value={section.text || ''} onChange={(e) => {
        const body = [...articleForm.body]
        body[index] = { ...section, text: e.target.value }
        setArticleForm({ ...articleForm, body })
      }} />
    </label>

    <label>Заголовок (Русский)
      <input className="field" value={section.headingRu || ''} onChange={(e) => {
        const body = [...articleForm.body]
        body[index] = { ...section, headingRu: e.target.value }
        setArticleForm({ ...articleForm, body })
      }} />
    </label>

    <label>Текст (Русский)
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
        Удалить раздел
      </button>
    )}
  </div>
))}
>
  + Добавить раздел
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
  + Добавить раздел
</button>
  )}
  <button
  type="button"
  className="btn"
  onClick={saveArticle}
>
  {editingArticleId ? 'Сохранить изменения' : 'Добавить статью'}
</button>
</div>
      <h2>Список товаров</h2>

      <div style={{ display: 'grid', gap: 12, marginBottom: 30 }}>
        {products.map((product) => (
          <div
            key={product.id}
            style={{
              padding: 12,
              border: '1px solid #ddd',
              borderRadius: 8
            }}
          >
            {product.images?.[0] && (
              <img
                src={product.images[0]}
                alt={product.name}
                style={{
                  width: 100,
                  height: 100,
                  objectFit: 'cover',
                  borderRadius: 8
                }}
              />
            )}

            <strong>{product.name}</strong>
            <p>{product.nameRu || ''}</p>
            <p>{Number(product.price || 0).toLocaleString()} ₩</p>

            <button
              className="btn"
              onClick={() => editProduct(product)}
            >
              Редактировать
            </button>

            <button
              className="btn ghost"
              onClick={() => deleteProduct(product)}
            >
              Удалить
            </button>
          </div>
        ))}
      </div>

      <h2>Список статей</h2>

<div style={{ display: 'grid', gap: 12, marginBottom: 30 }}>
  {articles.map((article) => (
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
        Редактировать
      </button>

      <button
        className="btn ghost"
        onClick={() => deleteArticle(article)}
      >
        Удалить
      </button>
    </div>
  ))}
</div>
      <h2>{lang === 'ru' ? 'Управление расписанием занятий' : '수업 일정 관리'}</h2>

<div style={{ display: 'grid', gap: 10, maxWidth: 500, marginBottom: 30 }}>
  <label>
    날짜
    <input
      type="date"
      value={eventForm.ymd}
      onChange={(e) => setEventForm({ ...eventForm, ymd: e.target.value })}
    />
  </label>

  <label>
    시간
    <input
      type="text"
      placeholder="14:00-16:00"
      value={eventForm.time}
      onChange={(e) => setEventForm({ ...eventForm, time: e.target.value })}
    />
  </label>

  <label>
    수업명
    <input
      type="text"
      value={eventForm.title}
      onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
    />
  </label>

  <label>
    장소
    <input
      type="text"
      value={eventForm.place}
      onChange={(e) => setEventForm({ ...eventForm, place: e.target.value })}
    />
  </label>

  <label>
    모집 인원
    <input
      type="number"
      min="1"
      value={eventForm.cap}
      onChange={(e) => setEventForm({ ...eventForm, cap: e.target.value })}
    />
  </label>

 <button
  className="btn"
  onClick={editingEventId ? updateEvent : addEvent}
>
  {editingEventId ? '수정 완료' : '일정 저장'}
</button>

{editingEventId && (
  <button
    className="btn ghost"
    onClick={() => {
      setEditingEventId(null)
      setEventForm({
        ymd: '',
        time: '',
        type: '수업',
        title: '',
        place: '',
        cap: 8,
        online: false
      })
    }}
  >
    취소
  </button>
)}
</div>
      <h2>{lang === 'ru' ? 'Запланированные занятия' : '등록된 수업 일정'}</h2>

<div style={{ display: 'grid', gap: 10, marginBottom: 30 }}>
  {events.map((event) => (
    <div
      key={event.id}
      style={{
        padding: 12,
        border: '1px solid #ddd',
        borderRadius: 8
      }}
    >
      <strong>{event.title}</strong>
      <p>{event.ymd} · {event.time}</p>
      <p>{event.place || '-' } · 모집 {event.cap}명</p>

           <button
        className="btn"
        onClick={() => editEvent(event)}
      >
        수정
      </button>

      <button
        className="btn ghost"
        onClick={() => deleteEvent(event)}
      >
        삭제
      </button>
    </div>
  ))}
</div>
      <h2>{lang === 'ru' ? 'Список записей на занятия' : '수업 신청 목록'}</h2>

      {!isFirebase && (
        <p>Firebase 연결이 필요합니다.</p>
      )}

      <p>전체 신청: {adminReservations.length}명</p>

      {adminReservations.length === 0 ? (
        <p>아직 신청자가 없습니다.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>수업</th>
                <th>이름</th>
                <th>이메일</th>
                <th>연락처</th>
                <th>신청일</th>
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
                      {r.at ? new Date(r.at).toLocaleString() : '-'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}
