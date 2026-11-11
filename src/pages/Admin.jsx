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
    <main className="page admin-page" style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px' }}>
      <h1>{lang === 'ru' ? 'Панель администратора' : '관리자 페이지'}</h1>
            <h2>{lang === 'ru' ? 'Управление товарами' : '상품 관리'}</h2>

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
    <option value="bag">{lang === 'ru' ? 'Сумки' : '가방'}</option>
    <option value="home">{lang === 'ru' ? 'Для дома' : '홈 인테리어'}</option>
    <option value="accessory">{lang === 'ru' ? 'Аксессуары' : '액세서리'}</option>
    <option value="clothes">{lang === 'ru' ? 'Одежда' : '의류'}</option>
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
            </div>

      <h2>{lang === 'ru' ? 'Управление статьями' : '아티클 관리'}</h2>

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
      <h2>{lang === 'ru' ? 'Список товаров' : '상품 목록'}</h2>

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
        {lang === 'ru' ? 'Редактировать' : '수정'}
      </button>

      <button
        className="btn ghost"
        onClick={() => deleteProduct(product)}
      >
        {lang === 'ru' ? 'Удалить' : '삭제'}
      </button>
    </div>
  ))}
</div>

      <h2>{lang === 'ru' ? 'Список статей' : '아티클 목록'}</h2>

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
    
<h2>{lang === 'ru' ? 'Управление расписанием занятий' : '수업 일정 관리'}</h2>

<div style={{ display: 'grid', gap: 10, maxWidth: 500, marginBottom: 30 }}>
  <label>
    {lang === 'ru' ? 'Дата' : '날짜'}
    <input
      type="date"
      value={eventForm.ymd}
      onChange={(e) => setEventForm({ ...eventForm, ymd: e.target.value })}
    />
  </label>

  <label>
    {lang === 'ru' ? 'Время' : '시간'}
    <input
      type="text"
      placeholder="14:00-16:00"
      value={eventForm.time}
      onChange={(e) => setEventForm({ ...eventForm, time: e.target.value })}
    />
  </label>

  <label>
    {lang === 'ru' ? 'Название занятия' : '수업명'}
    <input
      type="text"
      value={eventForm.title}
      onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
    />
  </label>

  <label>
    {lang === 'ru' ? 'Место проведения' : '장소'}
    <input
      type="text"
      value={eventForm.place}
      onChange={(e) => setEventForm({ ...eventForm, place: e.target.value })}
    />
  </label>

  <label>
    {lang === 'ru' ? 'Количество мест' : '모집 인원'}
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
    {editingEventId
      ? (lang === 'ru' ? 'Сохранить изменения' : '수정 완료')
      : (lang === 'ru' ? 'Сохранить расписание' : '일정 저장')}
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
      {lang === 'ru' ? 'Отмена' : '취소'}
    </button>
  )}
</div>

<h2>{lang === 'ru' ? 'Запланированные занятия' : '등록된 수업 일정'}</h2>


<div style={{ display: 'grid', gap: 10, marginBottom: 30 }}>
 
{events.map((event) => (
  <div
    key={event.id}
    style={{
      padding: 16,
      border: '1px solid #ddd',
      borderRadius: 8,
      marginBottom: 12
    }}
  >
    <strong>
  {lang === 'ru'
    ? (event.titleRu || event.title)
    : (event.titleKo || event.title)}
</strong>
    <p>{event.ymd} · {event.time}</p>
    <p>
      {event.place || '-'} · {lang === 'ru' ? 'Мест' : '모집'} {event.cap}
      {lang === 'ru' ? '' : '명'}
    </p>

    <button
      className="btn"
      onClick={() => editEvent(event)}
    >
      {lang === 'ru' ? 'Редактировать' : '수정'}
    </button>

    <button
      className="btn ghost"
      onClick={() => deleteEvent(event)}
    >
      {lang === 'ru' ? 'Удалить' : '삭제'}
    </button>
  </div>
))}
</div>

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

</main>
  )
}
