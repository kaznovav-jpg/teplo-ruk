import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { D } from '../lib/data.js'
import { useApp } from '../lib/store.jsx'
import { useLanguage } from '../lib/language.jsx'
import { BOARDS, isPhoto, dFmt, shrink } from '../lib/util.js'
import useTitle from '../lib/useTitle.js'
import { Crumb, Img, ArticleCard, ProductCard, Heart } from '../components/Cards.jsx'
import Comments from '../components/Comments.jsx'

const share = (toast) => { try { navigator.clipboard.writeText(location.href).then(() => toast('링크를 복사했어요'), () => toast('공유 링크를 복사하지 못했어요')) } catch { toast('공유 링크를 복사하지 못했어요') } }

export function Articles() {
  const { lang } = useLanguage()
  const pageTitle = lang === 'ru' ? 'Статьи и блог' : '아티클·블로그'
  useTitle(pageTitle)
  const [sp] = useSearchParams()
  const { articles } = useApp()
const [cat, setCat] = useState(sp.get('cat') || ''), [kw, setKw] = useState('')
  const l = articles.filter((a) => {
    const title = lang === 'ru' ? (a.titleRu || a.title) : a.title
    const excerpt = lang === 'ru' ? (a.excerptRu || a.excerpt) : a.excerpt
    return (!cat || a.tag === cat) &&
      (!kw || title?.toLowerCase().includes(kw.toLowerCase()) ||
        excerpt?.toLowerCase().includes(kw.toLowerCase()))
  })
  return (
    <div className="wrap">
      <Crumb items={[pageTitle]} />
      <h1 style={{ fontSize: '1.8rem', marginBottom: 14 }}>{pageTitle}</h1>
      <div className="bar">
        <div className="tabs" role="tablist" style={{ margin: 0, flex: 1, overflowX: 'auto' }}>{['', '정보', '트렌드', '리뷰'].map((t) => <button key={t} role="tab" className={t === cat ? 'on' : ''} onClick={() => setCat(t)}>{t || '전체'}</button>)}</div>
        <input className="field" type="search" placeholder="아티클 검색" aria-label="아티클 검색" value={kw} onChange={(e) => setKw(e.target.value.trim())} />
      </div>
      <p className="muted" style={{ marginBottom: 12 }}>총 {l.length}개</p>
      <div className="grid g3">{l.length ? l.map((a) => <ArticleCard key={a.id} a={a} />) : <p className="empty" style={{ gridColumn: '1/-1' }}>검색 결과가 없어요. 다른 단어로 찾아보세요.</p>}</div>
    </div>
  )
}


export function Article() {
  const { id } = useParams(), { toast, articles } = useApp()
  const { lang } = useLanguage()
  const a = articles.find((x) => x.id === id) || articles[0]

  if (!a) return <div className="wrap empty">Статья не найдена</div>

  const body = (a.body || []).map((s) => ({
    heading: lang === 'ru'
      ? (s.headingRu || s.heading || (Array.isArray(s) ? s[0] : ''))
      : (s.heading || (Array.isArray(s) ? s[0] : '')),
    text: lang === 'ru'
      ? (s.textRu || s.text || (Array.isArray(s) ? s[1] : ''))
      : (s.text || (Array.isArray(s) ? s[1] : ''))
  }))

  const title = lang === 'ru' ? (a.titleRu || a.title) : a.title
  const excerpt = lang === 'ru' ? (a.excerptRu || a.excerpt) : a.excerpt

  useTitle(title)

  return (
    <div className="wrap">
      <Crumb items={[<Link to="/articles">아티클·블로그</Link>, title]} />
      <div className="art">
        <p className="muted" style={{ margin: 0 }}>{a.tag} · {a.date}</p>
        <h1 style={{ fontSize: '1.9rem', margin: '6px 0 14px' }}>{title}</h1>
        <div className="thumb wide">
          <Img src={a.thumb} alt={title} seed={a.id} h={400} loading="eager" />
        </div>

        {excerpt && <p className="lead">{excerpt}</p>}

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 12,
          marginTop: 20
        }}>
          {(a.images?.length ? a.images.slice(1) : []).map((url, i) => (
            <button
              key={i}
              type="button"
              onClick={() => window.open(url, '_blank')}
              style={{
                border: 0,
                padding: 0,
                background: 'transparent',
                cursor: 'zoom-in'
              }}
            >
              <Img
                src={url}
                alt={`${title} — ${i + 2}`}
                seed={`${a.id}-${i}`}
                h={260}
              />
            </button>
          ))}
        </div>

        <nav className="lead" aria-label="목차" style={{ marginTop: 20 }}>
          <ol style={{ marginTop: 6 }}>
            {body.map((s, i) => (
              <li key={i}>
                <button
                  className="btn ghost"
                  style={{ border: 0, justifyContent: 'flex-start' }}
                  onClick={() => document.getElementById('sec' + i)?.scrollIntoView({ behavior: 'smooth' })}
                >
                  {i + 1}. {s.heading}
                </button>
              </li>
            ))}
          </ol>
        </nav>

        {body.map((s, i) => (
          <div key={i}>
            <h2 id={'sec' + i} style={{ fontSize: '1.3rem', marginTop: 26 }}>{s.heading}</h2>
            <p>{s.text}</p>
          </div>
        ))}

        <div className="acts">
          <button className="btn ghost" onClick={() => share(toast)}>공유하기</button>
          <Heart id={a.id} text />
        </div>

        <h2 className="mt" style={{ fontSize: '1.3rem' }}>관련 상품</h2>
        <div className="grid g4" style={{ marginTop: 12, gridTemplateColumns: 'repeat(2,1fr)' }}>
          {(a.related || []).map((pid) => {
            const product = D.products.find((p) => p.id === pid)
            return product ? <ProductCard key={pid} p={product} D={D} /> : null
          })}
        </div>

        <div className="mt"><Comments id={a.id} sample={a.thread || []} /></div>

        <h2 className="mt" style={{ fontSize: '1.3rem' }}>관련 글</h2>
        <div className="grid g3" style={{ marginTop: 12, gridTemplateColumns: 'repeat(2,1fr)' }}>
          {articles.filter((x) => x.id !== a.id).slice(0, 2).map((x) => (
            <ArticleCard key={x.id} a={x} />
          ))}
        </div>
      </div>
      <div style={{ height: 48 }} />
    </div>
  )
}


const useAll = () => { const { posts, S } = useApp(); return { all: [...posts, ...D.posts], likeN: (p) => (p.likes || 0) + (S.likes.includes(p.id) ? 1 : 0) } }
const cmtN = (p) => (p.thread || []).length || p.comments || 0

const postTime = (p) => {
  const value = p.at || p.createdAt || p.date || p.created_at
  if (value == null) return 0
  if (typeof value === 'number') return value < 1e12 ? value * 1000 : value
  if (typeof value?.toMillis === 'function') return value.toMillis()
  if (typeof value?.seconds === 'number') return value.seconds * 1000
  const parsed = Date.parse(String(value).replace(/\./g, '-'))
  return Number.isNaN(parsed) ? 0 : parsed
}

export function Community() {
  useTitle('포토 포럼·커뮤니티')
  const [sp] = useSearchParams(), nav = useNavigate(), { user, toast } = useApp(), { all, likeN } = useAll()
  const [b, setB] = useState(sp.get('board') || 'wip')
  const [keywords, setKeywords] = useState({})
  const keyword = keywords[b] || ''
  const hot = (p) => likeN(p) >= 20 && <span className="badge">인기</span>
  const l = all
    .filter((p) => p.board === b)
    .sort((a, z) => postTime(z) - postTime(a))
    .filter((p) => {
      if (!keyword.trim()) return true
      const haystack = [p.id, p.title, p.body, p.author, p.tag, ...(p.tags || []), p.date, p.at, p.likes, cmtN(p)]
        .filter((value) => value != null)
        .join(' ')
        .toLocaleLowerCase()
      return haystack.includes(keyword.trim().toLocaleLowerCase())
    })
  const write = () => { if (!user) { toast('로그인이 필요해요'); nav('/mypage?tab=login') } else nav('/community/write?board=' + b) }
  return (
    <div className="wrap">
      <Crumb items={['포토 포럼·커뮤니티']} />
      <div className="ah" style={{ paddingTop: 0 }}><h1 style={{ fontSize: '1.8rem' }}>포토 포럼·커뮤니티</h1><button className="btn" onClick={write}>글쓰기</button></div>
      <div className="tabs" role="tablist" style={{ overflowX: 'auto' }}>{BOARDS.map((x) => <button key={x[0]} role="tab" aria-selected={x[0] === b} className={x[0] === b ? 'on' : ''} onClick={() => setB(x[0])}>{x[1]}</button>)}</div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', margin: '14px 0' }}>
        <input
          className="field"
          type="search"
          value={keyword}
          onChange={(e) => setKeywords((prev) => ({ ...prev, [b]: e.target.value }))}
          placeholder="Поиск по словам или цифрам"
          aria-label="Поиск публикаций в выбранном подразделе"
          style={{ flex: 1, minWidth: 0 }}
        />
        {keyword && <button type="button" className="btn ghost" onClick={() => setKeywords((prev) => ({ ...prev, [b]: '' }))}>Очистить</button>}
      </div>
      <p className="muted" style={{ marginBottom: 12 }}>Найдено: {l.length}</p>
      {!l.length ? <p className="empty">{keyword ? 'По вашему запросу ничего не найдено.' : 'Пока нет публикаций. Будьте первым!'}</p> : isPhoto(b) ? (
        <div className="mason">{l.map((p) => (
          <article className="mc" key={p.id}>
            <Link to={`/community/${p.id}`}><Img src={p.thumb} alt={p.title} seed={p.id} /></Link>
            <div className="mi"><p><b>{p.title}</b></p><p className="muted">{p.author} · ♥ {likeN(p)} · 댓글 {cmtN(p)} {hot(p)}</p></div>
          </article>))}
        </div>
      ) : (
        <ul className="list">{l.map((p) => (
          <li key={p.id} style={{ padding: '10px 0', flexWrap: 'wrap' }}>
            <span className="badge line">{p.tag}</span>{hot(p)}
            <Link to={`/community/${p.id}`} style={{ flex: 1, minWidth: 180 }}><b>{p.title}</b></Link>
            <span className="muted">{p.author} · ♥ {likeN(p)} · 💬 {cmtN(p)}</span>
          </li>))}
        </ul>
      )}
    </div>
  )
}
export function Post() {
  const { id } = useParams(), nav = useNavigate()
  const { user, isAdmin, S, toggleLike, toast, updatePost, deletePost } = useApp()
  const { all, likeN } = useAll()
  const [editing, setEditing] = useState(false)
  const p = all.find((x) => x.id === id)
  useTitle(p?.title || '게시글')
  if (!p) return <div className="wrap empty"><p>게시글을 찾을 수 없어요.</p><Link className="btn" to="/community">목록으로</Link></div>
  const canManage = Boolean(user && (isAdmin || p.uid === user.uid))
  const on = S.likes.includes(p.id), imgs = p.images || []
  const like = () => { if (!user) { toast('로그인이 필요해요'); nav('/mypage?tab=login'); return } toggleLike(p.id) }
  const remove = async () => {
    if (!window.confirm('Удалить эту публикацию?')) return
    try { await deletePost(p.id); toast('Публикация удалена.'); nav('/community') }
    catch (error) { toast(error?.message || 'Не удалось удалить публикацию.') }
  }
  const save = async (event) => {
    event.preventDefault()
    const form = event.currentTarget
    try {
      await updatePost(p.id, { title: form.title.value.trim(), body: form.body.value.trim(), tag: form.tags.value.split(',').map((x) => x.trim()).filter(Boolean)[0] || p.tag, tags: form.tags.value.split(',').map((x) => x.trim()).filter(Boolean) })
      toast('Изменения сохранены.'); setEditing(false)
    } catch (error) { toast(error?.message || 'Не удалось сохранить изменения.') }
  }
  return (
    <div className="wrap">
      <Crumb items={[<Link to={`/community?board=${p.board}`}>{BOARDS.find((x) => x[0] === p.board)?.[1] || '커뮤니티'}</Link>, p.title]} />
      <div className="art">
        <p>{likeN(p) >= 20 && <span className="badge">인기</span>}<span className="badge line">{p.tag}</span></p>
        {editing ? <form className="form" onSubmit={save}>
          <label>Заголовок<input className="field" name="title" defaultValue={p.title} required maxLength={60} /></label>
          <label>Текст<textarea className="field" name="body" rows={7} defaultValue={p.body} required /></label>
          <label>Теги (через запятую)<input className="field" name="tags" defaultValue={(p.tags || []).join(', ')} /></label>
          <div className="acts"><button className="btn">Сохранить</button><button type="button" className="btn ghost" onClick={() => setEditing(false)}>Отмена</button></div>
        </form> : <>
          <h1 style={{ fontSize: '1.7rem', margin: '6px 0' }}>{p.title}</h1>
          <p className="muted" style={{ margin: 0 }}>{p.author} · {p.at ? dFmt(p.at) : p.date}</p>
          <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>{imgs.map((s, i) => <Img key={i} src={s} alt={`${p.title} 사진 ${i + 1}`} seed={p.id + i} style={{ borderRadius: 12, width: '100%' }} />)}</div>
          <p style={{ marginTop: 16, whiteSpace: 'pre-wrap' }}>{p.body}</p>
          <p className="muted">{(p.tags || []).map((t) => '#' + t).join(' ')}</p>
          <div className="acts"><button className="btn ghost" aria-pressed={on} onClick={like}>{on ? '♥' : '♡'} 좋아요 {likeN(p)}</button><button className="btn ghost" onClick={() => share(toast)}>공유하기</button>
            {canManage && <><button className="btn ghost" onClick={() => setEditing(true)}>Изменить</button><button className="btn ghost" onClick={remove}>Удалить</button></>}
          </div>
        </>}
        <div className="mt"><Comments id={p.id} sample={p.thread || []} /></div>
      </div>
      <div style={{ height: 48 }} />
    </div>
  )
}

export function Write() {
  useTitle('글쓰기')
  const { lang } = useLanguage()
  const ru = lang === 'ru'
  const nav = useNavigate(), [sp] = useSearchParams(), { user, authReady, addPost, uploadImages, toast } = useApp()
  const [imgs, setImgs] = useState([]), [busy, setBusy] = useState(false)
  const cancelRequested = useRef(false)
  useEffect(() => { if (authReady && !user) { toast('로그인이 필요해요'); nav('/mypage?tab=login') } }, [authReady, user, nav, toast])
  if (!authReady || !user) return null
  const pick = async (e) => {
    const selected = [...e.target.files]
    e.target.value = ''
    if (!selected.length) return
    const remaining = 4 - imgs.length
    if (remaining <= 0) {
      toast(ru ? 'Можно добавить не более 4 фотографий.' : '사진은 최대 4장까지 추가할 수 있어요.')
      return
    }
    if (selected.length > remaining) toast(ru ? `Можно добавить ещё ${remaining} фото.` : `사진을 ${remaining}장 더 추가할 수 있어요.`)
    try {
      const compressed = await Promise.all(selected.slice(0, remaining).map(shrink))
      setImgs(prev => [...prev, ...compressed].slice(0, 4))
    } catch (err) { toast(err?.message || '사진을 처리하지 못했어요') }
  }
  const removePhoto = (i) => setImgs(prev => prev.filter((_, idx) => idx !== i))
  const cancel = () => {
    if (busy) cancelRequested.current = true
    toast(busy ? (ru ? 'Отмена публикации… Подождите.' : '게시 취소 중… 잠시 기다려 주세요.') : (ru ? 'Создание публикации отменено.' : '작성 취소'))
    nav('/community')
  }
  const submit = async (e) => {
    e.preventDefault()
    const f = e.target, b = f.board.value
    if (isPhoto(b) && !imgs.length) { toast('사진 게시판에는 사진을 1장 이상 올려 주세요'); return }
    cancelRequested.current = false
    setBusy(true)
    try {
      const tags = f.tags.value.split(',').map((t) => t.trim()).filter(Boolean), urls = await uploadImages(imgs)
      if (cancelRequested.current) { toast('게시가 취소되었어요'); return }
      const id = await addPost({ board: b, title: f.title.value.trim(), tag: tags[0] || BOARDS.find((x) => x[0] === b)[1], tags, body: f.body.value.trim(), images: urls, thumb: urls[0] || '' })
      toast('글을 등록했어요'); nav('/community/' + id)
    } catch (err) { console.error('Community publish error:', err); toast(err?.message || '글을 등록하지 못했어요') }
    finally { setBusy(false) }
  }
  return (
    <div className="wrap sec" style={{ maxWidth: 680 }}>
      <h1 style={{ fontSize: '1.7rem', marginBottom: 14 }}>글쓰기</h1>
      <form className="form" onSubmit={submit}>
        <label>게시판<select className="field" name="board" defaultValue={sp.get('board') || 'wip'} disabled={busy}>{BOARDS.map((x) => <option key={x[0]} value={x[0]}>{x[1]}</option>)}</select></label>
        <label>제목<input className="field" name="title" required maxLength={60} disabled={busy} /></label>
        <label>내용<textarea className="field" name="body" rows={6} required style={{ padding: 10 }} disabled={busy} /></label>
        <label>태그 (쉼표로 구분)<input className="field" name="tags" placeholder="뜨개, 니트" disabled={busy} /></label>
        <label>사진 (최대 4장)<input className="field" type="file" accept="image/*" multiple onChange={pick} disabled={busy} /></label>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {imgs.map((s, i) => <div key={i} style={{ position: 'relative' }}>
            <img src={s} alt={ru ? `Предпросмотр фото ${i + 1}` : `업로드한 사진 ${i + 1} 미리보기`} style={{ width: 88, height: 88, objectFit: 'cover', borderRadius: 8 }} />
            <button type="button" className="btn ghost" onClick={() => removePhoto(i)} disabled={busy} aria-label={ru ? `Удалить фото ${i + 1}` : `사진 ${i + 1} 삭제`} style={{ position: 'absolute', top: 2, right: 2, minWidth: 28, padding: '2px 7px', borderRadius: 20, background: '#fff' }}>×</button>
          </div>)}
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn" disabled={busy}>{busy ? (ru ? 'Публикация… (дождитесь завершения)' : '등록 중… (완료될 때까지 기다려 주세요)') : (ru ? 'Опубликовать' : '등록하기')}</button>
          <button type="button" className="btn ghost" onClick={cancel}>{ru ? 'Отменить публикацию' : '작성 취소'}</button>
        </div>
      </form>
    </div>
  )
}
