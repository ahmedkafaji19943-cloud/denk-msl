import React, { useState } from 'react'
import { getState, saveCall, getMessagesFor, getAllCalls } from '../storage'

export default function LogCall({ msl }) {
  const s = getState()
  const [medRep, setMedRep] = useState(s.medReps[0])
  const [product] = useState(s.products[0])
  const [messages, setMessages] = useState(getMessagesFor(product.id, msl.id))
  const [selected, setSelected] = useState([])
  const [score, setScore] = useState(8)
  const [note, setNote] = useState('')

  const usedBefore = (msg) => {
    const calls = getAllCalls()
    return calls.some(c => c.medRep === medRep && c.productId === product.id && c.messages?.includes(msg))
  }

  function toggleMessage(i) {
    const text = messages[i]
    setSelected(sel => sel.includes(text) ? sel.filter(x => x !== text) : [...sel, text])
  }

  function submit() {
    if (!selected.length) return alert('Choose at least one message')
    saveCall({ mslId: msl.id, medRep, productId: product.id, messages: selected, score, note, time: new Date().toISOString() })
    alert('Saved')
    setSelected([])
    setNote('')
  }

  return (
    <div className="card">
      <h2>Log Call</h2>
      <label>Med Rep</label>
      <select value={medRep} onChange={e => setMedRep(e.target.value)}>
        {s.medReps.map(m => <option key={m} value={m}>{m}</option>)}
      </select>

      <label>Product</label>
      <div className="muted">{product.name}</div>

      <label>Messages (tap to select)</label>
      <div className="messages">
        {messages.map((m, i) => (
          <button key={i} className={selected.includes(m) ? 'chip selected' : 'chip'} onClick={() => toggleMessage(i)}>
            <div>{m}</div>
            <small className="badge">{usedBefore(m) ? 'Used' : 'New'}</small>
          </button>
        ))}
      </div>

      <label>Assessment: {score}</label>
      <input type="range" min="0" max="10" value={score} onChange={e => setScore(Number(e.target.value))} />

      <label>Note</label>
      <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Knowledge note..." />

      <button className="primary" onClick={submit}>Save Call</button>
    </div>
  )
}
