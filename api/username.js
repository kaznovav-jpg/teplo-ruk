import { createHash } from 'node:crypto'
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
const app = getApps().length ? getApps()[0] : initializeApp({ credential: cert(serviceAccount) })
const auth = getAuth(app)
const db = getFirestore(app)

const fail = (res, status, error) => res.status(status).json({ error })
const normalize = (value) => String(value || '').normalize('NFKC').trim().replace(/\\s+/g, ' ').toLocaleLowerCase()
const keyFor = (value) => createHash('sha256').update(normalize(value)).digest('hex')

export default async function handler(req, res) {
  if (req.method !== 'POST') return fail(res, 405, 'Method not allowed')
  try {
    const authorization = req.headers.authorization || ''
    const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : ''
    if (!token) return fail(res, 401, 'Необходима авторизация')
    const decoded = await auth.verifyIdToken(token)
    const name = String(req.body?.name || '').normalize('NFKC').trim().replace(/\\s+/g, ' ')
    const normalized = normalize(name)
    if (!name || name.length > 40) return fail(res, 400, 'Имя должно содержать от 1 до 40 символов.')

    // Check existing accounts and profiles, including accounts created before unique names were introduced.
    const [authUsers, profiles, privateProfiles] = await Promise.all([
      auth.listUsers(1000),
      db.collection('publicProfiles').get(),
      db.collection('users').get()
    ])
    const duplicateAuth = authUsers.users.some((user) => user.uid !== decoded.uid && normalize(user.displayName) === normalized)
    const duplicatePublic = profiles.docs.some((doc) => doc.id !== decoded.uid && normalize(doc.data().name) === normalized)
    const duplicatePrivate = privateProfiles.docs.some((doc) => doc.id !== decoded.uid && normalize(doc.data().name) === normalized)
    if (duplicateAuth || duplicatePublic || duplicatePrivate) {
      return fail(res, 409, 'Это имя уже занято. Пожалуйста, выберите другое.')
    }

    const usernameRef = db.collection('usernames').doc(keyFor(name))
    await db.runTransaction(async (transaction) => {
      const existing = await transaction.get(usernameRef)
      if (existing.exists && existing.data().uid !== decoded.uid) {
        const error = new Error('USERNAME_TAKEN')
        error.code = 'USERNAME_TAKEN'
        throw error
      }
      transaction.set(usernameRef, {
        uid: decoded.uid,
        name,
        normalizedName: normalized,
        createdAt: FieldValue.serverTimestamp()
      })
    })
    return res.status(200).json({ success: true })
  } catch (error) {
    if (error.code === 'USERNAME_TAKEN') return fail(res, 409, 'Это имя уже занято. Пожалуйста, выберите другое.')
    console.error('Username registration error:', error)
    return fail(res, 500, 'Не удалось проверить имя. Попробуйте ещё раз.')
  }
}
