import { useState } from 'react'
import { useApp, useComments, addComment } from '../lib/store.jsx'
import { useNavigate } from 'react-router-dom'
import { dFmt } from '../lib/util.js'

// 댓글 + 답글. sample은 샘플 데이터의 기본 댓글입니다.
export default function Comments({ id, sample = [] }) {
  const { user, toast } = useApp(), nav = useNavigate()
  const mine = useComments(id)
  const [text, setText] = useState(''), [parent, setParent] = useState(null)
  const all = [...sample, ...mine], top = all.filter((c) => !c.parent)
  const one = (c, sub) => (
    <li key={c.id} style={sub ? { marginLeft: 28 } : undefined}>
      <b>{c.author}</b> <span className="muted">{c.at ? dFmt(c.at) : c.date}</span>
      <p>{c.text}</p>
      {!sub && <button className="btn ghost" onClick={() => setParent(c.id)}>답글</button>}
    </li>
  )
  const submit = async (e) => {
    e.preventDefault()
    if (!user) { toast('로그인이 필요해요'); nav('/mypage?tab=login'); return }
    try { await addComment(user, id, text.trim(), parent); setText(''); setParent(null); toast('댓글을 등록했어요') } catch (err) { console.error(err); toast('댓글을 등록하지 못했어요') }
  }
  return (
    <section>
      <h2 style={{ fontSize: '1.2rem' }}>댓글 {all.length}</h2>
      <ul className="qa">
        {top.length ? top.flatMap((c) => [one(c), ...all.filter((r) => r.parent === c.id).map((r) => one(r, true))]) : <li className="muted">첫 댓글을 남겨 보세요.</li>}
      </ul>
      <form onSubmit={submit} style={{ display: 'grid', gap: 8, marginTop: 12 }}>
        <label>{parent ? '답글 쓰기' : '댓글 쓰기'}
          <textarea className="field" rows={3} required value={text} onChange={(e) => setText(e.target.value)} style={{ width: '100%', padding: 10, display: 'block' }} />
        </label>
        <button className="btn" style={{ justifySelf: 'start' }}>등록</button>
      </form>
    </section>
  )
}
