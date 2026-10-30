import { Link, useSearchParams } from 'react-router-dom'
import { CATS, BOARDS } from '../lib/util.js'
import { useApp } from '../lib/store.jsx'
import useTitle from '../lib/useTitle.js'

function Node({ t, to, kids }) {
  return <li><Link to={to}>{t}</Link>{kids && <ul>{kids.map((k) => <Node key={k[1]} t={k[0]} to={k[1]} kids={k[2]} />)}</ul>}</li>
}

export function Sitemap() {
  useTitle('사이트 안내')
  const T = [
    ['홈', '/'], ['공예 종류', '/category?c=all', CATS.map((c) => [c[1], '/category?c=' + c[0]])], ['클래스', '/classes'], ['작가 작품', '/artists'], ['일정·시간표', '/schedule'],
    ['아티클·블로그', '/articles', ['정보', '트렌드', '리뷰'].map((c) => [c, '/articles?cat=' + c])], ['포토 포럼·커뮤니티', '/community', BOARDS.map((b) => [b[1], '/community?board=' + b[0]])],
    ['마이페이지', '/mypage', [['로그인', '/mypage?tab=login'], ['회원가입', '/mypage?tab=signup'], ['장바구니', '/cart']]],
    ['이용 안내', '/info?t=이용약관', [['이용약관', '/info?t=이용약관'], ['개인정보처리방침', '/info?t=개인정보처리방침'], ['배송·교환 안내', '/info?t=배송·교환 안내'], ['주문제작 문의', '/info?t=주문제작 문의']]],
  ]
  return <div className="wrap sec smap"><h1 style={{ fontSize: '1.8rem', marginBottom: 16 }}>사이트 안내</h1><ul>{T.map((x) => <Node key={x[1]} t={x[0]} to={x[1]} kids={x[2]} />)}</ul></div>
}

export function Info() {
  const [sp] = useSearchParams(), t = sp.get('t') || '안내', { toast } = useApp()
  useTitle(t)
  if (t === '주문제작 문의') {
    return (
      <div className="wrap sec" style={{ maxWidth: 560 }}>
        <h1 style={{ fontSize: '1.7rem', marginBottom: 12 }}>주문제작 문의</h1>
        <form className="form" onSubmit={(e) => { e.preventDefault(); toast('문의가 접수되었어요 (샘플)'); e.target.reset() }}>
          <label>이름<input className="field" required /></label><label>연락처<input className="field" type="tel" required /></label>
          <label>원하는 작품과 요청사항<textarea className="field" rows={5} required style={{ padding: 10 }} /></label><button className="btn">문의 보내기</button>
        </form>
      </div>
    )
  }
  return (
    <div className="wrap sec" style={{ maxWidth: 720 }}>
      <h1 style={{ fontSize: '1.7rem', marginBottom: 12 }}>{t}</h1>
      <p>이 문서는 샘플 문구예요. 실제 운영 전에 사업자 정보에 맞는 내용으로 교체해 주세요.</p>
      <p className="muted" style={{ marginTop: 12 }}>시행일: 2026년 10월 21일</p>
    </div>
  )
}

export function NotFound() {
  useTitle('페이지를 찾을 수 없어요')
  return <div className="wrap empty" style={{ padding: '100px 20px' }}><p style={{ fontSize: '2.4rem' }} aria-hidden="true">🪡</p><h1 style={{ fontSize: '1.6rem', margin: '8px 0' }}>페이지를 찾을 수 없어요</h1><Link className="btn" style={{ marginTop: 18 }} to="/">홈으로 돌아가기</Link></div>
}
