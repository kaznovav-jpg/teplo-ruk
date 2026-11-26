import { useEffect, useState } from 'react'
import { Link, useSearchParams, useNavigate, useParams } from 'react-router-dom'
import { D } from '../lib/data.js'
import * as F from '../lib/firebase.js'
import { useApp, useMyComments } from '../lib/store.jsx'
import { useLanguage } from '../lib/language.jsx'
import { won } from '../lib/util.js'
import useTitle from '../lib/useTitle.js'
import { ProductCard, ClassCard, ArtistCard } from '../components/Cards.jsx'
import FilePicker from '../components/FilePicker.jsx'
import { optimizeImage } from '../lib/optimizeImage.js'

const AUTH = ['login', 'signup', 'find']
const errMsg = (e, isRu) => {
  if (e?.code === 'auth/user-disabled') return isRu
    ? 'Ваш аккаунт заблокирован администрацией. Вход на сайт временно недоступен. Если вы считаете, что это ошибка, свяжитесь с администрацией.'
    : '관리자에 의해 계정이 차단되었습니다. 사이트에 로그인할 수 없습니다. 오류라고 생각하시면 관리자에게 문의해 주세요.'
  if (e?.message === 'Это имя уже занято. Пожалуйста, выберите другое.') return isRu
    ? e.message
    : '이미 사용 중인 이름입니다. 다른 이름을 선택해 주세요.'
  if (e?.message && (e.message.includes('Имя должно содержать') || e.message.includes('Не удалось проверить имя'))) return e.message
  return ({ 'auth/email-not-verified': '이메일 인증이 필요해요. 받은 메일의 링크를 눌러 주세요.', 'auth/invalid-credential': '이메일 또는 비밀번호가 맞지 않아요', 'auth/email-already-in-use': '이미 가입된 이메일이에요', 'auth/weak-password': '비밀번호는 6자 이상이어야 해요', 'auth/popup-closed-by-user': '로그인 창이 닫혔어요' }[e?.code] || '처리하지 못했어요. 잠시 후 다시 시도해 주세요.')
}

function AuthForms({ tab, go }) {
  const { login, signup, resetPw, resendVerification, toast } = useApp()
  const { lang } = useLanguage()
  const isRu = lang === 'ru'
  const [pendingVerification, setPendingVerification] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const submit = async (e) => {
    e.preventDefault()
    if (submitting) return
    const f = e.target, email = f.email.value.trim()
    setSubmitting(true)
    try {
      if (tab === 'login') { setPendingVerification(false); await login(email, f.pw.value); toast('로그인되었어요'); go('dash') }
      else if (tab === 'signup') {
        if (f.pw.value !== f.pw2.value) { toast('비밀번호가 서로 달라요'); return }
        await signup(f.nm.value.trim(), email, f.pw.value); toast('인증 메일을 보냈어요. 이메일의 링크를 누른 뒤 로그인해 주세요.'); go('login')
      } else { await resetPw(email); toast('재설정 안내를 보냈어요') }
    } catch (err) { console.error(err); setPendingVerification(err?.code === 'auth/email-not-verified'); toast(errMsg(err, isRu)) }
    finally { setSubmitting(false) }
  }
  return (
    <div className="wrap sec">
      <h1 style={{ fontSize: '1.6rem', textAlign: 'center' }}>{{ login: '로그인', signup: '회원가입', find: '비밀번호 찾기' }[tab]}</h1>
      {tab === 'signup' && <p className="auth-verification-note">{isRu ? 'После регистрации мы отправим письмо на вашу электронную почту. Чтобы подтвердить адрес и войти в личный кабинет, откройте письмо и нажмите ссылку подтверждения.' : '회원가입 후 이메일로 인증 메일을 보내드립니다. 이메일 주소를 인증하고 로그인하려면 메일을 열어 인증 링크를 눌러 주세요.'}</p>}
      <form className="auth" onSubmit={submit}>
        {tab === 'signup' && <label>이름<input className="field" name="nm" required /></label>}
        {tab === 'find' && <p className="muted">가입한 이메일로 재설정 안내를 보내드려요.</p>}
        <label>이메일<input className="field" type="email" name="email" required autoComplete="email" /></label>
        {tab !== 'find' && <label>비밀번호{tab === 'signup' ? ' (8자 이상)' : ''}<input className="field" type="password" name="pw" required minLength={tab === 'signup' ? 8 : undefined} autoComplete={tab === 'login' ? 'current-password' : 'new-password'} /></label>}
        {tab === 'signup' && <label>비밀번호 확인<input className="field" type="password" name="pw2" required minLength={8} /></label>}
        {tab === 'signup' && <label style={{ display: 'flex', gap: 8, alignItems: 'center', minHeight: 44 }}><input type="checkbox" required style={{ width: 20, height: 20, accentColor: 'var(--pt)' }} />이용약관과 개인정보 수집에 동의합니다.</label>}
        <button className="btn" type="submit" disabled={submitting} aria-busy={submitting} style={submitting ? { opacity: 0.7, cursor: 'wait' } : undefined}>{submitting ? (isRu ? 'Обрабатывается… Пожалуйста, подождите' : '처리 중… 잠시만 기다려 주세요') : ({ login: '로그인', signup: '가입하기', find: '안내 메일 받기' }[tab])}</button>
        {pendingVerification && <button type="button" className="btn ghost" onClick={async (e) => { const form = e.currentTarget.form; try { await resendVerification(form.email.value.trim(), form.pw.value); toast('인증 메일을 다시 보냈어요. 받은편지함과 스팸함을 확인해 주세요.') } catch (err) { console.error(err); toast(err?.message || '인증 메일을 보내지 못했어요.') } }}>{'인증 메일 다시 보내기'}</button>}
        <p style={{ textAlign: 'center' }}>
          {tab === 'login' ? <><Link className="more" to="/mypage?tab=signup">회원가입</Link> · <Link className="more" to="/mypage?tab=find">비밀번호 찾기</Link></> : <Link className="more" to="/mypage?tab=login">{tab === 'signup' ? '이미 회원이에요' : '로그인으로 돌아가기'}</Link>}
        </p>
      </form>
    </div>
  )
}

const stepOf = (o) => {
  if (o.orderStatus === 'cancelled') return -1
  if (o.paymentStatus !== 'paid') return 1
  if (o.fulfillmentStatus === 'delivered') return 5
  if (o.fulfillmentStatus === 'shipped') return 4
  if (o.fulfillmentStatus === 'preparing') return 3
  return 2
}

export default function MyPage() {
  useTitle('마이페이지')
  const [sp, setSp] = useSearchParams()
  const { lang } = useLanguage()
  const isRu = lang === 'ru'
  const STEPS = isRu
    ? ['Заказ оформлен', 'Ожидание оплаты', 'Оплата завершена', 'Изготавливается', 'В пути', 'Доставлено']
    : ['주문 접수', '결제 대기', '결제 완료', '제작중', '배송중', '배송완료']
  const NAV = isRu
    ? [['dash', 'Обзор'], ['notices', 'Сообщения'], ['master', 'Стать мастером'], ['orders', 'Мои заказы'], ['class', 'Мои курсы и записи'], ['fav', 'Избранное'], ['act', 'Моя активность'], ['coupon', 'Купоны'], ['profile', 'Профиль']]
    : [['dash', '요약'], ['notices', '알림'], ['master', '작가 신청'], ['orders', '주문내역'], ['class', '내 클래스·예약'], ['fav', '즐겨찾기'], ['act', '내 활동'], ['coupon', '쿠폰'], ['profile', '프로필 관리']]
  const { user, S, orders, posts, cancelRes, logout, updateUser, toast, cartCount, adminEvents, isFirebase } = useApp()
  const myc = useMyComments(user)
  const [masterApplication, setMasterApplication] = useState(null)
  const [userNotices, setUserNotices] = useState([])
  const [myArtistWorks, setMyArtistWorks] = useState([])
  const [workForm, setWorkForm] = useState({ title: '', titleRu: '', description: '', descriptionRu: '', contact: '', category: 'accessory', images: [] })
  const [editingWorkId, setEditingWorkId] = useState(null)
  const [workSaving, setWorkSaving] = useState(false)
  useEffect(() => {
    if (!user?.uid || !isFirebase) { setMasterApplication(null); return }
    return F.onSnapshot(F.doc(F.db, 'masterApplications', user.uid),
      (snap) => setMasterApplication(snap.exists() ? snap.data() : null),
      (error) => console.error('Master application error:', error))
  }, [user?.uid, isFirebase])
  useEffect(() => {
    if (!user?.uid || !isFirebase) { setUserNotices([]); return }
    return F.onSnapshot(
      F.query(F.collection(F.db, 'userNotifications'), F.where('uid', '==', user.uid)),
      (snap) => setUserNotices(snap.docs.map((d) => ({ ...d.data(), id: d.id })).sort((a, b) => {
        const av = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0
        const bv = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0
        return bv - av
      })),
      (error) => console.error('User notifications error:', error)
    )
  }, [user?.uid, isFirebase])

  useEffect(() => {
    if (!user?.uid || !isFirebase || masterApplication?.status !== 'approved') { setMyArtistWorks([]); return }
    return F.onSnapshot(
      F.query(F.collection(F.db, 'artistWorks'), F.where('artistUid', '==', user.uid)),
      (snap) => setMyArtistWorks(snap.docs.map((d) => ({ ...d.data(), id: d.id })).sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))),
      (error) => console.error('My artist works error:', error)
    )
  }, [user?.uid, isFirebase, masterApplication?.status])

  const uploadMakerImage = async (file) => {
    if (!file) return ''
    const body = new FormData()
    const optimizedFile = await optimizeImage(file)
    body.append('file', optimizedFile, optimizedFile.name || 'photo.webp')
    body.append('upload_preset', 'teplo_ruk_upload')
    const response = await fetch('https://api.cloudinary.com/v1_1/sfnfmwiv/image/upload', { method: 'POST', body })
    const result = await response.json()
    if (!response.ok) throw new Error(result.error?.message || 'Upload failed')
    return result.secure_url
  }

  const saveMakerWork = async (e) => {
    e.preventDefault()
    if (!isFirebase) { toast(isRu ? 'Для отправки работы необходимо подключение Firebase.' : '작품을 등록하려면 Firebase 연결이 필요합니다.'); return }
    if (!workForm.title.trim() || !workForm.titleRu.trim() || !workForm.contact.trim() || !workForm.images.length) {
      toast(isRu ? 'Заполните названия, контактные данные и добавьте хотя бы одну фотографию.' : '작품명, 연락처를 입력하고 사진을 한 장 이상 추가해 주세요.')
      return
    }
    setWorkSaving(true)
    const data = {
      artistUid: user.uid,
      artistName: user.name || '',
      title: workForm.title.trim(),
      titleRu: workForm.titleRu.trim(),
      description: workForm.description.trim(),
      descriptionRu: workForm.descriptionRu.trim(),
      contact: workForm.contact.trim(),
      category: workForm.category,
      images: workForm.images,
      image: workForm.images[0],
      agreedToTermsAt: new Date().toISOString(),
      sellerTermsVersion: '1.0',
      status: 'pending',
      updatedAt: new Date().toISOString()
    }
    try {
      if (editingWorkId) await F.setDoc(F.doc(F.db, 'artistWorks', editingWorkId), data, { merge: true })
      else await F.addDoc(F.collection(F.db, 'artistWorks'), { ...data, createdAt: new Date().toISOString() })
      setWorkForm({ title: '', titleRu: '', description: '', descriptionRu: '', contact: '', category: 'accessory', images: [] })
      setEditingWorkId(null)
      toast(isRu ? 'Работа отправлена на проверку администратора.' : '작품이 관리자 검토로 전송되었습니다.')
    } catch (error) {
      console.error('Maker work save error:', error)
      toast(isRu ? 'Не удалось отправить работу. Проверьте подключение и попробуйте снова.' : '작품을 저장하지 못했습니다. 다시 시도해 주세요.')
    } finally { setWorkSaving(false) }
  }
  const editMakerWork = (work) => {
    setEditingWorkId(work.id)
    setWorkForm({ title: work.title || '', titleRu: work.titleRu || '', description: work.description || '', descriptionRu: work.descriptionRu || '', contact: work.contact || '', category: work.category || 'accessory', images: work.images?.length ? work.images.slice(0, 3) : (work.image ? [work.image] : []) })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const deleteMakerWork = async (work) => {
    if (!window.confirm(isRu ? 'Удалить эту работу?' : '이 작품을 삭제할까요?')) return
    try { await F.deleteDoc(F.doc(F.db, 'artistWorks', work.id)); toast(isRu ? 'Работа удалена.' : '작품이 삭제되었습니다.') }
    catch (error) { console.error(error); toast(isRu ? 'Не удалось удалить работу.' : '작품을 삭제하지 못했습니다.') }
  }

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
      {stat('class', S.reservations.length, '일정 예약')}{stat('orders', orders.length, '주문')}{stat('coupon', `${(user.coupons || []).length}${isRu ? ' шт.' : '장'}`, isRu ? 'Купоны' : '쿠폰')}
    </div>,
    notices: <>
      <h2 style={{ fontSize: '1.2rem', marginBottom: 12 }}>{isRu ? 'Сообщения администрации' : '관리자 알림'}</h2>
      {userNotices.length ? userNotices.map((notice) => <article className="box" key={notice.id} style={{ marginBottom: 12, border: notice.read ? undefined : '1px solid #B8593B' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
          <b>{notice.title || (isRu ? 'Сообщение администрации' : '관리자 메시지')}</b>
          {!notice.read && <span className="badge line">{isRu ? 'Новое' : '새 알림'}</span>}
        </div>
        <p style={{ whiteSpace: 'pre-wrap', margin: '10px 0' }}>{notice.message}</p>
        <p className="muted" style={{ fontSize: 12 }}>{notice.createdAt?.toDate ? notice.createdAt.toDate().toLocaleString(isRu ? 'ru-RU' : 'ko-KR') : ''}</p>
        {!notice.read && <button type="button" className="btn ghost" onClick={async () => {
          try { await F.updateDoc(F.doc(F.db, 'userNotifications', notice.id), { read: true }) }
          catch (error) { console.error('Notification read update error:', error); toast(isRu ? 'Не удалось отметить сообщение прочитанным.' : '알림을 읽음으로 표시하지 못했습니다.') }
        }}>{isRu ? 'Отметить прочитанным' : '읽음으로 표시'}</button>}
      </article>) : <p className="muted">{isRu ? 'Сообщений от администрации пока нет.' : '관리자 메시지가 없습니다.'}</p>}
    </>,
    master: <section className="box" style={{ maxWidth: 620 }}>
      <h2>{isRu ? 'Стать мастером «Тепло Рук»' : '손길의 온기 작가 신청'}</h2>
      {masterApplication?.status === 'approved' ? (
        <div>
          <p className="muted">{isRu ? 'Добавляйте свои работы. После проверки администратором одобренные работы появятся в разделе «Работы мастеров».' : '작품을 등록해 주세요. 관리자 승인 후 작가 작품 페이지에 공개됩니다.'}</p>
          <form className="form" onSubmit={saveMakerWork} style={{ maxWidth: 620 }}>
            <h3>{editingWorkId ? (isRu ? 'Редактировать работу' : '작품 수정') : (isRu ? 'Добавить новую работу' : '새 작품 등록')}</h3>
            <label>{isRu ? 'Название (корейский)' : '작품명 (한국어)'}<input className="field" value={workForm.title} onChange={(e) => setWorkForm({ ...workForm, title: e.target.value })} required /></label>
            <label>{isRu ? 'Название (русский)' : '작품명 (러시아어)'}<input className="field" value={workForm.titleRu} onChange={(e) => setWorkForm({ ...workForm, titleRu: e.target.value })} required /></label>
            <label>{isRu ? 'Описание (корейский)' : '설명 (한국어)'}<textarea className="field" rows={3} value={workForm.description} onChange={(e) => setWorkForm({ ...workForm, description: e.target.value })} /></label>
            <label>{isRu ? 'Описание (русский)' : '설명 (러시아어)'}<textarea className="field" rows={3} value={workForm.descriptionRu} onChange={(e) => setWorkForm({ ...workForm, descriptionRu: e.target.value })} /></label>
            <label>{isRu ? 'Категория' : '카테고리'}<select className="field" value={workForm.category} onChange={(e) => setWorkForm({ ...workForm, category: e.target.value })}><option value="accessory">{isRu ? 'Аксессуары' : '액세서리'}</option><option value="bag">{isRu ? 'Сумки и шитьё' : '가방·바느질'}</option><option value="home">{isRu ? 'Для дома' : '홈 인테리어'}</option><option value="clothes">{isRu ? 'Одежда' : '의류'}</option><option value="knit">{isRu ? 'Вязание' : '뜨개질'}</option><option value="embroidery">{isRu ? 'Вышивка' : '자수'}</option></select></label>
            <label>{isRu ? 'Контакты для связи с вами' : '연락 가능한 연락처'}<input className="field" value={workForm.contact} onChange={(e) => setWorkForm({ ...workForm, contact: e.target.value })} placeholder={isRu ? 'Телефон, KakaoTalk ID, Instagram или ссылка' : '전화번호, 카카오톡 ID, 인스타그램 또는 링크'} required /></label>
            <label>{isRu ? 'Фотографии работы (до 3)' : '작품 사진 (최대 3장)'}<FilePicker label={isRu ? 'Выбрать фотографии' : '사진 선택'} className="field" type="file" multiple accept="image/*" onChange={async (e) => {
              const files = Array.from(e.target.files || [])
              if (!files.length) return
              if (workForm.images.length + files.length > 3) {
                toast(isRu ? 'Можно добавить не более 3 фотографий.' : '사진은 최대 3장까지 등록할 수 있습니다.')
                e.target.value = ''
                return
              }
              try {
                const urls = []
                for (const file of files) urls.push(await uploadMakerImage(file))
                setWorkForm((prev) => ({ ...prev, images: [...prev.images, ...urls].slice(0, 3) }))
              } catch (error) {
                console.error(error)
                toast(isRu ? 'Не удалось загрузить фото.' : '사진 업로드에 실패했습니다.')
              }
              e.target.value = ''
            }} /></label>
            <p className="muted">{isRu ? 'Добавлено фотографий: ' + workForm.images.length + ' из 3' : '등록된 사진: ' + workForm.images.length + '/3'}</p>
            {workForm.images.length > 0 && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{workForm.images.map((url, index) => <div key={url} style={{ position: 'relative' }}><img src={url} alt={isRu ? 'Фото работы ' + (index + 1) : '작품 사진 ' + (index + 1)} style={{ width: 120, height: 100, objectFit: 'cover', borderRadius: 8 }} /><button type="button" className="btn ghost" onClick={() => setWorkForm((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }))}>{isRu ? 'Удалить' : '삭제'}</button></div>)}</div>}
            <label style={{ display: 'flex', gap: 9, alignItems: 'flex-start', lineHeight: 1.6, margin: '12px 0' }}><input type="checkbox" required style={{ width: 20, height: 20, flexShrink: 0, marginTop: 3, accentColor: 'var(--pt)' }} /><span>{isRu ? <>Я ознакомился(ась) с <Link className="more" to="/maker-terms" target="_blank" rel="noreferrer">правилами размещения товаров</Link> и подтверждаю, что работа создана мной лично или у меня есть необходимые права на её публикацию.</> : <><Link className="more" to="/maker-terms" target="_blank" rel="noreferrer">상품 등록 운영정책</Link>을 확인하고 동의하며, 직접 제작했거나 게시에 필요한 권리를 보유한 작품임을 확인합니다.</>}</span></label>
            <div className="acts"><button className="btn" disabled={workSaving}>{workSaving ? (isRu ? 'Сохранение…' : '저장 중…') : (isRu ? 'Отправить на проверку' : '검토 요청')}</button>{editingWorkId && <button type="button" className="btn ghost" onClick={() => { setEditingWorkId(null); setWorkForm({ title: '', titleRu: '', description: '', descriptionRu: '', price: '', category: 'accessory', image: '' }) }}>{isRu ? 'Отмена' : '취소'}</button>}</div>
          </form>
          <h3 style={{ marginTop: 28 }}>{isRu ? 'Мои работы и их статус' : '내 작품 및 검토 상태'}</h3>
          {myArtistWorks.length ? <div className="grid g3">{myArtistWorks.map((work) => <div className="box" key={work.id}><img src={work.image} alt={work.title} style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', borderRadius: 8 }} /><b>{isRu ? work.titleRu : work.title}</b><p className="muted">{work.contact}</p><p className="muted">{isRu ? ({ pending: 'На проверке', approved: 'Опубликовано', rejected: 'Нужно исправить' }[work.status] || work.status) : ({ pending: '검토 중', approved: '공개 중', rejected: '수정 필요' }[work.status] || work.status)}</p><div className="acts"><button className="btn ghost" onClick={() => editMakerWork(work)}>{isRu ? 'Изменить' : '수정'}</button><button className="btn ghost" onClick={() => deleteMakerWork(work)}>{isRu ? 'Удалить' : '삭제'}</button></div></div>)}</div> : <p className="muted">{isRu ? 'Вы ещё не добавили работы.' : '아직 등록한 작품이 없습니다.'}</p>}
        </div>
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
    orders: orders.length ? orders.map((o, k) => {
      const canRequestCancel = !['shipped', 'delivered'].includes(o.fulfillmentStatus) && !['pending', 'approved'].includes(o.cancellationRequest?.status) && o.orderStatus !== 'cancelled'
      return <div className="box" key={o.id || k}>
        <p><b>{o.no}</b> <span className="muted">{o.date}</span></p>
        {o.orderStatus !== 'cancelled' && <div className="steps" aria-label="배송 상태">{STEPS.map((s, i) => <span key={s} className={i === stepOf(o) ? 'on' : ''}>{s}</span>)}</div>}
        {o.orderStatus === 'cancelled' && <p className="badge line">{isRu ? 'Заказ отменён' : '주문 취소 완료'}</p>}
        {o.cancellationRequest?.status === 'pending' && <p className="muted">{isRu ? 'Запрос на отмену отправлен администратору. Ожидается решение.' : '취소 요청이 관리자에게 전달되어 검토 중입니다.'}</p>}
        {o.cancellationRequest?.status === 'rejected' && <p className="muted">{isRu ? 'Администратор отклонил запрос на отмену.' : '관리자가 주문 취소 요청을 거절했습니다.'}</p>}
        {o.items.map((i, n) => <p key={n}>{isRu ? (i.nameRu || ({ kokoshnik: 'Кокошник', nomer1: 'Изделие № 1', '일번': 'Изделие № 1' }[i.name] || i.name)) : i.name} ({i.opt}) × {i.qty}</p>)}
        <p style={{ marginTop: 6 }}><b>{won(o.total)}</b> <span className="muted">· {o.pay} · {o.addr}</span></p>
        {canRequestCancel && <Link className="btn ghost" style={{ display: 'inline-block', marginTop: 10 }} to={`/cancel-order/${o.id}`}>{isRu ? 'Отменить заказ' : '주문 취소'}</Link>}
        {o.fulfillmentStatus === 'shipped' && <p className="muted" style={{ marginTop: 8 }}>{isRu ? 'После отправки заказ нельзя отменить через личный кабинет.' : '배송이 시작된 주문은 마이페이지에서 취소할 수 없습니다.'}</p>}
      </div>
    }) : <p className="empty">주문 내역이 없어요.<br /><Link className="more" to="/category?c=all">쇼핑하러 가기</Link></p>,
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
      {(user.coupons || []).map((c, i) => <div className="box" key={i}><b>{isRu ? (c.name === '신규 가입 쿠폰' ? 'Приветственный купон' : c.name) : c.name}</b><p className="muted">{isRu ? 'Скидка 3 000 ₩ при покупке от 30 000 ₩' : c.desc}</p></div>)}{!(user.coupons || []).length && <p className="muted">{isRu ? 'У вас пока нет купонов.' : '보유한 쿠폰이 없어요.'}</p>}
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


export function CancelOrderPage() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const { lang } = useLanguage()
  const isRu = lang === 'ru'
  const { user, orders, requestOrderCancellation, toast, isFirebase } = useApp()
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const order = orders.find((item) => item.id === orderId)
  const canCancel = !!order && !['shipped', 'delivered'].includes(order.fulfillmentStatus) && !['pending', 'approved'].includes(order.cancellationRequest?.status) && order.orderStatus !== 'cancelled'

  const submit = async (event) => {
    event.preventDefault()
    if (!reason.trim()) {
      toast(isRu ? 'Пожалуйста, подробно укажите причину отмены.' : '취소 사유를 자세히 입력해 주세요.')
      return
    }
    if (!isFirebase) {
      toast(isRu ? 'Для отправки запроса необходимо подключение Firebase.' : '취소 요청을 보내려면 Firebase 연결이 필요합니다.')
      return
    }
    setSaving(true)
    try {
      await requestOrderCancellation(orderId, reason.trim())
      toast(isRu ? 'Запрос отправлен администратору.' : '취소 요청이 관리자에게 전송되었습니다.')
      navigate('/mypage?tab=orders')
    } catch (error) {
      console.error('Order cancellation request error:', error)
      toast(isRu ? `Не удалось отправить запрос: ${error?.code || error?.message || 'неизвестная ошибка'}` : `요청 전송 실패: ${error?.code || error?.message || '알 수 없는 오류'}`)
    } finally {
      setSaving(false)
    }
  }

  if (!user) return <div className="wrap sec"><p>{isRu ? 'Войдите, чтобы отправить запрос.' : '로그인 후 취소 요청을 보내 주세요.'} <Link className="more" to="/mypage?tab=login">{isRu ? 'Войти' : '로그인'}</Link></p></div>
  if (!order) return <div className="wrap sec"><h1>{isRu ? 'Заказ не найден' : '주문을 찾을 수 없습니다'}</h1><Link className="more" to="/mypage?tab=orders">{isRu ? 'Вернуться к заказам' : '주문 내역으로 돌아가기'}</Link></div>

  return <div className="wrap sec">
    <div className="box" style={{ maxWidth: 680, margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.6rem' }}>{isRu ? 'Причина отмены заказа' : '주문 취소 사유'}</h1>
      <p className="muted">{isRu ? `Заказ № ${order.no || order.id}` : `주문번호 ${order.no || order.id}`}</p>
      {!canCancel ? <><p>{order.cancellationRequest?.status === 'pending' ? (isRu ? 'Запрос уже отправлен и ожидает решения администратора.' : '취소 요청이 이미 접수되어 관리자 검토 중입니다.') : (isRu ? 'Отмена через личный кабинет сейчас недоступна. Заказ можно отменить только до отправки.' : '현재 마이페이지에서 취소할 수 없습니다. 배송 시작 전까지만 취소 요청이 가능합니다.')}</p><Link className="btn ghost" to="/mypage?tab=orders">{isRu ? 'Вернуться к заказам' : '주문 내역으로 돌아가기'}</Link></> : <form className="form" onSubmit={submit}>
        <label>{isRu ? 'Опишите подробнее, почему вы хотите отменить заказ' : '주문을 취소하려는 이유를 자세히 작성해 주세요'}<textarea className="field" rows={7} value={reason} onChange={(event) => setReason(event.target.value)} placeholder={isRu ? 'Напишите причину отмены…' : '취소 사유를 입력해 주세요…'} required /></label>
        <p className="muted">{isRu ? 'После отправки администратор рассмотрит запрос. Заказ не будет отменён автоматически.' : '요청을 보내면 관리자가 검토합니다. 자동으로 주문이 취소되지는 않습니다.'}</p>
        <div className="acts"><button className="btn" disabled={saving || !reason.trim()}>{saving ? (isRu ? 'Отправка…' : '전송 중…') : (isRu ? 'Отправить администратору' : '관리자에게 보내기')}</button><Link className="btn ghost" to="/mypage?tab=orders">{isRu ? 'Назад' : '뒤로'}</Link></div>
      </form>}
    </div>
  </div>
}
