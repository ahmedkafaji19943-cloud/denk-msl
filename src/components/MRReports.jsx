import React, { useEffect, useMemo, useState } from 'react'
import { getAllCalls } from '../firestoreStorage'

export default function MRReports({ config }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [calls, setCalls] = useState([])
  const [provinceFilter, setProvinceFilter] = useState('all')
  const [medRepFilter, setMedRepFilter] = useState('all')
  const [mslFilter, setMslFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('')

  useEffect(() => {
    loadCalls()
  }, [])

  useEffect(() => {
    // Reset med rep filter if province changes and selected med rep is not in the new province
    if (provinceFilter !== 'all' && medRepFilter !== 'all') {
      const selectedMedRepProvince = medRepToProvince[medRepFilter]
      if (selectedMedRepProvince !== provinceFilter) {
        setMedRepFilter('all')
      }
    }
  }, [provinceFilter, medRepToProvince, medRepFilter])

  async function loadCalls() {
    try {
      setLoading(true)
      setError(null)
      const allCalls = await getAllCalls()
      setCalls(allCalls || [])
    } catch (err) {
      console.error('Error loading MR reports:', err)
      setError('Failed to load MR reports: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const mslNameById = useMemo(() => {
    const map = {}
    ;(config?.msls || []).forEach(msl => {
      map[msl.id] = msl.name
    })
    return map
  }, [config])

  const medRepOptions = useMemo(() => {
    let names = []
    
    if (provinceFilter !== 'all') {
      // Show only med reps from selected province
      names = (config?.medReps || [])
        .filter(m => (typeof m === 'string' ? false : m?.province === provinceFilter))
        .map(m => (typeof m === 'string' ? m : m?.name))
        .filter(Boolean)
    } else {
      // Show all med reps
      const namesFromCalls = calls.map(c => c.medRep).filter(Boolean)
      const namesFromConfig = (config?.medReps || [])
        .map(m => (typeof m === 'string' ? m : m?.name))
        .filter(Boolean)
      names = Array.from(new Set([...namesFromCalls, ...namesFromConfig]))
    }
    
    return names.sort((a, b) => a.localeCompare(b))
  }, [calls, config, provinceFilter])

  const provinceOptions = useMemo(() => {
    const provinces = (config?.medReps || [])
      .map(m => (typeof m === 'string' ? null : m?.province))
      .filter(Boolean)
    return Array.from(new Set(provinces)).sort((a, b) => a.localeCompare(b))
  }, [config])

  const mslOptions = useMemo(() => {
    return (config?.msls || []).filter(m => !m.reportsOnly)
  }, [config])

  const medRepToProvince = useMemo(() => {
    const map = {}
    ;(config?.medReps || []).forEach(m => {
      if (typeof m !== 'string') {
        map[m.name] = m.province
      }
    })
    return map
  }, [config])

  const filteredCalls = useMemo(() => {
    return calls
      .filter(call => {
        if (provinceFilter !== 'all') {
          const medRepProvince = medRepToProvince[call.medRep]
          if (medRepProvince !== provinceFilter) return false
        }
        if (medRepFilter !== 'all' && call.medRep !== medRepFilter) return false
        if (mslFilter !== 'all' && call.mslId !== mslFilter) return false
        if (dateFilter && call.date !== dateFilter) return false
        return true
      })
      .sort((a, b) => {
        const dateA = new Date(a.date || 0).getTime()
        const dateB = new Date(b.date || 0).getTime()
        return dateB - dateA
      })
  }, [calls, provinceFilter, medRepFilter, mslFilter, dateFilter, medRepToProvince])

  const groupedByMedRep = useMemo(() => {
    const groups = {}
    filteredCalls.forEach(call => {
      const key = call.medRep || 'Unknown Med Rep'
      groups[key] = groups[key] || []
      groups[key].push(call)
    })
    return Object.keys(groups)
      .sort((a, b) => a.localeCompare(b))
      .map(name => ({ medRep: name, calls: groups[name] }))
  }, [filteredCalls])

  if (loading) return <div className="card">Loading MR reports...</div>
  if (error) return <div className="card" style={{ color: '#ec4899', fontWeight: 'bold' }}>⚠️ {error}</div>

  return (
    <div className="card mr-reports">
      <h2>MR Reports</h2>
      <div className="muted" style={{ marginBottom: 16 }}>View complete call history per Med Rep</div>

      {/* Debug Info */}
      <div style={{ fontSize: '0.85em', color: '#999', marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 6 }}>
        <div>📊 Debug: {calls.length} total calls | {filteredCalls.length} filtered | Provinces: {provinceOptions.length} | Med Reps: {medRepOptions.length}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 20 }}>
        <div>
          <label>Filter by Province</label>
          <select value={provinceFilter} onChange={e => setProvinceFilter(e.target.value)}>
            <option value="all">All Provinces</option>
            {provinceOptions.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>

        <div>
          <label>Filter by Med Rep</label>
          <select value={medRepFilter} onChange={e => setMedRepFilter(e.target.value)}>
            <option value="all">All Med Reps</option>
            {medRepOptions.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>

        <div>
          <label>Filter by MSL</label>
          <select value={mslFilter} onChange={e => setMslFilter(e.target.value)}>
            <option value="all">All MSLs</option>
            {mslOptions.map(msl => (
              <option key={msl.id} value={msl.id}>{msl.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label>Filter by Date</label>
          <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} />
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <button
          onClick={() => {
            setProvinceFilter('all')
            setMedRepFilter('all')
            setMslFilter('all')
            setDateFilter('')
          }}
          style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 14px', cursor: 'pointer' }}
        >
          Clear Filters
        </button>
      </div>

      {groupedByMedRep.length === 0 ? (
        <div style={{ padding: 16, borderRadius: 8, background: '#f9fafb', border: '1px solid var(--border)' }}>
          No calls found for selected filters.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {groupedByMedRep.map(group => (
            <div key={group.medRep} className="mr-group" style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
              <div className="mr-group-head" style={{ padding: 14, background: '#f9fafb', borderBottom: '1px solid var(--border)', fontWeight: 700 }}>
                <div>👤 {group.medRep} ({group.calls.length} call{group.calls.length !== 1 ? 's' : ''})</div>
                {medRepToProvince[group.medRep] && (
                  <div style={{ fontSize: '0.85em', marginTop: 6, color: '#6b7280' }}>
                    🗺️ {medRepToProvince[group.medRep]}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 14 }}>
                {group.calls.map(call => {
                  const productName = config?.products?.find(p => p.id === call.productId)?.name || call.productId || 'Unknown Product'
                  return (
                    <div key={call.id} className="mr-call" style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 12, background: '#fff' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8, marginBottom: 10 }}>
                        <div><strong>📅 Date:</strong> {call.date || '-'}</div>
                        <div><strong>👨‍⚕️ MSL:</strong> {mslNameById[call.mslId] || call.mslId || '-'}</div>
                        <div><strong>📦 Product:</strong> {productName}</div>
                        <div><strong>⭐ Assessment:</strong> {call.score ?? '-'}</div>
                      </div>

                      <div style={{ marginBottom: 8 }}>
                        <strong>💬 Messages:</strong>
                        <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {(call.messages || []).length > 0 ? (
                            call.messages.map((msg, idx) => (
                              <div key={idx} style={{ lineHeight: 1.4 }}>• {msg}</div>
                            ))
                          ) : (
                            <div className="muted">No messages logged</div>
                          )}
                        </div>
                      </div>

                      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                        <strong>📝 Knowledge Note:</strong>
                        <div style={{ marginTop: 6, fontStyle: call.note ? 'italic' : 'normal' }}>
                          {call.note || 'No note'}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
