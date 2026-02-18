import React from 'react'
import { getState } from '../storage'

export default function Login({ onSelect }) {
  const s = getState()
  return (
    <div className="card">
      <h2>Select MSL</h2>
      <div className="list">
        {s.msls.map(msl => (
          <button key={msl.id} onClick={() => onSelect(msl)} className="list-item">
            {msl.name} {msl.manager ? ' (Manager)' : ''}
          </button>
        ))}
      </div>
    </div>
  )
}
