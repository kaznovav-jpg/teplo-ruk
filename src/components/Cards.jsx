import { Link } from 'react-router-dom'
import { useApp } from '../lib/store.jsx'
import { won, ph, artistName } from '../lib/util.js'

export function Img({ src, alt, seed = 'x', w = 600, h = 750, ...rest }) {
  return <img src={src} alt={alt} loading="lazy" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = ph(seed, w, h) }} {...rest} />
}

export function Crumb({ items }) {
  return (
    <nav className="crumb" aria-label="현재 위치">
      <Link to="/">홈</Link>{items.map((x, i) => <span key={i}> › {x}</span>)}
    </nav>
  )
}

// 찜 하트. text=true면 "♡ 찜하기" 버튼 형태
export function Heart({ id, label, text }) {
  const { S, toggleWish, toast } = useApp()
  const on = S.wish.includes(id)
  const click = () => toast(toggleWish(id) ? '찜 목록에 담았어요' : '찜을 해제했어요')
  if (text) return <button className={'heart btn' + (on ? ' on' : '')} aria-pressed={on} onClick={click}>{on ? '♥ 찜함' : '♡ 찜하기'}</button>
  return <button className={'heart' + (on ? ' on' : '')} aria-label={`${label} 찜하기`} aria-pressed={on} onClick={click}>♥</button>
}

export function FollowBtn({ a }) {
  const { S, toggleFollow, toast } = useApp()
  const on = S.follows.includes(a.id)
  return <button className="btn ghost" aria-pressed={on} onClick={() => toast(toggleFollow(a.id) ? '팔로우했어요' : '팔로우를 취소했어요')}>{on ? '팔로잉' : '+ 팔로우'}</button>
}
export const followers = (a, S) => (a.followers + (S.follows.includes(a.id) ? 1 : 0)).toLocaleString('ko-KR')

export function ProductCard({ p, D }) {
  return (
    <article className="card">
      <Link to={`/product/${p.id}`}>
        <div className="thumb">
          {p.images.slice(0, 2).map((s, i) => <Img key={i} src={s} alt={`${p.name} ${i ? '두 번째 컷' : '대표 이미지'}`} seed={p.id + i} />)}
          {p.soldOut && <div className="so">품절</div>}
        </div>
      </Link>
      <div className="bd">{p.badges.map((b) => <span key={b} className="badge">{b}</span>)}</div>
      <Link to={`/product/${p.id}`}><p className="ar">{artistName(D, p.artist)}</p><p className="nm">{p.name}</p><p className="pr">{won(p.price)}</p></Link>
      <Heart id={p.id} label={p.name} />
    </article>
  )
}

export const typeBadge = (t) => <span className={'badge ' + (t === '유료' ? '' : t === '무료' ? 'free' : 'free kit')}>{t}</span>

export function ClassCard({ c, D }) {
  return (
    <article className="card">
      <Link to={`/classes/${c.id}`}>
        <div className="thumb wide"><Img src={c.thumb} alt={`${c.title} 썸네일`} seed={c.id} h={400} /></div>
        <p style={{ marginTop: 10 }}>{typeBadge(c.type)}<span className="badge line">{c.kind}</span><span className="badge line">{c.level}</span></p>
        <p className="nm">{c.title}</p>
        <p className="ar">{artistName(D, c.artist)} 작가 · {c.minutes}분 · {c.price ? won(c.price) : '무료'}</p>
      </Link>
      <Heart id={c.id} label={c.title} />
    </article>
  )
}

export function ArticleCard({ a }) {
  return (
    <article className="card">
      <Link to={`/articles/${a.id}`}>
        <div className="thumb wide"><Img src={a.thumb} alt={`${a.title} 썸네일`} seed={a.id} h={400} /></div>
        <p className="ar" style={{ marginTop: 10 }}>{a.tag} · {a.date}</p>
        <p className="nm serif">{a.title}</p><p className="muted">{a.excerpt}</p>
      </Link>
    </article>
  )
}

export function ArtistCard({ a, D }) {
  const { S } = useApp()
  return (
    <article className="card">
      <Link to={`/artists/${a.id}`}>
        <div className="thumb wide"><Img src={a.cover} alt={`${a.name} 작가 대표 이미지`} seed={a.id} h={400} /></div>
        <h3 style={{ marginTop: 10, fontSize: '1.15rem' }}>{a.name}</h3>
        <p className="ar">{a.field} · 팔로워 {followers(a, S)}명</p>
        <p className="muted" style={{ margin: '6px 0 10px' }}>{a.bio}</p>
      </Link>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 12 }}>
        {a.products.slice(0, 3).map((id) => { const p = D.products.find((x) => x.id === id); return <Link key={id} to={`/product/${id}`}><div className="thumb sq"><Img src={p.images[0]} alt={p.name} seed={id} /></div></Link> })}
      </div>
      <FollowBtn a={a} />
      <Heart id={a.id} label={`${a.name} 작가`} />
    </article>
  )
}
