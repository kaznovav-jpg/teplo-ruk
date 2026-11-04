import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../lib/store.jsx'
import { CATS } from '../lib/util.js'

const MENU = [['공예 종류', '/category?c=all'], ['클래스', '/classes'], ['작가 작품', '/artists'], ['일정·시간표', '/schedule'], ['아티클·블로그', '/articles'], ['포토 포럼·커뮤니티', '/community'], ['사이트 안내', '/sitemap'], ['마이페이지', '/mypage']]

export default function Layout() {
  const { user, cartCount, logout, toast, isFirebase, isAdmin } = useApp()
  const nav = useNavigate(), { pathname } = useLocation()
  const [notice, setNotice] = useState(true), [open, setOpen] = useState(false), [search, setSearch] = useState(false)
  const [kw, setKw] = useState(''), [scrolled, setScrolled] = useState(false), [top, setTop] = useState(false)

  useEffect(() => { window.scrollTo(0, 0); setOpen(false); setSearch(false) }, [pathname])
  useEffect(() => {
    const f = () => { setScrolled(scrollY > 10); setTop(scrollY > 500) }
    addEventListener('scroll', f, { passive: true })
    return () => removeEventListener('scroll', f)
  }, [])

  const sub = CATS.map((c) => <Link key={c[0]} to={`/category?c=${c[0]}`}>{c[1]}</Link>)
  const doSearch = (e) => { e.preventDefault(); nav('/category?c=all&s=' + encodeURIComponent(kw)) }
  const authBtn = async () => { if (user) { await logout(); toast('로그아웃되었습니다'); nav('/') } else nav('/mypage?tab=login') }

  return (
    <>
      <a className="skip" href="#main">본문으로 건너뛰기</a>
      {notice && <div className="notice">3만 원 이상 무료배송 · 신규 가입 시 첫 구매 쿠폰 증정<button aria-label="공지 닫기" onClick={() => setNotice(false)}>✕</button></div>}
      <header className={'hdr' + (scrolled ? ' scrolled' : '')}>
        <div className="wrap">
          <Link className="logo" to="/">손길의 온기</Link>
          <ul className="nav" aria-label="메인 메뉴">
           {MENU.map((m, i) => <li key={m[0]}><Link to={m[1]}>{m[0]}</Link>{i === 0 && <div className="sub">{sub}</div>}</li>)}
{isAdmin && <li><Link to="/admin">관리자 페이지</Link></li>}
          </ul>
          <div className="tools">
            <button className="ibtn" aria-label="검색" onClick={() => setSearch(!search)}>🔍</button>
            <button className="ibtn" onClick={authBtn}>{user ? '로그아웃' : '로그인'}</button>
            <Link className="ibtn" to="/cart" aria-label="장바구니">🛍<span className="cnt">{cartCount}</span></Link>
            <button className="ibtn hamb" aria-label="메뉴 열기" onClick={() => setOpen(true)}>☰</button>
          </div>
        </div>
        <form className={'search' + (search ? ' on' : '')} role="search" onSubmit={doSearch}>
          <input type="search" value={kw} onChange={(e) => setKw(e.target.value)} placeholder="상품을 검색해 보세요" aria-label="상품 검색" />
        </form>
      </header>
      <nav className={'drawer' + (open ? ' on' : '')} aria-label="모바일 메뉴">
        <button className="ibtn" aria-label="메뉴 닫기" style={{ marginLeft: 'auto', display: 'flex' }} onClick={() => setOpen(false)}>✕</button>
       {MENU.map((m, i) => <div key={m[0]}><Link to={m[1]}>{m[0]}</Link>{i === 0 && <div className="s">{sub}</div>}</div>)}
{isAdmin && <div><Link to="/admin">관리자 페이지</Link></div>}
      </nav>
      {!isFirebase && <div className="muted" style={{ textAlign: 'center', padding: '6px 12px', background: 'var(--sub)' }}>로컬 모드: Firebase가 연결되지 않아 이 브라우저에만 저장돼요.</div>}
      <main id="main" tabIndex={-1}><Outlet /></main>
      <footer className="ftr">
        <div className="wrap">
          <div className="cols">
            <div><h3>손길의 온기</h3><p>한 땀 한 땀 손으로 만든 따뜻한 물건과 배움을 전합니다.</p><p><a href="#">인스타그램</a> <a href="#">블로그</a> <a href="#">유튜브</a></p></div>
            <div><h3>고객센터</h3><p>1234-5678 (평일 10:00~17:00)<br />점심 12:30~13:30 · 주말/공휴일 휴무<br />help@handmade.example</p></div>
            <div><h3>이용 안내</h3><p><Link to="/info?t=이용약관">이용약관</Link><br /><Link to="/info?t=개인정보처리방침">개인정보처리방침</Link><br /><Link to="/info?t=배송·교환 안내">배송·교환 안내</Link></p></div>
          </div>
          <div className="biz">상호 손길의 온기 · 대표 홍길동 · 사업자등록번호 000-00-00000 · 통신판매업 신고 제0000-경기-0000호<br />경기도 화성시 (샘플 주소) · © 2026 Handmade. All rights reserved.</div>
        </div>
      </footer>
      <button className={'top' + (top ? ' on' : '')} aria-label="맨 위로" onClick={() => scrollTo({ top: 0 })}>↑</button>
    </>
  )
}
