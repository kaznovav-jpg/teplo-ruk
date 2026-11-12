import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { D } from '../lib/data.js'
import * as F from '../lib/firebase.js'
import { useApp, useMyComments } from '../lib/store.jsx'
import { useLanguage } from '../lib/language.jsx'
import { won } from '../lib/util.js'
import useTitle from '../lib/useTitle.js'
import { ProductCard, ClassCard, ArtistCard } from '../components/Cards.jsx'

const AUTH = ['login', 'signup', 'find']
const errMsg = (e) => ({ 'auth/invalid-credential': '이메일 또는 비밀번호가 맞지 않아요', 'auth/email-already-in-use': '이미 가입된 이메일이에요', 'auth/weak-password': '비밀번호는 6자 이상이어야 해요', 'auth/popup-closed-by-user': '로그인 창이 닫혔어요' }[e?.code] || '처리하지 못했어요. 잠시 후 다시 시도해 주세요')

function AuthForms({ tab, go }) {
  const { login, signup, resetPw, loginGoogle, toast } = useApp()
  const submit = async (e) => {
    e.preventDefault()
    const f = e.target, email = f.email.value.trim()
    try {
      if (tab === 'login') { await login(email, f.pw.value); toast('로그인되었어요'); go('dash') }
      else if (tab === 'signup') {
        if (f.pw.value !== f.pw2.value) { toast('비밀번호가 서로 달라요'); return }
        await signup(f.nm.value.trim(), email, f.pw.value); toast('가입이 완료되었어요. 신규 쿠폰이 지급됐어요'); go('dash')
      } else { await resetPw(email); toast('재설정 안내를 보냈어요') }
    } catch (err) { console.error(err); toast(errMsg(err)) }
  }
  const soc = async (g) => { if (!g) { toast('카카오·네이버 로그인은 서버 연동이 필요해요 (README 참고)'); return } try { await loginGoogle(); go('dash') } catch (err) { toast(errMsg(err)) } }
  return (
    <div className="wrap sec">
      <h1 style={{ fontSize: '1.6rem', textAlign: 'center' }}>{{ login: '로그인', signup: '회원가입', find: '비밀번호 찾기' }[tab]}</h1>
      <form className="auth" onSubmit={submit}>
        {tab === 'signup' && <label>이름<input className="field" name="nm" required /></label>}
        {tab === 'find' && <p className="muted">가입한 이메일로 재설정 안내를 보내드려요.</p>}
        <label>이메일<input className="field" type="email" name="email" required autoComplete="email" /></label>
        {tab !== 'find' && <label>비밀번호{tab === 'signup' ? ' (8자 이상)' : ''}<input className="field" type="password" name="pw" required minLength={tab === 'signup' ? 8 : undefined} autoComplete={tab === 'login' ? 'current-password' : 'new-password'} /></label>}
        {tab === 'signup' && <label>비밀번호 확인<input className="field" type="password" name="pw2" required minLength={8} /></label>}
        {tab === 'signup' && <label style={{ display: 'flex', gap: 8, alignItems: 'center', minHeight: 44 }}><input type="checkbox" required style={{ width: 20, height: 20, accentColor: 'var(--pt)' }} />이용약관과 개인정보 수집에 동의합니다.</label>}
        <button className="btn">{{ login: '로그인', signup: '가입하기', find: '안내 메일 받기' }[tab]}</button>
        {tab === 'login' && <div className="soc"><button type="button" onClick={() => soc(false)}>카카오로 시작하기</button><button type="button" onClick={() => soc(false)}>네이버로 시작하기</button><button type="button" onClick={() => soc(true)}>Google로 시작하기</button></div>}
        <p style={{ textAlign: 'center' }}>
          {tab === 'login' ? <><Link className="more" to="/mypage?tab=signup">회원가입</Link> · <Link className="more" to="/mypage?tab=find">비밀번호 찾기</Link></> : <Link className="more" to="/mypage?tab=login">{tab === 'signup' ? '이미 회원이에요' : '로그인으로 돌아가기'}</Link>}
        </p>
      </form>
    </div>
  )
}

const STEPS = ['결제완료', '제작중', '배송중', '배송완료']
const stepOf = (o) => { const h = (Date.now() - o.at) / 36e5; return h < 1 ? 0 : h < 24 ? 1 : h < 72 ? 2 : 3 }

export default function MyPage() {
  useTitle('마이페이지')
  const [sp, setSp] = useSearchParams()
  const { lang } = useLanguage()
  const isRu = lang === 'ru'
  const NAV = isRu
    ? [['dash', 'Обзор'], ['master', 'Стать мастером'], ['orders', 'Мои заказы'], ['class', 'Мои курсы и записи'], ['fav', 'Избранное'], ['act', 'Моя активность'], ['coupon', 'Купоны и баллы'], ['profile', 'Профиль']]
    : [['dash', '요약'], ['master', '작가 신청'], ['orders', '주문내역'], ['class', '내 클래스·예약'], ['fav', '즐겨찾기'], ['act', '내 활동'], ['coupon', '쿠폰·적립금'], ['profile', '프로필 관리']]
  const { user, S, orders, posts, cancelRes, logout, updateUser, toast, cartCount, adminEvents, isFirebase } = useApp()
  const myc = useMyComments(user)
  const [masterApplication, setMasterApplication] = useState(null)
  useEffect(() => {
    if (!user?.uid || !isFirebase) { setMasterApplication(null); return }
    return F.onSnapshot(F.doc(F.db, 'masterApplications', user.uid),
      (snap) => setMasterApplication(snap.exists() ? snap.data() : null),
      (error) => console.error('Master application error:', error))
  }, [user?.uid, isFirebase])
  const submitMasterApplication = async (e) => {
    e.preventDefault()
    if (!isFirebase) { toast(isRu ? 'Для подачи заявки необходимо подключение Firebase.' : '신청하려면 Firebase 연결이 필요합니다.'); return }
    if (masterApplication?.status === 'pending' || masterApplication?.status === 'approved') return
    const form = e.currentTarget
    const data = {
      uid: user.uid,
      name: user.name || '',
      email: user.email || '',
      phone: form.phone.value.trim(),
      craft: form.craft.value.trim(),
      bio: form.bio.value.trim(),
      portfolio: form.portfolio.value.trim(),
      status: 'pending',
      submittedAt: new Date().toISOString()
    }
    try {
      await F.setDoc(F.doc(F.db, 'masterApplications', user.uid), data)
      setMasterApplication(data)
      toast(isRu ? 'Заявка отправлена. Ожидайте решения администратора.' : '신청이 전송되었습니다. 관리자 승인을 기다려 주세요.')
    } catch (error) {
      console.error('Master application submit error:', error)
      toast(isRu ? 'Не удалось отправить заявку. Попробуйте ещё раз.' : '신청을 보내지 못했습니다. 다시 시도해 주세요.')
    }
  }
  let tab = sp.get('tab') || ''
  const go = (t) => setSp({ tab: t })
  if (!user) return <AuthForms tab={AUTH.includes(tab) ? tab : 'login'} go={go} />
  if (!tab || AUTH.includes(tab)) tab = 'dash'
  const me = user.uid || user.email, mine = posts.filter((p) => p.uid === me), wish = S.wish
  const stat = (t, n, l) => <button className="stat" style={{ border: 0, textAlign: 'left', cursor: 'pointer' }} onClick={() => go(t)}><b>{n}</b>{l}</button>

  const C = {
    dash: <div className="stats">
      <Link className="stat" to="/cart"><b>{cartCount}</b>장바구니</Link>{stat('fav', wish.length, '찜')}{stat('class', S.enrolled.length, '수강 중 클래스')}
      {stat('class', S.reservations.length, '일정 예약')}{stat('orders', orders.length, '주문')}{stat('coupon', `${(user.coupons || []).length}장`, `쿠폰 · ${(user.points || 0).toLocaleString('ko-KR')}P`)}
    </div>,
    master: <section className="box" style={{ maxWidth: 620 }}>
      <h2>{isRu ? 'Стать мастером «Тепло Рук»' : '손길의 온기 작가 신청'}</h2>
      {masterApplication?.status === 'approved' ? (
        <p>{isRu ? 'Ваша заявка одобрена. Скоро здесь появится управление вашими работами.' : '작가 신청이 승인되었습니다. 곧 이곳에서 작품을 관리할 수 있습니다.'}</p>
      ) : masterApplication?.status === 'pending' ? (
        <p>{isRu ? 'Ваша заявка отправлена и ожидает проверки администратора. Мы сообщим о решении.' : '신청이 접수되어 관리자 검토를 기다리고 있습니다. 승인 결과를 안내해 드리겠습니다.'}</p>
      ) : ['rejected', 'removed'].includes(masterApplication?.status) ? (
        <>
          <p>{masterApplication?.status === 'removed' ? (isRu ? 'Доступ мастера был закрыт администратором. Вы можете подать заявку повторно.' : '관리자가 작가 권한을 해제했습니다. 다시 신청할 수 있습니다.') : (isRu ? 'Предыдущая заявка не была одобрена. Вы можете отправить новую.' : '이전 신청이 승인되지 않았습니다. 내용을 보완하여 다시 신청할 수 있습니다.')}</p>
          <form className="form" onSubmit={submitMasterApplication}>
            <label>{isRu ? 'Контактный телефон' : '연락처'}<input className="field" name="phone" defaultValue={masterApplication?.phone || user.phone || ''} required /></label>
            <label>{isRu ? 'Направление рукоделия' : '공예 분야'}<input className="field" name="craft" defaultValue={masterApplication?.craft || ''} placeholder={isRu ? 'Например, вышивка, вязание, шитьё' : '예: 자수, 뜨개질, 바느질'} required /></label>
            <label>{isRu ? 'Расскажите о себе и своём опыте' : '자기소개와 공예 경력을 소개해 주세요'}<textarea className="field" name="bio" rows={4} defaultValue={masterApplication?.bio || ''} required /></label>
            <label>{isRu ? 'Ссылка на портфолио или социальные сети' : '포트폴리오 또는 SNS 링크'}<input className="field" name="portfolio" defaultValue={masterApplication?.portfolio || ''} /></label>
            <button className="btn">{isRu ? 'Отправить заявку повторно' : '다시 신청하기'}</button>
          </form>
        </>
      ) : (
        <>
          <p className="muted">{isRu ? 'Расскажите о себе и своих работах. После проверки администратор сможет открыть вам кабинет мастера.' : '자신과 작품을 소개해 주세요. 관리자 검토 후 작가 전용 페이지를 이용할 수 있습니다.'}</p>
          <form className="form" onSubmit={submitMasterApplication}>
            <label>{isRu ? 'Контактный телефон' : '연락처'}<input className="field" name="phone" defaultValue={user.phone || ''} required /></label>
            <label>{isRu ? 'Направление рукоделия' : '공예 분야'}<input className="field" name="craft" placeholder={isRu ? 'Например, вышивка, вязание, шитьё' : '예: 자수, 뜨개질, 바느질'} required /></label>
            <label>{isRu ? 'Расскажите о себе и своём опыте' : '자기소개와 공예 경력을 소개해 주세요'}<textarea className="field" name="bio" rows={4} required /></label>
            <label>{isRu ? 'Ссылка на портфолио или социальные сети' : '포트폴리오 또는 SNS 링크'}<input className="field" name="portfolio" placeholder={isRu ? 'https://...' : 'https://...'} /></label>
            <button className="btn">{isRu ? 'Отправить заявку' : '작가 신청하기'}</button>
          </form>
        </>
      )}
    </section>,
    orders: orders.length ? orders.map((o, k) => (
      <div className="box" key={o.id || k}>
        <p><b>{o.no}</b> <span className="muted">{o.date}</span></p>
        <div className="steps" aria-label="배송 상태">{STEPS.map((s, i) => <span key={s} className={i === stepOf(o) ? 'on' : ''}>{s}</span>)}</div>
        {o.items.map((i, n) => <p key={n}>{i.name} ({i.opt}) × {i.qty}</p>)}
        <p style={{ marginTop: 6 }}><b>{won(o.total)}</b> <span className="muted">· {o.pay} · {o.addr}</span></p>
      </div>)) : <p className="empty">주문 내역이 없어요.<br /><Link className="more" to="/category?c=all">쇼핑하러 가기</Link></p>,
    class: <>
  <h2 style={{ fontSize: '1.2rem', marginBottom: 10 }}>수강 중인 클래스</h2>
  {S.enrolled.length ? S.enrolled.map((x) => {
    const c = D.classes.find((k) => k.id === x.id)
    if (!c) return null
    const p = Math.round(((S.progress[x.id] || []).length / c.lessons.length) * 100)

    return <div className="box" key={x.id}>
      <p><b>{c.title}</b> <span className="muted">{p}% 진행</span></p>
      <div className="prog"><i style={{ width: p + '%' }} /></div>
      <Link className="btn ghost" to={`/classes/${c.id}/learn`}>이어서 학습</Link>
    </div>
  }) : <p className="muted">아직 수강 중인 클래스가 없어요. <Link className="more" to="/classes">클래스 보기</Link></p>}

  <h2 style={{ fontSize: '1.2rem', margin: '22px 0 10px' }}>내 일정 예약</h2>
  {S.reservations.length ? S.reservations.map((r) => {
    const e = adminEvents.find((k) => k.id === r.id)
      || D.extras.events.find((k) => k.id === r.id)

    return <div className="box" key={r.id}>
      {e ? <>
        <p><span className="badge line">{e.type}</span> <b>{e.title}</b></p>
        <p className="muted">{e.ymd.replace(/-/g, '.')} {e.time} · {e.online ? '온라인' : e.place}</p>
      </> : <p><b>{r.title || '예약한 수업'}</b></p>}
     <button className="btn ghost" onClick={async () => {
  const ok = await cancelRes(r.id)
  if (ok) toast('예약을 취소했어요')
}}>예약 취소</button>
    </div>
  }) : <p className="muted">예약한 일정이 없어요. <Link className="more" to="/schedule">일정 보기</Link></p>}
</>,
    fav: <>
      <h2 style={{ fontSize: '1.2rem', marginBottom: 10 }}>상품</h2>
      <div className="grid g4">{wish.filter((i) => i[0] === 'p').map((i) => <ProductCard key={i} p={D.products.find((p) => p.id === i)} D={D} />)}{!wish.some((i) => i[0] === 'p') && <p className="muted">찜한 상품이 없어요.</p>}</div>
      <h2 style={{ fontSize: '1.2rem', margin: '22px 0 10px' }}>클래스</h2>
      <div className="grid g3">{wish.filter((i) => i[0] === 'c').map((i) => <ClassCard key={i} c={D.classes.find((c) => c.id === i)} D={D} />)}{!wish.some((i) => i[0] === 'c') && <p className="muted">찜한 클래스가 없어요.</p>}</div>
      <h2 style={{ fontSize: '1.2rem', margin: '22px 0 10px' }}>작가 (찜·팔로잉)</h2>
      <div className="grid g3">{[...new Set([...wish.filter((i) => i[0] === 'a'), ...S.follows])].map((i) => <ArtistCard key={i} a={D.artists.find((a) => a.id === i)} D={D} />)}{!wish.some((i) => i[0] === 'a') && !S.follows.length && <p className="muted">찜하거나 팔로우한 작가가 없어요.</p>}</div>
    </>,
    act: <>
      <h2 style={{ fontSize: '1.2rem', marginBottom: 10 }}>내가 쓴 글</h2>
      {mine.length ? <ul className="list">{mine.map((p) => <li key={p.id}><span className="badge line">{p.tag}</span><Link to={`/community/${p.id}`} style={{ flex: 1 }}>{p.title}</Link></li>)}</ul> : <p className="muted">작성한 글이 없어요.</p>}
      <h2 style={{ fontSize: '1.2rem', margin: '22px 0 10px' }}>내 댓글</h2>
      {myc.length ? <ul className="list">{myc.map((c) => <li key={c.id}><Link to={(c.targetId[0] === 't' ? '/articles/' : '/community/') + c.targetId} style={{ flex: 1 }}>{c.text}</Link></li>)}</ul> : <p className="muted">작성한 댓글이 없어요.</p>}
      <h2 style={{ fontSize: '1.2rem', margin: '22px 0 10px' }}>내 후기</h2><p className="muted">구매·수강 후 작성한 후기가 여기에 모여요.</p>
    </>,
    coupon: <>
      <div className="box"><b>적립금</b><p className="serif" style={{ fontSize: '1.6rem' }}>{(user.points || 0).toLocaleString('ko-KR')}P</p></div>
      {(user.coupons || []).map((c, i) => <div className="box" key={i}><b>{c.name}</b><p className="muted">{c.desc}</p></div>)}{!(user.coupons || []).length && <p className="muted">보유한 쿠폰이 없어요.</p>}
    </>,
    profile: <form className="form" style={{ maxWidth: 480 }} onSubmit={async (e) => { e.preventDefault(); const f = e.target; await updateUser({ name: f.nm.value.trim(), phone: f.phone.value, addr: f.addr.value }); toast('프로필을 저장했어요') }}>
      <label>이름<input className="field" name="nm" defaultValue={user.name || ''} required /></label>
      <label>이메일<input className="field" type="email" defaultValue={user.email || ''} readOnly /></label>
      <label>연락처<input className="field" type="tel" name="phone" defaultValue={user.phone || ''} /></label>
      <label>기본 배송지<input className="field" name="addr" defaultValue={user.addr || ''} /></label>
      <button className="btn">저장하기</button>
      <button type="button" className="btn ghost" onClick={async () => { await logout(); toast('로그아웃되었습니다') }}>로그아웃</button>
    </form>,
  }
  return (
    <div className="wrap sec">
      <h1 style={{ fontSize: '1.7rem', marginBottom: 16 }}>{isRu ? `Личный кабинет: ${user.name}` : `${user.name}님의 마이페이지`}</h1>
      <div className="mp">
        <nav className="mpn" aria-label={isRu ? "Меню личного кабинета" : "마이페이지 메뉴"}>{NAV.map((n) => <button key={n[0]} className={n[0] === tab ? 'on' : ''} onClick={() => go(n[0])}>{n[1]}</button>)}</nav>
        <div>{C[tab]}</div>
      </div>
    </div>
  )
}
