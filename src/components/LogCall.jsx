import React, { useState, useEffect } from 'react'
import { getSharedConfig, saveCall, getMessagesForMSL, wasMessageUsedWithMedRep } from '../firestoreStorage'

export default function LogCall({ user, mslId, config }) {
  const [medRep, setMedRep] = useState('')
  const [product, setProduct] = useState(null)
  const [messages, setMessages] = useState([])
  const [selected, setSelected] = useState([])
  const [score, setScore] = useState(8)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [usageHistory, setUsageHistory] = useState({})

  useEffect(() => {
    if (config && config.products.length > 0 && config.medReps.length > 0) {
      setProduct(config.products[0])
      // Extract name from med rep (handle both string and object format)
      const firstMedRep = config.medReps[0]
      const medRepName = typeof firstMedRep === 'string' ? firstMedRep : firstMedRep.name
      setMedRep(medRepName)
      setLoading(false)
    }
  }, [config])

  useEffect(() => {
    if (product) {
      loadMessages()
    }
  }, [product])

  useEffect(() => {
    if (product && medRep) {
      checkMessageHistory()
    }
  }, [medRep, product])

  async function loadMessages() {
    const msgs = await getMessagesForMSL(mslId, product.id, product.messages)
    setMessages(msgs)
  }

  async function checkMessageHistory() {
    const history = {}
    for (const msg of messages) {
      const used = await wasMessageUsedWithMedRep(medRep, product.id, msg, mslId)
      history[msg] = used
    }
    setUsageHistory(history)
  }

  function toggleMessage(i) {
    const text = messages[i]
    setSelected(sel => sel.includes(text) ? sel.filter(x => x !== text) : [...sel, text])
  }

  async function submit() {
    if (!selected.length) return alert('Choose at least one message')
    setSaving(true)
    try {
      await saveCall({ 
        mslId, 
        medRep, 
        productId: product.id, 
        messages: selected, 
        score, 
        note 
      })
      alert('Call saved!')
      
      // Immediately update local history to reflect the newly saved messages
      const newHistory = { ...usageHistory }
      selected.forEach(msg => {
        newHistory[msg] = true // Mark as used
      })
      setUsageHistory(newHistory)
      
      setSelected([])
      setNote('')
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading || !config || !product) return <div className="card">Loading...</div>

  // Convert med reps to array of names (handle old string or new object format)
  const medRepNames = (config.medReps || []).map(m => typeof m === 'string' ? m : m.name)
  const selectedMedRepObj = (config.medReps || []).find(m => (typeof m === 'string' ? m : m.name) === medRep)
  const medRepDetails = typeof selectedMedRepObj === 'string' ? { name: selectedMedRepObj, zone: '', line: '' } : (selectedMedRepObj || { name: medRep, zone: '', line: '' })

  return (
    <div className="card">
      <h2>Log Call</h2>
      <label>Med Rep</label>
      <select value={medRep} onChange={e => setMedRep(e.target.value)}>
        {medRepNames.map(m => <option key={m} value={m}>{m}</option>)}
      </select>

      {medRepDetails.zone && <div className="muted" style={{marginTop: 8}}>
        <small>📍 Zone: {medRepDetails.zone}{medRepDetails.line ? ` • Dept: ${medRepDetails.line}` : ''}</small>
      </div>}

      <label>Product</label>
      <select value={product.id} onChange={e => {
        const p = config.products.find(x => x.id === e.target.value)
        setProduct(p)
      }}>
        {config.products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>

      <label>Messages (tap to select)</label>
      <div className="messages">
        {messages.map((m, i) => (
          <button 
            key={i}
            className={selected.includes(m) ? 'chip selected' : 'chip'} 
            onClick={() => toggleMessage(i)}
          >
            <div>{m}</div>
            <small className="badge">
              {usageHistory[m] ? `✓ Used with ${medRep}` : 'New for this rep'}
            </small>
          </button>
        ))}
      </div>

      <label>Assessment: {score}</label>
      <input type="range" min="0" max="10" value={score} onChange={e => setScore(Number(e.target.value))} />

      <label>Note</label>
      <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Knowledge note..." />

      <button className="primary" onClick={submit} disabled={saving}>
        {saving ? 'Saving...' : 'Save Call'}
      </button>
    </div>
  )
}
