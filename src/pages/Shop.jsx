import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { D } from '../lib/data.js'
import { useApp, lastOrder } from '../lib/store.jsx'
import { useLanguage } from '../lib/language.jsx'
import { CATS, COLORS, FREE_SHIP, SHIP, won, artistName } from '../lib/util.js'
import useTitle from '../lib/useTitle.js'
import { Img, Crumb, Heart, ProductCard } from '../components/Cards.jsx'
import * as F from '../lib/firebase.js'

const PR = [['~3만원', 0, 30000], ['3~7만원', 30000, 70000], ['7만원~', 70000, 1e9]]
const DEFAULT_BANK_DETAILS = { bank: '신한은행 / Shinhan Bank', account: '110 318 981600', holder: '가즈노바빅토리아' }

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
const { lang } = useLanguage()
  const categoryNamesRu = { bag: 'Сумки и шитьё', knit: 'Вязание', felt: 'Фетр и валяние', clothes: 'Одежда ручной работы', deco: 'Декор и декупаж', accessory: 'Аксессуары', home: 'Для дома' }
  const name = c === 'all'
  ? (lang === 'ru' ? 'Все товары' : '전체 상품')
  : (lang === 'ru' ? (categoryNamesRu[c] || 'Все товары') : (CATS.find((x) => x[0] === c)?.[1] || '전체 상품'))
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
      <Crumb items={[<Link to="/category?c=all">{lang === 'ru' ? 'Виды рукоделия' : '공예 종류'}</Link>, name]} />
      <h1 style={{ fontSize: '1.8rem', marginBottom: 18 }}>{name}</h1>
      <div className="cat-lay">
        <aside className={'filters' + (sheet ? ' on' : '')}>
          <button className="btn ghost block close" style={{ marginBottom: 14 }} onClick={() => setSheet(false)}>필터 닫기</button>
          <Group title={lang === 'ru' ? 'Цена' : '가격'} items={PR.map((p, i) => [i, lang === 'ru' ? ['До 30 000 ₩', '30 000–70 000 ₩', 'От 70 000 ₩'][i] : p[0]])} sel={f.pr} onFlip={flip('pr')} />
<Group title={lang === 'ru' ? 'Материал' : '소재'} items={uniq((p) => [p.material]).map((m) => [m, lang === 'ru' ? ({ 린넨: 'Лён', 면: 'Хлопок', 캔버스: 'Канвас', 울: 'Шерсть', 양모: 'Шерсть', 나무: 'Дерево' }[m] || m) : m])} sel={f.m} onFlip={flip('m')} />
<Group title={lang === 'ru' ? 'Цвет' : '색상'} items={uniq((p) => p.colors).map((m) => [m, lang === 'ru' ? ({ 아이보리: 'Слоновая кость', 베이지: 'Бежевый', 테라코타: 'Терракотовый', 차콜: 'Графитовый', 세이지: 'Шалфейный', 머스터드: 'Горчичный', 레드: 'Красный', 블루: 'Синий' }[m] || m) : m])} sel={f.c} onFlip={flip('c')} />
<Group title={lang === 'ru' ? 'Мастер' : '작가'} items={uniq((p) => [p.artist]).map((a) => [a, artistName(D, a, lang)])} sel={f.a} onFlip={flip('a')} />
<fieldset><legend>{lang === 'ru' ? 'Статус' : '상태'}</legend>
  <label><input type="checkbox" checked={onlyNew} onChange={() => setNew(!onlyNew)} />{lang === 'ru' ? 'Только новинки' : '신상품만'}</label>
  <label><input type="checkbox" checked={inStock} onChange={() => setStock(!inStock)} />{lang === 'ru' ? 'Только в наличии' : '품절 제외'}</label>
</fieldset>
        </aside>
        <div>
          <div className="bar">
            <button className="btn ghost fbtn" onClick={() => setSheet(true)}>
  {lang === 'ru' ? 'Фильтры' : '필터'}
</button>
<span className="muted">
  {lang === 'ru' ? `Всего: ${list.length}` : `총 ${list.length}개`}
</span>
<select aria-label={lang === 'ru' ? 'Сортировка' : '정렬'} value={sort} onChange={(e) => setSort(e.target.value)}>
  <option value="pop">{lang === 'ru' ? 'По популярности' : '인기순'}</option>
  <option value="new">{lang === 'ru' ? 'Сначала новые' : '최신순'}</option>
  <option value="lo">{lang === 'ru' ? 'Сначала дешевле' : '낮은 가격순'}</option>
  <option value="hi">{lang === 'ru' ? 'Сначала дороже' : '높은 가격순'}</option>
</select>
          </div>
          <div className="grid g4">
  {list.length ? (
    list.map((p) => <ProductCard key={p.id} p={p} D={D} />)
  ) : (
    <p className="empty" style={{ gridColumn: '1/-1' }}>
      {lang === 'ru'
        ? 'Товары не найдены. Попробуйте изменить фильтры.'
        : '조건에 맞는 상품이 없어요. 필터를 줄여 보세요.'}
    </p>
  )}
</div>
        </div>
      </div>
    </div>
  )
}

export function Product() {
  const { lang } = useLanguage()
  const { id } = useParams(), nav = useNavigate(), { addCart, toast, products } = useApp()
  const originalProduct = products.find((x) => x.id === id) || products[0]

const p = {
  ...originalProduct,
  images: Array.isArray(originalProduct.images) ? originalProduct.images : [],
  colors: Array.isArray(originalProduct.colors) ? originalProduct.colors : [],
  sizes: Array.isArray(originalProduct.sizes) ? originalProduct.sizes : [],
  badges: Array.isArray(originalProduct.badges) ? originalProduct.badges : [],
  sizeTable: Array.isArray(originalProduct.sizeTable) ? originalProduct.sizeTable : []
}
  const ru = lang === 'ru'
  const fallbackNames = { kokoshnik: 'Кокошник', '일번': 'Изделие № 1', nomer1: 'Изделие № 1' }
  const productName = ru ? (p.nameRu || fallbackNames[p.name] || p.name) : p.name
  const productDesc = ru ? (p.descRu || p.descRuText || p.desc || '') : p.desc
  const colorNamesRu = { red: 'Красный', 레드: 'Красный', blue: 'Синий', 블루: 'Синий', black: 'Чёрный', white: 'Белый', 화이트: 'Белый', 아이보리: 'Слоновая кость', 베이지: 'Бежевый', 테라코타: 'Терракотовый', 차콜: 'Графитовый', 세이지: 'Шалфейный', 머스터드: 'Горчичный' }
  const materialNamesRu = { silk: 'Шёлк', 실크: 'Шёлк', 린넨: 'Лён', 면: 'Хлопок', 캔버스: 'Канвас', 울: 'Шерсть', 양모: 'Шерсть', 나무: 'Дерево' }
  const categoryNamesRu = { bag: 'Сумки и шитьё', knit: 'Вязание', felt: 'Фетр и валяние', clothes: 'Одежда', deco: 'Декор', accessory: 'Аксессуары', home: 'Для дома' }
  const colorLabel = (value) => ru ? (colorNamesRu[value] || value) : value
  const badgeLabel = (value) => ru ? ({ 주문제작: 'На заказ', 품절: 'Нет в наличии', NEW: 'Новинка', BEST: 'Хит продаж' }[value] || value) : value
  const sizeLabel = (value) => ru ? ({ sml: 'S / M / L', 'sml': 'S / M / L' }[value] || value) : value
  const careText = ru ? (p.careRu || ({ '손세탁 권장, 그늘에서 건조해 주세요.': 'Рекомендуется ручная стирка. Сушить в тени.' }[p.care] || p.care || 'Уход уточняйте у мастера.')) : p.care
  const sizeCell = (value) => ru ? ({ 사이즈: 'Размер', 가로: 'Ширина', 세로: 'Высота', 길이: 'Длина' }[value] || value) : value
  useTitle(productName)
  const [img, setImg] = useState(0), [color, setColor] = useState(p.colors[0] || ''), [size, setSize] = useState(p.sizes[0] || ''), [qty, setQty] = useState(1), [zoom, setZoom] = useState(false), [tab, setTab] = useState('i')
  useEffect(() => {
  setImg(0)
  setColor(p.colors[0] || '')
  setSize(p.sizes[0] || '')
  setQty(1)
}, [p.id])
  useEffect(() => { if (!zoom) return; const k = (e) => e.key === 'Escape' && setZoom(false); addEventListener('keydown', k); return () => removeEventListener('keydown', k) }, [zoom])
  const add = () => addCart({ pid: p.id, color, size, qty })
  const related = products.filter((x) => x.id !== p.id && (x.cat === p.cat || x.artist === p.artist)).slice(0, 4)
  const T = {
    i: <><table><tbody><tr><th>{ru ? 'Материал' : '소재'}</th><td>{ru ? (materialNamesRu[p.material] || p.material) : p.material}</td></tr><tr><th>{ru ? 'Уход' : '세탁법'}</th><td>{careText}</td></tr></tbody></table>
      <h3 style={{ margin: '20px 0 8px' }}>{ru ? 'Таблица размеров' : '사이즈표'}</h3>
      <table><tbody>{p.sizeTable.map((r, i) => <tr key={i}>{r.map((c, k) => (i ? <td key={k}>{sizeCell(c)}</td> : <th key={k}>{sizeCell(c)}</th>))}</tr>)}</tbody></table></>,
    r: <>{ru ? <p className="muted">Отзывы с фотографиями появятся после первых покупок.</p> : <ul className="rvs">{D.extras.reviews.map((r) => <li key={r.name}>★★★★★ <b>{r.name}</b><p>{r.text}</p></li>)}</ul>}</>,
    q: <ul className="qa"><li><b>{ru ? 'Возможно ли изготовление на заказ?' : 'Q. 주문제작도 가능한가요?'}</b><p className="muted">{ru ? 'Да. Отправьте запрос через кнопку «Индивидуальный заказ».' : 'A. 가능합니다. 주문제작 문의 버튼으로 요청해 주세요.'}</p></li><li><b>{ru ? 'Есть ли подарочная упаковка?' : 'Q. 선물 포장이 되나요?'}</b><p className="muted">{ru ? 'По умолчанию отправляем в обычной упаковке. По поводу подарочной упаковки свяжитесь с нами.' : 'A. 기본 포장으로 발송되며, 선물 포장은 문의 시 안내드려요.'}</p></li></ul>,
    d: <>{ru ? <><p>Доставка: {won(SHIP)}. Бесплатно при заказе от {won(FREE_SHIP)}.</p><p>Обмен и возврат возможны в течение 7 дней после получения. Для изделий на заказ отмена и изменение после начала изготовления затруднены.</p></> : <><p>배송비 {won(SHIP)} ({won(FREE_SHIP)} 이상 무료). 제작 기간 포함 영업일 기준 2~14일 소요됩니다.</p><p>수령 후 7일 이내 교환·반품 가능하나, 주문제작 상품은 제작 시작 후 변경·취소가 어렵습니다.</p></>}</>,
  }
  return (
    <div className="wrap">
      <Crumb items={[<Link to={`/category?c=${p.cat}`}>{ru ? (categoryNamesRu[p.cat] || 'Товары') : (CATS.find((c) => c[0] === p.cat)?.[1] || '상품')}</Link>, productName]} />
      <div className="pd">
        <div>
          <div className="main-img" role="button" tabIndex={0} aria-label={ru ? 'Увеличить изображение' : '이미지 확대'} onClick={() => setZoom(true)} onKeyDown={(e) => e.key === 'Enter' && setZoom(true)}>
            <Img src={p.images[img]} alt={ru ? `${productName} — изображение ${img + 1}` : `${p.name} 이미지 ${img + 1}`} seed={p.id + img} loading="eager" />
          </div>
          <div className="ths">{p.images.map((s, i) => <button key={i} className={i === img ? 'on' : ''} aria-label={ru ? `Показать изображение ${i + 1}` : `이미지 ${i + 1} 보기`} onClick={() => setImg(i)}><Img src={s} alt="" seed={p.id + i} /></button>)}</div>
        </div>
        <div>
          <Link className="muted" to={`/artists/${p.artist}`}>{ru ? artistName(D, p.artist, 'ru') : artistName(D, p.artist, lang) + ' 작가'}</Link>
          <h1 style={{ fontSize: '1.7rem', margin: '4px 0' }}>{productName}</h1>
          <p>{p.badges.map((b) => <span key={b} className="badge">{badgeLabel(b)}</span>)}</p>
          <p className="pr serif" style={{ fontSize: '1.5rem', margin: '10px 0' }}>{won(p.price)}</p>
          <p>{productDesc}</p>
          <div className="opt"><b>{ru ? 'Цвет' : '색상'}: {colorLabel(color)}</b>
            <div className="sw">{p.colors.map((c) => <button key={c} className={c === color ? 'on' : ''} style={{ background: COLORS[c] }} aria-label={c} onClick={() => setColor(c)} />)}</div></div>
          <div className="opt"><b>{ru ? 'Размер' : '사이즈'}</b><select className="field" aria-label={ru ? 'Размер' : '사이즈'} value={size} onChange={(e) => setSize(e.target.value)}>{p.sizes.map((s) => <option key={s} value={s}>{sizeLabel(s)}</option>)}</select></div>
          <div className="opt"><b>{ru ? 'Количество' : '수량'}</b><div className="qty"><button aria-label={ru ? 'Уменьшить количество' : '수량 감소'} onClick={() => setQty(Math.max(1, qty - 1))}>−</button><span>{qty}</span><button aria-label={ru ? 'Увеличить количество' : '수량 증가'} onClick={() => setQty(qty + 1)}>+</button></div></div>
          <div className="lead"><b>{lang === 'ru' ? 'Сроки изготовления и отправки' : '핸드메이드 상품 발송 안내'}</b><br />{lang === 'ru' ? 'Товары в наличии отправляются через 2–3 дня, изделия на заказ — через 7–30 дней.' : '핸드메이드 상품은 제작 기간(재고 2~3일, 주문제작 7~30일)이 지난 뒤 발송돼요.'}<br />{ru ? (p.leadRu || 'Срок зависит от наличия и сложности изделия.') : (p.lead || '')} {ru ? 'Каждое изделие создаётся вручную, поэтому возможна разница в цвете и размере около 1–2 см.' : '하나하나 손으로 만들어 색감·크기에 1~2cm 정도 차이가 있을 수 있어요.'}</div>
          <div className="acts">
            <button className="btn ghost" disabled={p.soldOut} onClick={() => { add(); toast(ru ? 'Товар добавлен в корзину.' : '장바구니에 담았어요') }}>{ru ? 'В корзину' : '장바구니'}</button>
            <button className="btn" disabled={p.soldOut} onClick={() => { add(); nav('/checkout') }}>{p.soldOut ? (ru ? 'Нет в наличии' : '품절') : (ru ? 'Купить сейчас' : '바로구매')}</button>
          </div>
          <div className="acts" style={{ marginTop: 10 }}><Heart id={p.id} text label={productName} /><Link className="btn ghost" to="/info?t=주문제작 문의">{ru ? 'Индивидуальный заказ' : '주문제작 문의'}</Link></div>
        </div>
      </div>
      <div style={{ marginTop: 48 }}>
        <div className="tabs" role="tablist">{(ru ? [['i', 'Материал · уход · размеры'], ['r', 'Отзывы с фото'], ['q', 'Вопросы и ответы'], ['d', 'Доставка и возврат']] : [['i', '소재·세탁·사이즈'], ['r', '사진후기'], ['q', 'Q&A'], ['d', '배송·교환']]).map(([k, l]) => <button key={k} role="tab" className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}</div>
        <div className="tp">{T[tab]}</div>
      </div>
      <div className="sec"><div className="sec-h"><h2>{ru ? 'Похожие товары' : '관련 상품'}</h2></div><div className="grid g4">{related.map((x) => <ProductCard key={x.id} p={x} D={D} />)}</div></div>
      {zoom && <div className="lb" onClick={() => setZoom(false)}><Img src={p.images[img]} alt={ru ? `${productName} — увеличенное изображение` : `${p.name} 확대 이미지`} seed={p.id + img} loading="eager" /></div>}
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
  const { lang } = useLanguage()
  const ru = lang === 'ru'
  return (
    <aside className="sum" style={sticky ? { position: 'sticky', top: 90 } : undefined}>
      <div className="row"><span>{ru ? 'Стоимость товаров' : '상품금액'}</span><span>{won(s)}</span></div>
      <div className="row"><span>{ru ? 'Доставка' : '배송비'}</span><span>{sh ? won(sh) : (ru ? 'Бесплатно' : '무료')}</span></div>
      {s > 0 && s < FREE_SHIP && <p className="muted">{ru ? 'Добавьте ещё на' : ''} {won(FREE_SHIP - s)} {ru ? 'для бесплатной доставки' : '더 담으면 무료배송'}</p>}
      <div className="row tot"><span>{ru ? 'Итого к оплате' : '결제 예정 금액'}</span><span>{won(t)}</span></div>{children}
    </aside>
  )
}

export function Cart() {
  const { lang } = useLanguage()
  useTitle(lang === 'ru' ? 'Корзина' : '장바구니')
  const { setQty, removeCart } = useApp(), { L, s, sh, t } = useLines()
  const ru = lang === 'ru'
  return (
    <div className="wrap sec">
      <h1 style={{ fontSize: '1.8rem', marginBottom: 12 }}>{ru ? 'Моя корзина' : '내 장바구니'}</h1>
      {L.length ? (
        <div className="cl">
          <div>{L.map((x) => (
            <div className="item" key={x.i}>
              <Link to={`/product/${x.pid}`}><Img src={x.p.images[0]} alt={x.p.name} seed={x.pid} /></Link>
              <div><p className="nm"><b>{ru ? (x.p.nameRu || x.p.name) : x.p.name}</b></p><p className="muted">{x.color} / {x.size}</p>
                <div className="qty" style={{ marginTop: 6 }}><button aria-label={ru ? 'Уменьшить количество' : '수량 감소'} onClick={() => setQty(x.i, x.qty - 1)}>−</button><span>{x.qty}</span><button aria-label={ru ? 'Увеличить количество' : '수량 증가'} onClick={() => setQty(x.i, x.qty + 1)}>+</button></div></div>
              <div style={{ textAlign: 'right' }}><p><b>{won(x.p.price * x.qty)}</b></p><button className="ibtn" aria-label={ru ? 'Удалить товар' : '삭제'} onClick={() => removeCart(x.i)}>{ru ? 'Удалить' : '삭제'}</button></div>
            </div>))}
          </div>
          <Summary s={s} sh={sh} t={t}><Link className="btn block" style={{ marginTop: 14 }} to="/checkout">{ru ? 'Оформить весь заказ' : '전체 상품 주문하기'}</Link></Summary>
        </div>
      ) : <div className="empty"><p>{ru ? 'Ваша корзина пока пуста.' : '장바구니가 비어 있어요.'}</p><Link className="btn" style={{ marginTop: 14 }} to="/category?c=all">{ru ? 'Перейти к покупкам' : '쇼핑 계속하기'}</Link></div>}
    </div>
  )
}

export function Checkout() {
  const { lang } = useLanguage()
  const ru = lang === 'ru'
  useTitle(ru ? 'Оформление заказа' : '주문서')
  const nav = useNavigate(), { saveOrder, clearCart, toast } = useApp(), { L, s, sh, t } = useLines()
  const [pay, setPay] = useState('신용·체크카드')
  const [bankDetails, setBankDetails] = useState(DEFAULT_BANK_DETAILS)
  useEffect(() => {
    if (!F.isFirebase) return
    F.getDoc(F.doc(F.db, 'siteSettings', 'payment')).then((snap) => {
      if (snap.exists()) setBankDetails((prev) => ({ ...prev, ...snap.data() }))
    }).catch((error) => console.error('Bank details load error:', error))
  }, [])
  if (!L.length) return <div className="wrap empty"><p>{ru ? 'В корзине нет товаров.' : '주문할 상품이 없어요.'}</p><Link className="btn" to="/category?c=all">{ru ? 'Перейти к товарам' : '상품 보러 가기'}</Link></div>
  const field = (n, l, type = 'text', req = true) => <label>{l}<input className="field" name={n} type={type} required={req} /></label>
  const paymentMethods = ru
    ? [['신용·체크카드', 'Кредитная или дебетовая карта'], ['무통장입금', 'Оплата банковским переводом без карты']]
    : [['신용·체크카드', '신용·체크카드'], ['무통장입금', '무통장입금']]
  const submit = async (e) => {
    e.preventDefault()
    const d = Object.fromEntries(new FormData(e.target))
    const storeTab = d.pay === '신용·체크카드' ? window.open('about:blank', '_blank') : null
    try {
      await saveOrder({ paymentStatus: 'awaiting_payment', no: 'HM' + Date.now().toString().slice(-8), date: new Date().toLocaleDateString('ko-KR'), bankDetails: d.pay === '무통장입금' ? bankDetails : null, items: L.map((x) => ({ name: x.p.name, nameRu: x.p.nameRu || ({ kokoshnik: 'Кокошник', '일번': 'Изделие № 1' }[x.p.name] || x.p.name), opt: `${x.color}/${x.size}`, qty: x.qty, price: x.p.price })), total: t, ...d })
      clearCart()
      if (d.pay === '신용·체크카드') {
        if (storeTab) {
          storeTab.location.href = 'https://smartstore.naver.com/miniri'
        } else {
          toast(ru ? 'Браузер заблокировал новую вкладку. Разрешите всплывающие окна для этого сайта и повторите попытку.' : '새 탭이 차단되었어요. 이 사이트의 팝업을 허용한 뒤 다시 시도해 주세요.')
        }
        return
      }
      nav('/order-complete')
    } catch (err) {
      if (storeTab) storeTab.close()
      console.error(err)
      toast(ru ? 'Не удалось сохранить заказ. Попробуйте ещё раз.' : '주문을 저장하지 못했어요. 다시 시도해 주세요')
    }
  }
  return (
    <div className="wrap sec">
      <h1 style={{ fontSize: '1.8rem', marginBottom: 18 }}>{ru ? 'Оформление заказа' : '주문서'}</h1>
      <form className="cl" onSubmit={submit}>
        <div>
          <div className="form"><h2>{ru ? 'Данные покупателя' : '주문자 정보'}</h2>{field('name', ru ? 'Имя' : '이름')}{field('tel', ru ? 'Телефон' : '연락처', 'tel')}{field('email', ru ? 'Электронная почта' : '이메일', 'email')}</div>
          <div className="form"><h2>{ru ? 'Адрес доставки' : '배송지'}</h2>{field('zip', ru ? 'Почтовый индекс' : '우편번호')}{field('addr', ru ? 'Адрес' : '주소')}{field('addr2', ru ? 'Квартира, дом, подробности адреса' : '상세 주소', 'text', false)}
            <label>{ru ? 'Пожелания по доставке' : '배송 요청사항'}<select className="field" name="memo"><option>{ru ? 'Оставить у двери' : '문 앞에 놓아 주세요'}</option><option>{ru ? 'Оставить у охраны' : '경비실에 맡겨 주세요'}</option><option>{ru ? 'Связаться перед доставкой' : '배송 전 연락 주세요'}</option></select></label></div>
          <div className="lead" style={{ marginBottom: 16 }}><b>{ru ? 'Сроки изготовления и отправки' : '핸드메이드 상품 발송 안내'}</b><p>{ru ? 'Товары в наличии отправляются через 2–3 дня, изделия на заказ — через 7–30 дней.' : '핸드메이드 상품은 제작 기간(재고 2~3일, 주문제작 7~30일)이 지난 뒤 발송돼요.'}</p></div>
          <div className="form"><h2>{ru ? 'Способ оплаты' : '결제수단'}</h2><div className="pay">{paymentMethods.map(([value, label]) => <label key={value}><input type="radio" name="pay" value={value} checked={pay === value} onChange={() => setPay(value)} />{label}</label>)}</div>{pay === '무통장입금' && <><div className="lead" style={{ marginTop: 14 }}><b>{ru ? 'Банковские реквизиты для перевода' : '무통장 입금 계좌 안내'}</b><p>{ru ? 'Банк:' : '은행:'} {bankDetails.bank}</p><p>{ru ? 'Номер счёта:' : '계좌번호:'} <b>{bankDetails.account}</b></p><p>{ru ? 'Получатель:' : '예금주:'} {bankDetails.holder}</p><p>{ru ? 'Сумма к переводу:' : '입금하실 금액:'} <b>{won(t)}</b></p><p>{ru ? 'Пожалуйста, укажите номер заказа в назначении перевода.' : '입금 시 주문번호를 메모에 기재해 주세요.'}</p></div>{field('depositor', ru ? 'Имя отправителя банковского перевода (как указано в банке)' : '실제 입금자명 (은행에 표시되는 이름)')}</>}{pay === '신용·체크카드' && <div className="lead" style={{ marginTop: 14 }}><b>{ru ? 'Оплата банковской картой через Naver SmartStore' : '네이버 스마트스토어 카드 결제 안내'}</b><p>{ru ? 'После нажатия кнопки «Оформить заказ» вы будете перенаправлены в мой магазин Naver SmartStore, где сможете завершить покупку и оплатить её кредитной или дебетовой картой.' : '주문하기 버튼을 누르면 네이버 스마트스토어 내 상점으로 이동합니다. 해당 상점에서 상품 구매와 신용·체크카드 결제를 완료해 주세요.'}</p></div>}</div>
          <div className="form"><label style={{ display: 'flex', gap: 8, alignItems: 'center', minHeight: 44 }}><input type="checkbox" required style={{ width: 20, height: 20, accentColor: 'var(--pt)' }} />{ru ? 'Я проверил(а) заказ и согласен(на) с условиями использования и обработкой персональных данных.' : '주문 내용을 확인했으며 이용약관·개인정보 수집에 동의합니다.'}</label></div>
        </div>
        <Summary s={s} sh={sh} t={t} sticky><button className="btn block" style={{ marginTop: 14 }}>{ru ? 'Оформить заказ' : '결제하기'}</button></Summary>
      </form>
    </div>
  )
}
export function Complete() {
  const { lang } = useLanguage()
  const ru = lang === 'ru'
  useTitle(ru ? 'Заказ оформлен' : '주문 완료')
  const [currentBankDetails, setCurrentBankDetails] = useState(DEFAULT_BANK_DETAILS)
  useEffect(() => {
    if (!F.isFirebase) return
    F.getDoc(F.doc(F.db, 'siteSettings', 'payment')).then((snap) => {
      if (snap.exists()) setCurrentBankDetails((prev) => ({ ...prev, ...snap.data() }))
    }).catch((error) => console.error('Bank details load error:', error))
  }, [])
  const o = lastOrder()
  if (!o) return <div className="wrap empty"><p>{ru ? 'Недавний заказ не найден.' : '최근 주문 내역이 없어요.'}</p><Link className="btn" to="/">{ru ? 'На главную' : '홈으로'}</Link></div>
  return (
    <div className="wrap sec" style={{ maxWidth: 640, textAlign: 'center' }}>
      <p style={{ fontSize: '2.4rem' }} aria-hidden="true">🧶</p><h1 style={{ fontSize: '1.8rem', margin: '8px 0' }}>{ru ? 'Заказ оформлен' : '주문이 완료되었어요'}</h1>
      <p className="muted">{ru ? 'Номер заказа' : '주문번호'} {o.no} · {o.date}</p>
      <div className="sum" style={{ margin: '24px 0', textAlign: 'left' }}>
        {o.items.map((i, k) => <div className="row" key={k}><span>{ru ? (i.nameRu || ({ kokoshnik: 'Кокошник', '일번': 'Изделие № 1' }[i.name] || i.name)) : i.name} ({i.opt}) × {i.qty}</span><span>{won(i.price * i.qty)}</span></div>)}
        <div className="row tot"><span>{ru ? 'Общая сумма' : '총 주문금액'} ({o.pay === '무통장입금' ? (ru ? 'Банковский перевод' : '무통장입금') : (ru ? 'Карта' : '카드')})</span><span>{won(o.total)}</span></div>
        <p className="muted" style={{ marginTop: 10 }}>{ru ? 'Адрес доставки:' : '배송지:'} {o.addr} {o.addr2 || ''}</p>
      </div>
      {o.pay === '무통장입금' && <div className="lead" style={{ textAlign: 'left', marginBottom: 20 }}><b>{ru ? 'Реквизиты для оплаты' : '입금 계좌 안내'}</b>{o.depositor && <p>{ru ? 'Имя отправителя перевода:' : '입금자명:'} <b>{o.depositor}</b></p>}<p>{ru ? 'Банк:' : '은행:'} {(o.bankDetails || currentBankDetails).bank}</p><p>{ru ? 'Номер счёта:' : '계좌번호:'} <b>{(o.bankDetails || currentBankDetails).account}</b></p><p>{ru ? 'Получатель:' : '예금주:'} {(o.bankDetails || currentBankDetails).holder}</p><p>{ru ? 'Сумма к переводу:' : '입금하실 금액:'} <b>{won(o.total)}</b></p><p>{ru ? 'Пожалуйста, переведите указанную сумму и укажите номер заказа в назначении платежа.' : '위 금액을 입금해 주시고, 입금 메모에 주문번호를 기재해 주세요.'}</p></div>}
      <p className="lead">{ru ? 'Товары в наличии отправляются через 2–3 дня, изделия на заказ — через 7–30 дней.' : '핸드메이드 상품은 제작 기간(재고 2~3일, 주문제작 7~30일)이 지난 뒤 발송돼요.'}</p>
      <div className="acts"><Link className="btn" to="/category?c=all">{ru ? 'Продолжить покупки' : '쇼핑 계속하기'}</Link><Link className="btn ghost" to="/mypage?tab=orders">{ru ? 'Мои заказы' : '주문내역 보기'}</Link></div>
    </div>
  )
}
