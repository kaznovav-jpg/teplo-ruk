import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { D } from '../lib/data.js'
import { useLanguage } from '../lib/language.jsx'
import { useApp } from '../lib/store.jsx'
import { CATS, won } from '../lib/util.js'
import useTitle from '../lib/useTitle.js'
import { Crumb, Heart, FollowBtn, ClassCard, ArtistCard, ProductCard, Img, typeBadge, followers } from '../components/Cards.jsx'

export function Classes() {
  useTitle('클래스')
  const { lang } = useLanguage()
  const ru = lang === 'ru'
  const [f, setF] = useState({ cat: '', lv: '', ty: '', kd: '' })
  const labels = ru
    ? { cat: 'Виды рукоделия', lv: 'Уровень сложности', ty: 'Цена', kd: 'Формат' }
    : { cat: '공예 종류', lv: '난이도', ty: '가격', kd: '방식' }
  const all = ru ? 'Все' : '전체'
  const catNames = { bag: 'Сумки и шитьё', knit: 'Вязание', felt: 'Фетр и валяние', clothes: 'Одежда ручной работы', deco: 'Декор и декупаж' }
  const options = {
    cat: CATS.map((c) => [c[0], ru ? (catNames[c[0]] || c[1]) : c[1]]),
    lv: [['초급', ru ? 'Начальный' : '초급'], ['중급', ru ? 'Средний' : '중급']],
    ty: [['무료', ru ? 'Бесплатно' : '무료'], ['유료', ru ? 'Платно' : '유료'], ['패키지', ru ? 'Набор материалов' : '패키지(재료키트)']],
    kd: [['동영상', ru ? 'Видео' : '동영상'], ['오프라인', ru ? 'Очно' : '오프라인']]
  }
  const sel = (k) => (
    <select className="field" aria-label={labels[k]} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })}>
      <option value="">{labels[k]}: {all}</option>{options[k].map((o) => <option key={o[0]} value={o[0]}>{o[1]}</option>)}
    </select>
  )
  const l = D.classes.filter((c) => (!f.cat || c.cat === f.cat) && (!f.lv || c.level === f.lv) && (!f.ty || c.type === f.ty) && (!f.kd || c.kind === f.kd))
  return (
    <div className="wrap">
      <Crumb items={[ru ? 'Мастер-классы' : '클래스']} />
      <h1 style={{ fontSize: '1.8rem', marginBottom: 6 }}>{ru ? 'Мастер-классы' : '클래스'}</h1>
      <p className="muted" style={{ marginBottom: 18 }}>{ru ? 'Учитесь дома по видео или очно в мастерской.' : '동영상으로 집에서, 오프라인으로 공방에서 배워요.'}</p>
      <div className="sw2">{sel('cat')}{sel('lv')}{sel('ty')}{sel('kd')}</div>
      <p className="muted" style={{ marginBottom: 12 }}>{ru ? `Всего ${l.length} шт.` : `총 ${l.length}개`}</p>
      <div className="grid g3">{l.length ? l.map((c) => <ClassCard key={c.id} c={c} D={D} />) : <p className="empty" style={{ gridColumn: '1/-1' }}>{ru ? 'По заданным условиям ничего не найдено. Измените фильтры.' : '조건에 맞는 클래스가 없어요. 필터를 줄여 보세요.'}</p>}</div>
    </div>
  )
}

export function ClassDetail() {
  const { id } = useParams(), nav = useNavigate(), { S, enroll, toast } = useApp()
  const c = D.classes.find((x) => x.id === id) || D.classes[0], a = D.artists.find((x) => x.id === c.artist)
  useTitle(c.title)
  const en = S.enrolled.some((x) => x.id === c.id), tot = c.lessons.length
  const pct = Math.round(((S.progress[c.id] || []).length / tot) * 100), mins = c.lessons.reduce((s, l) => s + l[1], 0)
  return (
    <div className="wrap">
      <Crumb items={[<Link to="/classes">클래스</Link>, c.title]} />
      <div className="cl">
        <div>
          <div className="vid" style={{ backgroundImage: `url(${c.thumb})` }}><button className="play" aria-label="소개 영상 재생" onClick={() => toast('소개 영상은 샘플이에요')}>▶</button><span className="cap">소개 영상 (샘플)</span></div>
          <p style={{ marginTop: 18 }}>{typeBadge(c.type)}<span className="badge line">{c.kind}</span><span className="badge line">{c.level}</span></p>
          <h1 style={{ fontSize: '1.7rem', margin: '8px 0' }}>{c.title}</h1><p>{c.intro}</p>
          <h2 className="mt" style={{ fontSize: '1.3rem' }}>커리큘럼</h2>
          <ol className="list">{c.lessons.map((l, i) => <li key={i}><span className="chip">{i + 1}강</span><span style={{ flex: 1 }}>{l[0]}</span><span className="muted">{l[1]}분</span></li>)}</ol>
          <h2 className="mt" style={{ fontSize: '1.3rem' }}>준비물</h2>
          <ul className="list">{c.kit && <li>재료키트가 함께 배송돼요.</li>}{c.materials.map((m) => <li key={m}>{m}</li>)}</ul>
          <h2 className="mt" style={{ fontSize: '1.3rem' }}>강사 소개</h2>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap', marginTop: 10 }}>
            <div style={{ flex: 1, minWidth: 200 }}><Link to={`/artists/${a.id}`}><b>{a.name}</b></Link><p className="muted">{a.field}</p><p>{a.bio}</p></div><FollowBtn a={a} />
          </div>
          <h2 className="mt" style={{ fontSize: '1.3rem' }}>수강 후기</h2>
          <ul className="rvs">{D.extras.reviews.map((r) => <li key={r.name}>★★★★★ <b>{r.name}</b><p>{r.text}</p></li>)}</ul>
        </div>
        <aside className="sum" style={{ position: 'sticky', top: 90 }}>
          <p className="serif" style={{ fontSize: '1.5rem' }}>{c.price ? won(c.price) : '무료'}</p>{c.kit && <p className="muted">재료키트 포함 패키지</p>}
          <div className="row"><span>난이도</span><span>{c.level}</span></div><div className="row"><span>방식</span><span>{c.kind}</span></div><div className="row"><span>총 시간</span><span>{mins}분 ({tot}강)</span></div>
          {en ? <><p className="muted" style={{ margin: '8px 0' }}>진행률 {pct}%</p><button className="btn block" onClick={() => nav(`/classes/${c.id}/learn`)}>이어서 학습하기</button></>
            : <button className="btn block" style={{ marginTop: 12 }} onClick={() => { enroll(c.id); toast('수강신청이 완료되었어요') }}>{c.price ? '수강신청' : '무료로 시작하기'}</button>}
          <div style={{ marginTop: 10 }}><Heart id={c.id} text /></div>
        </aside>
      </div>
    </div>
  )
}

export function Learn() {
  const { id } = useParams(), { S, toggleDone, setNote, toast } = useApp()
  const c = D.classes.find((x) => x.id === id) || D.classes[0]
  useTitle(c.title + ' 수강')
  const [n, setN] = useState(0), [note, setNoteTxt] = useState(S.notes[c.id] || '')
  useEffect(() => { window.scrollTo(0, 0) }, [n])
  if (!S.enrolled.some((x) => x.id === c.id)) return <div className="wrap empty"><p>수강신청 후 학습할 수 있어요.</p><Link className="btn" style={{ marginTop: 14 }} to={`/classes/${c.id}`}>클래스 보러 가기</Link></div>
  const L = c.lessons, done = S.progress[c.id] || [], pct = Math.round((done.length / L.length) * 100), dn = done.includes(n)
  return (
    <div className="wrap">
      <Crumb items={[<Link to="/classes">클래스</Link>, <Link to={`/classes/${c.id}`}>{c.title}</Link>, '수강']} />
      <h1 style={{ fontSize: '1.5rem', marginBottom: 14 }}>{c.title}</h1>
      <div className="cl">
        <div>
          <div className="vid" style={{ backgroundImage: `url(${c.thumb})` }}><button className="play" aria-label="재생" onClick={() => toast('샘플 영상 화면이에요')}>▶</button><span className="cap">{n + 1}강 {L[n][0]}</span></div>
          <div className="acts" style={{ margin: '14px 0' }}>
            <button className="btn ghost" disabled={!n} onClick={() => setN(n - 1)}>이전 강</button>
            <button className={'btn' + (dn ? ' ghost' : '')} onClick={() => toggleDone(c.id, n)}>{dn ? '완료 취소' : '수강 완료 표시'}</button>
            <button className="btn ghost" disabled={n >= L.length - 1} onClick={() => setN(n + 1)}>다음 강</button>
          </div>
          <h2 style={{ fontSize: '1.2rem', marginBottom: 8 }}>메모</h2>
          <textarea className="field" rows={4} value={note} onChange={(e) => setNoteTxt(e.target.value)} onBlur={() => setNote(c.id, note)} style={{ width: '100%', padding: 12 }} placeholder="강의를 보며 기록해 보세요" aria-label="강의 메모" />
          <h2 className="mt" style={{ fontSize: '1.2rem' }}>학습 자료</h2>
          <ul className="list">{['도안 PDF', '준비물 체크리스트', '작품 사진 가이드'].map((t) => <li key={t} style={{ justifyContent: 'space-between' }}><span>{t}</span><button className="btn ghost" onClick={() => toast('자료 다운로드는 샘플이에요')}>다운로드</button></li>)}</ul>
        </div>
        <aside className="sum">
          <b>학습 진행률 {pct}%</b>
          <div className="prog" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="학습 진행률"><i style={{ width: pct + '%' }} /></div>
          {L.map((l, i) => <button key={i} className={'lsn' + (i === n ? ' on' : '')} onClick={() => setN(i)}><span aria-hidden="true">{done.includes(i) ? '✔' : '○'}</span><span style={{ flex: 1 }}>{i + 1}강 {l[0]}</span><span className="muted">{l[1]}분</span></button>)}
        </aside>
      </div>
    </div>
  )
}

export function Artists() {
  useTitle('작가 작품')
  const { lang } = useLanguage()
  const { artistWorks } = useApp()
  const ru = lang === 'ru'
  return (
    <div className="wrap">
      <Crumb items={['작가 작품']} />
      <h1 style={{ fontSize: '1.8rem', marginBottom: 18 }}>작가 작품</h1>
      <div className="grid g3">{D.artists.map((a) => <ArtistCard key={a.id} a={a} D={D} />)}</div>
      <h2 className="mt" style={{ fontSize: '1.3rem' }}>{ru ? 'Работы независимых мастеров' : '입점 작가 작품'}</h2>
      {artistWorks.length ? <div className="grid g4" style={{ marginTop: 14 }}>{artistWorks.map((work) => <article className="box" key={work.id}><img src={work.image} alt={ru ? work.titleRu : work.title} style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', borderRadius: 8 }} /><h3 style={{ marginTop: 10 }}>{ru ? work.titleRu : work.title}</h3><p className="muted" style={{ marginTop: 8, marginBottom: 6 }}>{ru ? 'Описание' : '설명'}</p><p>{ru ? (work.descriptionRu || work.description) : (work.description || work.descriptionRu)}</p><p className="muted">{ru ? 'Категория' : '카테고리'}: {{ accessory: ru ? 'Аксессуары' : '액세서리', bag: ru ? 'Сумки и шитьё' : '가방·바느질', home: ru ? 'Для дома' : '홈 인테리어', clothes: ru ? 'Одежда' : '의류', knit: ru ? 'Вязание' : '뜨개질', embroidery: ru ? 'Вышивка' : '자수' }[work.category] || work.category || '—'}</p><b>{Number(work.price || 0).toLocaleString('ko-KR')} ₩</b><p className="muted">{work.artistName}</p></article>)}</div> : <p className="muted">{ru ? 'Новые работы мастеров скоро появятся здесь.' : '새로운 작가 작품이 곧 이곳에 소개됩니다.'}</p>}
            <div className="mt"><div className="sec-h"><h2>시즌 기획전</h2></div>
        {D.extras.collections.map((k) => (
          <section key={k.id} style={{ marginBottom: 36 }}>
            <h3 style={{ fontSize: '1.25rem' }}>{k.title}</h3><p className="muted">{k.desc}</p>
            <div className="grid g4" style={{ marginTop: 14 }}>{k.products.map((id) => <ProductCard key={id} p={D.products.find((p) => p.id === id)} D={D} />)}</div>
          </section>
        ))}
      </div>
    </div>
  )
}

export function Artist() {
  const { id } = useParams(), { S } = useApp()
  const a = D.artists.find((x) => x.id === id) || D.artists[0]
  useTitle(a.name + ' 쇼룸')
  const P = D.products.filter((p) => p.artist === a.id), C = D.classes.filter((c) => c.artist === a.id)
  return (
    <>
      <div className="cover"><Img src={a.cover} alt={`${a.name} 쇼룸 커버 이미지`} seed={a.id} w={1200} h={600} loading="eager" /></div>
      <div className="wrap">
        <Crumb items={[<Link to="/artists">작가 작품</Link>, a.name]} />
        <div className="ah" style={{ paddingTop: 0 }}>
          <div><h1 className="serif" style={{ fontSize: '1.8rem' }}>{a.name}</h1><p className="muted">{a.field} · 팔로워 {followers(a, S)}명</p></div>
          <div className="acts"><FollowBtn a={a} /><Heart id={a.id} text /></div>
        </div>
        <h2 style={{ fontSize: '1.3rem' }}>작가 스토리</h2><p style={{ maxWidth: '42em', marginTop: 8 }}>{a.story}</p>
        <h2 className="mt" style={{ fontSize: '1.3rem' }}>작품 ({P.length})</h2>
        <div className="grid g4" style={{ marginTop: 14 }}>{P.map((p) => <ProductCard key={p.id} p={p} D={D} />)}</div>
        {C.length > 0 && <><h2 className="mt" style={{ fontSize: '1.3rem' }}>진행 중 클래스</h2><div className="grid g3" style={{ marginTop: 14 }}>{C.map((c) => <ClassCard key={c.id} c={c} D={D} />)}</div></>}
        <h2 className="mt" style={{ fontSize: '1.3rem' }}>작가 소식</h2>
        <ul className="list">{a.news.map((n, i) => <li key={i}><span className="chip">{n[0]}</span>{n[1]}</li>)}</ul>
        <div style={{ height: 48 }} />
      </div>
    </>
  )
}

const pad = (n) => String(n).padStart(2, '0')
function EventModal({ e, joined, onClose }) {
  const { S, reserve, cancelRes, toast } = useApp()

  const r = S.reservations.some((x) => x.id === e.id)
  const j = joined
  const full = j >= Number(e.cap || 0) && !r
  useEffect(() => { const k = (ev) => ev.key === 'Escape' && onClose(); addEventListener('keydown', k); return () => removeEventListener('keydown', k) }, [onClose])
  return (
    <div className="modal" onClick={(ev) => ev.target === ev.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={e.title}>
        <span className="badge line">{e.type}</span><h2 style={{ fontSize: '1.3rem', margin: '8px 0' }}>{e.title}</h2>
        <p><b>일시</b> {e.ymd.replace(/-/g, '.')} {e.time}</p>
        <p><b>장소</b> {e.online ? '온라인 (신청 후 접속 링크를 안내해 드려요)' : e.place}</p>
        <p><b>정원</b> {j}/{e.cap}명</p>
        {e.cls && <p><Link className="more" to={`/classes/${e.cls}`}>관련 클래스 보기</Link></p>}
        <div className="acts" style={{ marginTop: 16 }}>
          <button className={'btn' + (r ? ' ghost' : '')} disabled={full} autoFocus onClick={async () => {
  if (r) {
    const ok = await cancelRes(e.id)
    if (ok) toast('신청을 취소했어요')
  } else {
    const ok = await reserve(e.id)
    if (ok) toast('신청이 완료되었어요')
  }
}}>{r ? '신청 취소' : full ? '마감되었어요' : '신청하기'}</button>
          <button className="btn ghost" onClick={onClose}>닫기</button>
        </div>
      </div>
    </div>
  )
}

export function Schedule() {
  useTitle('일정·시간표')
const { S, adminEvents } = useApp()
const { lang } = useLanguage()
const ru = lang === 'ru'
const typeLabel = (type) => ru ? ({ '수업': 'Занятие', '웨비나': 'Вебинар', '모임': 'Встреча' }[type] || type) : type
const eventTitle = (event) => ru ? (event.titleRu || event.title) : event.title
const events = adminEvents
const [reservationCounts, setReservationCounts] = useState({})

useEffect(() => {
  fetch('/api/reserve')
    .then((response) => {
      if (!response.ok) throw new Error('Ошибка загрузки')
      return response.json()
    })
    .then((data) => setReservationCounts(data.counts || {}))
    .catch((error) => console.error('Reservation counts error:', error))
}, [])
  const [view, setView] = useState(() => (innerWidth < 768 ? 'list' : 'cal')), [ty, setTy] = useState(''), [ym, setYm] = useState(() => {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Seoul', year: 'numeric', month: 'numeric' }).formatToParts(new Date())
    return {
      y: Number(parts.find((part) => part.type === 'year')?.value),
      m: Number(parts.find((part) => part.type === 'month')?.value) - 1
    }
  }), [open, setOpen] = useState(null)
  const { y, m } = ym, pre = `${y}-${pad(m + 1)}`
  const monthLabel = new Intl.DateTimeFormat(ru ? 'ru-RU' : 'ko-KR', { month: ru ? 'long' : 'numeric', year: 'numeric', timeZone: 'Asia/Seoul' }).format(new Date(y, m, 15, 12))
  const weekdays = ru ? ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'] : ['일', '월', '화', '수', '목', '금', '토']
  const list = events.filter((e) => (!ty || e.type === ty) && e.ymd.startsWith(pre))
  const shift = (d) => setYm(({ y, m }) => { m += d; return m < 0 ? { y: y - 1, m: 11 } : m > 11 ? { y: y + 1, m: 0 } : { y, m } })
  const first = new Date(y, m, 1).getDay(), days = new Date(y, m + 1, 0).getDate()
  const ev = events.find((e) => e.id === open)
  const getJoined = (eventId) =>
  Number(reservationCounts[eventId] || 0)
const isFull = (event) =>
  getJoined(event.id) >= Number(event.cap || 0)
  return (
    <div className="wrap">
      <Crumb items={[ru ? 'Расписание' : '일정·시간표']} />
      <h1 style={{ fontSize: '1.8rem', marginBottom: 14 }}>{ru ? 'Расписание' : '일정·시간표'}</h1>
      <div className="sw2">
        <button className="ibtn" aria-label={ru ? 'Предыдущий месяц' : '이전 달'} onClick={() => shift(-1)}>‹</button><b>{monthLabel}</b><button className="ibtn" aria-label={ru ? 'Следующий месяц' : '다음 달'} onClick={() => shift(1)}>›</button><span style={{ flex: 1 }} />
        <button className={'btn' + (view === 'cal' ? '' : ' ghost')} aria-pressed={view === 'cal'} onClick={() => setView('cal')}>{ru ? 'Календарь' : '캘린더'}</button>
        <button className={'btn' + (view === 'list' ? '' : ' ghost')} aria-pressed={view === 'list'} onClick={() => setView('list')}>{ru ? 'Список' : '리스트'}</button>
      </div>
      <div className="tabs" role="tablist" aria-label={ru ? 'Фильтр событий' : '유형 필터'}>{['', '수업', '웨비나', '모임'].map((t) => <button key={t} role="tab" className={t === ty ? 'on' : ''} onClick={() => setTy(t)}>{t ? typeLabel(t) : (ru ? 'Все' : '전체')}</button>)}</div>
      {view === 'cal' ? (
        <>
          <div className="cal">
            {weekdays.map((d) => <div key={d} className="dh">{d}</div>)}
            {Array.from({ length: first }, (_, i) => <div key={'b' + i} />)}
            {Array.from({ length: days }, (_, i) => {
              const k = `${pre}-${pad(i + 1)}`
              return <div key={k}><b>{i + 1}</b>{list.filter((e) => e.ymd === k).map((e) => <button key={e.id} className="ev" data-t={e.type} aria-label={`${typeLabel(e.type)} ${eventTitle(e)} ${e.time}`} onClick={() => setOpen(e.id)}>{e.time.slice(0, 5)} {eventTitle(e)}</button>)}</div>
            })}
          </div>
          <p className="muted" style={{ marginTop: 10 }}>왼쪽 색 막대: 수업(테라코타) · 웨비나(초록) · 모임(황토)</p>
        </>
      ) : list.length ? (
        <ul className="list">{list.map((e) => (
          <li key={e.id} style={{ padding: '10px 0', flexWrap: 'wrap' }}>
            <span className="chip">{e.date}</span><span className="badge line">{typeLabel(e.type)}</span>
            <span style={{ flex: 1, minWidth: 160 }}><b>{eventTitle(e)}</b><br /><span className="muted">{e.time} · {e.online ? (ru ? 'Онлайн' : '온라인') : e.place}</span></span>
            <span className="badge line">
  {getJoined(e.id)}/{e.cap}{ru ? ' чел.' : '명'}
</span>
{isFull(e) && <span className="badge line">{ru ? 'Мест нет' : '마감'}</span>}
{S.reservations.some((r) => r.id === e.id) && <span className="badge free">{ru ? 'Вы записаны' : '신청 완료'}</span>}
<button className="btn ghost" onClick={() => setOpen(e.id)}>{ru ? 'Подробнее' : '자세히'}</button>
          </li>))}
        </ul>
      ) : <p className="empty">{ru ? 'В этом месяце событий нет.' : '이 달에는 일정이 없어요.'}</p>}
      <div style={{ height: 40 }} />
      {ev && <EventModal e={ev} joined={getJoined(ev.id)} onClose={() => setOpen(null)} />}
    </div>
  )
}
