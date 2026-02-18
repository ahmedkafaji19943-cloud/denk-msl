import React, { useState, useEffect } from 'react'
import { getSharedConfig, saveCall, getMessagesForMSL, wasMessageUsedWithMedRep } from '../firestoreStorage'

export default function LogCall({ user, mslId, config }) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [medRep, setMedRep] = useState('')
  const [medRepSearch, setMedRepSearch] = useState('')
  const [product, setProduct] = useState(null)
  const [productSearch, setProductSearch] = useState('')
  const [messages, setMessages] = useState([])
  const [selected, setSelected] = useState([])
  const [score, setScore] = useState(8)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [usageHistory, setUsageHistory] = useState({})
  const [showMedRepDropdown, setShowMedRepDropdown] = useState(false)
  const [showProductDropdown, setShowProductDropdown] = useState(false)

  useEffect(() => {
    if (config && config.products.length > 0 && config.medReps.length > 0) {
      // Don't set defaults - let user choose
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
    if (!medRep) return alert('Choose a med rep')
    if (!product) return alert('Choose a product')
    if (!selected.length) return alert('Choose at least one message')
    setSaving(true)
    try {
      await saveCall({ 
        date,
        mslId, 
        medRep, 
        productId: product.id, 
        messages: selected, 
        score, 
        note,
        createdOn: new Date().toLocaleString()
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

  if (loading || !config) return <div className="card">Loading...</div>

  // Convert med reps to array of names (handle old string or new object format)
  const medRepNames = (config.medReps || []).map(m => typeof m === 'string' ? m : m.name)
  const filteredMedReps = medRepNames.filter(m => m.toLowerCase().includes(medRepSearch.toLowerCase()))
  
  const filteredProducts = config.products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()))
  
  const selectedMedRepObj = (config.medReps || []).find(m => (typeof m === 'string' ? m : m.name) === medRep)
  const medRepDetails = typeof selectedMedRepObj === 'string' ? { name: selectedMedRepObj, zone: '', line: '' } : (selectedMedRepObj || { name: medRep, zone: '', line: '' })

  return (
    <div className="card">
      <h2>Log Call</h2>
      
      <label>Date</label>
      <input type="date" value={date} onChange={e => setDate(e.target.value)} />

      <label>Med Rep</label>
      <div style={{position: 'relative'}}>
        <input
          type="text"
          placeholder="Search med rep..."
          value={medRepSearch || medRep}
          onChange={e => setMedRepSearch(e.target.value)}
          onFocus={() => setShowMedRepDropdown(true)}
          onBlur={() => setTimeout(() => setShowMedRepDropdown(false), 150)}
          style={{width: '100%', padding: '8px', fontSize: '1em'}}
        />
        {showMedRepDropdown && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            background: '#fff',
            maxHeight: '220px',
            overflowY: 'auto',
            zIndex: 10,
            marginTop: '6px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
          }}>
            {filteredMedReps.length > 0 ? filteredMedReps.map(m => (
              <div
                key={m}
                onClick={() => {
                  setMedRep(m)
                  setMedRepSearch('')
                  setShowMedRepDropdown(false)
                }}
                style={{
                  padding: '12px 14px',
                  cursor: 'pointer',
                  background: medRep === m ? 'linear-gradient(135deg, rgba(254, 237, 0, 0.15), rgba(254, 237, 0, 0.08))' : '#fff',
                  borderBottom: '1px solid #f3f4f6',
                  fontSize: '0.95em',
                  borderLeft: medRep === m ? '3px solid #FEED00' : 'none',
                  paddingLeft: medRep === m ? '11px' : '14px'
                }}
              >
                {m}
              </div>
            )) : (
              <div style={{padding: '12px 14px', color: '#9ca3af'}}>No matches</div>
            )}
          </div>
        )}
      </div>

      {medRep && medRepDetails.zone && <div className="muted" style={{marginTop: 8}}>
        <small>📍 Zone: {medRepDetails.zone}{medRepDetails.line ? ` • Dept: ${medRepDetails.line}` : ''}</small>
      </div>}

      <label>Product</label>
      <div style={{position: 'relative'}}>
        <input
          type="text"
          placeholder="Search product..."
          value={productSearch || product?.name || ''}
          onChange={e => setProductSearch(e.target.value)}
          onFocus={() => setShowProductDropdown(true)}
          onBlur={() => setTimeout(() => setShowProductDropdown(false), 150)}
          style={{width: '100%', padding: '8px', fontSize: '1em'}}
        />
        {showProductDropdown && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            background: '#fff',
            maxHeight: '220px',
            overflowY: 'auto',
            zIndex: 10,
            marginTop: '6px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
          }}>
            {filteredProducts.length > 0 ? filteredProducts.map(p => (
              <div
                key={p.id}
                onClick={() => {
                  setProduct(p)
                  setProductSearch('')
                  setShowProductDropdown(false)
                }}
                style={{
                  padding: '12px 14px',
                  cursor: 'pointer',
                  background: product?.id === p.id ? 'linear-gradient(135deg, rgba(254, 237, 0, 0.15), rgba(254, 237, 0, 0.08))' : '#fff',
                  borderBottom: '1px solid #f3f4f6',
                  fontSize: '0.95em',
                  borderLeft: product?.id === p.id ? '3px solid #FEED00' : 'none',
                  paddingLeft: product?.id === p.id ? '11px' : '14px'
                }}
              >
                {p.name}
              </div>
            )) : (
              <div style={{padding: '12px 14px', color: '#9ca3af'}}>No matches</div>
            )}
          </div>
        )}
      </div>

      {product && (
        <>
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
        </>
      )}

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
