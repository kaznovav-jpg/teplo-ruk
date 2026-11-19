import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
const app = getApps().length ? getApps()[0] : initializeApp({ credential: cert(serviceAccount) })
const db = getFirestore(app)

const fail = (res, status, error) => res.status(status).json({ error })

const escapeHtml = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;')

export default async function handler(req, res) {
  if (req.method !== 'POST') return fail(res, 405, 'Method not allowed')
  if (!process.env.RESEND_API_KEY) return fail(res, 503, 'RESEND_API_KEY не настроен в Vercel')

  try {
    const authorization = req.headers.authorization || ''
    const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : ''
    if (!token) return fail(res, 401, 'Необходим вход в аккаунт администратора')

    const decoded = await getAuth(app).verifyIdToken(token)
    const adminSnap = await db.collection('admins').doc(decoded.uid).get()
    if (!adminSnap.exists) return fail(res, 403, 'Только администратор может отправлять письма')

    const requestId = String(req.body?.requestId || '').trim()
    const message = String(req.body?.message || '').trim()
    if (!requestId || !message || message.length > 5000) {
      return fail(res, 400, 'Проверьте заявку и текст ответа (до 5000 символов)')
    }

    const requestRef = db.collection('customOrders').doc(requestId)
    const requestSnap = await requestRef.get()
    if (!requestSnap.exists) return fail(res, 404, 'Заявка не найдена')

    const request = requestSnap.data()
    const recipient = String(request.email || '').trim()
    if (!recipient || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
      return fail(res, 400, 'В заявке указан некорректный email')
    }

    const safeName = escapeHtml(request.name || '')
    const safeMessage = escapeHtml(message).replace(/\r?\n/g, '<br>')
    const subject = 'Ответ на ваш индивидуальный заказ — Тепло Рук'
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || 'Тепло Рук <onboarding@resend.dev>',
        to: [recipient],
        subject,
        text: `Здравствуйте, ${request.name || ''}!\n\n${message}\n\nС уважением, Тепло Рук`,
        html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#2F2B28"><p>Здравствуйте, ${safeName}!</p><p>${safeMessage}</p><p>С уважением,<br>Тепло Рук</p></div>`
      })
    })
    const emailResult = await emailResponse.json().catch(() => ({}))
    if (!emailResponse.ok) {
      console.error('Resend custom order reply error:', emailResult)
      return fail(res, emailResponse.status === 429 ? 429 : 502, emailResult.message || 'Сервис почты не принял письмо')
    }

    await requestRef.set({
      status: request.status === 'new' ? 'contacted' : request.status,
      lastReplyAt: new Date().toISOString(),
      lastReplyMessage: message
    }, { merge: true })

    return res.status(200).json({ success: true, emailId: emailResult.id || null })
  } catch (error) {
    console.error('Custom order email API error:', error)
    return fail(res, 500, 'Не удалось отправить письмо')
  }
}
