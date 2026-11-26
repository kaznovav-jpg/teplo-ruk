import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
const app = getApps().length ? getApps()[0] : initializeApp({ credential: cert(serviceAccount) })
const db = getFirestore(app)
const fail = (res, status, error) => res.status(status).json({ error })

export default async function handler(req, res) {
  if (req.method !== 'POST') return fail(res, 405, 'Method not allowed')
  try {
    const authorization = req.headers.authorization || ''
    const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : ''
    if (!token) return fail(res, 401, 'Необходим вход в аккаунт администратора')
    const auth = getAuth(app)
    const decoded = await auth.verifyIdToken(token)
    const adminSnap = await db.collection('admins').doc(decoded.uid).get()
    if (!adminSnap.exists) return fail(res, 403, 'Только администратор может отвечать на заявки')

    const requestId = String(req.body?.requestId || '').trim()
    const message = String(req.body?.message || '').trim()
    if (!requestId || !message || message.length > 5000) return fail(res, 400, 'Проверьте заявку и текст ответа (до 5000 символов)')

    const requestRef = db.collection('customOrders').doc(requestId)
    const requestSnap = await requestRef.get()
    if (!requestSnap.exists) return fail(res, 404, 'Заявка не найдена')
    const request = requestSnap.data()
    const email = String(request.email || '').trim().toLowerCase()
    if (!email) return fail(res, 400, 'В заявке не указан email')

    let recipientUid = String(request.uid || '').trim()
    if (recipientUid) {
      const recipient = await auth.getUser(recipientUid)
      if (String(recipient.email || '').toLowerCase() !== email || !recipient.emailVerified) {
        return fail(res, 409, 'Email заявки не совпадает с подтверждённым адресом аккаунта покупателя')
      }
    } else {
      let recipient
      try { recipient = await auth.getUserByEmail(email) }
      catch (error) {
        if (error.code === 'auth/user-not-found') return fail(res, 409, 'Покупателю нужно зарегистрироваться и подтвердить этот email, чтобы увидеть ответ в личном кабинете')
        throw error
      }
      if (!recipient.emailVerified) return fail(res, 409, 'Покупателю нужно подтвердить email в аккаунте, чтобы увидеть ответ')
      recipientUid = recipient.uid
    }

    const now = new Date().toISOString()
    await requestRef.set({
      uid: recipientUid,
      status: request.status === 'new' ? 'contacted' : request.status,
      lastReplyAt: now,
      lastReplyMessage: message
    }, { merge: true })

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('Custom order reply save error:', error)
    return fail(res, 500, 'Не удалось сохранить ответ')
  }
}
