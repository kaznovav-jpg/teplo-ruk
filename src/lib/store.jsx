import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import * as F from './firebase'

/*
 * 앱 전역 상태. Firebase 설정이 있으면 Auth + Firestore + Storage를, 없으면 브라우저 저장(로컬 모드)을 씁니다.
 * 화면 코드는 이 파일의 useApp() 인터페이스만 사용하므로, 백엔드를 바꿀 때 여기만 수정하면 됩니다.
 */
export const Ctx = createContext(null)
export const useApp = () => useContext(Ctx)

const EMPTY = { cart: [], wish: [], follows: [], enrolled: [], progress: {}, notes: {}, reservations: [], likes: [] }
const pick = (o, keys) => Object.fromEntries(keys.filter((k) => o[k] !== undefined).map((k) => [k, o[k]]))
const pickState = (o) => pick(o, Object.keys(EMPTY))
const pickProfile = (o) => pick(o, ['name', 'email', 'phone', 'addr', 'points', 'coupons'])
const WELCOME = { name: '신규 가입 쿠폰', desc: '3,000원 할인 (3만 원 이상 구매 시)' }

const rd = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d } catch { return d } }
const wr = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* 저장 공간 부족 등 */ } }
const sk = (u) => (u ? 'hm_s_' + (u.uid || u.email) : 'hm_guest')
const bus = new EventTarget()
const ping = () => bus.dispatchEvent(new Event('x'))
const uidOf = (u) => u.uid || u.email

export function AppProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [S, setS] = useState(() => ({ ...EMPTY, ...rd('hm_guest', {}) }))
  const [orders, setOrders] = useState([])
  const [posts, setPosts] = useState([])
 const [adminReservations, setAdminReservations] = useState([])
  const [msg, setMsg] = useState('')
  const SR = useRef(S), UR = useRef(user), busy = useRef(false), tm = useRef(0)
  SR.current = S; UR.current = user

  const toast = useCallback((m) => { setMsg(m); clearTimeout(tm.current); tm.current = setTimeout(() => setMsg(''), 1800) }, [])

  // 로그인 상태 복원
  useEffect(() => {
    if (F.isFirebase) {
      return F.onAuthStateChanged(F.auth, async (fu) => {
        if (busy.current) return
        if (!fu) {
  setUser(null)
  setIsAdmin(false)
  setS({ ...EMPTY, ...rd('hm_guest', {}) })
  return
}
        const ref = F.doc(F.db, 'users', fu.uid)
        let d = null
        try { const snap = await F.getDoc(ref); d = snap.exists() ? snap.data() : null } catch (e) { console.error(e) }
        if (!d) {
          d = { name: fu.displayName || (fu.email || '').split('@')[0], email: fu.email, points: 1000, coupons: [WELCOME], ...EMPTY, ...rd('hm_guest', {}) }
          try { await F.setDoc(ref, d) } catch (e) { console.error(e) }
        }
      let admin = false
try {
  const adminDoc = await F.getDoc(F.doc(F.db, 'admins', fu.uid))
  admin = adminDoc.exists()
} catch (e) {
  console.error('Admin check error:', e)
}

setIsAdmin(admin)
setUser({ uid: fu.uid, ...pickProfile(d) })
setS({ ...EMPTY, ...pickState(d) })
      })
    }
    const u = rd('hm_user', null)
    setUser(u); setS({ ...EMPTY, ...rd(sk(u), {}) })
  }, [])

  const save = useCallback((next) => {
    SR.current = next; setS(next)
    const u = UR.current
    if (u && F.isFirebase) F.setDoc(F.doc(F.db, 'users', u.uid), pickState(next), { merge: true }).catch(console.error)
    else wr(sk(u), next)
  }, [])
  const upd = (fn) => save(fn(SR.current))
  const toggle = (key, id) => { const on = !SR.current[key].includes(id); upd((s) => ({ ...s, [key]: on ? [...s[key], id] : s[key].filter((x) => x !== id) })); return on }

  // 주문
  useEffect(() => {
    if (!user) { setOrders([]); return }
    if (F.isFirebase) {
      return F.onSnapshot(F.query(F.collection(F.db, 'orders'), F.where('uid', '==', user.uid)),
        (s) => setOrders(s.docs.map((d) => ({ ...d.data(), id: d.id })).sort((a, b) => b.at - a.at)), console.error)
    }
    setOrders(rd('hm_orders_' + sk(user), []))
  }, [user])
  const saveOrder = async (o) => {
    o = { ...o, at: Date.now() }
    const u = UR.current
    if (u && F.isFirebase) await F.addDoc(F.collection(F.db, 'orders'), { ...o, uid: u.uid })
    else { const k = 'hm_orders_' + sk(u), l = [o, ...rd(k, [])]; wr(k, l); if (u) setOrders(l) }
    wr('hm_last', o)
  }
  
  // 관리자: 전체 수업 신청 목록
  useEffect(() => {
    if (!user || !isAdmin || !F.isFirebase) {
      setAdminReservations([])
      return
    }

    return F.onSnapshot(
      F.collection(F.db, 'reservations'),
      (s) => {
        setAdminReservations(
          s.docs.map((d) => ({ ...d.data(), id: d.id }))
        )
      },
      (e) => console.error('Admin reservations error:', e)
    )
  }, [user, isAdmin])
  // 커뮤니티 글
  useEffect(() => {
    if (F.isFirebase) {
      return F.onSnapshot(F.query(F.collection(F.db, 'posts'), F.orderBy('at', 'desc'), F.limit(100)),
        (s) => setPosts(s.docs.map((d) => ({ ...d.data(), id: d.id }))), console.error)
    }
    const f = () => setPosts(rd('hm_posts', []))
    f(); bus.addEventListener('x', f)
    return () => bus.removeEventListener('x', f)
  }, [])
  const addPost = async (p) => {
    const u = UR.current, data = { ...p, uid: uidOf(u), author: u.name, likes: 0, comments: 0, at: new Date().toISOString() }
    if (F.isFirebase) return (await F.addDoc(F.collection(F.db, 'posts'), data)).id
    const id = 'u' + Date.now(); wr('hm_posts', [{ ...data, id }, ...rd('hm_posts', [])]); ping(); return id
  }
  const uploadImages = async (urls) => {
    const u = UR.current
    if (!F.isFirebase || !u) return urls
    return Promise.all(urls.map(async (d, i) => {
      const r = F.ref(F.storage, `posts/${u.uid}/${Date.now()}_${i}.jpg`)
      await F.uploadString(r, d, 'data_url'); return F.getDownloadURL(r)
    }))
  }

  // 인증
  const signup = async (name, email, pw) => {
    const prof = { name, email, points: 1000, coupons: [WELCOME] }
    if (F.isFirebase) {
      busy.current = true
      try {
        const c = await F.createUserWithEmailAndPassword(F.auth, email, pw)
        await F.updateProfile(c.user, { displayName: name })
        await F.setDoc(F.doc(F.db, 'users', c.user.uid), { ...prof, ...EMPTY, ...rd('hm_guest', {}) })
        setUser({ uid: c.user.uid, ...prof }); setS({ ...EMPTY, ...rd('hm_guest', {}) })
      } finally { busy.current = false }
    } else {
      wr('hm_accts', [...rd('hm_accts', []).filter((x) => x.email !== email), prof]); wr('hm_user', prof)
      setUser(prof); setS({ ...EMPTY, ...rd(sk(prof), {}) })
    }
  }
  const login = async (email, pw) => {
    if (F.isFirebase) { await F.signInWithEmailAndPassword(F.auth, email, pw); return }
    const u = rd('hm_accts', []).find((x) => x.email === email) || { name: email.split('@')[0], email, points: 0, coupons: [] }
    wr('hm_user', u); setUser(u); setS({ ...EMPTY, ...rd(sk(u), {}) })
  }
  const loginGoogle = async () => {
    if (!F.isFirebase) { toast('Google 로그인은 Firebase 연결 후 사용할 수 있어요'); return }
    await F.signInWithPopup(F.auth, new F.GoogleAuthProvider())
  }
  const logout = async () => {
    if (F.isFirebase) await F.signOut(F.auth)
    else { wr('hm_user', null); setUser(null); setS({ ...EMPTY, ...rd('hm_guest', {}) }) }
  }
  const resetPw = async (email) => { if (F.isFirebase) await F.sendPasswordResetEmail(F.auth, email) }
  const updateUser = async (patch) => {
    const u = { ...UR.current, ...patch }; UR.current = u; setUser(u)
    if (F.isFirebase) await F.setDoc(F.doc(F.db, 'users', u.uid), patch, { merge: true })
    else { wr('hm_user', u); wr('hm_accts', [...rd('hm_accts', []).filter((x) => x.email !== u.email), u]) }
  }

  const api = {
   user, isAdmin, S, orders, posts, adminReservations, toast, isFirebase: F.isFirebase,
    cartCount: S.cart.reduce((a, b) => a + b.qty, 0),
    addCart: (it) => upd((s) => {
      const c = [...s.cart], f = c.find((x) => x.pid === it.pid && x.color === it.color && x.size === it.size)
      f ? (f.qty += it.qty) : c.push(it); return { ...s, cart: c }
    }),
    setQty: (i, q) => upd((s) => ({ ...s, cart: s.cart.map((x, k) => (k === i ? { ...x, qty: Math.max(1, q) } : x)) })),
    removeCart: (i) => upd((s) => ({ ...s, cart: s.cart.filter((_, k) => k !== i) })),
    clearCart: () => upd((s) => ({ ...s, cart: [] })),
    toggleWish: (id) => toggle('wish', id), toggleFollow: (id) => toggle('follows', id), toggleLike: (id) => toggle('likes', id),
    enroll: (id) => { if (!SR.current.enrolled.some((x) => x.id === id)) upd((s) => ({ ...s, enrolled: [...s.enrolled, { id, at: new Date().toISOString() }] })) },
    toggleDone: (cid, i) => upd((s) => { const a = s.progress[cid] || []; return { ...s, progress: { ...s.progress, [cid]: a.includes(i) ? a.filter((x) => x !== i) : [...a, i] } } }),
    setNote: (cid, t) => upd((s) => ({ ...s, notes: { ...s.notes, [cid]: t } })),
    reserve: (id) => {
  if (SR.current.reservations.some((x) => x.id === id)) return

  const u = UR.current
  const at = new Date().toISOString()

  upd((s) => ({
    ...s,
    reservations: [...s.reservations, { id, at }]
  }))

 if (u && F.isFirebase) {
  const ref = F.doc(
    F.db,
    'reservations',
    `${u.uid}_${encodeURIComponent(id)}`
  )

  F.setDoc(ref, {
    uid: u.uid,
    eventId: id,
    name: u.name || '',
email: u.email || '',
phone: u.phone || '',
at
  })
    .catch((e) => {
      console.error('Reservation save error:', e)
      toast('신청 저장에 실패했어요. 다시 시도해 주세요')
    })
}
},
cancelRes: (id) => {
  const u = UR.current

  upd((s) => ({
    ...s,
    reservations: s.reservations.filter((x) => x.id !== id)
  }))

  if (u && F.isFirebase) {
    const ref = F.doc(
      F.db,
      'reservations',
      `${u.uid}_${encodeURIComponent(id)}`
    )

    F.getDoc(ref)
      .then((snap) => {
        if (snap.exists()) return F.deleteDoc(ref)
      })
      .catch((e) => {
        console.error('Reservation delete error:', e)
        toast('신청 취소에 실패했어요. 다시 시도해 주세요')
      })
  }
},
    cancelRes: (id) => upd((s) => ({ ...s, reservations: s.reservations.filter((x) => x.id !== id) })),
    saveOrder, addPost, uploadImages, signup, login, loginGoogle, logout, resetPw, updateUser,
  }
  return <Ctx.Provider value={api}>{children}{msg && <div className="toast" role="status">{msg}</div>}</Ctx.Provider>
}

// 댓글: Firestore(comments 컬렉션) 또는 로컬 저장
export function useComments(targetId) {
  const [l, setL] = useState([])
  useEffect(() => {
    if (F.isFirebase) {
      return F.onSnapshot(F.query(F.collection(F.db, 'comments'), F.where('targetId', '==', targetId)),
        (s) => setL(s.docs.map((d) => ({ ...d.data(), id: d.id })).sort((a, b) => (a.at < b.at ? -1 : 1))), console.error)
    }
    const f = () => setL(rd('hm_cmts', {})[targetId] || [])
    f(); bus.addEventListener('x', f)
    return () => bus.removeEventListener('x', f)
  }, [targetId])
  return l
}
export function useMyComments(user) {
  const [l, setL] = useState([])
  useEffect(() => {
    if (!user) { setL([]); return }
    if (F.isFirebase) return F.onSnapshot(F.query(F.collection(F.db, 'comments'), F.where('uid', '==', user.uid)), (s) => setL(s.docs.map((d) => ({ ...d.data(), id: d.id }))), console.error)
    setL(Object.values(rd('hm_cmts', {})).flat().filter((c) => c.uid === uidOf(user)))
  }, [user])
  return l
}
export async function addComment(user, targetId, text, parent) {
  const c = { targetId, uid: uidOf(user), author: user.name, text, parent: parent || null, at: new Date().toISOString() }
  if (F.isFirebase) await F.addDoc(F.collection(F.db, 'comments'), c)
  else { const m = rd('hm_cmts', {}); (m[targetId] = m[targetId] || []).push({ ...c, id: 'u' + Date.now() }); wr('hm_cmts', m); ping() }
}
export const lastOrder = () => rd('hm_last', null)
