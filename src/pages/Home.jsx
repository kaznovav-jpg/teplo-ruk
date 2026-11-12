import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { D } from '../lib/data.js'
import { useLanguage } from '../lib/language.jsx'
import { useApp } from '../lib/store.jsx'
import { CATS } from '../lib/util.js'
import useTitle from '../lib/useTitle.js'
import { Img, ProductCard, ClassCard, ArticleCard } from '../components/Cards.jsx'

const SLIDES_KO = [
  ['손끝에서 피어난 따뜻함', '한 점씩 정성껏 만든 가방과 니트를 만나보세요.', '/category?c=all', 'h1'],
  ['이번 가을, 포근한 뜨개', '손뜨개 머플러와 베스트를 새로 선보입니다.', '/category?c=knit', 'h2'],
  ['배우고, 만들고, 나누는 공방', '수공예 클래스와 작가 커뮤니티를 만나보세요.', '/classes', 'h3'],
]
const SLIDES_RU = [
  ['Тепло, рождённое в руках', 'Сумки и вязаные изделия, созданные с заботой и вниманием к каждой детали.', '/category?c=all', 'h1'],
  ['Уютное вязание этой осенью', 'Откройте для себя новые вязаные шарфы и жилеты.', '/category?c=knit', 'h2'],
  ['Учимся, создаём и делимся', 'Знакомьтесь с мастер-классами и сообществом мастеров.', '/classes', 'h3'],
]

export default function Home() {
  useTitle('')
  const { toast } = useApp()
  const { lang } = useLanguage()
  const ru = lang === 'ru'
  const slides = ru ? SLIDES_RU : SLIDES_KO
  const t = (ko, russian) => ru ? russian : ko
  const [i, setI] = useState(0), [hov, setHov] = useState(false), [tab, setTab] = useState('new'), [rv, setRv] = useState(0)
  const go = (n) => setI((n + 3) % 3)
  useEffect(() => {
    if (hov || matchMedia('(prefers-reduced-motion:reduce)').matches) return
    const t = setInterval(() => setI((x) => (x + 1) % 3), 5000)
    return () => clearInterval(t)
  }, [hov])
  useEffect(() => { const t = setInterval(() => setRv((x) => (x + 1) % 3), 4500); return () => clearInterval(t) }, [])

  const P = D.products, art = D.artists[0], ex = D.extras
  const list = [...P].sort(tab === 'new' ? (a, b) => a.daysAgo - b.daysAgo : (a, b) => b.popularity - a.popularity).slice(0, 8)
  const hotPosts = [...D.posts].sort((a, b) => b.likes - a.likes).slice(0, 4)

  return (
    <>
      <section className="hero" aria-label={t('메인 배너', 'Главный баннер')} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
        <div className="slides" style={{ transform: `translateX(-${i * 100}%)` }}>
          {slides.map((s) => (
            <div key={s[3]} className="slide" style={{ backgroundImage: `url(https://picsum.photos/seed/${s[3]}/1600/700)` }}>
              <div className="wrap"><h1>{s[0]}</h1><p>{s[1]}</p><Link className="btn" to={s[2]}>{t('보러 가기', 'Смотреть')}</Link></div>
            </div>
          ))}
        </div>
        <button className="arrow l" aria-label={t('이전 배너', 'Предыдущий баннер')} onClick={() => go(i - 1)}>‹</button>
        <button className="arrow r" aria-label={t('다음 배너', 'Следующий баннер')} onClick={() => go(i + 1)}>›</button>
        <div className="dots">{slides.map((_, k) => <button key={k} className={k === i ? 'on' : ''} aria-label={`${k + 1}번 배너`} onClick={() => go(k)} />)}</div>
      </section>

      <section className="sec"><div className="wrap quick">{CATS.map((c) => <Link key={c[0]} to={`/category?c=${c[0]}`}><i aria-hidden="true">{c[2]}</i>{c[1]}</Link>)}</div></section>

      <section className="sec" style={{ paddingTop: 0 }}><div className="wrap">
        <div className="tabs" role="tablist">
          <button role="tab" className={tab === 'new' ? 'on' : ''} onClick={() => setTab('new')}>${t('신상품', 'Новинки')}</button>
          <button role="tab" className={tab === 'best' ? 'on' : ''} onClick={() => setTab('best')}>${t('베스트셀러', 'Бестселлеры')}</button>
        </div>
        <div className="grid g4">{list.map((p) => <ProductCard key={p.id} p={p} D={D} />)}</div>
      </div></section>

      <section className="sec alt"><div className="wrap">
        <div className="sec-h"><h2>${t('이번 주 추천 클래스', 'Рекомендуемые мастер-классы')}</h2><Link className="more" to="/classes">${t('전체 보기', 'Смотреть все')}</Link></div>
        <div className="grid g3">{D.classes.slice(0, 3).map((c) => <ClassCard key={c.id} c={c} D={D} />)}</div>
      </div></section>

      <section className="sec"><div className="wrap">
        <div className="sec-h"><h2>${t('이달의 작가', 'Мастер месяца')}</h2><Link className="more" to="/artists">작가 ${t('전체 보기', 'Смотреть все')}</Link></div>
        <div className="artist">
          <div className="thumb wide"><Img src={art.cover} alt={`${art.name} ${t('작가 작업 공간', 'рабочее пространство мастера')}`} seed="artist1" h={540} /></div>
          <div>
            <h3 style={{ fontSize: '1.4rem' }}>{art.name}</h3><p className="muted">{art.field}</p>
            <p style={{ margin: '12px 0 18px' }}>{art.bio}</p>
            <div className="grid g3" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
              {art.products.slice(0, 3).map((id) => { const p = P.find((x) => x.id === id); return <Link key={id} to={`/product/${id}`}><div className="thumb sq"><Img src={p.images[0]} alt={p.name} seed={id} /></div></Link> })}
            </div>
          </div>
        </div>
      </div></section>

      <section className="sec alt"><div className="wrap two">
        <div>
          <div className="sec-h"><h2>${t('다가오는 일정', 'Ближайшие события')}</h2><Link className="more" to="/schedule">${t('전체 일정', 'Все события')}</Link></div>
          <ul className="list">{ex.events.slice(0, 4).map((e) => <li key={e.id}><span className="chip">{e.date}</span><Link to="/schedule" style={{ flex: 1 }}>{e.title}</Link><span className="badge line">{e.type}</span></li>)}</ul>
        </div>
        <div>
          <div className="sec-h"><h2>${t('커뮤니티 인기글', 'Популярное в сообществе')}</h2><Link className="more" to="/community">${t('더 보기', 'Ещё')}</Link></div>
          <ul className="list">{hotPosts.map((p) => <li key={p.id}><span className="badge line">{p.tag}</span><Link to={`/community/${p.id}`} style={{ flex: 1 }}>{p.title}</Link><span className="muted">♥{p.likes} 💬{p.comments}</span></li>)}</ul>
        </div>
      </div></section>

      <section className="sec"><div className="wrap">
        <div className="sec-h"><h2>${t('최신 아티클', 'Новые статьи')}</h2><Link className="more" to="/articles">${t('전체 보기', 'Смотреть все')}</Link></div>
        <div className="grid g3">{D.articles.slice(0, 3).map((a) => <ArticleCard key={a.id} a={a} />)}</div>
      </div></section>

      <section className="sec alt"><div className="wrap">
        <div className="sec-h"><h2>${t('작업 중인 작품(WIP) 갤러리', 'Галерея работ в процессе')}</h2></div>
        <div className="insta">{D.posts.filter((p) => p.images.length).slice(0, 6).map((p) => <div key={p.id}><Link to={`/community/${p.id}`}><Img src={p.thumb} alt={p.title} seed={p.id} w={400} h={400} /></Link></div>)}</div>
      </div></section>

      <section className="sec"><div className="wrap">
        <div className="sec-h"><h2>${t('고객 후기', 'Отзывы клиентов')}</h2></div>
        <div className="slider"><div className="track" style={{ transform: `translateX(-${rv * 100}%)` }}>
          {ex.reviews.map((r) => <div key={r.name} className="rv"><p>★★★★★</p><p style={{ margin: '8px 0' }}>{r.text}</p><p className="muted">{r.name} ${t('님', '')}</p></div>)}
        </div></div>
      </div></section>

      <section className="sec alt"><div className="wrap">
        <div className="sec-h"><h2>${t('인스타그램', 'Instagram')}</h2></div>
        <div className="insta">{P.slice(6, 12).map((p) => <div key={p.id}><Img src={p.images[2]} alt={`${p.name} ${t('인스타그램', 'Instagram')} 사진`} seed={p.id + 'i'} w={400} h={400} /></div>)}</div>
      </div></section>

      <section className="news"><div className="wrap">
        <h2>${t('새 소식을 가장 먼저 받아보세요', 'Узнавайте новости первыми')}</h2>
        <form onSubmit={(e) => { e.preventDefault(); toast('구독해 주셔서 감사합니다 (샘플)'); e.target.reset() }}>
          <input type="email" required placeholder="${t('이메일 주소', 'Адрес электронной почты')}" aria-label="이메일" /><button className="btn">${t('구독하기', 'Подписаться')}</button>
        </form>
      </div></section>
    </>
  )
}
