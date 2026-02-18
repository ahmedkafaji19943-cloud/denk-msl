import React from 'react'
import { getState } from '../storage'

function avg(arr) { return arr.length ? (arr.reduce((a,b)=>a+b,0)/arr.length).toFixed(1) : '-' }

export default function Reports({ msl }) {
  const s = getState()
  const calls = s.calls.filter(c => c.mslId === msl.id)

  const byMedRep = {}
  calls.forEach(c => {
    byMedRep[c.medRep] = byMedRep[c.medRep] || []
    byMedRep[c.medRep].push(c.score)
  })

  return (
    <div className="card">
      <h2>Report — {msl.name}</h2>
      <div className="muted">Total calls: {calls.length}</div>
      <h3>Scores by Med Rep</h3>
      <ul>
        {Object.keys(byMedRep).map(k => (
          <li key={k}>{k}: {avg(byMedRep[k])}</li>
        ))}
      </ul>

      <h3>Knowledge gaps (scores ≤4)</h3>
      <ul>
        {calls.filter(c=>c.score<=4).map(c => (
          <li key={c.id}>{c.medRep} — {c.productId} — {c.messages.join('; ')} ({c.score})</li>
        ))}
      </ul>
    </div>
  )
}
