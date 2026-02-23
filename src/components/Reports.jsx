import React, { useState, useEffect } from 'react'
import { getCallsForMSL, getAllCalls } from '../firestoreStorage'

function avg(arr) { return arr.length ? (arr.reduce((a,b)=>a+b,0)/arr.length).toFixed(1) : '-' }

export default function Reports({ mslId, mslName, isManager, config }) {
  const [loading, setLoading] = useState(true)
  const [teamReports, setTeamReports] = useState({})
  const [selectedMSLId, setSelectedMSLId] = useState(null)
  const [expandedMedReps, setExpandedMedReps] = useState({})

  useEffect(() => {
    loadReports()
  }, [])

  async function loadReports() {
    const allCalls = await getAllCalls()
    setTeamReports(groupCallsByMSL(allCalls, config))
    setLoading(false)
  }

  function groupCallsByMSL(allCalls, cfg) {
    const groups = {}
    cfg.msls.forEach(msl => {
      groups[msl.id] = { name: msl.name, calls: allCalls.filter(c => c.mslId === msl.id) }
    })
    return groups
  }

  function toggleMedRep(key) {
    setExpandedMedReps(prev => ({...prev, [key]: !prev[key]}))
  }

  if (loading) return <div className="card">Loading reports...</div>

  // If an MSL is selected, show detailed isolated view
  if (selectedMSLId) {
    const mslData = teamReports[selectedMSLId]
    return (
      <div className="card" style={{position: 'relative'}}>
        <button 
          onClick={() => setSelectedMSLId(null)}
          style={{
            position: 'absolute',
            top: 16,
            left: 16,
            background: '#6366f1',
            color: '#fff',
            border: 'none',
            padding: '8px 16px',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: '0.9em',
            fontWeight: 500,
            transition: 'background 0.2s ease'
          }}
          onMouseEnter={e => e.target.style.background = '#4f46e5'}
          onMouseLeave={e => e.target.style.background = '#6366f1'}
        >
          ← Back to Reports
        </button>
        
        <div style={{marginTop: 50}}>
          <h2 style={{fontSize: '1.8em', color: '#6366f1', marginBottom: 12}}>
            {mslData.name}
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 12,
            marginBottom: 30,
            padding: 20,
            background: '#f5f5f5',
            borderRadius: 8
          }}>
            <StatCard label="Total Calls" value={mslData.calls.length} />
            <StatCard label="Avg Score" value={calculateAvgScore(mslData.calls)} />
            <StatCard label="Med Reps Covered" value={countUniqueMedReps(mslData.calls)} />
          </div>
          
          <ReportContent 
            calls={mslData.calls} 
            config={config} 
            onToggleMedRep={toggleMedRep} 
            expandedMedReps={expandedMedReps} 
          />
        </div>
      </div>
    )
  }

  // List view showing all MSLs
  return (
    <div className="card">
      <h2>{isManager ? 'Team Reports' : 'All MSL Reports'}</h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 20,
        marginTop: 24
      }}>
        {Object.entries(teamReports).map(([mslId, team]) => {
          const avgScore = calculateAvgScore(team.calls)
          const medRepCount = countUniqueMedReps(team.calls)
          
          return (
            <div
              key={mslId}
              onClick={() => setSelectedMSLId(mslId)}
              style={{
                padding: 20,
                background: 'linear-gradient(135deg, #fff 0%, #f9f9f9 100%)',
                border: '2px solid #e0e0e0',
                borderRadius: 12,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.12)'
                e.currentTarget.style.borderColor = '#FEED00'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'
                e.currentTarget.style.borderColor = '#e0e0e0'
              }}
            >
              <div style={{fontSize: '1.3em', fontWeight: 'bold', color: '#333', marginBottom: 16}}>
                👤 {team.name}
              </div>
              
              <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
                <div style={{padding: 12, background: '#fff', borderRadius: 6, border: '1px solid #eee'}}>
                  <div style={{fontSize: '0.85em', color: '#666', marginBottom: 4}}>Calls Logged</div>
                  <div style={{fontSize: '1.5em', fontWeight: 'bold', color: '#6366f1'}}>
                    {team.calls.length}
                  </div>
                </div>
                
                <div style={{padding: 12, background: '#fff', borderRadius: 6, border: '1px solid #eee'}}>
                  <div style={{fontSize: '0.85em', color: '#666', marginBottom: 4}}>Avg Score</div>
                  <div style={{fontSize: '1.5em', fontWeight: 'bold', color: '#FEED00'}}>
                    {avgScore}
                  </div>
                </div>
                
                <div style={{padding: 12, background: '#fff', borderRadius: 6, border: '1px solid #eee'}}>
                  <div style={{fontSize: '0.85em', color: '#666', marginBottom: 4}}>Med Reps Covered</div>
                  <div style={{fontSize: '1.5em', fontWeight: 'bold', color: '#ec4899'}}>
                    {medRepCount}
                  </div>
                </div>
              </div>
              
              <div style={{
                marginTop: 16,
                padding: 12,
                background: '#6366f1',
                color: '#fff',
                textAlign: 'center',
                borderRadius: 6,
                fontWeight: 600,
                fontSize: '0.95em'
              }}>
                View Details →
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function StatCard({ label, value }) {
  return (
    <div style={{padding: 16, background: '#fff', borderRadius: 8, border: '1px solid #ddd', textAlign: 'center'}}>
      <div style={{fontSize: '0.85em', color: '#666', marginBottom: 8, fontWeight: 500}}>{label}</div>
      <div style={{fontSize: '1.8em', fontWeight: 'bold', color: '#6366f1'}}>{value}</div>
    </div>
  )
}

function calculateAvgScore(calls) {
  if (!calls.length) return '-'
  const scores = calls.map(c => c.score || 0).filter(s => s > 0)
  return scores.length ? (scores.reduce((a,b) => a+b, 0) / scores.length).toFixed(1) : '-'
}

function countUniqueMedReps(calls) {
  return new Set(calls.map(c => c.medRep)).size
}

function ReportContent({ calls, config, onToggleMedRep, expandedMedReps }) {
  const byMedRep = {}
  const byMedRepProduct = {}
  
  calls.forEach(c => {
    byMedRep[c.medRep] = byMedRep[c.medRep] || []
    byMedRep[c.medRep].push(c.score)
    
    // Group by med rep and product, keeping individual calls with dates
    const key = `${c.medRep}_${c.productId}`
    byMedRepProduct[key] = byMedRepProduct[key] || { medRep: c.medRep, productId: c.productId, calls: [] }
    
    // Preserve individual calls with all their details including dates
    if (c.messages && Array.isArray(c.messages)) {
      byMedRepProduct[key].calls.push({
        date: c.date || 'No date',
        messages: c.messages,
        note: c.note || '',
        score: c.score
      })
    }
  })

  return (
    <div style={{marginTop: 24}}>
      <h3 style={{marginBottom: 20, fontSize: '1.2em', color: '#333'}}>📋 Detailed Call History</h3>
      
      {Object.keys(byMedRep).length > 0 ? (
        <div>
          {Object.keys(byMedRep).sort().map(medRep => {
            const repKey = `medRep_${medRep}`
            const isExpanded = expandedMedReps[repKey]
            const avgScore = avg(byMedRep[medRep])
            const productsForRep = Object.keys(byMedRepProduct).filter(k => byMedRepProduct[k].medRep === medRep)
            
            return (
              <div key={medRep} style={{marginBottom: 16, border: '2px solid #e0e0e0', borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)'}}>
                <div
                  onClick={() => onToggleMedRep(repKey)}
                  style={{
                    cursor: 'pointer',
                    padding: 16,
                    background: isExpanded ? '#FEED00' : '#f9f9f9',
                    fontWeight: 'bold',
                    userSelect: 'none',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'background 0.2s ease'
                  }}
                  onMouseEnter={e => {
                    if (!isExpanded) e.currentTarget.style.background = '#f0f0f0'
                  }}
                  onMouseLeave={e => {
                    if (!isExpanded) e.currentTarget.style.background = '#f9f9f9'
                  }}
                >
                  <span style={{fontSize: '1.05em'}}>
                    {isExpanded ? '▼' : '▶'} <strong>{medRep}</strong>
                  </span>
                  <span style={{fontSize: '0.9em', color: '#666', fontWeight: 'normal'}}>
                    {byMedRep[medRep].length} call{byMedRep[medRep].length !== 1 ? 's' : ''} | Avg: {avgScore}
                  </span>
                </div>

                {isExpanded && (
                  <div style={{padding: 20, background: '#fafafa'}}>
                    {productsForRep.map(productKey => {
                      const productData = byMedRepProduct[productKey]
                      const product = config?.products?.find(p => p.id === productData.productId)
                      
                      return (
                        <div key={productKey} style={{marginBottom: 16, padding: 16, background: '#fff', borderRadius: 8, border: '1px solid #e0e0e0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)'}}>
                          <div style={{fontWeight: 'bold', color: '#FEED00', marginBottom: 12, fontSize: '1.05em'}}>
                            📦 {product?.name || productData.productId}
                          </div>
                          
                          {productData.calls && productData.calls.length > 0 ? (
                            <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
                              {productData.calls.map((callData, callIdx) => (
                                <div key={callIdx} style={{padding: 12, background: '#f9f9f9', borderRadius: 6, borderLeft: '4px solid #FEED00', transition: 'background 0.2s ease'}}
                                  onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'}
                                  onMouseLeave={e => e.currentTarget.style.background = '#f9f9f9'}
                                >
                                  <div style={{fontSize: '0.9em', color: '#666', marginBottom: 8, fontWeight: 600}}>
                                    📅 {callData.date}
                                  </div>
                                  <div style={{fontSize: '0.95em', color: '#333', marginBottom: callData.note ? 8 : 0}}>
                                    {callData.messages.map((msg, msgIdx) => (
                                      <div key={msgIdx} style={{marginBottom: 6, lineHeight: '1.4'}}>
                                        • {msg}
                                      </div>
                                    ))}
                                  </div>
                                  {callData.note && (
                                    <div style={{fontSize: '0.9em', color: '#555', fontStyle: 'italic', paddingLeft: 12, paddingTop: 6, borderTop: '1px solid #eee', marginTop: 8}}>
                                      📝 Note: {callData.note}
                                    </div>
                                  )}
                                  <div style={{fontSize: '0.85em', color: '#999', paddingLeft: 12, marginTop: 8}}>
                                    ⭐ Score: <strong>{callData.score || '-'}</strong>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="muted" style={{fontSize: '0.95em'}}>No calls recorded for this product</div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div style={{padding: 20, background: '#f5f5f5', borderRadius: 8, textAlign: 'center', color: '#999'}}>
          No calls logged yet
        </div>
      )}
    </div>
  )
}
