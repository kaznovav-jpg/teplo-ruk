import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { D } from '../lib/data.js'
import { useApp, useMyComments } from '../lib/store.jsx'
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

const NAV = [['dash', '요약'], ['orders', '주문내역'], ['class', '내 클래스·예약'], ['fav', '즐겨찾기'], ['act', '내 활동'], ['coupon', '쿠폰·적립금'], ['profile', '프로필 관리']]
const STEPS = ['결제완료', '제작중', '배송중', '배송완료']
const stepOf = (o) => { const h = (Date.now() - o.at) / 36e5; return h < 1 ? 0 : h < 24 ? 1 : h < 72 ? 2 : 3 }

export default function MyPage() {
  useTitle('마이페이지')
  const [sp, setSp] = useSearchParams()
  const { user, S, orders, posts, cancelRes, logout, updateUser, toast, cartCount } = useApp()
  const myc = useMyComments(user)
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
    orders: orders.length ? orders.map((o, k) => (
      <div className="box" key={o.id || k}>
        <p><b>{o.no}</b> <span className="muted">{o.date}</span></p>
        <div className="steps" aria-label="배송 상태">{STEPS.map((s, i) => <span key={s} className={i === stepOf(o) ? 'on' : ''}>{s}</span>)}</div>
        {o.items.map((i, n) => <p key={n}>{i.name} ({i.opt}) × {i.qty}</p>)}
        <p style={{ marginTop: 6 }}><b>{won(o.total)}</b> <span className="muted">· {o.pay} · {o.addr}</span></p>
      </div>)) : <p className="empty">주문 내역이 없어요.<br /><Link className="more" to="/category?c=all">쇼핑하러 가기</Link></p>,
    class: <>
      <h2 style={{ fontSize: '1.2rem', marginBottom: 10 }}>수강 중인 클래스</h2>
      {S.enrolled.length ? S.enrolled.map((x) => { const c = D.classes.find((k) => k.id === x.id), p = Math.round(((S.progress[x.id] || []).length / c.lessons.length) * 100)
        return <div className="box" key={x.id}><p><b>{c.title}</b> <span className="muted">{p}% 진행</span></p><div className="prog"><i style={{ width: p + '%' }} /></div><Link className="btn ghost" to={`/classes/${c.id}/learn`}>이어서 학습</Link></div> })
        : <p className="muted">아직 수강 중인 클래스가 없어요. <Link className="more" to="/classes">클래스 보기</Link></p>}
      <h2 style={{ fontSize: '1.2rem', margin: '22px 0 10px' }}>내 일정 예약</h2>
      {S.reservations.length ? S.reservations.map((r) => { const e = D.extras.events.find((k) => k.id === r.id)
        return <div className="box" key={r.id}><p><span className="badge line">{e.type}</span> <b>{e.title}</b></p><p className="muted">{e.ymd.replace(/-/g, '.')} {e.time} · {e.online ? '온라인' : e.place}</p><button className="btn ghost" onClick={() => { cancelRes(e.id); toast('예약을 취소했어요') }}>예약 취소</button></div> })
        : <p className="muted">예약한 일정이 없어요. <Link className="more" to="/schedule">일정 보기</Link></p>}
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
      <h1 style={{ fontSize: '1.7rem', marginBottom: 16 }}>{user.name}님의 마이페이지</h1>
      <div className="mp">
        <nav className="mpn" aria-label="마이페이지 메뉴">{NAV.map((n) => <button key={n[0]} className={n[0] === tab ? 'on' : ''} onClick={() => go(n[0])}>{n[1]}</button>)}</nav>
        <div>{C[tab]}</div>
      </div>
    </div>
  )
}
