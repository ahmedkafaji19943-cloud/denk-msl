import React, { useState } from 'react'
import { createProduct } from '../firestoreStorage'

export default function ProductManager({ config, onProductAdded }) {
  const [showForm, setShowForm] = useState(false)
  const [productName, setProductName] = useState('')
  const [messages, setMessages] = useState(['', '', '', '', '', ''])
  const [saving, setSaving] = useState(false)

  function updateMessage(i, val) {
    const m = messages.slice()
    m[i] = val
    setMessages(m)
  }

  async function handleCreate() {
    if (!productName.trim()) {
      alert('Please enter a product name')
      return
    }
    if (!messages.some(m => m.trim())) {
      alert('Please enter at least one message')
      return
    }

    setSaving(true)
    try {
      const messagesList = messages.filter(m => m.trim())
      await createProduct(productName, messagesList)
      alert('Product created!')
      setProductName('')
      setMessages(['', '', '', '', '', ''])
      setShowForm(false)
      onProductAdded()
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="card">
      <h2>Products</h2>
      <div className="muted">Total products: {config?.products?.length || 0}</div>

      {showForm ? (
        <div style={{marginTop: 16}}>
          <h3>Add New Product</h3>
          <label>Product Name</label>
          <input 
            type="text" 
            placeholder="e.g., DenkPlus400"
            value={productName}
            onChange={e => setProductName(e.target.value)}
          />

          <label>Initial Messages (enter at least 1)</label>
          {messages.map((m, i) => (
            <div key={i} className="msg-edit">
              <small>{String.fromCharCode(65 + i)}.</small>
              <textarea 
                value={m}
                onChange={e => updateMessage(i, e.target.value)}
                placeholder={`Message ${i + 1}`}
              />
            </div>
          ))}

          <div style={{display: 'flex', gap: 8}}>
            <button className="primary" onClick={handleCreate} disabled={saving}>
              {saving ? 'Creating...' : 'Create Product'}
            </button>
            <button className="secondary" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      ) : (
        <button className="primary" onClick={() => setShowForm(true)} style={{marginTop: 12}}>
          + Add New Product
        </button>
      )}

      <h3>Existing Products</h3>
      <ul>
        {config?.products?.map(p => (
          <li key={p.id}><strong>{p.name}</strong> ({p.messages.length} messages)</li>
        ))}
      </ul>
    </div>
  )
}
