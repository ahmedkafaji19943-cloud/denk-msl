import React, { useState, useEffect } from 'react'
import { savePlan, getAllPlans } from '../firestoreStorage'

export default function PlanManager({ mslId, mslName, config }) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [pairs, setPairs] = useState([
    { id: Date.now() + 1, medRep: '', medRepSearch: '', showMedRepDropdown: false, product: null, productSearch: '', showProductDropdown: false },
    { id: Date.now() + 2, medRep: '', medRepSearch: '', showMedRepDropdown: false, product: null, productSearch: '', showProductDropdown: false }
  ])
  const [saving, setSaving] = useState(false)
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (config && config.products.length > 0 && config.medReps.length > 0) {
      // Don't set defaults - let user choose
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

  function updatePair(id, field, value) {
    setPairs(prev => prev.map(p => p.id === id ? {...p, [field]: value} : p))
  }

  function addPair() {
    setPairs(prev => [...prev, {
      id: Date.now() + Math.random(),
      medRep: '',
      medRepSearch: '',
      showMedRepDropdown: false,
      product: null,
      productSearch: '',
      showProductDropdown: false
    }])
  }

  function removePair(id) {
    setPairs(prev => prev.length > 1 ? prev.filter(p => p.id !== id) : prev)
  }

  async function handleSavePlan() {
    const validPairs = pairs.filter(p => p.medRep && p.product)
    if (validPairs.length === 0) return alert('Add at least one Med Rep with a product')
    
    setSaving(true)
    try {
      for (const pair of validPairs) {
        await savePlan({
          date,
          medRep: pair.medRep,
          productId: pair.product.id,
          mslId,
          mslName,
          createdOn: new Date().toLocaleString()
        })
      }
      
      alert(`${validPairs.length} plan${validPairs.length !== 1 ? 's' : ''} saved!`)
      setPairs([
        { id: Date.now() + 1, medRep: '', medRepSearch: '', showMedRepDropdown: false, product: null, productSearch: '', showProductDropdown: false },
        { id: Date.now() + 2, medRep: '', medRepSearch: '', showMedRepDropdown: false, product: null, productSearch: '', showProductDropdown: false }
      ])
      await loadPlans()
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading || !config) return <div className="card">Loading...</div>

  // Convert med reps to array of names (handle old string or new object format)
  const medRepNames = (config.medReps || []).map(m => typeof m === 'string' ? m : m.name)

  // Group plans by date
  const groupedPlans = {}
  plans.forEach(plan => {
    if (!groupedPlans[plan.date]) {
      groupedPlans[plan.date] = []
    }
    groupedPlans[plan.date].push(plan)
  })

  return (
    <div>
      <div className="card">
        <h2>Daily Call Plan</h2>

        <label>Date</label>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} />

        <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {pairs.map((pair, idx) => {
            const filteredMedReps = medRepNames.filter(m => m.toLowerCase().includes(pair.medRepSearch.toLowerCase()))
            const filteredProducts = config.products.filter(p => p.name.toLowerCase().includes(pair.productSearch.toLowerCase()))
            
            return (
              <div key={pair.id} style={{ border: '2px solid #e5e7eb', borderRadius: 10, padding: 14, background: '#f9fafb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontWeight: 700, color: '#333' }}>Call #{idx + 1}</span>
                  {pairs.length > 1 && (
                    <button
                      onClick={() => removePair(pair.id)}
                      style={{
                        background: '#ec4899',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 4,
                        padding: '4px 8px',
                        cursor: 'pointer',
                        fontSize: '0.85em'
                      }}
                    >
                      ✕ Remove
                    </button>
                  )}
                </div>

                <label>Med Rep #{idx + 1}</label>
                <div style={{ position: 'relative', marginBottom: 12 }}>
                  <input
                    type="text"
                    placeholder="Search med rep..."
                    value={pair.medRepSearch || pair.medRep}
                    onChange={e => updatePair(pair.id, 'medRepSearch', e.target.value)}
                    onFocus={() => updatePair(pair.id, 'showMedRepDropdown', true)}
                    onBlur={() => setTimeout(() => updatePair(pair.id, 'showMedRepDropdown', false), 150)}
                    style={{ width: '100%', padding: '8px', fontSize: '1em' }}
                  />
                  {pair.showMedRepDropdown && (
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
                            updatePair(pair.id, 'medRep', m)
                            updatePair(pair.id, 'medRepSearch', '')
                            updatePair(pair.id, 'showMedRepDropdown', false)
                          }}
                          style={{
                            padding: '12px 14px',
                            cursor: 'pointer',
                            background: pair.medRep === m ? 'linear-gradient(135deg, rgba(254, 237, 0, 0.15), rgba(254, 237, 0, 0.08))' : '#fff',
                            borderBottom: '1px solid #f3f4f6',
                            fontSize: '0.95em',
                            borderLeft: pair.medRep === m ? '3px solid #FEED00' : 'none',
                            paddingLeft: pair.medRep === m ? '11px' : '14px'
                          }}
                        >
                          {m}
                        </div>
                      )) : (
                        <div style={{ padding: '10px 12px', color: '#999' }}>No matches</div>
                      )}
                    </div>
                  )}
                </div>

                {pair.medRep && (
                  <div style={{ background: 'linear-gradient(135deg, rgba(254, 237, 0, 0.08), rgba(254, 237, 0, 0.04))', padding: 12, borderRadius: 8, marginBottom: 12, border: '2px solid #FEED00' }}>
                    <label style={{ background: 'linear-gradient(135deg, #FEED00 0%, #FFC800 100%)', color: '#000', padding: '6px 10px', borderRadius: 6, fontWeight: 700, marginBottom: 8, display: 'inline-block', fontSize: '0.85em' }}>
                      📦 Product for {pair.medRep}
                    </label>
                    <div style={{ marginTop: 8, position: 'relative' }}>
                      <input
                        type="text"
                        placeholder="Search product..."
                        value={pair.productSearch || pair.product?.name || ''}
                        onChange={e => updatePair(pair.id, 'productSearch', e.target.value)}
                        onFocus={() => updatePair(pair.id, 'showProductDropdown', true)}
                        onBlur={() => setTimeout(() => updatePair(pair.id, 'showProductDropdown', false), 150)}
                        style={{ width: '100%', padding: '10px', fontSize: '1em', border: '2px solid #FEED00', borderRadius: 4 }}
                      />
                      {pair.product && (
                        <div style={{ marginTop: 8, padding: 8, background: '#fff', border: '1px solid #FEED00', borderRadius: 4 }}>
                          ✅ {pair.product.name}
                        </div>
                      )}
                      {pair.showProductDropdown && (
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
                                updatePair(pair.id, 'product', p)
                                updatePair(pair.id, 'productSearch', '')
                                updatePair(pair.id, 'showProductDropdown', false)
                              }}
                              style={{
                                padding: '12px 14px',
                                cursor: 'pointer',
                                background: pair.product?.id === p.id ? 'linear-gradient(135deg, rgba(254, 237, 0, 0.15), rgba(254, 237, 0, 0.08))' : '#fff',
                                borderBottom: '1px solid #f3f4f6',
                                fontSize: '0.95em',
                                borderLeft: pair.product?.id === p.id ? '3px solid #FEED00' : 'none',
                                paddingLeft: pair.product?.id === p.id ? '11px' : '14px'
                              }}
                            >
                              {p.name}
                            </div>
                          )) : (
                            <div style={{ padding: '12px 14px', color: '#9ca3af' }}>No matches</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
          <button
            onClick={addPair}
            style={{
              background: '#6366f1',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              padding: '10px 16px',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            + Add More Med Rep
          </button>
          <button
            className="primary"
            onClick={handleSavePlan}
            disabled={saving}
            style={{
              background: pairs.some(p => p.medRep && p.product) ? '#FEED00' : '#ccc',
              color: '#000',
              border: 'none',
              borderRadius: 6,
              padding: '10px 16px',
              cursor: pairs.some(p => p.medRep && p.product) ? 'pointer' : 'not-allowed',
              fontWeight: 700
            }}
          >
            {saving ? 'Saving...' : `Save Plan${pairs.filter(p => p.medRep && p.product).length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>

      <div className="card">
        <h2>Team's Daily Plans</h2>
        {Object.keys(groupedPlans).sort().reverse().map(planDate => (
          <div key={planDate} style={{ marginBottom: 20 }}>
            <h3 style={{ marginTop: 0, color: '#FEED00' }}>📅 {new Date(planDate + 'T00:00:00').toLocaleDateString()}</h3>
            {groupedPlans[planDate].map((plan, i) => (
              <div key={i} style={{ padding: 12, background: '#f9f9f9', borderRadius: 6, marginBottom: 8, borderLeft: '4px solid #FEED00' }}>
                <div style={{ marginBottom: 8 }}>
                  <strong style={{ fontSize: '1.1em' }}>{plan.mslName}</strong>
                  <span className="muted" style={{ marginLeft: 8 }}>→</span>
                  <strong style={{ marginLeft: 8 }}>{plan.medRep}</strong>
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
