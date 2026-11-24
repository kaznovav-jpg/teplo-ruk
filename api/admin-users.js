import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
const app = getApps().length ? getApps()[0] : initializeApp({ credential: cert(serviceAccount) })
const auth = getAuth(app)
const db = getFirestore(app)

const fail = (res, status, error) => res.status(status).json({ error })
const deleteByUid = async (collectionName, field, uid) => {
  const snap = await db.collection(collectionName).where(field, '==', uid).get()
  for (let i = 0; i < snap.docs.length; i += 400) {
    const batch = db.batch()
    snap.docs.slice(i, i + 400).forEach((doc) => batch.delete(doc.ref))
    await batch.commit()
  }
}

export default async function handler(req, res) {
  try {
    const authorization = req.headers.authorization || ''
    const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : ''
    if (!token) return fail(res, 401, 'Необходим вход администратора')
    const decoded = await auth.verifyIdToken(token)
    const adminSnap = await db.collection('admins').doc(decoded.uid).get()
    if (!adminSnap.exists) return fail(res, 403, 'Доступ только для администратора')

    if (req.method === 'GET') {
      const users = []
      let pageToken
      do {
        const page = await auth.listUsers(1000, pageToken)
        users.push(...page.users)
        pageToken = page.pageToken
      } while (pageToken)
      const adminAccounts = await db.collection('admins').get()
      const adminIds = new Set(adminAccounts.docs.map((doc) => doc.id))
      const memberUsers = users.filter((u) => !adminIds.has(u.uid))
      const profiles = await Promise.all(memberUsers.map((u) => db.collection('users').doc(u.uid).get()))
      const result = memberUsers.map((u, i) => {
        const profile = profiles[i].exists ? profiles[i].data() : {}
        return {
          uid: u.uid,
          email: u.email || '',
          name: profile.name || u.displayName || '',
          createdAt: u.metadata.creationTime || '',
          lastSignInAt: u.metadata.lastSignInTime || '',
          disabled: !!u.disabled,
          status: profile.status || (u.disabled ? 'blocked' : 'active'),
          phone: profile.phone || ''
        }
      }).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
      return res.status(200).json({ users: result })
    }

    if (req.method !== 'POST') return fail(res, 405, 'Method not allowed')
    const { action, uid } = req.body || {}
    if (!uid || typeof uid !== 'string' || uid === decoded.uid) return fail(res, 400, 'Некорректный аккаунт')
    const targetAdmin = await db.collection('admins').doc(uid).get()
    if (targetAdmin.exists) return fail(res, 403, 'Нельзя изменять другой аккаунт администратора')

    if (action === 'warn') {
      const message = String(req.body.message || '').trim()
      if (!message || message.length > 2000) return fail(res, 400, 'Введите сообщение до 2000 символов')
      const ref = await db.collection('userNotifications').add({
        uid,
        type: 'warning',
        title: 'Предупреждение администрации',
        message,
        createdAt: FieldValue.serverTimestamp(),
        read: false,
        adminUid: decoded.uid
      })
      return res.status(200).json({ success: true, notificationId: ref.id })
    }

    if (action === 'block' || action === 'unblock') {
      const blocked = action === 'block'
      await auth.updateUser(uid, { disabled: blocked })
      await db.collection('users').doc(uid).set({
        status: blocked ? 'blocked' : 'active',
        statusUpdatedAt: FieldValue.serverTimestamp(),
        statusUpdatedBy: decoded.uid
      }, { merge: true })
      return res.status(200).json({ success: true, status: blocked ? 'blocked' : 'active' })
    }

    if (action === 'delete') {
      await auth.deleteUser(uid)
      await db.collection('users').doc(uid).delete().catch(() => {})
      await deleteByUid('posts', 'uid', uid)
      await deleteByUid('comments', 'uid', uid)
      await deleteByUid('artistWorks', 'artistUid', uid)
      await db.collection('masterApplications').doc(uid).delete().catch(() => {})
      await db.collection('masterProfiles').doc(uid).delete().catch(() => {})
      await deleteByUid('reservations', 'uid', uid)
      await deleteByUid('userNotifications', 'uid', uid)
      return res.status(200).json({ success: true })
    }

    return fail(res, 400, 'Неизвестное действие')
  } catch (error) {
    console.error('Admin users API error:', error)
    return fail(res, 500, error.code === 'auth/user-not-found' ? 'Пользователь не найден' : 'Не удалось выполнить действие')
  }
}
