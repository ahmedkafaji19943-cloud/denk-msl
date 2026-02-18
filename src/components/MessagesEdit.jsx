import React, { useState, useEffect } from 'react'
import { updateMessagesForMSL, getMessagesForMSL } from '../firestoreStorage'

export default function MessagesEdit({ mslId, config }) {
  const [product, setProduct] = useState(null)
  const [messages, setMessages] = useState([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (config && config.products.length > 0) {
      setProduct(config.products[0])
      setLoading(false)
    }
  }, [config])

  useEffect(() => {
    if (product) {
      loadMessages()
    }
  }, [product])

  async function loadMessages() {
    const msgs = await getMessagesForMSL(mslId, product.id, product.messages)
    setMessages(msgs)
  }

  function change(i, v) {
    const c = messages.slice(); c[i] = v; setMessages(c)
  }

  async function save() {
    setSaving(true)
    try {
      await updateMessagesForMSL(mslId, product.id, messages)
      alert('Messages saved!')
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading || !config || !product) return <div className="card">Loading...</div>

  return (
    <div className="card">
      <h2>Edit Messages</h2>
      <label>Product</label>
      <select value={product.id} onChange={e => {
        const p = config.products.find(x => x.id === e.target.value)
        setProduct(p)
      }}>
        {config.products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>

      {messages.map((m, i) => (
        <div key={i} className="msg-edit">
          <small>{String.fromCharCode(65 + i)}.</small>
          <textarea value={m} onChange={e => change(i, e.target.value)} />
        </div>
      ))}
      <button className="primary" onClick={save} disabled={saving}>
        {saving ? 'Saving...' : 'Save Messages'}
      </button>
    </div>
  )
}
