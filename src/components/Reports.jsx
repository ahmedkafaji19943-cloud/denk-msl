import React, { useState, useEffect } from 'react'
import { getCallsForMSL, getAllCalls } from '../firestoreStorage'

function avg(arr) { return arr.length ? (arr.reduce((a,b)=>a+b,0)/arr.length).toFixed(1) : '-' }

export default function Reports({ mslId, mslName, isManager, config }) {
  const [calls, setCalls] = useState([])
  const [loading, setLoading] = useState(true)
  const [teamReports, setTeamReports] = useState({})

  useEffect(() => {
    loadReports()
  }, [])

  async function loadReports() {
    if (isManager) {
      const allCalls = await getAllCalls()
      setTeamReports(groupCallsByMSL(allCalls, config))
    } else {
      const mslCalls = await getCallsForMSL(mslId)
      setCalls(mslCalls)
    }
    setLoading(false)
  }

  function groupCallsByMSL(allCalls, cfg) {
    const groups = {}
    cfg.msls.forEach(msl => {
      groups[msl.id] = { name: msl.name, calls: allCalls.filter(c => c.mslId === msl.id) }
    })
    return groups
  }

  if (loading) return <div className="card">Loading reports...</div>

  if (isManager) {
    return (
      <div className="card">
        <h2>Team Reports</h2>
        {Object.values(teamReports).map(team => (
          <div key={team.name} className="team-item">
            <h3>{team.name}</h3>
            <ReportContent calls={team.calls} />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="card">
      <h2>My Report</h2>
      <ReportContent calls={calls} />
    </div>
  )
}

function ReportContent({ calls }) {
  const byMedRep = {}
  calls.forEach(c => {
    byMedRep[c.medRep] = byMedRep[c.medRep] || []
    byMedRep[c.medRep].push(c.score)
  })

  return (
    <>
      <div className="muted">Total calls: {calls.length}</div>
      <h3>Scores by Med Rep</h3>
      {Object.keys(byMedRep).length > 0 ? (
        <ul>
          {Object.keys(byMedRep).map(k => (
            <li key={k}><strong>{k}:</strong> {avg(byMedRep[k])}</li>
          ))}
        </ul>
      ) : (
        <div className="muted">No calls logged yet</div>
      )}
    </>
  )
}
