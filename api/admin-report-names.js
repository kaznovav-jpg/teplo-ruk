import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
const app = getApps().length ? getApps()[0] : initializeApp({ credential: cert(serviceAccount) })
const auth = getAuth(app)
const db = getFirestore(app)

const fail = (res, status, error) => res.status(status).json({ error })

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return fail(res, 405, 'Method not allowed')
    const authorization = req.headers.authorization || ''
    const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : ''
    if (!token) return fail(res, 401, 'Необходим вход администратора')
    const decoded = await auth.verifyIdToken(token)
    const adminSnap = await db.collection('admins').doc(decoded.uid).get()
    if (!adminSnap.exists) return fail(res, 403, 'Доступ только для администратора')

    const conversationIds = req.body?.conversationIds
    if (!Array.isArray(conversationIds) || conversationIds.length > 100 ||
      conversationIds.some((id) => typeof id !== 'string' || !id || id.length > 300)) {
      return fail(res, 400, 'Некорректный список переписок')
    }

    const snapshots = await Promise.all(conversationIds.map((id) => db.collection('conversations').doc(id).get()))
    const names = {}
    snapshots.forEach((snap, index) => {
      if (snap.exists) {
        const data = snap.data() || {}
        names[conversationIds[index]] = data.names && typeof data.names === 'object' ? data.names : {}
      }
    })
    return res.status(200).json({ names })
  } catch (error) {
    console.error('Admin report names API error:', error)
    return fail(res, 500, 'Не удалось загрузить имена участников')
  }
}
