import React, { useState } from 'react'
import { addOrUpdateMedRep, removeMedRep } from '../firestoreStorage'

export default function MedRepManager({ config, onMedRepsUpdated }) {
  const [showForm, setShowForm] = useState(false)
  const [newMedRepName, setNewMedRepName] = useState('')
  const [newZone, setNewZone] = useState('')
  const [newLine, setNewLine] = useState('')
  const [saving, setSaving] = useState(false)
  const [editingMedRep, setEditingMedRep] = useState(null)
  const [editName, setEditName] = useState('')
  const [editZone, setEditZone] = useState('')
  const [editLine, setEditLine] = useState('')

  async function handleAddMedRep() {
    if (!newMedRepName.trim()) {
      alert('Please enter a med rep name')
      return
    }

    setSaving(true)
    try {
      await addOrUpdateMedRep(newMedRepName.trim(), newZone.trim(), newLine.trim())
      alert('Med rep added!')
      setNewMedRepName('')
      setNewZone('')
      setNewLine('')
      setShowForm(false)
      onMedRepsUpdated()
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveEdit() {
    if (!editName.trim()) {
      alert('Please enter a med rep name')
      return
    }

    setSaving(true)
    try {
      await addOrUpdateMedRep(editName.trim(), editZone.trim(), editLine.trim())
      alert('Med rep updated!')
      setEditingMedRep(null)
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

  const medReps = (config?.medReps || []).map(m => typeof m === 'string' ? { name: m, zone: '', line: '' } : m)

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
            placeholder="e.g., Dr. Ahmed Hassan"
            value={newMedRepName}
            onChange={e => setNewMedRepName(e.target.value)}
          />
          <label>Zone</label>
          <input 
            type="text" 
            placeholder="e.g., North, Central, South"
            value={newZone}
            onChange={e => setNewZone(e.target.value)}
          />
          <label>Line / Department</label>
          <input 
            type="text" 
            placeholder="e.g., Cardiology, Internal Medicine"
            value={newLine}
            onChange={e => setNewLine(e.target.value)}
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
      {editingMedRep ? (
        <div style={{marginBottom: 20}}>
          <h4>Edit Med Rep</h4>
          <label>Name</label>
          <input value={editName} onChange={e => setEditName(e.target.value)} />
          <label>Zone</label>
          <input value={editZone} onChange={e => setEditZone(e.target.value)} />
          <label>Line / Department</label>
          <input value={editLine} onChange={e => setEditLine(e.target.value)} />
          <div style={{display: 'flex', gap: 8, marginTop: 12}}>
            <button className="primary" onClick={handleSaveEdit} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button className="secondary" onClick={() => setEditingMedRep(null)}>Cancel</button>
          </div>
        </div>
      ) : null}

      {medReps.length > 0 ? (
        <ul>
          {medReps.map((rep, i) => (
            <li key={i} style={{padding: '10px', border: '1px solid #eee', borderRadius: 6, marginBottom: 8}}>
              <div><strong>{rep.name}</strong></div>
              {rep.zone && <div className="muted"><small>Zone: {rep.zone}</small></div>}
              {rep.line && <div className="muted"><small>Line: {rep.line}</small></div>}
              <div style={{display: 'flex', gap: 8, marginTop: 6}}>
                <button 
                  className="secondary" 
                  onClick={() => { setEditingMedRep(rep.name); setEditName(rep.name); setEditZone(rep.zone); setEditLine(rep.line); }}
                  style={{padding: 4, fontSize: '0.85em'}}
                >
                  Edit
                </button>
                <button 
                  className="secondary" 
                  onClick={() => handleRemove(rep.name)}
                  style={{padding: 4, fontSize: '0.85em'}}
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="muted">No med reps yet</div>
      )}
    </div>
  )
}
