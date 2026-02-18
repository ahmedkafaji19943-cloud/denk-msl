import React, { useState, useEffect } from 'react'
import { updateMessagesForMSL, getMessagesForMSL, addMessageToProduct } from '../firestoreStorage'

export default function MessagesEdit({ mslId, config }) {
  const [product, setProduct] = useState(null)
  const [productSearch, setProductSearch] = useState('')
  const [showProductDropdown, setShowProductDropdown] = useState(false)
  const [messages, setMessages] = useState([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [newMessage, setNewMessage] = useState('')

  useEffect(() => {
    if (config && config.products.length > 0) {
      // Don't set defaults - let user choose
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

  async function addNewMessage() {
    if (!newMessage.trim()) {
      alert('Please enter a message')
      return
    }
    try {
      const updated = await addMessageToProduct(mslId, product.id, newMessage, product.messages)
      setMessages(updated)
      setNewMessage('')
      alert('Message added!')
    } catch (err) {
      alert('Error: ' + err.message)
    }
  }

  if (loading || !config) return <div className="card">Loading...</div>

  const filteredProducts = config.products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()))

  return (
    <div className="card">
      <h2>Edit Messages</h2>
      
      <label>Select Product</label>
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
            border: '1px solid #ccc',
            borderRadius: '4px',
            background: 'white',
            maxHeight: '200px',
            overflowY: 'auto',
            zIndex: 10,
            marginTop: '4px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
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
                  padding: '10px 12px',
                  cursor: 'pointer',
                  background: product?.id === p.id ? '#FEED00' : 'white',
                  borderBottom: '1px solid #f0f0f0',
                  fontSize: '0.95em'
                }}
              >
                {p.name}
              </div>
            )) : (
              <div style={{padding: '10px 12px', color: '#999'}}>No matches</div>
            )}
          </div>
        )}
      </div>

      {product && (
        <>
          <h3 style={{marginTop: 20}}>Your Messages for {product.name} ({messages.length})</h3>
          {messages.map((m, i) => (
            <div key={i} className="msg-edit">
              <small>{String.fromCharCode(65 + i)}.</small>
              <textarea value={m} onChange={e => change(i, e.target.value)} />
            </div>
          ))}
          <button className="primary" onClick={save} disabled={saving}>
            {saving ? 'Saving...' : 'Save All Messages'}
          </button>

          <h3 style={{marginTop: 24}}>Add New Message to {product.name}</h3>
          <textarea 
            value={newMessage} 
            onChange={e => setNewMessage(e.target.value)} 
            placeholder="Enter a new key message or benefit..."
            style={{height: 80}}
          />
          <button className="secondary" onClick={addNewMessage}>+ Add Message</button>
        </>
      )}
    </div>
  )
}
