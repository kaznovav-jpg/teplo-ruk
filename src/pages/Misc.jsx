import { Link, useSearchParams } from 'react-router-dom'
import { CATS, BOARDS } from '../lib/util.js'
import { useApp } from '../lib/store.jsx'
import * as F from '../lib/firebase.js'
import { useLanguage } from '../lib/language.jsx'
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
  const { lang } = useLanguage()
  const ru = lang === 'ru'
  const customTitle = ru ? 'Индивидуальный заказ' : '주문제작 문의'
  useTitle(t === '주문제작 문의' && ru ? customTitle : t)
  if (t === '주문제작 문의') {
    return (
      <div className="wrap sec" style={{ maxWidth: 560 }}>
        <h1 style={{ fontSize: '1.7rem', marginBottom: 12 }}>{customTitle}</h1>
        <form className="form" onSubmit={async (e) => {
          e.preventDefault()
          if (!F.isFirebase) { toast(ru ? 'Сервис временно недоступен. Попробуйте позже.' : '서비스를 사용할 수 없습니다.'); return }
          const form = e.currentTarget
          const data = new FormData(form)
          const request = {
            name: String(data.get('name') || '').trim(),
            phone: String(data.get('phone') || '').trim(),
            details: String(data.get('details') || '').trim(),
            status: 'new',
            at: new Date().toISOString()
          }
          try {
            await F.addDoc(F.collection(F.db, 'customOrders'), request)
            toast(ru ? 'Ваш запрос успешно отправлен. Мы свяжемся с вами.' : '문의가 정상적으로 접수되었습니다. 연락드리겠습니다.')
            form.reset()
          } catch (error) {
            console.error('Custom order request error:', error)
            toast(ru ? 'Не удалось отправить запрос. Попробуйте ещё раз.' : '문의 전송에 실패했습니다. 다시 시도해 주세요.')
          }
        }}>
          <label>{ru ? 'Имя' : '이름'}<input className="field" name="name" required maxLength={80} /></label>
          <label>{ru ? 'Контактный телефон' : '연락처'}<input className="field" name="phone" type="tel" required maxLength={40} /></label>
          <label>{ru ? 'Какое изделие вы хотите заказать и ваши пожелания' : '원하는 작품과 요청사항'}<textarea className="field" name="details" rows={5} required maxLength={3000} style={{ padding: 10 }} /></label>
          <button className="btn">{ru ? 'Отправить запрос' : '문의 보내기'}</button>
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
