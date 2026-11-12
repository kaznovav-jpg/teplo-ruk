import { useEffect, useRef, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../lib/store.jsx'
import { useLanguage } from '../lib/language.jsx'
import { CATS } from '../lib/util.js'

const MENU_KO = [
  ['공예 종류', '/category?c=all'],
  ['클래스', '/classes'],
  ['작가 작품', '/artists'],
  ['일정·시간표', '/schedule'],
  ['아티클·블로그', '/articles'],
  ['포토 포럼·커뮤니티', '/community'],
  ['사이트 안내', '/sitemap'],
  ['마이페이지', '/mypage']
]

const MENU_RU = [
  ['Виды рукоделия', '/category?c=all'],
  ['Мастер-классы', '/classes'],
  ['Работы мастеров', '/artists'],
  ['Расписание', '/schedule'],
  ['Статьи и блог', '/articles'],
  ['Фотофорум и сообщество', '/community'],
  ['Информация о сайте', '/sitemap'],
  ['Моя страница', '/mypage']
]
export default function Layout() {
  const { user, cartCount, logout, toast, isFirebase, isAdmin } = useApp()
    const { lang, changeLanguage } = useLanguage()
  const MENU = lang === 'ru' ? MENU_RU : MENU_KO
  console.log('Текущий язык сайта:', lang)
  const nav = useNavigate(), { pathname } = useLocation()
  const [notice, setNotice] = useState(true), [open, setOpen] = useState(false), [search, setSearch] = useState(false)
  const [kw, setKw] = useState(''), [scrolled, setScrolled] = useState(false), [top, setTop] = useState(false)
  const originalTextRef = useRef(new WeakMap())
  const originalAttrRef = useRef(new WeakMap())

  useEffect(() => { window.scrollTo(0, 0); setOpen(false); setSearch(false) }, [pathname])

  useEffect(() => {
    const translations = {
      '클래스':'Мастер-классы','작가 작품':'Работы мастеров','일정·시간표':'Расписание',
      '아티클·블로그':'Статьи и блог','포토 포럼·커뮤니티':'Фотофорум и сообщество',
      '사이트 안내':'Информация о сайте','마이페이지':'Моя страница','공예 종류':'Виды рукоделия',
      '가방·바느질':'Сумки и шитьё','뜨개질':'Вязание','펠트·양모펠트':'Фетр и валяние','수제 옷':'Одежда ручной работы','데코·데코파주':'Декор и декупаж',
      '동영상으로 집에서, 오프라인으로 공방에서 배워요.':'Учитесь дома по видео или очно в мастерской.',
      '난이도':'Уровень сложности','가격':'Цена','방식':'Формат','무료':'Бесплатно','유료':'Платно',
      '초급':'Начальный','중급':'Средний','패키지(재료키트)':'Набор материалов','동영상':'Видео','오프라인':'Очно',
      '전체':'Все','총':'Всего','개':'шт.','조건에 맞는 클래스가 없어요. 필터를 줄여 보세요.':'По заданным условиям ничего не найдено. Измените фильтры.',
      '시즌 기획전':'Сезонная коллекция','소개 영상 (샘플)':'Видео-презентация (пример)',
      '커리큘럼':'Программа курса','준비물':'Материалы','강사 소개':'Об авторе курса','수강 후기':'Отзывы учеников',
      '재료키트가 함께 배송돼요.':'Набор материалов доставляется вместе с заказом.','재료키트 포함 패키지':'Пакет с набором материалов',
      '총 시간':'Общая продолжительность','이어서 학습하기':'Продолжить обучение','수강신청':'Записаться на курс','무료로 시작하기':'Начать бесплатно',
      '수강신청 후 학습할 수 있어요.':'Чтобы начать обучение, сначала запишитесь на курс.','클래스 보러 가기':'Перейти к мастер-классам',
      '이전 강':'Предыдущий урок','다음 강':'Следующий урок','완료 취소':'Отменить отметку','수강 완료 표시':'Отметить как пройденный',
      '메모':'Заметки','강의를 보며 기록해 보세요':'Делайте заметки во время урока','학습 자료':'Учебные материалы',
      '준비물 체크리스트':'Список материалов','작품 사진 가이드':'Руководство по фотографированию работы','다운로드':'Скачать',
      '학습 진행률':'Прогресс обучения','작가 스토리':'История мастера','팔로워':'Подписчики','작품':'Работы',
      '진행 중 클래스':'Текущие мастер-классы','작가 소식':'Новости мастера','일시':'Дата и время','장소':'Место','정원':'Количество мест',
      '관련 클래스 보기':'Посмотреть мастер-класс','신청 취소':'Отменить запись','마감되었어요':'Мест нет','신청하기':'Записаться','닫기':'Закрыть',
      '왼쪽 색 막대: 수업(테라코타) · 웨비나(초록) · 모임(황토)':'Цветные полосы слева: занятия · вебинары · встречи',
      '아티클 검색':'Поиск по статьям','검색 결과가 없어요. 다른 단어로 찾아보세요.':'Ничего не найдено. Попробуйте другое слово.',
      '정보':'Информация','트렌드':'Тренды','리뷰':'Отзывы','공유하기':'Поделиться','관련 상품':'Похожие товары','관련 글':'Похожие статьи',
      '글쓰기':'Написать публикацию','아직 글이 없어요. 첫 글을 남겨 보세요.':'Публикаций пока нет. Будьте первым!',
      '로그인이 필요해요':'Необходимо войти в аккаунт','목록으로':'К списку','게시글을 찾을 수 없어요.':'Публикация не найдена.',
      '좋아요':'Нравится','게시판':'Раздел','제목':'Заголовок','내용':'Текст','태그 (쉼표로 구분)':'Теги (через запятую)',
      '사진 (최대 4장)':'Фотографии (до 4)','등록하기':'Опубликовать','등록 중…':'Публикация…',
      '이름':'Имя','이메일':'Электронная почта','비밀번호':'Пароль','비밀번호 확인':'Подтвердите пароль',
      '로그인':'Войти','회원가입':'Регистрация','비밀번호 찾기':'Восстановить пароль','가입하기':'Зарегистрироваться',
      '안내 메일 받기':'Получить письмо','이미 회원이에요':'Уже есть аккаунт','로그인으로 돌아가기':'Вернуться ко входу',
      '요약':'Обзор','주문내역':'Мои заказы','내 클래스·예약':'Мои курсы и записи','즐겨찾기':'Избранное',
      '내 활동':'Моя активность','쿠폰·적립금':'Купоны и баллы','프로필 관리':'Профиль','장바구니':'Корзина',
      '찜':'Избранное','수강 중 클래스':'Курсы в обучении','일정 예약':'Записи на мероприятия','주문':'Заказы',
      '주문 내역이 없어요.':'Заказов пока нет.','쇼핑하러 가기':'Перейти к покупкам','수강 중인 클래스':'Мои курсы',
      '아직 수강 중인 클래스가 없어요.':'У вас пока нет активных курсов.','클래스 보기':'Посмотреть курсы',
      '내 일정 예약':'Мои записи на мероприятия','예약 취소':'Отменить запись','예약한 수업':'Забронированное занятие',
      '예약한 일정이 없어요.':'У вас пока нет записей.','일정 보기':'Посмотреть расписание','상품':'Товары',
      '찜한 상품이 없어요.':'В избранном пока нет товаров.','클래스':'Мастер-классы','찜한 클래스가 없어요.':'В избранном пока нет мастер-классов.',
      '작가 (찜·팔로잉)':'Мастера (избранное и подписки)','찜하거나 팔로우한 작가가 없어요.':'Нет мастеров в избранном или подписках.',
      '내가 쓴 글':'Мои публикации','작성한 글이 없어요.':'Вы ещё не публиковали записи.','내 댓글':'Мои комментарии',
      '작성한 댓글이 없어요.':'Вы ещё не оставляли комментарии.','내 후기':'Мои отзывы',
      '구매·수강 후 작성한 후기가 여기에 모여요.':'Здесь будут отображаться отзывы о покупках и курсах.',
      '적립금':'Бонусные баллы','보유한 쿠폰이 없어요.':'У вас пока нет купонов.','연락처':'Телефон',
      '기본 배송지':'Адрес доставки','저장하기':'Сохранить','로그아웃':'Выйти','결제완료':'Оплата завершена',
      '제작중':'Изготавливается','배송중':'В пути','배송완료':'Доставлено','이용약관':'Условия использования',
      '개인정보처리방침':'Политика конфиденциальности','배송·교환 안내':'Доставка и обмен','홈':'Главная',
      '이용 안내':'Информация для пользователей','주문제작 문의':'Индивидуальный заказ','페이지를 찾을 수 없어요':'Страница не найдена',
      '홈으로 돌아가기':'Вернуться на главную','검색하러 가기':'Перейти к поиску',
      '작업과정(WIP) 포토':'Фото процесса работы (WIP)','자랑하기':'Показать свои работы','질문·답변':'Вопросы и ответы',
      '자유게시판':'Свободное общение'
    }
    const translate = (value) => {
      const trimmed = value.trim()
      return translations[trimmed] ? value.replace(trimmed, translations[trimmed]) : value
    }
    const applyText = (node) => {
      let original = originalTextRef.current.get(node)
      const current = node.nodeValue
      if (original === undefined || (current !== original && current !== translate(original))) {
        original = current
        originalTextRef.current.set(node, original)
      }
      const next = lang === 'ru' ? translate(original) : original
      if (node.nodeValue !== next) node.nodeValue = next
    }
    const applyAttrs = (el) => {
      for (const attr of ['placeholder','aria-label','alt']) {
        if (!el.hasAttribute(attr)) continue
        let saved = originalAttrRef.current.get(el)
        if (!saved) { saved = {}; originalAttrRef.current.set(el, saved) }
        const current = el.getAttribute(attr), original = saved[attr]
        if (original === undefined || (current !== original && current !== translate(original))) saved[attr] = current
        const next = lang === 'ru' ? translate(saved[attr]) : saved[attr]
        if (current !== next) el.setAttribute(attr, next)
      }
    }
    const walk = (root) => {
      if (root.nodeType === Node.TEXT_NODE) { applyText(root); return }
      if (root.nodeType !== Node.ELEMENT_NODE && root !== document.body) return
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
      const nodes = []
      while (walker.nextNode()) nodes.push(walker.currentNode)
      nodes.forEach(applyText)
      if (root.querySelectorAll) {
        root.querySelectorAll('input[placeholder],textarea[placeholder],input[aria-label],button[aria-label],img[alt]').forEach(applyAttrs)
        if (root.matches?.('input[placeholder],textarea[placeholder],input[aria-label],button[aria-label],img[alt]')) applyAttrs(root)
      }
    }
    const target = document.querySelector('main') || document.body
    walk(target)
    const observer = new MutationObserver((records) => records.forEach((record) => {
      if (record.type === 'characterData') applyText(record.target)
      else record.addedNodes.forEach(walk)
    }))
    observer.observe(target, { childList: true, subtree: true, characterData: true })
    return () => observer.disconnect()
  }, [lang, pathname])

  useEffect(() => {
    const f = () => { setScrolled(scrollY > 10); setTop(scrollY > 500) }
    addEventListener('scroll', f, { passive: true })
    return () => removeEventListener('scroll', f)
  }, [])

  const CAT_NAMES_RU = {
    bag: 'Сумки и шитьё',
    knit: 'Вязание',
    felt: 'Фетр и валяние',
    clothes: 'Одежда ручной работы',
    deco: 'Декор и декупаж'
  }
  const sub = CATS.map((c) => <Link key={c[0]} to={`/category?c=${c[0]}`}>{lang === 'ru' ? CAT_NAMES_RU[c[0]] || c[1] : c[1]}</Link>)
  const doSearch = (e) => { e.preventDefault(); nav('/category?c=all&s=' + encodeURIComponent(kw)) }
  const authBtn = async () => { if (user) { await logout(); toast('로그아웃되었습니다'); nav('/') } else nav('/mypage?tab=login') }

  return (
    <>
      <a className="skip" href="#main">본문으로 건너뛰기</a>
      {notice && <div className="notice">{lang === 'ru'
  ? 'Бесплатная доставка от 30 000 вон · Купон на первую покупку для новых участников'
  : '3만 원 이상 무료배송 · 신규 가입 시 첫 구매 쿠폰 증정'}<button aria-label="공지 닫기" onClick={() => setNotice(false)}>✕</button></div>}
      <header className={'hdr' + (scrolled ? ' scrolled' : '')}>
        <div className="wrap">
          <Link className="logo" to="/">{lang === 'ru' ? 'Тепло Рук' : '손길의 온기'}</Link>
          <ul className="nav" aria-label="메인 메뉴">
           {MENU.map((m, i) => <li key={m[0]}><Link to={m[1]}>{m[0]}</Link>{i === 0 && <div className="sub">{sub}</div>}</li>)}
{isAdmin && <li><Link to="/admin">{lang === 'ru' ? 'Панель администратора' : '관리자 페이지'}</Link></li>}
          </ul>
          <div className="tools">
            <button className="ibtn" onClick={() => changeLanguage('ko')}>한국어</button>
            <button className="ibtn" onClick={() => changeLanguage('ru')}>Русский</button>
            <button className="ibtn" aria-label="검색" onClick={() => setSearch(!search)}>🔍</button>
            <button className="ibtn" onClick={authBtn}>{user
  ? (lang === 'ru' ? 'Выйти' : '로그아웃')
  : (lang === 'ru' ? 'Войти' : '로그인')}</button>
            <Link className="ibtn" to="/cart" aria-label="장바구니">🛍<span className="cnt">{cartCount}</span></Link>
            <button className="ibtn hamb" aria-label="메뉴 열기" onClick={() => setOpen(true)}>☰</button>
          </div>
        </div>
        <form className={'search' + (search ? ' on' : '')} role="search" onSubmit={doSearch}>
          <input type="search" value={kw} onChange={(e) => setKw(e.target.value)} placeholder={lang === 'ru' ? 'Поиск товаров' : '상품을 검색해 보세요'} aria-label="상품 검색" />
        </form>
      </header>
      <nav className={'drawer' + (open ? ' on' : '')} aria-label="모바일 메뉴">
        <button className="ibtn" aria-label="메뉴 닫기" style={{ marginLeft: 'auto', display: 'flex' }} onClick={() => setOpen(false)}>✕</button>
       {MENU.map((m, i) => <div key={m[0]}><Link to={m[1]}>{m[0]}</Link>{i === 0 && <div className="s">{sub}</div>}</div>)}
{isAdmin && <div><Link to="/admin">{lang === 'ru' ? 'Панель администратора' : '관리자 페이지'}</Link></div>}
      </nav>
      {!isFirebase && <div className="muted" style={{ textAlign: 'center', padding: '6px 12px', background: 'var(--sub)' }}>로컬 모드: Firebase가 연결되지 않아 이 브라우저에만 저장돼요.</div>}
      <main id="main" tabIndex={-1}><Outlet /></main>
      <footer className="ftr">
        <div className="wrap">
          <div className="cols">
            <div>
  <h3>{lang === 'ru' ? 'Тепло Рук' : '손길의 온기'}</h3>
  <p>{lang === 'ru'
    ? 'Мы делимся теплом вещей ручной работы и знаниями, созданными с душой.'
    : '한 땀 한 땀 손으로 만든 따뜻한 물건과 배움을 전합니다.'}</p>
  <p>
    <a href="#">Instagram</a> <a href="#">Блог</a> <a href="#">YouTube</a>
  </p>
</div>
           <div><h3>{lang === 'ru' ? 'Служба поддержки' : '고객센터'}</h3><p>
  010-5175-2515 ({lang === 'ru' ? 'будни 10:00–17:00' : '평일 10:00~17:00'})
  <br />
  {lang === 'ru'
    ? 'Обед 12:30–13:30 · Выходные и праздники — выходные'
    : '점심 12:30~13:30 · 주말/공휴일 휴무'}
  <br />
  vic-kaznova@narod.ru
</p></div>
            <div><h3>{lang === 'ru' ? 'Информация для пользователей' : '이용 안내'}</h3><p><Link to="/info?t=이용약관">
  {lang === 'ru' ? 'Условия использования' : '이용약관'}
</Link>
<br />
<Link to="/info?t=개인정보처리방침">
  {lang === 'ru' ? 'Политика конфиденциальности' : '개인정보처리방침'}
</Link>
<br />
<Link to="/info?t=배송·교환 안내">
  {lang === 'ru' ? 'Доставка и обмен' : '배송·교환 안내'}
</Link></p></div>
          </div>
        <div className="biz">
  {lang === 'ru'
    ? 'Название: Тепло Рук · Представитель: 홍길동 · Регистрационный номер: 000-00-00000 · Регистрация интернет-торговли: 제0000-경기-0000호'
    : '상호 손길의 온기 · 대표 홍길동 · 사업자등록번호 000-00-00000 · 통신판매업 신고 제0000-경기-0000호'}
  <br />
  {lang === 'ru'
    ? 'Кёнгидо, г. Хвасон (пример адреса) · © 2026 Handmade. Все права защищены.'
    : '경기도 화성시 (샘플 주소) · © 2026 Handmade. All rights reserved.'}
</div>
        </div>
      </footer>
      <button className={'top' + (top ? ' on' : '')} aria-label="맨 위로" onClick={() => scrollTo({ top: 0 })}>↑</button>
    </>
  )
}
