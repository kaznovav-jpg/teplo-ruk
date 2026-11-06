import { useState } from 'react'
import { useApp } from '../lib/store.jsx'
import { D } from '../lib/data.js'
import * as F from '../lib/firebase.js'

export default function Admin() {
  const { user, isAdmin, adminReservations, adminEvents, isFirebase } = useApp()
  const [eventForm, setEventForm] = useState({
  ymd: '',
  time: '',
  type: '수업',
  title: '',
  place: '',
  cap: 8,
  online: false
})

  if (!user || !isAdmin) {
    return (
      <main className="page">
        <h1>관리자 전용 페이지</h1>
        <p>관리자만 접근할 수 있습니다.</p>
      </main>
    )
  }

  const events = adminEvents.length ? adminEvents : D.extras.events || []
  return (
    <main className="page">
      <h1>관리자 페이지</h1>
      <h2>수업 신청 목록</h2>

      {!isFirebase && (
        <p>Firebase 연결이 필요합니다.</p>
      )}

      <p>전체 신청: {adminReservations.length}명</p>

      {adminReservations.length === 0 ? (
        <p>아직 신청자가 없습니다.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>수업</th>
                <th>이름</th>
                <th>이메일</th>
                <th>연락처</th>
                <th>신청일</th>
              </tr>
            </thead>
            <tbody>
              {adminReservations.map((r) => {
                const event = events.find((e) => e.id === r.eventId)

                return (
                  <tr key={r.id}>
                    <td>{event?.title || r.eventId}</td>
                    <td>{r.name || '-'}</td>
                    <td>{r.email || '-'}</td>
                    <td>{r.phone || '-'}</td>
                    <td>
                      {r.at ? new Date(r.at).toLocaleString() : '-'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}
