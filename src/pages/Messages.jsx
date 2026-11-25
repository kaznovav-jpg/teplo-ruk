import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import * as F from '../lib/firebase.js'
import { useApp } from '../lib/store.jsx'
import { useLanguage } from '../lib/language.jsx'
import useTitle from '../lib/useTitle.js'

export default function Messages() {
  const { user, authReady, toast } = useApp()
  const { lang } = useLanguage()
  const ru = lang === 'ru'
  const nav = useNavigate()
  const [sp, setSp] = useSearchParams()
  const [profiles, setProfiles] = useState([])
  const [conversations, setConversations] = useState([])
  const [messages, setMessages] = useState([])
  const [search, setSearch] = useState('')
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const selectedId = sp.get('c') || ''
  const selected = conversations.find((item) => item.id === selectedId)
  const otherUid = selected?.participants?.find((uid) => uid !== user?.uid)
  const otherName = selected?.names?.[otherUid] || profiles.find((p) => p.uid === otherUid)?.name || (ru ? 'Участник' : '회원')

  useTitle(ru ? 'Личные сообщения' : '쪽지')

  useEffect(() => {
    if (authReady && !user) nav('/mypage?tab=login')
  }, [authReady, user, nav])

  useEffect(() => {
    if (!user?.uid || !F.isFirebase) return
    return F.onSnapshot(F.collection(F.db, 'publicProfiles'), (snap) => {
      setProfiles(snap.docs.map((d) => ({ ...d.data(), uid: d.id })).filter((p) => p.uid !== user.uid).sort((a, b) => (a.name || '').localeCompare(b.name || '')))
    }, (error) => { console.error('Member directory error:', error); toast(ru ? 'Не удалось загрузить каталог участников.' : '회원 목록을 불러오지 못했습니다.') })
  }, [user?.uid, F.isFirebase, ru])

  useEffect(() => {
    if (!user?.uid || !F.isFirebase) return
    return F.onSnapshot(F.query(F.collection(F.db, 'conversations'), F.where('participants', 'array-contains', user.uid)), (snap) => {
      const list = snap.docs.map((d) => ({ ...d.data(), id: d.id })).sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))
      setConversations(list)
    }, (error) => { console.error('Conversation list error:', error); toast(ru ? 'Не удалось загрузить переписки.' : '대화 목록을 불러오지 못했습니다.') })
  }, [user?.uid, F.isFirebase, ru])

  useEffect(() => {
    if (!selectedId || !user?.uid || !F.isFirebase) { setMessages([]); return }
    return F.onSnapshot(F.query(F.collection(F.db, 'conversations', selectedId, 'messages'), F.orderBy('createdAt', 'asc')), (snap) => {
      setMessages(snap.docs.map((d) => ({ ...d.data(), id: d.id })))
    }, (error) => { console.error('Message load error:', error); toast(ru ? 'Не удалось загрузить сообщения.' : '메시지를 불러오지 못했습니다.') })
  }, [selectedId, user?.uid, F.isFirebase, ru])

  const visibleProfiles = useMemo(() => profiles.filter((p) => (p.name || '').toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())), [profiles, search])

  const startConversation = async (profile) => {
    if (!user?.uid || !profile?.uid || !F.isFirebase) return
    const participants = [user.uid, profile.uid].sort()
    const id = participants.map((uid) => encodeURIComponent(uid)).join('__')
    const names = { [user.uid]: user.name || '', [profile.uid]: profile.name || '' }
    try {
      await F.setDoc(F.doc(F.db, 'conversations', id), {
        participants, names, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        lastMessage: '', lastSenderUid: user.uid
      }, { merge: true })
      setSp({ c: id })
    } catch (error) {
      console.error('Start conversation error:', error)
      toast(ru ? 'Не удалось начать переписку. Попробуйте позже.' : '대화를 시작하지 못했습니다. 다시 시도해 주세요.')
    }
  }

  const sendMessage = async (event) => {
    event.preventDefault()
    const text = draft.trim()
    if (!text || !selected || busy) return
    setBusy(true)
    const now = new Date().toISOString()
    try {
      await F.addDoc(F.collection(F.db, 'conversations', selected.id, 'messages'), {
        senderUid: user.uid, senderName: user.name || '', text, createdAt: now
      })
      await F.updateDoc(F.doc(F.db, 'conversations', selected.id), {
        lastMessage: text.slice(0, 160), lastSenderUid: user.uid, updatedAt: now
      })
      setDraft('')
    } catch (error) {
      console.error('Send message error:', error)
      toast(ru ? 'Сообщение не отправлено. Проверьте подключение и попробуйте снова.' : '메시지를 보내지 못했습니다. 다시 시도해 주세요.')
    } finally { setBusy(false) }
  }

  if (!authReady || !user) return null
  if (!F.isFirebase) return <div className="wrap sec"><p>{ru ? 'Для личных сообщений необходимо подключение Firebase.' : '쪽지를 사용하려면 Firebase 연결이 필요합니다.'}</p></div>

  return <div className="wrap sec">
    <h1 style={{ fontSize: '1.8rem', marginBottom: 8 }}>{ru ? 'Личные сообщения' : '쪽지'}</h1>
    <p className="muted" style={{ marginBottom: 20 }}>{ru ? 'Находите участников и общайтесь лично. Контактные данные в каталоге не показываются.' : '회원 이름으로 검색하고 1:1로 대화하세요. 연락처 정보는 공개되지 않습니다.'}</p>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,300px),1fr))', gap: 20, alignItems: 'start' }}>
      <section style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 12, padding: 16 }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: 12 }}>{ru ? 'Участники' : '회원 찾기'}</h2>
        <input className="field" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={ru ? 'Поиск по имени' : '이름으로 검색'} aria-label={ru ? 'Поиск участников' : '회원 검색'} />
        <div style={{ marginTop: 10, maxHeight: 260, overflowY: 'auto' }}>
          {visibleProfiles.length ? visibleProfiles.map((profile) => <div key={profile.uid} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
            <span>{profile.name || (ru ? 'Участник' : '회원')}</span>
            <button className="btn ghost" onClick={() => startConversation(profile)}>{ru ? 'Написать' : '쪽지 보내기'}</button>
          </div>) : <p className="muted" style={{ padding: 12 }}>{ru ? 'Участники не найдены.' : '검색 결과가 없습니다.'}</p>}
        </div>
      </section>
      <section style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 12, padding: 16 }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: 12 }}>{ru ? 'Мои переписки' : '내 대화'}</h2>
        {conversations.length ? conversations.map((conversation) => {
          const uid = conversation.participants.find((id) => id !== user.uid)
          const name = conversation.names?.[uid] || profiles.find((p) => p.uid === uid)?.name || (ru ? 'Участник' : '회원')
          return <button key={conversation.id} onClick={() => setSp({ c: conversation.id })} style={{ display: 'block', width: '100%', textAlign: 'left', border: '0', borderBottom: '1px solid var(--line)', background: selectedId === conversation.id ? 'var(--sub)' : 'transparent', padding: 12, cursor: 'pointer', borderRadius: 8 }}>
            <strong>{name}</strong><div className="muted" style={{ overflowWrap: 'anywhere' }}>{conversation.lastMessage || (ru ? 'Переписка создана' : '대화가 시작되었습니다.')}</div>
          </button>
        }) : <p className="muted">{ru ? 'Переписок пока нет. Найдите участника слева и напишите ему.' : '대화가 없습니다. 회원을 검색해 쪽지를 보내세요.'}</p>}
      </section>
    </div>
    {selected && <section style={{ marginTop: 20, background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 12, padding: 16 }}>
      <h2 style={{ fontSize: '1.2rem', marginBottom: 12 }}>{otherName}</h2>
      <div aria-live="polite" style={{ minHeight: 180, maxHeight: 380, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, padding: 8, background: 'var(--bg)', borderRadius: 8 }}>
        {messages.length ? messages.map((message) => <div key={message.id} style={{ alignSelf: message.senderUid === user.uid ? 'flex-end' : 'flex-start', maxWidth: '85%', padding: '9px 12px', borderRadius: 10, background: message.senderUid === user.uid ? 'var(--sub)' : 'var(--card)', border: '1px solid var(--line)', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
          <div style={{ fontSize: '.78rem', color: 'var(--tx2)', marginBottom: 3 }}>{message.senderUid === user.uid ? (ru ? 'Вы' : '나') : (message.senderName || otherName)}</div>{message.text}
        </div>) : <p className="muted">{ru ? 'Пока нет сообщений. Напишите первым!' : '아직 메시지가 없습니다. 첫 쪽지를 보내세요!'}</p>}
      </div>
      <form onSubmit={sendMessage} style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'end' }}>
        <textarea className="field" value={draft} onChange={(e) => setDraft(e.target.value)} rows={2} maxLength={2000} placeholder={ru ? 'Напишите сообщение…' : '메시지를 입력하세요…'} style={{ flex: 1, resize: 'vertical', minWidth: 0 }} />
        <button className="btn" disabled={busy || !draft.trim()}>{busy ? (ru ? 'Отправка…' : '전송 중…') : (ru ? 'Отправить' : '보내기')}</button>
      </form>
    </section>}
  </div>
}
