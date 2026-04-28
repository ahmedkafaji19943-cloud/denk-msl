import React, { useState, useEffect } from 'react'
import { getUserSettings, saveUserSettings, getAllUserSettings, getAllProvinces } from '../firestoreStorage'

export default function AccountManager({ config }) {
  const [mslList, setMslList] = useState([])
  const [selectedMsl, setSelectedMsl] = useState(null)
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [allProvinces, setAllProvinces] = useState([])
  const [editMode, setEditMode] = useState(false)

  useEffect(() => {
    loadData()
  }, [config])

  async function loadData() {
    try {
      const provinces = await getAllProvinces()
      setAllProvinces(provinces)
      setMslList(config?.msls || [])
      setLoading(false)
    } catch (err) {
      console.error('Error loading data:', err)
      setLoading(false)
    }
  }

  async function selectMsl(msl) {
    setSelectedMsl(msl)
    setEditMode(false)
    try {
      const userSettings = await getUserSettings(msl.id)
      setSettings(userSettings || {
        mslId: msl.id,
        allowedTabs: ['mslReport', 'mrReport'],
        allowedProvinces: allProvinces,
        displayName: msl.name,
        email: msl.email
      })
    } catch (err) {
      console.error('Error loading settings:', err)
    }
  }

  function toggleTab(tabName) {
    if (!settings) return
    const newTabs = settings.allowedTabs || []
    if (newTabs.includes(tabName)) {
      setSettings({
        ...settings,
        allowedTabs: newTabs.filter(t => t !== tabName)
      })
    } else {
      setSettings({
        ...settings,
        allowedTabs: [...newTabs, tabName]
      })
    }
  }

  function toggleProvince(province) {
    if (!settings) return
    const newProvinces = settings.allowedProvinces || []
    if (newProvinces.includes(province)) {
      setSettings({
        ...settings,
        allowedProvinces: newProvinces.filter(p => p !== province)
      })
    } else {
      setSettings({
        ...settings,
        allowedProvinces: [...newProvinces, province]
      })
    }
  }

  async function handleSaveSettings() {
    if (!settings) return
    setSaving(true)
    try {
      await saveUserSettings(settings.mslId, settings)
      alert('Settings saved successfully!')
      setEditMode(false)
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="card">Loading accounts...</div>

  const tabOptions = [
    { id: 'logCall', label: 'Log Call' },
    { id: 'plan', label: 'Plan' },
    { id: 'messages', label: 'Messages' },
    { id: 'products', label: 'Products' },
    { id: 'medReps', label: 'Med Reps' },
    { id: 'mslReport', label: 'MSL Report' },
    { id: 'mrReport', label: 'MR Reports' }
  ]

  return (
    <div className="card">
      <h2>Account Management</h2>
      <p className="muted">Manage MSL accounts, permissions, and province access</p>

      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px'}}>
        {/* Left: MSL List */}
        <div style={{border: '1px solid #eee', borderRadius: '6px', padding: '16px'}}>
          <h3>MSL Accounts</h3>
          <ul style={{listStyle: 'none', padding: 0}}>
            {mslList.map(msl => (
              <li key={msl.id}>
                <button
                  onClick={() => selectMsl(msl)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    marginBottom: '6px',
                    textAlign: 'left',
                    background: selectedMsl?.id === msl.id ? '#FEED00' : '#fff',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: selectedMsl?.id === msl.id ? 600 : 400
                  }}
                >
                  <div><strong>{msl.name}</strong></div>
                  <div style={{fontSize: '0.85em', color: '#666'}}>{msl.email}</div>
                  {msl.manager && <div style={{fontSize: '0.8em', color: '#6366f1', fontWeight: 600}}>👤 Manager</div>}
                  {msl.reportsOnly && <div style={{fontSize: '0.8em', color: '#ec4899', fontWeight: 600}}>📋 Reports Only</div>}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Right: Settings Editor */}
        {selectedMsl && settings ? (
          <div style={{border: '1px solid #ddd', borderRadius: '6px', padding: '16px', background: '#f9f9f9'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
              <div>
                <h3 style={{margin: '0 0 4px 0'}}>{selectedMsl.name}</h3>
                <p style={{margin: '0', fontSize: '0.9em', color: '#666'}}>{selectedMsl.email}</p>
              </div>
              <button
                onClick={() => setEditMode(!editMode)}
                style={{padding: '6px 12px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer'}}
              >
                {editMode ? 'Cancel' : 'Edit'}
              </button>
            </div>

            {editMode ? (
              <>
                <div style={{marginBottom: '20px'}}>
                  <h4>Allowed Tabs</h4>
                  <p style={{fontSize: '0.9em', color: '#666', marginBottom: '10px'}}>Select which tabs this MSL can access</p>
                  <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px'}}>
                    {tabOptions.map(tab => (
                      <label key={tab.id} style={{display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '8px', background: '#fff', borderRadius: '4px', border: '1px solid #eee'}}>
                        <input
                          type="checkbox"
                          checked={(settings.allowedTabs || []).includes(tab.id)}
                          onChange={() => toggleTab(tab.id)}
                        />
                        {tab.label}
                      </label>
                    ))}
                  </div>
                </div>

                <div style={{marginBottom: '20px'}}>
                  <h4>Allowed Provinces for MR Reports</h4>
                  <p style={{fontSize: '0.9em', color: '#666', marginBottom: '10px'}}>Select which provinces they can view in MR Reports</p>
                  <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px'}}>
                    {allProvinces.map(province => (
                      <label key={province} style={{display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '8px', background: '#fff', borderRadius: '4px', border: '1px solid #eee'}}>
                        <input
                          type="checkbox"
                          checked={(settings.allowedProvinces || []).includes(province)}
                          onChange={() => toggleProvince(province)}
                        />
                        🗺️ {province}
                      </label>
                    ))}
                  </div>
                </div>

                <div style={{display: 'flex', gap: '8px'}}>
                  <button
                    onClick={handleSaveSettings}
                    disabled={saving}
                    style={{flex: 1, padding: '10px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600}}
                  >
                    {saving ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={{marginBottom: '16px'}}>
                  <h4 style={{marginBottom: '8px'}}>Allowed Tabs</h4>
                  <div style={{display: 'flex', flexWrap: 'wrap', gap: '6px'}}>
                    {(settings.allowedTabs || []).length > 0 ? (
                      (settings.allowedTabs || []).map(tabId => {
                        const tab = tabOptions.find(t => t.id === tabId)
                        return (
                          <span key={tabId} style={{background: '#e0e7ff', color: '#4f46e5', padding: '4px 10px', borderRadius: '12px', fontSize: '0.85em', fontWeight: 500}}>
                            {tab?.label || tabId}
                          </span>
                        )
                      })
                    ) : (
                      <span className="muted">No tabs allowed</span>
                    )}
                  </div>
                </div>

                <div>
                  <h4 style={{marginBottom: '8px'}}>Allowed Provinces</h4>
                  <div style={{display: 'flex', flexWrap: 'wrap', gap: '6px'}}>
                    {(settings.allowedProvinces || []).length > 0 ? (
                      (settings.allowedProvinces || []).map(province => (
                        <span key={province} style={{background: '#fce7f3', color: '#be185d', padding: '4px 10px', borderRadius: '12px', fontSize: '0.85em', fontWeight: 500}}>
                          🗺️ {province}
                        </span>
                      ))
                    ) : (
                      <span className="muted">No provinces allowed</span>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <div style={{border: '1px solid #eee', borderRadius: '6px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px', color: '#999'}}>
            Select an MSL account to view/edit settings
          </div>
        )}
      </div>
    </div>
  )
}
