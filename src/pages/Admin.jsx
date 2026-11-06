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
 const addEvent = async () => {
  if (!eventForm.ymd || !eventForm.time || !eventForm.title) {
    alert('날짜, 시간, 수업명을 입력해 주세요.')
    return
  }

  if (!isFirebase) {
    alert('Firebase 연결이 필요합니다.')
    return
  }

 const [year, month, day] = eventForm.ymd.split('-')

  try {
    await F.addDoc(F.collection(F.db, 'events'), {
      ...eventForm,
      date: `${month}/${day}`,
      cap: Number(eventForm.cap),
      joined: 0,
      cls: ''
    })

    setEventForm({
      ymd: '',
      time: '',
      type: '수업',
      title: '',
      place: '',
      cap: 8,
      online: false
    })

    alert('수업이 저장되었습니다.')
  } catch (error) {
    console.error('Event save error:', error)
    alert('저장에 실패했습니다.')
  }
} 

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
      <h2>수업 일정 관리</h2>

<div style={{ display: 'grid', gap: 10, maxWidth: 500, marginBottom: 30 }}>
  <label>
    날짜
    <input
      type="date"
      value={eventForm.ymd}
      onChange={(e) => setEventForm({ ...eventForm, ymd: e.target.value })}
    />
  </label>

  <label>
    시간
    <input
      type="text"
      placeholder="14:00-16:00"
      value={eventForm.time}
      onChange={(e) => setEventForm({ ...eventForm, time: e.target.value })}
    />
  </label>

  <label>
    수업명
    <input
      type="text"
      value={eventForm.title}
      onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
    />
  </label>

  <label>
    장소
    <input
      type="text"
      value={eventForm.place}
      onChange={(e) => setEventForm({ ...eventForm, place: e.target.value })}
    />
  </label>

  <label>
    모집 인원
    <input
      type="number"
      min="1"
      value={eventForm.cap}
      onChange={(e) => setEventForm({ ...eventForm, cap: e.target.value })}
    />
  </label>

  <button className="btn" onClick={addEvent}>
    일정 저장
  </button>
</div>
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
