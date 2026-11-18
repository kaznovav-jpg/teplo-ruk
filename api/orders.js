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
    if (!token) return fail(res, 401, 'Необходим вход в аккаунт')

    const decoded = await getAuth(app).verifyIdToken(token)
    if (decoded.email_verified !== true) return fail(res, 403, 'Подтвердите электронную почту')
    const { action } = req.body || {}

    if (action === 'create') {
      const input = req.body.order || {}
      if (!Array.isArray(input.items) || input.items.length === 0) {
        return fail(res, 400, 'В заказе нет товаров')
      }

      const quantities = new Map()
      for (const item of input.items) {
        const pid = String(item.pid || '')
        const qty = Number(item.qty)
        if (!pid || !Number.isInteger(qty) || qty < 1) return fail(res, 400, 'Некорректное количество товара')
        quantities.set(pid, (quantities.get(pid) || 0) + qty)
      }

      const orderRef = db.collection('orders').doc()
      const productRefs = Array.from(quantities.keys()).map((pid) => db.collection('products').doc(pid))
      let savedOrder = null

      await db.runTransaction(async (transaction) => {
        const snapshots = await Promise.all(productRefs.map((ref) => transaction.get(ref)))
        const productById = new Map()
        snapshots.forEach((snap, index) => {
          if (!snap.exists) throw new Error('PRODUCT_NOT_FOUND')
          const data = snap.data()
          const stock = Number(data.stock || 0)
          const requested = quantities.get(snap.id)
          if (!Number.isInteger(stock) || stock < requested) throw new Error(stock <= 0 ? 'SOLD_OUT' : 'INSUFFICIENT_STOCK')
          productById.set(snap.id, { ref: productRefs[index], data, stock })
        })

        const orderItems = input.items.map((item) => {
          const product = productById.get(String(item.pid))
          return {
            pid: String(item.pid),
            name: product.data.name || '',
            nameRu: product.data.nameRu || product.data.name || '',
            opt: [item.color || '', item.size || ''].filter(Boolean).join('/'),
            color: item.color || '',
            size: item.size || '',
            qty: Number(item.qty),
            price: Number(product.data.price || 0)
          }
        })
        const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.qty, 0)
        const shipping = subtotal > 0 && subtotal < 50000 ? 4000 : 0
        const allowedFields = ['name', 'tel', 'email', 'zip', 'addr', 'addr2', 'memo', 'pay']
        const customer = Object.fromEntries(allowedFields.filter((key) => typeof input[key] === 'string').map((key) => [key, input[key]]))
        savedOrder = {
          uid: decoded.uid,
          at: Date.now(),
          no: 'HM' + Date.now().toString().slice(-8),
          date: new Date().toLocaleDateString('ko-KR'),
          paymentStatus: 'awaiting_payment',
          items: orderItems,
          subtotal,
          shipping,
          total: subtotal + shipping,
          bankDetails: input.pay === '무통장입금' ? (input.bankDetails || null) : null,
          ...customer
        }

        for (const [pid, product] of productById) {
          const nextStock = product.stock - quantities.get(pid)
          transaction.update(product.ref, { stock: nextStock, soldOut: nextStock <= 0 })
        }
        transaction.create(orderRef, savedOrder)
      })

      return res.status(200).json({ success: true, order: { ...savedOrder, id: orderRef.id } })
    }

    if (action === 'reviewCancellation') {
      const { orderId, decision } = req.body || {}
      if (!orderId || !['approved', 'rejected'].includes(decision)) {
        return fail(res, 400, 'Некорректный запрос')
      }
      const adminSnap = await db.collection('admins').doc(decoded.uid).get()
      if (!adminSnap.exists) return fail(res, 403, 'Только администратор может обработать отмену')

      const orderRef = db.collection('orders').doc(orderId)
      await db.runTransaction(async (transaction) => {
        const orderSnap = await transaction.get(orderRef)
        if (!orderSnap.exists) throw new Error('ORDER_NOT_FOUND')
        const order = orderSnap.data()
        if (order.cancellationRequest?.status !== 'pending') throw new Error('CANCELLATION_NOT_PENDING')
        if (decision === 'approved' && ['shipped', 'delivered'].includes(order.fulfillmentStatus)) throw new Error('ALREADY_SHIPPED')

        const productTotals = new Map()
        for (const item of (order.items || [])) {
          if (item.pid && Number.isInteger(Number(item.qty)) && Number(item.qty) > 0) {
            productTotals.set(item.pid, (productTotals.get(item.pid) || 0) + Number(item.qty))
          }
        }
        const productRefs = Array.from(productTotals.keys()).map((pid) => db.collection('products').doc(pid))
        const productSnaps = await Promise.all(productRefs.map((ref) => transaction.get(ref)))

        if (decision === 'approved') {
          productSnaps.forEach((snap, index) => {
            if (snap.exists) {
              const nextStock = Number(snap.data().stock || 0) + productTotals.get(snap.id)
              transaction.update(productRefs[index], { stock: nextStock, soldOut: false })
            }
          })
          transaction.update(orderRef, {
            'cancellationRequest.status': 'approved',
            orderStatus: 'cancelled',
            cancellationReviewedAt: Date.now()
          })
        } else {
          transaction.update(orderRef, {
            'cancellationRequest.status': 'rejected',
            cancellationReviewedAt: Date.now()
          })
        }
      })
      return res.status(200).json({ success: true })
    }

    return fail(res, 400, 'Неизвестное действие')
  } catch (error) {
    console.error('Order API error:', error)
    const messages = {
      PRODUCT_NOT_FOUND: 'Один из товаров больше не доступен',
      SOLD_OUT: 'Товар закончился. Обновите корзину.',
      INSUFFICIENT_STOCK: 'На складе осталось меньше товара, чем вы заказали. Измените количество.',
      ORDER_NOT_FOUND: 'Заказ не найден',
      CANCELLATION_NOT_PENDING: 'Запрос на отмену уже обработан',
      ALREADY_SHIPPED: 'Нельзя вернуть товар на склад после отправки заказа'
    }
    const message = messages[error.message]
    return fail(res, message ? 409 : 500, message || 'Не удалось обработать заказ')
  }
}
