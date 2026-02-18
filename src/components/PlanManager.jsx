import React, { useState, useEffect } from 'react'
import { savePlan, getAllPlans } from '../firestoreStorage'

export default function PlanManager({ mslId, mslName, config }) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [medRep, setMedRep] = useState('')
  const [product, setProduct] = useState(null)
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

  async function handleSavePlan() {
    setSaving(true)
    try {
      await savePlan({
        date,
        medRep,
        productId: product.id,
        mslId,
        mslName,
        createdOn: new Date().toLocaleString()
      })
      alert('Plan saved!')
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

        <button className="primary" onClick={handleSavePlan} disabled={saving}>
          {saving ? 'Saving Plan...' : 'Save Plan'}
        </button>
      </div>

      <div className="card">
        <h2>Team's Daily Plans</h2>
        {Object.keys(groupedPlans).sort().reverse().map(planDate => (
          <div key={planDate} style={{marginBottom: 20}}>
            <h3 style={{marginTop: 0, color: '#FEED00'}}>📅 {new Date(planDate + 'T00:00:00').toLocaleDateString()}</h3>
            {groupedPlans[planDate].map((plan, i) => (
              <div key={i} style={{padding: 12, background: '#f9f9f9', borderRadius: 6, marginBottom: 8, borderLeft: '4px solid #FEED00'}}>
                <div style={{marginBottom: 8}}>
                  <strong style={{fontSize: '1.1em'}}>{plan.mslName}</strong> 
                  <span className="muted" style={{marginLeft: 8}}>→</span> 
                  <strong style={{marginLeft: 8}}>{plan.medRep}</strong>
                </div>
                <div className="muted"><small>Product: <strong>{plan.productId}</strong></small></div>
              </div>
            ))}
          </div>
        ))}
        {Object.keys(groupedPlans).length === 0 && <div className="muted">No plans scheduled yet</div>}
      </div>
    </div>
  )
}
