import React, { useState, useEffect } from 'react'
import { savePlan, getAllPlans } from '../firestoreStorage'

export default function PlanManager({ mslId, mslName, config }) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [medRep1, setMedRep1] = useState('')
  const [medRep1Search, setMedRep1Search] = useState('')
  const [medRep2, setMedRep2] = useState('')
  const [medRep2Search, setMedRep2Search] = useState('')
  const [product1, setProduct1] = useState(null)
  const [product1Search, setProduct1Search] = useState('')
  const [product2, setProduct2] = useState(null)
  const [product2Search, setProduct2Search] = useState('')
  const [showMedRep1Dropdown, setShowMedRep1Dropdown] = useState(false)
  const [showMedRep2Dropdown, setShowMedRep2Dropdown] = useState(false)
  const [showProduct1Dropdown, setShowProduct1Dropdown] = useState(false)
  const [showProduct2Dropdown, setShowProduct2Dropdown] = useState(false)
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

  async function handleSavePlan() {
    if (!medRep1) return alert('Choose Med Rep #1')
    if (!product1) return alert('Choose Product for Med Rep #1')
    if (!medRep2) return alert('Choose Med Rep #2')
    if (!product2) return alert('Choose Product for Med Rep #2')
    
    setSaving(true)
    try {
      // Save first med rep call with product1
      await savePlan({
        date,
        medRep: medRep1,
        productId: product1.id,
        mslId,
        mslName,
        createdOn: new Date().toLocaleString()
      })
      
      // Save second med rep call with product2
      await savePlan({
        date,
        medRep: medRep2,
        productId: product2.id,
        mslId,
        mslName,
        createdOn: new Date().toLocaleString()
      })
      
      alert('2 plans saved!')
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
  
  // Filter med reps based on search
  const filteredMedReps1 = medRepNames.filter(m => m.toLowerCase().includes(medRep1Search.toLowerCase()))
  const filteredMedReps2 = medRepNames.filter(m => m.toLowerCase().includes(medRep2Search.toLowerCase()))
  
  // Filter products based on search
  const filteredProducts1 = config.products.filter(p => p.name.toLowerCase().includes(product1Search.toLowerCase()))
  const filteredProducts2 = config.products.filter(p => p.name.toLowerCase().includes(product2Search.toLowerCase()))

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

        <label>Med Rep #1</label>
        <div style={{position: 'relative'}}>
          <input
            type="text"
            placeholder="Search med rep..."
            value={medRep1Search || medRep1}
            onChange={e => setMedRep1Search(e.target.value)}
            onFocus={() => setShowMedRep1Dropdown(true)}
            onBlur={() => setTimeout(() => setShowMedRep1Dropdown(false), 150)}
            style={{width: '100%', padding: '8px', fontSize: '1em'}}
          />
          {showMedRep1Dropdown && (
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
              {filteredMedReps1.length > 0 ? filteredMedReps1.map(m => (
                <div
                  key={m}
                  onClick={() => {
                    setMedRep1(m)
                    setMedRep1Search('')
                    setShowMedRep1Dropdown(false)
                  }}
                  style={{
                    padding: '10px 12px',
                    cursor: 'pointer',
                    background: medRep1 === m ? '#FEED00' : 'white',
                    borderBottom: '1px solid #f0f0f0',
                    fontSize: '0.95em'
                  }}
                >
                  {m}
                </div>
              )) : (
                <div style={{padding: '10px 12px', color: '#999'}}>No matches</div>
              )}
            </div>
          )}
        </div>

        {medRep1 && (
          <>
            <label>Product for Med Rep #1</label>
            <div style={{position: 'relative'}}>
              <input
                type="text"
                placeholder="Search product..."
                value={product1Search || product1?.name || ''}
                onChange={e => setProduct1Search(e.target.value)}
                onFocus={() => setShowProduct1Dropdown(true)}
                onBlur={() => setTimeout(() => setShowProduct1Dropdown(false), 150)}
                style={{width: '100%', padding: '8px', fontSize: '1em'}}
              />
              {showProduct1Dropdown && (
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
                  {filteredProducts1.length > 0 ? filteredProducts1.map(p => (
                    <div
                      key={p.id}
                      onClick={() => {
                        setProduct1(p)
                        setProduct1Search('')
                        setShowProduct1Dropdown(false)
                      }}
                      style={{
                        padding: '10px 12px',
                        cursor: 'pointer',
                        background: product1?.id === p.id ? '#FEED00' : 'white',
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
          </>
        )}

        <label>Med Rep #2</label>
        <div style={{position: 'relative'}}>
          <input
            type="text"
            placeholder="Search med rep..."
            value={medRep2Search || medRep2}
            onChange={e => setMedRep2Search(e.target.value)}
            onFocus={() => setShowMedRep2Dropdown(true)}
            onBlur={() => setTimeout(() => setShowMedRep2Dropdown(false), 150)}
            style={{width: '100%', padding: '8px', fontSize: '1em'}}
          />
          {showMedRep2Dropdown && (
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
              {filteredMedReps2.length > 0 ? filteredMedReps2.map(m => (
                <div
                  key={m}
                  onClick={() => {
                    setMedRep2(m)
                    setMedRep2Search('')
                    setShowMedRep2Dropdown(false)
                  }}
                  style={{
                    padding: '10px 12px',
                    cursor: 'pointer',
                    background: medRep2 === m ? '#FEED00' : 'white',
                    borderBottom: '1px solid #f0f0f0',
                    fontSize: '0.95em'
                  }}
                >
                  {m}
                </div>
              )) : (
                <div style={{padding: '10px 12px', color: '#999'}}>No matches</div>
              )}
            </div>
          )}
        </div>

        {medRep2 && (
          <>
            <label>Product for Med Rep #2</label>
            <div style={{position: 'relative'}}>
              <input
                type="text"
                placeholder="Search product..."
                value={product2Search || product2?.name || ''}
                onChange={e => setProduct2Search(e.target.value)}
                onFocus={() => setShowProduct2Dropdown(true)}
                onBlur={() => setTimeout(() => setShowProduct2Dropdown(false), 150)}
                style={{width: '100%', padding: '8px', fontSize: '1em'}}
              />
              {showProduct2Dropdown && (
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
                  {filteredProducts2.length > 0 ? filteredProducts2.map(p => (
                    <div
                      key={p.id}
                      onClick={() => {
                        setProduct2(p)
                        setProduct2Search('')
                        setShowProduct2Dropdown(false)
                      }}
                      style={{
                        padding: '10px 12px',
                        cursor: 'pointer',
                        background: product2?.id === p.id ? '#FEED00' : 'white',
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
          </>
        )}

        <button className="primary" onClick={handleSavePlan} disabled={saving}>
          {saving ? 'Saving Plans...' : 'Save 2 Calls'}
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
