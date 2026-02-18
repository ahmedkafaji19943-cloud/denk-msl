import React, { useState } from 'react'
import { addOrUpdateMedRep, removeMedRep } from '../firestoreStorage'

export default function MedRepManager({ config, onMedRepsUpdated }) {
  const [showForm, setShowForm] = useState(false)
  const [newMedRepName, setNewMedRepName] = useState('')
  const [saving, setSaving] = useState(false)
  const [editingIndex, setEditingIndex] = useState(null)
  const [editValue, setEditValue] = useState('')

  async function handleAddMedRep() {
    if (!newMedRepName.trim()) {
      alert('Please enter a med rep name')
      return
    }

    setSaving(true)
    try {
      await addOrUpdateMedRep(newMedRepName.trim())
      alert('Med rep added!')
      setNewMedRepName('')
      setShowForm(false)
      onMedRepsUpdated()
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleRemove(medRepName) {
    if (!confirm(`Remove "${medRepName}" from the list?`)) return
    
    setSaving(true)
    try {
      await removeMedRep(medRepName)
      alert('Med rep removed!')
      onMedRepsUpdated()
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const medReps = config?.medReps || []

  return (
    <div className="card">
      <h2>Manage Med Reps</h2>
      <div className="muted">Total med reps: {medReps.length}</div>

      {showForm ? (
        <div style={{marginTop: 16}}>
          <h3>Add New Med Rep</h3>
          <label>Med Rep Name</label>
          <input 
            type="text" 
            placeholder="e.g., John Smith"
            value={newMedRepName}
            onChange={e => setNewMedRepName(e.target.value)}
          />

          <div style={{display: 'flex', gap: 8, marginTop: 12}}>
            <button className="primary" onClick={handleAddMedRep} disabled={saving}>
              {saving ? 'Adding...' : 'Add Med Rep'}
            </button>
            <button className="secondary" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      ) : (
        <button className="primary" onClick={() => setShowForm(true)} style={{marginTop: 12}}>
          + Add Med Rep
        </button>
      )}

      <h3 style={{marginTop: 24}}>Current Med Reps</h3>
      {medReps.length > 0 ? (
        <ul>
          {medReps.map((rep, i) => (
            <li key={i} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <span><strong>{rep}</strong></span>
              <button 
                className="secondary" 
                onClick={() => handleRemove(rep)}
                style={{padding: 4, fontSize: '0.85em'}}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="muted">No med reps yet</div>
      )}
    </div>
  )
}
