import React, { useState } from 'react'
import { getState, updateMessages, getMessagesFor } from '../storage'

export default function MessagesEdit({ msl }) {
  const s = getState()
  const product = s.products[0]
  const initial = getMessagesFor(product.id, msl.id)
  const [messages, setMessages] = useState(initial.slice())

  function change(i, v) {
    const c = messages.slice(); c[i] = v; setMessages(c)
  }

  function save() {
    updateMessages(product.id, msl.id, messages)
    alert('Saved messages for ' + msl.name)
  }

  return (
    <div className="card">
      <h2>Edit Messages — {product.name}</h2>
      {messages.map((m, i) => (
        <div key={i} className="msg-edit">
          <textarea value={m} onChange={e => change(i, e.target.value)} />
        </div>
      ))}
      <button className="primary" onClick={save}>Save Messages</button>
    </div>
  )
}
