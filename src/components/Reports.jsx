import React, { useState, useEffect } from 'react'
import { getCallsForMSL, getAllCalls } from '../firestoreStorage'

function avg(arr) { return arr.length ? (arr.reduce((a,b)=>a+b,0)/arr.length).toFixed(1) : '-' }

export default function Reports({ mslId, mslName, isManager, config }) {
  const [calls, setCalls] = useState([])
  const [loading, setLoading] = useState(true)
  const [teamReports, setTeamReports] = useState({})
  const [expandedMSLs, setExpandedMSLs] = useState({})
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

  function toggleMSL(mslId) {
    setExpandedMSLs(prev => ({...prev, [mslId]: !prev[mslId]}))
  }

  function toggleMedRep(key) {
    setExpandedMedReps(prev => ({...prev, [key]: !prev[key]}))
  }

  if (loading) return <div className="card">Loading reports...</div>

  return (
    <div className="card">
      <h2>{isManager ? 'Team Reports' : 'All MSL Reports'}</h2>
      {Object.entries(teamReports).map(([mslId, team]) => (
        <div key={mslId} style={{marginBottom: 20, borderBottom: '1px solid #eee', paddingBottom: 20}}>
          <div
            onClick={() => toggleMSL(mslId)}
            style={{
              cursor: 'pointer',
              padding: 12,
              background: expandedMSLs[mslId] ? '#FEED00' : '#f5f5f5',
              borderRadius: 6,
              fontWeight: 'bold',
              fontSize: '1.1em',
              userSelect: 'none'
            }}
          >
            {expandedMSLs[mslId] ? '▼' : '▶'} {team.name}
          </div>
          {expandedMSLs[mslId] && (
            <div style={{marginTop: 12, paddingLeft: 12}}>
              <ReportContent calls={team.calls} config={config} onToggleMedRep={toggleMedRep} expandedMedReps={expandedMedReps} />
            </div>
          )}
        </div>
      ))}
    </div>
  )
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
    <>
      <div className="muted" style={{marginBottom: 16}}>
        📊 Total calls: <strong>{calls.length}</strong>
      </div>
      
      {Object.keys(byMedRep).length > 0 ? (
        <div>
          {Object.keys(byMedRep).sort().map(medRep => {
            const repKey = `medRep_${medRep}`
            const isExpanded = expandedMedReps[repKey]
            const avgScore = avg(byMedRep[medRep])
            const productsForRep = Object.keys(byMedRepProduct).filter(k => byMedRepProduct[k].medRep === medRep)
            
            return (
              <div key={medRep} style={{marginBottom: 16, border: '1px solid #eee', borderRadius: 6, overflow: 'hidden'}}>
                <div
                  onClick={() => onToggleMedRep(repKey)}
                  style={{
                    cursor: 'pointer',
                    padding: 12,
                    background: isExpanded ? '#FEED00' : '#f9f9f9',
                    fontWeight: 'bold',
                    userSelect: 'none',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <span>{isExpanded ? '▼' : '▶'} {medRep}</span>
                  <span style={{fontSize: '0.9em', color: '#666'}}>Calls: {byMedRep[medRep].length} | Avg Score: {avgScore}</span>
                </div>

                {isExpanded && (
                  <div style={{padding: 16, background: '#fafafa'}}>
                    {productsForRep.map(productKey => {
                      const productData = byMedRepProduct[productKey]
                      const product = config?.products?.find(p => p.id === productData.productId)
                      
                      return (
                        <div key={productKey} style={{marginBottom: 12, padding: 12, background: '#fff', borderRadius: 6, border: '1px solid #e0e0e0'}}>
                          <div style={{fontWeight: 'bold', color: '#FEED00', marginBottom: 8}}>
                            📦 {product?.name || productData.productId}
                          </div>
                          
                          {productData.calls && productData.calls.length > 0 ? (
                            <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
                              {productData.calls.map((callData, callIdx) => (
                                <div key={callIdx} style={{padding: 10, background: '#f5f5f5', borderRadius: 4, borderLeft: '3px solid #FEED00'}}>
                                  <div style={{fontSize: '0.85em', color: '#666', marginBottom: 8, fontWeight: 500}}>
                                    📅 {callData.date}
                                  </div>
                                  <div style={{fontSize: '0.9em', color: '#333', marginBottom: callData.note ? 6 : 0, fontWeight: 500}}>
                                    {callData.messages.map((msg, msgIdx) => (
                                      <div key={msgIdx} style={{marginBottom: 4}}>
                                        • {msg}
                                      </div>
                                    ))}
                                  </div>
                                  {callData.note && (
                                    <div style={{fontSize: '0.85em', color: '#666', fontStyle: 'italic', paddingLeft: 12, marginBottom: 4}}>
                                      📝 Note: {callData.note}
                                    </div>
                                  )}
                                  <div style={{fontSize: '0.8em', color: '#999', paddingLeft: 12, marginTop: 4}}>
                                    ⭐ Score: {callData.score || '-'}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="muted" style={{fontSize: '0.9em'}}>No calls recorded</div>
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
        <div className="muted">No calls logged yet</div>
      )}
    </>
  )
}
