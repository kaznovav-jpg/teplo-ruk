import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import * as F from './firebase'
import { D } from './data.js'

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
  const [adminOrders, setAdminOrders] = useState([])
  const [posts, setPosts] = useState([])
 const [adminReservations, setAdminReservations] = useState([])
  const [masterApplications, setMasterApplications] = useState([])
  const [artistWorks, setArtistWorks] = useState([])
  const [adminEvents, setAdminEvents] = useState([])
 const [products, setProducts] = useState(D.products)
  const [articles, setArticles] = useState(D.articles)
  const [msg, setMsg] = useState('')
  const SR = useRef(S), UR = useRef(user), busy = useRef(false), tm = useRef(0)
  SR.current = S; UR.current = user

  const toast = useCallback((m) => { setMsg(m) }, [])

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
        let profileExists = false
        try { const snap = await F.getDoc(ref); profileExists = snap.exists(); d = profileExists ? snap.data() : null } catch (e) { console.error(e) }
        // Require Firebase email verification for every account before restoring a signed-in session.
        if (!fu.emailVerified) {
          setUser(null)
          setIsAdmin(false)
          setS({ ...EMPTY, ...rd('hm_guest', {}) })
          await F.signOut(F.auth).catch(console.error)
          return
        }
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
const profile = { uid: fu.uid, ...pickProfile(d) }
UR.current = profile
setUser(profile)
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
    const u = UR.current
    const authUser = F.isFirebase ? F.auth.currentUser : null
    if (!F.isFirebase || !u?.uid || !authUser || !authUser.emailVerified) {
      throw new Error('Для оформления заказа необходимо войти в подтверждённый аккаунт.')
    }
    const token = await authUser.getIdToken()
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action: 'create', order: o })
    })
    const result = await response.json()
    if (!response.ok) throw new Error(result.error || 'Не удалось оформить заказ')
    wr('hm_last', result.order)
  }
  
  // Admin: live order list for bank-transfer payment checks
  useEffect(() => {
    if (!user || !isAdmin || !F.isFirebase) { setAdminOrders([]); return }
    return F.onSnapshot(F.collection(F.db, 'orders'),
      (snap) => setAdminOrders(snap.docs.map((d) => ({ ...d.data(), id: d.id })).sort((x, y) => y.at - x.at)),
      (error) => console.error('Admin orders error:', error))
  }, [user, isAdmin])

  const confirmOrderPayment = async (orderId) => {
    if (!F.isFirebase) throw new Error('Firebase 연결이 필요합니다.')
    await F.setDoc(F.doc(F.db, 'orders', orderId), { paymentStatus: 'paid', paidAt: Date.now() }, { merge: true })
  }

  const updateOrderFulfillment = async (orderId, fulfillmentStatus) => {
    if (!F.isFirebase) throw new Error('Firebase 연결이 필요합니다.')
    if (!['preparing', 'shipped', 'delivered'].includes(fulfillmentStatus)) throw new Error('Invalid order status')
    await F.setDoc(F.doc(F.db, 'orders', orderId), {
      fulfillmentStatus,
      fulfillmentUpdatedAt: Date.now()
    }, { merge: true })
  }

  const requestOrderCancellation = async (orderId, reason) => {
    if (!F.isFirebase || !UR.current?.uid) throw new Error('Firebase 로그인 필요')
    if (!reason?.trim()) throw new Error('Cancellation reason required')
    await F.updateDoc(F.doc(F.db, 'orders', orderId), {
      cancellationRequest: { reason: reason.trim(), status: 'pending', submittedAt: Date.now(), requesterUid: UR.current.uid }
    })
  }

  const reviewOrderCancellation = async (orderId, decision) => {
    if (!F.isFirebase) throw new Error('Firebase 연결이 필요합니다.')
    if (!['approved', 'rejected'].includes(decision)) throw new Error('Invalid cancellation decision')
    const token = await F.auth.currentUser.getIdToken()
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action: 'reviewCancellation', orderId, decision })
    })
    const result = await response.json()
    if (!response.ok) throw new Error(result.error || 'Не удалось обработать отмену')
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
  // Заявки на статус мастера: список доступен только администратору
  useEffect(() => {
    if (!user || !isAdmin || !F.isFirebase) {
      setMasterApplications([])
      return
    }
    return F.onSnapshot(
      F.collection(F.db, 'masterApplications'),
      (s) => setMasterApplications(s.docs.map((d) => ({ ...d.data(), id: d.id }))),
      (e) => console.error('Master applications error:', e)
    )
  }, [user, isAdmin])

   // Работы мастеров: администратор видит все; остальные — опубликованные,
  // а вошедший мастер дополнительно видит собственные заявки на проверке.
  useEffect(() => {
    if (!F.isFirebase) {
      setArtistWorks([])
      return
    }

    const worksRef = F.collection(F.db, 'artistWorks')
    if (isAdmin) {
      return F.onSnapshot(
        worksRef,
        (s) => setArtistWorks(s.docs.map((d) => ({ ...d.data(), id: d.id }))),
        (e) => console.error('Artist works admin error:', e)
      )
    }

    let approvedWorks = []
    let ownWorks = []
    const publish = () => {
      const merged = new Map()
      approvedWorks.forEach((work) => merged.set(work.id, work))
      ownWorks.forEach((work) => merged.set(work.id, work))
      setArtistWorks(Array.from(merged.values()))
    }

    const unsubApproved = F.onSnapshot(
      F.query(worksRef, F.where('status', '==', 'approved')),
      (s) => {
        approvedWorks = s.docs.map((d) => ({ ...d.data(), id: d.id }))
        publish()
      },
      (e) => console.error('Approved artist works error:', e)
    )

    const unsubOwn = user
      ? F.onSnapshot(
          F.query(worksRef, F.where('artistUid', '==', user.uid)),
          (s) => {
            ownWorks = s.docs.map((d) => ({ ...d.data(), id: d.id }))
            publish()
          },
          (e) => console.error('Own artist works error:', e)
        )
      : () => {}

    return () => {
      unsubApproved()
      unsubOwn()
    }
  }, [user, isAdmin])

  // Расписание занятий из Firebase
  useEffect(() => {
    if (!F.isFirebase) return

    return F.onSnapshot(
      F.collection(F.db, 'events'),
      (s) => {
        setAdminEvents(
          s.docs.map((d) => ({ ...d.data(), id: d.id }))
        )
      },
      (e) => console.error('Admin events error:', e)
    )
  }, [])
  useEffect(() => {
  if (!F.isFirebase) return
  return F.onSnapshot(
    F.collection(F.db, 'products'),
    (s) => {
      if (!s.empty) {
        setProducts(s.docs.map((d) => ({ ...d.data(), id: d.id })))
      } else {
        setProducts(D.products)
      }
    },
    (e) => console.error('Products error:', e)
  )
}, [])
  useEffect(() => {
  if (!F.isFirebase) return
  return F.onSnapshot(
    F.collection(F.db, 'articles'),
    (s) => {
      if (!s.empty) {
        setArticles(s.docs.map((d) => ({ ...d.data(), id: d.id })))
      } else {
        setArticles(D.articles)
      }
    },
    (e) => console.error('Articles error:', e)
  )
}, [])
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
        await F.sendEmailVerification(c.user)
        // Do not create the Firestore profile or sign the user in until the email is verified.
        await F.signOut(F.auth)
      } finally { busy.current = false }
    } else {
      wr('hm_accts', [...rd('hm_accts', []).filter((x) => x.email !== email), prof]); wr('hm_user', prof)
      setUser(prof); setS({ ...EMPTY, ...rd(sk(prof), {}) })
    }
  }
  const login = async (email, pw) => {
    if (F.isFirebase) {
      const c = await F.signInWithEmailAndPassword(F.auth, email, pw)
      await F.reload(c.user)
      console.info('[Email verification diagnostic] Firebase emailVerified:', c.user.emailVerified)
      if (!c.user.emailVerified) {
        await F.signOut(F.auth)
        const error = new Error('Firebase reports emailVerified=false. Email verification is required.')
        error.code = 'auth/email-not-verified'
        error.emailVerified = c.user.emailVerified
        throw error
      }
      return
    }
    const u = rd('hm_accts', []).find((x) => x.email === email) || { name: email.split('@')[0], email, points: 0, coupons: [] }
    wr('hm_user', u); setUser(u); setS({ ...EMPTY, ...rd(sk(u), {}) })
  }
  const resendVerification = async (email, pw) => {
    if (!F.isFirebase) throw new Error('Firebase 연결이 필요합니다.')
    busy.current = true
    try {
      const c = await F.signInWithEmailAndPassword(F.auth, email, pw)
      await F.reload(c.user)
      if (c.user.emailVerified) throw new Error('이미 인증된 이메일입니다. 로그인해 주세요.')
      await F.sendEmailVerification(c.user)
      await F.signOut(F.auth)
    } finally { busy.current = false }
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
   user, isAdmin, S, orders, adminOrders, posts, adminReservations, adminEvents, masterApplications, artistWorks, products, articles, toast, isFirebase: F.isFirebase,
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

reserve: async (id) => {
  if (SR.current.reservations.some((x) => x.id === id)) return false

  const u = UR.current
  const event = adminEvents.find((e) => e.id === id)
  const eventTitle = event?.title || ''

  try {
    if (u && F.isFirebase) {
      const token = await F.auth.currentUser.getIdToken()

      const response = await fetch('/api/reserve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ eventId: id, action: 'reserve' })
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Ошибка записи')
    }

    upd((s) => ({
      ...s,
      reservations: [...s.reservations, {
        id,
        at: new Date().toISOString(),
        title: eventTitle
      }]
    }))

    return true
  } catch (e) {
    console.error('Reservation error:', e)
    toast(e.message || 'Не удалось записаться')
    return false
  }
},

cancelRes: async (id) => {
  const u = UR.current

  try {
    if (u && F.isFirebase) {
      const token = await F.auth.currentUser.getIdToken()

      const response = await fetch('/api/reserve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ eventId: id, action: 'cancel' })
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Ошибка отмены')
    }

    upd((s) => ({
      ...s,
      reservations: s.reservations.filter((x) => x.id !== id)
    }))

    return true
  } catch (e) {
    console.error('Reservation cancel error:', e)
    toast(e.message || 'Не удалось отменить запись')
    return false
  }
},

    saveOrder, confirmOrderPayment, updateOrderFulfillment, requestOrderCancellation, reviewOrderCancellation, addPost, uploadImages, signup, login, logout, resetPw, resendVerification, updateUser,
  }
  return <Ctx.Provider value={api}>{children}{msg && <div className="toast" role="status"><span>{msg}</span><button type="button" className="toast-close" aria-label="Закрыть уведомление" onClick={() => setMsg('')}>×</button></div>}</Ctx.Provider>
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
