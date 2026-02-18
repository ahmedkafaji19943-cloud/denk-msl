import React, { useState, useEffect } from 'react'
import { savePlan, getAllPlans } from '../firestoreStorage'

export default function PlanManager({ mslId, mslName, config }) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [medRep, setMedRep] = useState('')
  const [product, setProduct] = useState(null)
  const [messages, setMessages] = useState([])
  const [selected, setSelected] = useState([])
  const [saving, setSaving] = useState(false)
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (config && config.products.length > 0 && config.medReps.length > 0) {
      setProduct(config.products[0])
      const firstMedRep = config.medReps[0]
      const medRepName = typeof firstMedRep === 'string' ? firstMedRep : firstMedRep.name
      setMedRep(medRepName)
      loadPlans()
    }
  }, [config])

  useEffect(() => {
    if (product && config) {
      const msgs = product.messages
      setMessages(msgs)
    }
  }, [product])

  async function loadPlans() {
    try {
      const allPlans = await getAllPlans()
      setPlans(allPlans)
    } catch (err) {
      console.error('Error loading plans:', err)
    } finally {
      setLoading(false)
    }
  }

  function toggleMessage(i) {
    const text = messages[i]
    setSelected(sel => sel.includes(text) ? sel.filter(x => x !== text) : [...sel, text])
  }

  async function handleSavePlan() {
    if (!selected.length) {
      alert('Please select at least one message')
      return
    }

    setSaving(true)
    try {
      await savePlan({
        date,
        medRep,
        productId: product.id,
        messages: selected,
        mslId,
        mslName,
        createdOn: new Date().toLocaleString()
      })
      alert('Plan saved!')
      setSelected([])
      await loadPlans()
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading || !config || !product) return <div className="card">Loading...</div>

  // Group plans by date
  const groupedPlans = {}
  plans.forEach(plan => {
    if (!groupedPlans[plan.date]) {
      groupedPlans[plan.date] = []
    }
    groupedPlans[plan.date].push(plan)
  })

  const medRepNames = (config.medReps || []).map(m => typeof m === 'string' ? m : m.name)

  return (
    <div>
      <div className="card">
        <h2>Daily Call Plan</h2>

        <label>Date</label>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} />

        <label>Med Rep</label>
        <select value={medRep} onChange={e => setMedRep(e.target.value)}>
          {medRepNames.map(m => <option key={m} value={m}>{m}</option>)}
        </select>

        <label>Product</label>
        <select value={product.id} onChange={e => {
          const p = config.products.find(x => x.id === e.target.value)
          setProduct(p)
        }}>
          {config.products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>

        <label>Messages to discuss (select one or more)</label>
        <div className="messages">
          {messages.map((m, i) => (
            <button 
              key={i}
              className={selected.includes(m) ? 'chip selected' : 'chip'} 
              onClick={() => toggleMessage(i)}
            >
              {m}
            </button>
          ))}
        </div>

        <button className="primary" onClick={handleSavePlan} disabled={saving}>
          {saving ? 'Saving Plan...' : 'Save Plan'}
        </button>
      </div>

      <div className="card">
        <h2>Team's Daily Plans</h2>
        {Object.keys(groupedPlans).sort().reverse().map(planDate => (
          <div key={planDate} style={{marginBottom: 20}}>
            <h3 style={{marginTop: 0}}>{new Date(planDate + 'T00:00:00').toLocaleDateString()}</h3>
            {groupedPlans[planDate].map((plan, i) => (
              <div key={i} style={{padding: 12, background: '#f9f9f9', borderRadius: 6, marginBottom: 8}}>
                <div><strong>{plan.mslName}</strong> → <strong>{plan.medRep}</strong></div>
                <div className="muted"><small>{plan.productId}</small></div>
                <div style={{marginTop: 8}}>
                  {plan.messages.map((msg, j) => (
                    <div key={j} style={{fontSize: '0.9em', marginTop: 4, paddingLeft: 8, borderLeft: '2px solid #FEED00'}}>
                      {msg}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
        {Object.keys(groupedPlans).length === 0 && <div className="muted">No plans yet</div>}
      </div>
    </div>
  )
}
