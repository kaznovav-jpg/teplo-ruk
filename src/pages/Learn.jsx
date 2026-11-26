import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { D } from '../lib/data.js'
import * as F from '../lib/firebase.js'
import { useLanguage } from '../lib/language.jsx'
import { useApp } from '../lib/store.jsx'
import { CATS, won } from '../lib/util.js'
import useTitle from '../lib/useTitle.js'
import { Crumb, Heart, FollowBtn, ClassCard, ArtistCard, ProductCard, Img, typeBadge, followers } from '../components/Cards.jsx'

export function Classes() {
  useTitle('클래스')
  const { lang } = useLanguage()
  const { classes, artists, products } = useApp()
  const artistList = artists?.length ? artists : D.artists
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
  const l = classes.filter((c) => (!f.cat || c.cat === f.cat) && (!f.lv || c.level === f.lv) && (!f.ty || c.type === f.ty) && (!f.kd || c.kind === f.kd))
  return (
    <div className="wrap">
      <Crumb items={[ru ? 'Мастер-классы' : '클래스']} />
      <h1 style={{ fontSize: '1.8rem', marginBottom: 6 }}>{ru ? 'Мастер-классы' : '클래스'}</h1>
      <p className="muted" style={{ marginBottom: 18 }}>{ru ? 'Учитесь дома по видео или очно в мастерской.' : '동영상으로 집에서, 오프라인으로 공방에서 배워요.'}</p>
      <div className="sw2">{sel('cat')}{sel('lv')}{sel('ty')}{sel('kd')}</div>
      <p className="muted" style={{ marginBottom: 12 }}>{ru ? `Всего ${l.length} шт.` : `총 ${l.length}개`}</p>
      <div className="grid g3">{l.length ? l.map((c) => <ClassCard key={c.id} c={c} D={{ ...D, artists: artistList, products }} />) : <p className="empty" style={{ gridColumn: '1/-1' }}>{ru ? 'По заданным условиям ничего не найдено. Измените фильтры.' : '조건에 맞는 클래스가 없어요. 필터를 줄여 보세요.'}</p>}</div>
    </div>
  )
}

export function ClassDetail() {
  const { id } = useParams(), nav = useNavigate(), { S, enroll, toast, classes, artists } = useApp()
  const { lang } = useLanguage()
  const ru = lang === 'ru'
  const c = classes.find((x) => x?.id === id) || classes[0]
  const artistList = artists?.length ? artists : D.artists
  const a = artistList.find((x) => x?.id === c?.artist) || artistList[0] || null
  useTitle(c?.title || 'Мастер-класс')
  if (!c) return <div className="wrap empty"><p>Мастер-класс не найден.</p><Link className="btn" to="/classes">Вернуться к мастер-классам</Link></div>
  const lessons = Array.isArray(c.lessons) ? c.lessons : []
  const typeText = ru ? ({ '무료': 'Бесплатно', '유료': 'Платно', '패키지': 'Набор материалов' }[c.type] || c.type) : c.type
  const kindText = ru ? ({ '동영상': 'Видео', '오프라인': 'Очно' }[c.kind] || c.kind) : c.kind
  const levelText = ru ? ({ '초급': 'Начальный', '중급': 'Средний' }[c.level] || c.level) : c.level
  const en = S.enrolled.some((x) => x?.id === c.id), tot = lessons.length
  const pct = Math.round(((S.progress[c.id] || []).length / Math.max(1, tot)) * 100), mins = lessons.reduce((sum, lesson) => sum + Number(Array.isArray(lesson) ? lesson[1] : lesson?.minutes || 0), 0), totalMinutes = Number(c.minutes || mins)
  return (
    <div className="wrap">
      <Crumb items={[<Link to="/classes">클래스</Link>, c.title]} />
      <div className="cl">
        <div>
          <div className="vid">{c.thumb ? <img src={c.thumb} alt={ru ? (c.titleRu || c.title) : c.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span className="cap">{ru ? 'Фотография мастер-класса пока не добавлена' : '클래스 사진이 아직 등록되지 않았어요'}</span>}</div>
          <p style={{ marginTop: 18 }}>{typeBadge(c.type, typeText)}<span className="badge line">{kindText}</span><span className="badge line">{levelText}</span></p>
          <h1 style={{ fontSize: '1.7rem', margin: '8px 0' }}>{ru ? (c.titleRu || c.title) : c.title}</h1><p>{ru ? (c.introRu || c.intro) : c.intro}</p>
          <h2 className="mt" style={{ fontSize: '1.3rem' }}>{ru ? 'Программа курса' : '커리큘럼'}</h2>
          <ol className="list">{lessons.map((l, i) => {
            const lessonName = Array.isArray(l) ? l[0] : (ru ? (l.titleRu || l.title || '') : (l.title || l.titleRu || ''))
            const lessonMinutes = Array.isArray(l) ? l[1] : l.minutes
            return <li key={i}><span className="chip">{ru ? `Урок ${i + 1}` : `${i + 1}강`}</span><span style={{ flex: 1 }}>{lessonName}</span><span className="muted">{lessonMinutes}{ru ? ' мин' : '분'}</span></li>
          })}</ol>
          <h2 className="mt" style={{ fontSize: '1.3rem' }}>{ru ? 'Материалы' : '준비물'}</h2>
          {(ru ? c.materialsIntroRu : c.materialsIntro) && <p>{ru ? c.materialsIntroRu : c.materialsIntro}</p>}
          <ul className="list">{(Array.isArray(c.materials) ? c.materials : []).filter((m) => {
            const korean = /[가-힣]/.test(String(m))
            return ru ? !korean : korean
          }).map((m, i) => <li key={i}>{m}</li>)}</ul>
          <h2 className="mt" style={{ fontSize: '1.3rem' }}>{ru ? 'Об авторе курса' : '강사 소개'}</h2>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap', marginTop: 10 }}>
            <div style={{ flex: 1, minWidth: 200 }}>{a ? <><Link to={`/artists/${a.id}`}><b>{a.name}</b></Link><p className="muted">{a.field}</p><p>{a.bio}</p></> : <p className="muted">{ru ? (c.authorTextRu || 'Информация об авторе пока не добавлена.') : (c.authorText || '강사 정보가 아직 등록되지 않았어요.')}</p>}{a && (ru ? c.authorTextRu : c.authorText) && <p>{ru ? c.authorTextRu : c.authorText}</p>}</div>{a && <FollowBtn a={a} />}
          </div>
          <h2 className="mt" style={{ fontSize: '1.3rem' }}>{ru ? 'Отзывы учеников' : '수강 후기'}</h2>
          {(ru ? c.reviewsTextRu : c.reviewsText) ? <p>{ru ? c.reviewsTextRu : c.reviewsText}</p> : <p className="muted">{ru ? 'Отзывы пока не добавлены.' : '아직 후기가 등록되지 않았어요.'}</p>}
        </div>
        <aside className="sum" style={{ position: 'sticky', top: 90 }}>
          <p className="serif" style={{ fontSize: '1.5rem' }}>{c.price ? won(c.price) : '무료'}</p>
          <div className="row"><span>{ru ? 'Уровень сложности' : '난이도'}</span><span>{levelText}</span></div><div className="row"><span>{ru ? 'Формат' : '방식'}</span><span>{kindText}</span></div><div className="row"><span>{ru ? 'Общая длительность' : '총 시간'}</span><span>{totalMinutes}{ru ? ' мин' : '분'} ({tot}{ru ? ' уроков' : '강'})</span></div>
          {en ? <><p className="muted" style={{ margin: '8px 0' }}>{ru ? 'Прогресс обучения' : '학습 진행률'} {pct}%</p><button className="btn block" onClick={() => nav(`/classes/${c.id}/learn`)}>{ru ? 'Продолжить обучение' : '이어서 학습하기'}</button></>
            : <button className="btn block" style={{ marginTop: 12 }} onClick={() => { enroll(c.id); toast(ru ? 'Вы успешно записались на курс.' : '수강신청이 완료되었어요') }}>{ru ? (c.price ? 'Записаться на курс' : 'Начать бесплатно') : (c.price ? '수강신청' : '무료로 시작하기')}</button>}
          <div style={{ marginTop: 10 }}><Heart id={c.id} text /></div>
        </aside>
      </div>
    </div>
  )
}

const getYoutubeEmbedUrl = (url) => {
  try {
    const parsed = new URL(url)
    const host = parsed.hostname.replace(/^www\./, '')
    let videoId = ''
    if (host === 'youtu.be') videoId = parsed.pathname.split('/').filter(Boolean)[0] || ''
    else if (host.endsWith('youtube.com')) {
      const parts = parsed.pathname.split('/').filter(Boolean)
      if (parsed.pathname === '/watch') videoId = parsed.searchParams.get('v') || ''
      else if (['embed', 'shorts', 'live'].includes(parts[0])) videoId = parts[1] || ''
    }
    if (!videoId) return ''
    let start = Number(parsed.searchParams.get('start') || 0)
    if (!start && parsed.searchParams.get('t')) {
      const t = parsed.searchParams.get('t')
      const match = t.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/)
      if (match) start = Number(match[1] || 0) * 3600 + Number(match[2] || 0) * 60 + Number(match[3] || 0)
      else if (/^\d+$/.test(t)) start = Number(t)
    }
    return `https://www.youtube-nocookie.com/embed/${videoId}${start > 0 ? `?start=${start}` : ''}`
  } catch {
    return ''
  }
}

export function Learn() {
  const { id } = useParams(), { S, toggleDone, setNote, toast, classes, user } = useApp()
  const { lang } = useLanguage()
  const ru = lang === 'ru'
  const [reviewText, setReviewText] = useState('')
  const [reviewRating, setReviewRating] = useState(5)
  const [reviews, setReviews] = useState([])
  const [reviewSaving, setReviewSaving] = useState(false)
  const c = classes.find((x) => x?.id === id) || classes[0]
  useTitle((c?.title || '클래스') + ' 수강')
  const [n, setN] = useState(0), [note, setNoteTxt] = useState(c ? (S.notes[c.id] || '') : '')
  const lessons = Array.isArray(c?.lessons) ? c.lessons : []
  useEffect(() => { if (!F.isFirebase || !id) return; return F.onSnapshot(F.query(F.collection(F.db, 'classReviews'), F.where('classId', '==', id)), snap => setReviews(snap.docs.map(d => ({...d.data(), id:d.id})).sort((a,b)=>(b.at||'').localeCompare(a.at||''))), console.error) }, [id])
  useEffect(() => { window.scrollTo(0, 0) }, [n])
  if (!c) return <div className="wrap empty"><p>클래스를 찾을 수 없어요.</p><Link className="btn" to="/classes">클래스 목록으로</Link></div>
  const lessonTitle = (lesson) => ru ? (lesson?.titleRu || lesson?.title || '') : (lesson?.title || lesson?.titleRu || '')
  const submitReview = async () => { if (!user || !F.isFirebase) { toast(ru ? 'Войдите в аккаунт, чтобы оставить отзыв.' : '후기를 작성하려면 로그인해 주세요.'); return } if (!reviewText.trim()) { toast(ru ? 'Напишите текст отзыва.' : '후기 내용을 입력해 주세요.'); return } setReviewSaving(true); try { await F.setDoc(F.doc(F.db, 'classReviews', `${c.id}_${user.uid}`), {classId:c.id,uid:user.uid,author:user.name||user.email,rating:reviewRating,text:reviewText.trim(),at:new Date().toISOString()}); setReviewText(''); toast(ru ? 'Спасибо! Ваш отзыв опубликован.' : '후기를 등록해 주셔서 감사합니다.') } catch(error) { console.error(error); toast(ru ? 'Не удалось сохранить отзыв.' : '후기를 저장하지 못했어요.') } finally { setReviewSaving(false) } }
  if (!S.enrolled.some((x) => x.id === c.id)) return <div className="wrap empty"><p>{ru ? 'Сначала запишитесь на мастер-класс.' : '수강신청 후 학습할 수 있어요.'}</p><Link className="btn" style={{ marginTop: 14 }} to={`/classes/${c.id}`}>{ru ? 'К мастер-классу' : '클래스 보러 가기'}</Link></div>
  const L = lessons, done = S.progress[c.id] || [], pct = Math.round((done.length / Math.max(1, L.length)) * 100), dn = done.includes(n), current = L[n] || {}
  return (
    <div className="wrap">
      <Crumb items={[<Link to="/classes">{ru ? 'Мастер-классы' : '클래스'}</Link>, <Link to={`/classes/${c.id}`}>{ru ? (c.titleRu || c.title) : c.title}</Link>, ru ? 'Обучение' : '수강']} />
      <h1 style={{ fontSize: '1.5rem', marginBottom: 14 }}>{ru ? (c.titleRu || c.title) : c.title}</h1>
      <div className="cl">
        <div>
          {current.videoUrl ? (getYoutubeEmbedUrl(current.videoUrl) ? <iframe className="vid" src={getYoutubeEmbedUrl(current.videoUrl)} title={lessonTitle(current) || (ru ? `Урок ${n + 1}` : `${n + 1}강`)} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen style={{ width: '100%', aspectRatio: '16/9', border: 0, background: '#2F2B28' }} /> : <video className="vid" src={current.videoUrl} controls playsInline preload="metadata" poster={c.thumb || undefined} style={{ width: '100%', height: 'auto', aspectRatio: '16/9', objectFit: 'contain', background: '#2F2B28' }} />) : <div className="vid" style={{ backgroundImage: `url(${c.thumb})` }}><span className="cap">{ru ? `Урок ${n+1}` : `${n+1}강`} {lessonTitle(current)}</span></div>}
          <div className="acts" style={{ margin: '14px 0' }}>
            <button className="btn ghost" disabled={!n} onClick={() => setN(n - 1)}>{ru ? 'Предыдущий урок' : '이전 강'}</button>
            <button className={'btn' + (dn ? ' ghost' : '')} onClick={() => toggleDone(c.id, n)}>{dn ? (ru ? 'Отменить отметку' : '완료 취소') : (ru ? 'Отметить как пройденный' : '수강 완료 표시')}</button>
            <button className="btn ghost" disabled={n >= L.length - 1} onClick={() => setN(n + 1)}>{ru ? 'Следующий урок' : '다음 강'}</button>
          </div>
          {(current.photos || []).length > 0 && <section style={{ margin: '18px 0' }}><h2 style={{ fontSize: '1.2rem', marginBottom: 10 }}>{ru ? 'Фотографии-инструкция' : '사진 안내'}</h2><div style={{ display: 'grid', gap: 12 }}>{current.photos.map((url, i) => <img key={url + i} src={url} alt={ru ? `Шаг ${i + 1}` : `단계 ${i + 1}`} style={{ width: '100%', height: 'auto', borderRadius: 10, objectFit: 'contain' }} />)}</div></section>}
          <h2 style={{ fontSize: '1.2rem', marginBottom: 8 }}>{ru ? 'Заметки' : '메모'}</h2>
          <textarea className="field" rows={4} value={note} onChange={(e) => setNoteTxt(e.target.value)} onBlur={() => setNote(c.id, note)} style={{ width: '100%', padding: 12 }} placeholder={ru ? 'Записывайте важное во время урока' : '강의를 보며 기록해 보세요'} aria-label={ru ? 'Заметки к уроку' : '강의 메모'} />
          <h2 className="mt" style={{ fontSize: '1.2rem' }}>{ru ? 'Материалы урока' : '학습 자료'}</h2>
          {(current.materials || []).length ? <ul className="list">{current.materials.map((m,i)=><li key={i} style={{justifyContent:'space-between'}}><span>{ru ? (m.labelRu || m.label) : (m.label || m.labelRu)}</span>{m.url && <a className="btn ghost" href={m.url} target="_blank" rel="noreferrer">{ru ? 'Скачать' : '다운로드'}</a>}</li>)}</ul> : <p className="muted">{ru ? 'Материалы к этому уроку пока не добавлены.' : '등록된 학습 자료가 없어요.'}</p>}
          {current.videoUrl && <p><a className="more" href={current.videoUrl} target="_blank" rel="noreferrer">{ru ? 'Открыть видео урока' : '강의 영상 보기'}</a></p>}
        </div>
        <aside className="sum">
          <b>{ru ? 'Прогресс обучения' : '학습 진행률'} {pct}%</b>
          <div className="prog" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="학습 진행률"><i style={{ width: pct + '%' }} /></div>
          {L.map((l, i) => <button key={i} className={'lsn' + (i === n ? ' on' : '')} onClick={() => setN(i)}><span aria-hidden="true">{done.includes(i) ? '✔' : '○'}</span><span style={{ flex: 1 }}>{ru ? `Урок ${i+1}` : `${i+1}강`} {lessonTitle(l)}</span><span className="muted">{Array.isArray(l) ? l[1] : l?.minutes}{ru ? ' мин' : '분'}</span></button>)}
        </aside>
      </div>
      {pct === 100 && <section className="box" style={{marginTop:24,padding:18}}><h2 style={{fontSize:'1.25rem'}}>{ru ? 'Оставить отзыв о мастер-классе' : '수강 후기 작성'}</h2><p className="muted">{ru ? 'Вы завершили все уроки. Поделитесь впечатлениями.' : '모든 강의를 완료했어요. 수강 경험을 나눠 주세요.'}</p><label>{ru ? 'Оценка' : '평점'} <select className="field" value={reviewRating} onChange={e=>setReviewRating(Number(e.target.value))}><option value={5}>★★★★★</option><option value={4}>★★★★☆</option><option value={3}>★★★☆☆</option><option value={2}>★★☆☆☆</option><option value={1}>★☆☆☆☆</option></select></label><textarea className="field" rows={4} value={reviewText} onChange={e=>setReviewText(e.target.value)} placeholder={ru ? 'Ваш отзыв о мастер-классе...' : '수강 후기를 작성해 주세요.'} style={{width:'100%',marginTop:10}}/><button className="btn" disabled={reviewSaving} onClick={submitReview} style={{marginTop:10}}>{ru ? 'Опубликовать отзыв' : '후기 등록'}</button></section>}
      {reviews.length>0 && <section className="box" style={{marginTop:20,padding:18}}><h2 style={{fontSize:'1.2rem'}}>{ru ? 'Отзывы учеников' : '수강 후기'}</h2>{reviews.map(r=><article key={r.id} style={{padding:'12px 0',borderBottom:'1px solid #E5DCD2'}}><b>{r.author}</b> · {'★'.repeat(r.rating||5)}<p style={{whiteSpace:'pre-wrap'}}>{r.text}</p></article>)}</section>}
    </div>
  )
}

export function Artists() {
  useTitle('작가 작품')
  const { lang } = useLanguage()
  const { artistWorks, artists, products, artistCollections, user, toast } = useApp()
  const nav = useNavigate()
  const pageData = { ...D, products }
  const artistList = (artists?.length ? artists : D.artists).filter(Boolean)
  const collectionList = (artistCollections?.length ? artistCollections : D.extras.collections).filter(Boolean)
  const ru = lang === 'ru'
  const [selectedWork, setSelectedWork] = useState(null)
  const categoryName = (category) => ({
    accessory: ru ? 'Аксессуары' : '액세서리',
    bag: ru ? 'Сумки и шитьё' : '가방·바느질',
    home: ru ? 'Для дома' : '홈 인테리어',
    clothes: ru ? 'Одежда' : '의류',
    knit: ru ? 'Вязание' : '뜨개질',
    embroidery: ru ? 'Вышивка' : '자수'
  }[category] || category || '—')
  useEffect(() => {
    if (!selectedWork) return
    const onKeyDown = (event) => { if (event.key === 'Escape') setSelectedWork(null) }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selectedWork])
  return (
    <div className="wrap">
      <Crumb items={['작가 작품']} />
      <h1 style={{ fontSize: '1.8rem', marginBottom: 18 }}>작가 작품</h1>
      <div className="grid g3">{artistList.map((a) => <ArtistCard key={a.id} a={a} D={pageData} />)}</div>
      <h2 className="mt" style={{ fontSize: '1.3rem' }}>{ru ? 'Работы независимых мастеров' : '입점 작가 작품'}</h2>
      {artistWorks.length ? <div className="grid g4" style={{ marginTop: 14 }}>{artistWorks.map((work) => <article
        className="box" key={work.id} role="button" tabIndex={0}
        aria-label={ru ? 'Подробнее о работе ' + (work.titleRu || work.title) : '작품 자세히 보기 ' + work.title}
        onClick={() => setSelectedWork(work)}
        onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelectedWork(work) } }}
        style={{ cursor: 'pointer', textAlign: 'left' }}
      >
        <img src={work.image} alt={ru ? work.titleRu : work.title} style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', borderRadius: 8 }} />
        <h3 style={{ marginTop: 10 }}>{ru ? work.titleRu : work.title}</h3>
        <p className="muted" style={{ marginTop: 8, marginBottom: 6 }}>{ru ? 'Описание' : '설명'}</p>
        <p>{ru ? (work.descriptionRu || work.description) : (work.description || work.descriptionRu)}</p>
        <p className="muted">{ru ? 'Категория' : '카테고리'}: {categoryName(work.category)}</p>
        <b>{Number(work.price || 0).toLocaleString('ko-KR')} ₩</b>
        <p className="muted">{work.artistName}</p>
        <p className="muted" style={{ marginTop: 8 }}>{ru ? 'Нажмите, чтобы рассмотреть подробнее' : '자세히 보려면 눌러 주세요'}</p>
      </article>)}</div> : <p className="muted">{ru ? 'Новые работы мастеров скоро появятся здесь.' : '새로운 작가 작품이 곧 이곳에 소개됩니다.'}</p>}
      {selectedWork && <div className="modal" onClick={(event) => { if (event.target === event.currentTarget) setSelectedWork(null) }}>
        <div role="dialog" aria-modal="true" aria-label={ru ? 'Подробная информация о работе' : '작품 상세 정보'} style={{ maxWidth: 760, maxHeight: '90vh', overflowY: 'auto', textAlign: 'left' }}>
          <img src={selectedWork.image} alt={ru ? selectedWork.titleRu : selectedWork.title} style={{ width: '100%', maxHeight: '55vh', objectFit: 'contain', borderRadius: 10, background: 'var(--sub)' }} />
          <h2 style={{ fontSize: '1.5rem', margin: '16px 0 8px' }}>{ru ? (selectedWork.titleRu || selectedWork.title) : selectedWork.title}</h2>
          <p className="muted">{ru ? 'Мастер' : '작가'}: {selectedWork.artistName}</p>
          <p className="muted" style={{ marginTop: 14, marginBottom: 6 }}>{ru ? 'Описание' : '작품 설명'}</p>
          <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{ru ? (selectedWork.descriptionRu || selectedWork.description || 'Описание не добавлено') : (selectedWork.description || selectedWork.descriptionRu || '설명이 없습니다')}</p>
          <p className="muted" style={{ marginTop: 12 }}>{ru ? 'Категория' : '카테고리'}: {categoryName(selectedWork.category)}</p>
          <p style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: 12 }}>{Number(selectedWork.price || 0).toLocaleString('ko-KR')} ₩</p>
          <div className="acts" style={{ justifyContent: 'space-between', flexWrap: 'wrap', marginTop: 18 }}>
            <button className="btn" disabled={!!user?.uid && selectedWork.artistUid === user.uid} onClick={async () => {
              if (!user?.uid) { nav('/mypage?tab=login'); return }
              const artistUid = selectedWork.artistUid
              if (!artistUid) { toast(ru ? 'Не удалось определить аккаунт мастера. Пожалуйста, сообщите администратору.' : '작가 계정을 확인할 수 없습니다. 관리자에게 문의해 주세요.'); return }
              if (artistUid === user.uid) { toast(ru ? 'Это ваша работа.' : '내 작품입니다.'); return }
              const participants = [user.uid, artistUid].sort()
              const conversationId = participants.map((uid) => encodeURIComponent(uid)).join('__')
              const now = new Date().toISOString()
              try {
                const conversationRef = F.doc(F.db, 'conversations', conversationId)
                const existing = await F.getDoc(conversationRef)
                if (!existing.exists()) {
                  await F.setDoc(conversationRef, {
                    participants,
                    names: { [user.uid]: user.name || '', [artistUid]: selectedWork.artistName || '' },
                    createdAt: now, updatedAt: now, lastMessage: '', lastSenderUid: user.uid
                  })
                }
                nav('/messages?c=' + encodeURIComponent(conversationId))
              } catch (error) {
                console.error('Contact artist error:', error)
                toast(ru ? 'Не удалось открыть переписку. Попробуйте позже.' : '쪽지를 열지 못했습니다. 다시 시도해 주세요.')
              }
            }}>{ru ? 'Написать мастеру' : '작가에게 쪽지 보내기'}</button>
            <button className="btn ghost" onClick={() => setSelectedWork(null)}>{ru ? 'Закрыть' : '닫기'}</button>
          </div>
        </div>
      </div>}
      <div className="mt"><div className="sec-h"><h2>시즌 기획전</h2></div>
        {collectionList.map((k) => (
          <section key={k.id} style={{ marginBottom: 36 }}>
            <h3 style={{ fontSize: '1.25rem' }}>{ru ? (k.titleRu || k.title) : k.title}</h3><p className="muted">{ru ? (k.descRu || k.desc) : k.desc}</p>
            <div className="grid g4" style={{ marginTop: 14 }}>{k.products.map((id) => <ProductCard key={id} p={products.find((p) => p.id === id)} D={pageData} />)}</div>
          </section>
        ))}
      </div>
    </div>
  )
}

export function Artist() {
  const { id } = useParams(), { S, artists, products, classes } = useApp()
  const artistList = (artists?.length ? artists : D.artists).filter(Boolean)
  const a = artistList.find((x) => x?.id === id) || artistList[0]
  useTitle(a?.name ? a.name + ' 쇼룸' : '작가 쇼룸')
  if (!a) return <div className="wrap empty"><p>Мастер пока не добавлен.</p><Link className="btn" to="/artists">Вернуться к работам мастеров</Link></div>
  const P = products.filter((p) => p.artist === a.id), C = classes.filter((c) => c.artist === a.id)
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
        <div className="grid g4" style={{ marginTop: 14 }}>{P.map((p) => <ProductCard key={p.id} p={p} D={{ ...D, products, artists: artistList }} />)}</div>
        {C.length > 0 && <><h2 className="mt" style={{ fontSize: '1.3rem' }}>진행 중 클래스</h2><div className="grid g3" style={{ marginTop: 14 }}>{C.map((c) => <ClassCard key={c.id} c={c} D={D} />)}</div></>}
        <h2 className="mt" style={{ fontSize: '1.3rem' }}>작가 소식</h2>
        <ul className="list">{a.news.map((n, i) => <li key={i}><span className="chip">{n[0]}</span>{n[1]}</li>)}</ul>
        <div style={{ height: 48 }} />
      </div>
    </>
  )
}

const pad = (n) => String(n).padStart(2, '0')
const typeLabelForModal = (type, ru) => ru ? ({ '수업': 'Занятие', '웨비나': 'Вебинар', '모임': 'Встреча' }[type] || type) : type
function EventModal({ e, joined, onClose, ru }) {
  const { S, reserve, cancelRes, toast } = useApp()

  const r = S.reservations.some((x) => x.id === e.id)
  const j = joined
  const full = j >= Number(e.cap || 0) && !r
  useEffect(() => { const k = (ev) => ev.key === 'Escape' && onClose(); addEventListener('keydown', k); return () => removeEventListener('keydown', k) }, [onClose])
  return (
    <div className="modal" onClick={(ev) => ev.target === ev.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={e.title}>
        {(e.images?.length ? e.images : (e.image ? [e.image] : [])).map((url, index) => <img key={url + index} src={url} alt={e.title} style={{ width: '100%', maxHeight: 340, objectFit: 'cover', borderRadius: 10, marginBottom: 12 }} />)}
        <span className="badge line">{typeLabelForModal(e.type, ru)}</span><h2 style={{ fontSize: '1.3rem', margin: '8px 0' }}>{ru ? (e.titleRu || e.title) : e.title}</h2>
        <p><b>{ru ? 'Дата и время' : '일시'}</b> {e.ymd.replace(/-/g, '.')} {e.time}</p>
        <p><b>{ru ? 'Место' : '장소'}</b> {e.online ? (ru ? 'Онлайн (ссылка для подключения будет отправлена после записи)' : '온라인 (신청 후 접속 링크를 안내해 드려요)') : e.place}</p>
        <p><b>{ru ? 'Количество мест' : '정원'}</b> {j}/{e.cap}{ru ? ' чел.' : '명'}</p>
        {e.cls && <p><Link className="more" to={`/classes/${e.cls}`}>{ru ? 'Посмотреть мастер-класс' : '관련 클래스 보기'}</Link></p>}
        <div className="acts" style={{ marginTop: 16 }}>
          <button className={'btn' + (r ? ' ghost' : '')} disabled={full} autoFocus onClick={async () => {
  if (r) {
    const ok = await cancelRes(e.id)
    if (ok) toast(ru ? 'Вы отменили запись.' : '신청을 취소했어요')
  } else {
    const ok = await reserve(e.id)
    if (ok) toast(ru ? 'Вы успешно записались.' : '신청이 완료되었어요')
  }
}}>{r ? (ru ? 'Отменить запись' : '신청 취소') : full ? (ru ? 'Мест нет' : '마감되었어요') : (ru ? 'Записаться' : '신청하기')}</button>
          <button className="btn ghost" onClick={onClose}>{ru ? 'Закрыть' : '닫기'}</button>
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
          <p className="muted" style={{ marginTop: 10 }}>{ru ? 'Цветные полосы слева: занятия (терракотовый) · вебинары (зелёный) · встречи (охристый)' : '왼쪽 색 막대: 수업(테라코타) · 웨비나(초록) · 모임(황토)'}</p>
        </>
      ) : list.length ? (
        <ul className="list">{list.map((e) => (
          <li key={e.id} style={{ padding: '10px 0', flexWrap: 'wrap' }}>
            {(e.images?.[0] || e.image) && <img src={e.images?.[0] || e.image} alt="" style={{ width: 76, height: 64, objectFit: 'cover', borderRadius: 7 }} />}
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
      {ev && <EventModal e={ev} joined={getJoined(ev.id)} ru={ru} onClose={() => setOpen(null)} />}
    </div>
  )
}
