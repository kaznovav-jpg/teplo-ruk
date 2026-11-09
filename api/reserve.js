
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)

const app = getApps().length
  ? getApps()[0]
  : initializeApp({ credential: cert(serviceAccount) })

const db = getFirestore(app)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const authorization = req.headers.authorization || ''
    const token = authorization.startsWith('Bearer ')
      ? authorization.slice(7)
      : ''

    if (!token) {
      return res.status(401).json({ error: 'Необходим вход в аккаунт' })
    }

    const decoded = await getAuth(app).verifyIdToken(token)
    const uid = decoded.uid
    const { eventId, action } = req.body || {}

    if (!eventId || !['reserve', 'cancel'].includes(action)) {
      return res.status(400).json({ error: 'Неверные данные' })
    }

    const reservationId = `${uid}_${encodeURIComponent(eventId)}`
    const reservationRef = db.collection('reservations').doc(reservationId)

    if (action === 'cancel') {
      await db.runTransaction(async (transaction) => {
        const reservation = await transaction.get(reservationRef)

        if (reservation.exists && reservation.data().uid === uid) {
          transaction.delete(reservationRef)
        }
      })

      return res.status(200).json({ success: true, action: 'cancel' })
    }

    const eventRef = db.collection('events').doc(eventId)

    await db.runTransaction(async (transaction) => {
      const event = await transaction.get(eventRef)
      const existing = await transaction.get(reservationRef)

      if (!event.exists) {
        throw new Error('EVENT_NOT_FOUND')
      }

      if (existing.exists) {
        throw new Error('ALREADY_RESERVED')
      }

      const reservationsQuery = db.collection('reservations')
        .where('eventId', '==', eventId)

      const reservations = await transaction.get(reservationsQuery)
      const cap = Number(event.data().cap || 0)

      if (cap <= 0 || reservations.size >= cap) {
        throw new Error('EVENT_FULL')
      }

      transaction.create(reservationRef, {
        uid,
        eventId,
        eventTitle: event.data().title || '',
        name: decoded.name || '',
        email: decoded.email || '',
        phone: '',
        at: new Date().toISOString()
      })
    })

    return res.status(200).json({ success: true, action: 'reserve' })

  } catch (error) {
    console.error('Reservation API error:', error)

    const messages = {
      EVENT_NOT_FOUND: 'Событие не найдено',
      ALREADY_RESERVED: 'Вы уже записаны',
      EVENT_FULL: 'Свободных мест больше нет'
    }

    const message = messages[error.message]

    return res.status(message ? 409 : 500).json({
      error: message || 'Ошибка сервера'
    })
  }
}
