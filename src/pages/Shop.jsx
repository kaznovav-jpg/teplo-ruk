import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { D } from '../lib/data.js'
import { useApp, lastOrder } from '../lib/store.jsx'
import { useLanguage } from '../lib/language.jsx'
import { CATS, COLORS, FREE_SHIP, SHIP, won, artistName } from '../lib/util.js'
import useTitle from '../lib/useTitle.js'
import { Img, Crumb, Heart, ProductCard } from '../components/Cards.jsx'

const PR = [['~3만원', 0, 30000], ['3~7만원', 30000, 70000], ['7만원~', 70000, 1e9]]

function Group({ title, items, sel, onFlip }) {
  return (
    <fieldset><legend>{title}</legend>
      {items.map(([v, l]) => <label key={v}><input type="checkbox" checked={sel.includes(v)} onChange={() => onFlip(v)} />{l}</label>)}
    </fieldset>
  )
}

export function Category() {
  const [sp] = useSearchParams(), c = sp.get('c') || 'all', s = sp.get('s') || ''
    const { products } = useApp()
  const name = c === 'all' ? '전체 상품' : CATS.find((x) => x[0] === c)?.[1] || '전체 상품'
  useTitle(name)
  const base = useMemo(() => products.filter((p) => (c === 'all' || p.cat === c) && (!s || p.name.includes(s))), [c, s])
  const [f, setF] = useState({ pr: [], m: [], c: [], a: [] }), [onlyNew, setNew] = useState(false), [inStock, setStock] = useState(false), [sort, setSort] = useState('pop'), [sheet, setSheet] = useState(false)
  useEffect(() => { setF({ pr: [], m: [], c: [], a: [] }); setNew(false); setStock(false) }, [c, s])
  const flip = (k) => (v) => setF((o) => ({ ...o, [k]: o[k].includes(v) ? o[k].filter((x) => x !== v) : [...o[k], v] }))
  const list = useMemo(() => {
    const l = base.filter((p) =>
      (!f.pr.length || f.pr.some((i) => p.price >= PR[i][1] && p.price < PR[i][2])) && (!f.m.length || f.m.includes(p.material)) &&
      (!f.c.length || p.colors.some((x) => f.c.includes(x))) && (!f.a.length || f.a.includes(p.artist)) &&
      (!onlyNew || p.badges.includes('NEW')) && (!inStock || !p.soldOut))
    return l.sort(sort === 'new' ? (x, y) => x.daysAgo - y.daysAgo : sort === 'lo' ? (x, y) => x.price - y.price : sort === 'hi' ? (x, y) => y.price - x.price : (x, y) => y.popularity - x.popularity)
  }, [base, f, onlyNew, inStock, sort])
  const uniq = (fn) => [...new Set(base.flatMap(fn))]
  return (
    <div className="wrap">
      <Crumb items={[<Link to="/category?c=all">공예 종류</Link>, name]} />
      <h1 style={{ fontSize: '1.8rem', marginBottom: 18 }}>{name}</h1>
      <div className="cat-lay">
        <aside className={'filters' + (sheet ? ' on' : '')}>
          <button className="btn ghost block close" style={{ marginBottom: 14 }} onClick={() => setSheet(false)}>필터 닫기</button>
          <Group title="가격" items={PR.map((p, i) => [i, p[0]])} sel={f.pr} onFlip={flip('pr')} />
          <Group title="소재" items={uniq((p) => [p.material]).map((m) => [m, m])} sel={f.m} onFlip={flip('m')} />
          <Group title="색상" items={uniq((p) => p.colors).map((m) => [m, m])} sel={f.c} onFlip={flip('c')} />
          <Group title="작가" items={uniq((p) => [p.artist]).map((a) => [a, artistName(D, a)])} sel={f.a} onFlip={flip('a')} />
          <fieldset><legend>상태</legend>
            <label><input type="checkbox" checked={onlyNew} onChange={() => setNew(!onlyNew)} />신상품만</label>
            <label><input type="checkbox" checked={inStock} onChange={() => setStock(!inStock)} />품절 제외</label>
          </fieldset>
        </aside>
        <div>
          <div className="bar">
            <button className="btn ghost fbtn" onClick={() => setSheet(true)}>필터</button>
            <span className="muted">총 {list.length}개</span>
            <select aria-label="정렬" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="pop">인기순</option><option value="new">최신순</option><option value="lo">낮은 가격순</option><option value="hi">높은 가격순</option>
            </select>
          </div>
          <div className="grid g4">
            {list.length ? list.map((p) => <ProductCard key={p.id} p={p} D={D} />) : <p className="empty" style={{ gridColumn: '1/-1' }}>조건에 맞는 상품이 없어요. 필터를 줄여 보세요.</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

export function Product() {
  const { lang } = useLanguage()
  const { id } = useParams(), nav = useNavigate(), { addCart, toast, products } = useApp()
  const p = products.find((x) => x.id === id) || products[0]
  const productName = lang === 'ru' ? (p.nameRu || p.name) : p.name
  useTitle(productName)
  const [img, setImg] = useState(0), [color, setColor] = useState(p.colors[0]), [size, setSize] = useState(p.sizes[0]), [qty, setQty] = useState(1), [zoom, setZoom] = useState(false), [tab, setTab] = useState('i')
  useEffect(() => { setImg(0); setColor(p.colors[0]); setSize(p.sizes[0]); setQty(1) }, [p.id])
  useEffect(() => { if (!zoom) return; const k = (e) => e.key === 'Escape' && setZoom(false); addEventListener('keydown', k); return () => removeEventListener('keydown', k) }, [zoom])
  const add = () => addCart({ pid: p.id, color, size, qty })
  const related = products.filter((x) => x.id !== p.id && (x.cat === p.cat || x.artist === p.artist)).slice(0, 4)
  const T = {
    i: <><table><tbody><tr><th>소재</th><td>{p.material}</td></tr><tr><th>세탁법</th><td>{p.care}</td></tr></tbody></table>
      <h3 style={{ margin: '20px 0 8px' }}>사이즈표</h3>
      <table><tbody>{p.sizeTable.map((r, i) => <tr key={i}>{r.map((c, k) => (i ? <td key={k}>{c}</td> : <th key={k}>{c}</th>))}</tr>)}</tbody></table></>,
    r: <ul className="rvs">{D.extras.reviews.map((r) => <li key={r.name}>★★★★★ <b>{r.name}</b><p>{r.text}</p></li>)}</ul>,
    q: <ul className="qa"><li><b>Q. 주문제작도 가능한가요?</b><p className="muted">A. 가능합니다. 주문제작 문의 버튼으로 요청해 주세요.</p></li><li><b>Q. 선물 포장이 되나요?</b><p className="muted">A. 기본 포장으로 발송되며, 선물 포장은 문의 시 안내드려요.</p></li></ul>,
    d: <><p>배송비 {won(SHIP)} ({won(FREE_SHIP)} 이상 무료). 제작 기간 포함 영업일 기준 2~14일 소요됩니다.</p><p>수령 후 7일 이내 교환·반품 가능하나, 주문제작 상품은 제작 시작 후 변경·취소가 어렵습니다.</p></>,
  }
  return (
    <div className="wrap">
      <Crumb items={[<Link to={`/category?c=${p.cat}`}>{CATS.find((c) => c[0] === p.cat)[1]}</Link>, p.name]} />
      <div className="pd">
        <div>
          <div className="main-img" role="button" tabIndex={0} aria-label="이미지 확대" onClick={() => setZoom(true)} onKeyDown={(e) => e.key === 'Enter' && setZoom(true)}>
            <Img src={p.images[img]} alt={`${p.name} 이미지 ${img + 1}`} seed={p.id + img} loading="eager" />
          </div>
          <div className="ths">{p.images.map((s, i) => <button key={i} className={i === img ? 'on' : ''} aria-label={`이미지 ${i + 1} 보기`} onClick={() => setImg(i)}><Img src={s} alt="" seed={p.id + i} /></button>)}</div>
        </div>
        <div>
          <Link className="muted" to={`/artists/${p.artist}`}>{artistName(D, p.artist)} 작가</Link>
          <h1 style={{ fontSize: '1.7rem', margin: '4px 0' }}>{productName}</h1>
          <p>{p.badges.map((b) => <span key={b} className="badge">{b}</span>)}</p>
          <p className="pr serif" style={{ fontSize: '1.5rem', margin: '10px 0' }}>{won(p.price)}</p>
          <p>{p.desc}</p>
          <div className="opt"><b>색상: {color}</b>
            <div className="sw">{p.colors.map((c) => <button key={c} className={c === color ? 'on' : ''} style={{ background: COLORS[c] }} aria-label={c} onClick={() => setColor(c)} />)}</div></div>
          <div className="opt"><b>사이즈</b><select className="field" aria-label="사이즈" value={size} onChange={(e) => setSize(e.target.value)}>{p.sizes.map((s) => <option key={s}>{s}</option>)}</select></div>
          <div className="opt"><b>수량</b><div className="qty"><button aria-label="수량 감소" onClick={() => setQty(Math.max(1, qty - 1))}>−</button><span>{qty}</span><button aria-label="수량 증가" onClick={() => setQty(qty + 1)}>+</button></div></div>
          <div className="lead"><b>핸드메이드 제작 기간 안내</b><br />{p.lead} 소요됩니다. 하나하나 손으로 만들어 색감·크기에 1~2cm 정도 차이가 있을 수 있어요.</div>
          <div className="acts">
            <button className="btn ghost" disabled={p.soldOut} onClick={() => { add(); toast('장바구니에 담았어요') }}>장바구니</button>
            <button className="btn" disabled={p.soldOut} onClick={() => { add(); nav('/checkout') }}>{p.soldOut ? '품절' : '바로구매'}</button>
          </div>
          <div className="acts" style={{ marginTop: 10 }}><Heart id={p.id} text /><Link className="btn ghost" to="/info?t=주문제작 문의">주문제작 문의</Link></div>
        </div>
      </div>
      <div style={{ marginTop: 48 }}>
        <div className="tabs" role="tablist">{[['i', '소재·세탁·사이즈'], ['r', '사진후기'], ['q', 'Q&A'], ['d', '배송·교환']].map(([k, l]) => <button key={k} role="tab" className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}</div>
        <div className="tp">{T[tab]}</div>
      </div>
      <div className="sec"><div className="sec-h"><h2>관련 상품</h2></div><div className="grid g4">{related.map((x) => <ProductCard key={x.id} p={x} D={D} />)}</div></div>
      {zoom && <div className="lb" onClick={() => setZoom(false)}><Img src={p.images[img]} alt={`${p.name} 확대 이미지`} seed={p.id + img} loading="eager" /></div>}
    </div>
  )
}

const useLines = () => {
  const { S, products } = useApp()
  const L = S.cart.map((it, i) => ({
    ...it,
    i,
    p: products.find((x) => x.id === it.pid)
  })).filter((x) => x.p)

  const s = L.reduce((a, x) => a + x.p.price * x.qty, 0)
  const sh = s && s < FREE_SHIP ? SHIP : 0

  return { L, s, sh, t: s + sh }
}
function Summary({ s, sh, t, children, sticky }) {
  return (
    <aside className="sum" style={sticky ? { position: 'sticky', top: 90 } : undefined}>
      <div className="row"><span>상품금액</span><span>{won(s)}</span></div>
      <div className="row"><span>배송비</span><span>{sh ? won(sh) : '무료'}</span></div>
      {s > 0 && s < FREE_SHIP && <p className="muted">{won(FREE_SHIP - s)} 더 담으면 무료배송</p>}
      <div className="row tot"><span>결제 예정 금액</span><span>{won(t)}</span></div>{children}
    </aside>
  )
}

export function Cart() {
  const { lang } = useLanguage()
  useTitle(lang === 'ru' ? 'Корзина' : '장바구니')
  const { setQty, removeCart } = useApp(), { L, s, sh, t } = useLines()
  return (
    <div className="wrap sec">
      <h1 style={{ fontSize: '1.8rem', marginBottom: 12 }}>장바구니</h1>
      {L.length ? (
        <div className="cl">
          <div>{L.map((x) => (
            <div className="item" key={x.i}>
              <Link to={`/product/${x.pid}`}><Img src={x.p.images[0]} alt={x.p.name} seed={x.pid} /></Link>
              <div><p className="nm"><b>{lang === 'ru' ? (x.p.nameRu || x.p.name) : x.p.name}</b></p><p className="muted">{x.color} / {x.size}</p>
                <div className="qty" style={{ marginTop: 6 }}><button aria-label="수량 감소" onClick={() => setQty(x.i, x.qty - 1)}>−</button><span>{x.qty}</span><button aria-label="수량 증가" onClick={() => setQty(x.i, x.qty + 1)}>+</button></div></div>
              <div style={{ textAlign: 'right' }}><p><b>{won(x.p.price * x.qty)}</b></p><button className="ibtn" aria-label="삭제" onClick={() => removeCart(x.i)}>삭제</button></div>
            </div>))}
          </div>
          <Summary s={s} sh={sh} t={t}><Link className="btn block" style={{ marginTop: 14 }} to="/checkout">주문하기</Link></Summary>
        </div>
      ) : <div className="empty"><p>장바구니가 비어 있어요.</p><Link className="btn" style={{ marginTop: 14 }} to="/category?c=all">쇼핑 계속하기</Link></div>}
    </div>
  )
}

export function Checkout() {
  const { lang } = useLanguage()
  useTitle(lang === 'ru' ? 'Оформление заказа' : '주문서')
  const nav = useNavigate(), { saveOrder, clearCart, toast } = useApp(), { L, s, sh, t } = useLines()
  if (!L.length) return <div className="wrap empty"><p>주문할 상품이 없어요.</p><Link className="btn" to="/category?c=all">상품 보러 가기</Link></div>
  const field = (n, l, type = 'text', req = true) => <label>{l}<input className="field" name={n} type={type} required={req} /></label>
  const submit = async (e) => {
    e.preventDefault()
    const d = Object.fromEntries(new FormData(e.target))
    try {
      await saveOrder({ no: 'HM' + Date.now().toString().slice(-8), date: new Date().toLocaleDateString('ko-KR'), items: L.map((x) => ({ name: lang === 'ru' ? (x.p.nameRu || x.p.name) : x.p.name, opt: `${x.color}/${x.size}`, qty: x.qty, price: x.p.price })), total: t, ...d })
      clearCart(); nav('/order-complete')
    } catch (err) { console.error(err); toast('주문을 저장하지 못했어요. 다시 시도해 주세요') }
  }
  return (
    <div className="wrap sec">
      <h1 style={{ fontSize: '1.8rem', marginBottom: 18 }}>주문서</h1>
      <form className="cl" onSubmit={submit}>
        <div>
          <div className="form"><h2>주문자 정보</h2>{field('name', '이름')}{field('tel', '연락처', 'tel')}{field('email', '이메일', 'email')}</div>
          <div className="form"><h2>배송지</h2>{field('zip', '우편번호')}{field('addr', '주소')}{field('addr2', '상세 주소', 'text', false)}
            <label>배송 요청사항<select className="field" name="memo"><option>문 앞에 놓아 주세요</option><option>경비실에 맡겨 주세요</option><option>배송 전 연락 주세요</option></select></label></div>
          <div className="form"><h2>결제수단</h2><div className="pay">{['신용·체크카드', '계좌이체', '무통장입금', '간편결제'].map((m, i) => <label key={m}><input type="radio" name="pay" value={m} defaultChecked={!i} />{m}</label>)}</div></div>
          <div className="form"><label style={{ display: 'flex', gap: 8, alignItems: 'center', minHeight: 44 }}><input type="checkbox" required style={{ width: 20, height: 20, accentColor: 'var(--pt)' }} />주문 내용을 확인했으며 이용약관·개인정보 수집에 동의합니다.</label></div>
        </div>
        <Summary s={s} sh={sh} t={t} sticky><button className="btn block" style={{ marginTop: 14 }}>결제하기</button></Summary>
      </form>
    </div>
  )
}

export function Complete() {
  useTitle('주문 완료')
  const o = lastOrder()
  if (!o) return <div className="wrap empty"><p>최근 주문 내역이 없어요.</p><Link className="btn" to="/">홈으로</Link></div>
  return (
    <div className="wrap sec" style={{ maxWidth: 640, textAlign: 'center' }}>
      <p style={{ fontSize: '2.4rem' }} aria-hidden="true">🧶</p><h1 style={{ fontSize: '1.8rem', margin: '8px 0' }}>주문이 완료되었어요</h1>
      <p className="muted">주문번호 {o.no} · {o.date}</p>
      <div className="sum" style={{ margin: '24px 0', textAlign: 'left' }}>
        {o.items.map((i, k) => <div className="row" key={k}><span>{i.name} ({i.opt}) × {i.qty}</span><span>{won(i.price * i.qty)}</span></div>)}
        <div className="row tot"><span>결제금액 ({o.pay})</span><span>{won(o.total)}</span></div>
        <p className="muted" style={{ marginTop: 10 }}>배송지: {o.addr} {o.addr2 || ''}</p>
      </div>
      <p className="lead">핸드메이드 상품은 제작 기간(재고 2~3일, 주문제작 7~14일)이 지난 뒤 발송돼요.</p>
      <div className="acts"><Link className="btn" to="/category?c=all">쇼핑 계속하기</Link><Link className="btn ghost" to="/mypage?tab=orders">주문내역 보기</Link></div>
    </div>
  )
}
