import React, { useState, useEffect } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from './firebase'
import { initializeSharedData, getSharedConfig } from './firestoreStorage'
import FirebaseLogin from './components/FirebaseLogin'
import LogCall from './components/LogCall'
import MessagesEdit from './components/MessagesEdit'
import Reports from './components/Reports'
import ProductManager from './components/ProductManager'
import MedRepManager from './components/MedRepManager'
import PlanManager from './components/PlanManager'

// Denk MSL Main App Component
// Force rebuild - 2026-02-18
export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('log')
  const [night, setNight] = useState(false)
  const [config, setConfig] = useState(null)
  const [mslInfo, setMslInfo] = useState(null)

  // Initialize Firebase and listen for auth changes
  useEffect(() => {
    initializeSharedData().catch(e => console.error('Init data failed:', e))
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const cfg = await getSharedConfig()
        setConfig(cfg)
        
        // Find MSL details by email or UID
        let msl = cfg.msls.find(m => m.email === firebaseUser.email)
        // If not found by email, try by UID
        if (!msl) {
          msl = cfg.msls.find(m => m.uid === firebaseUser.uid)
        }
        if (msl) {
          setMslInfo(msl)
          // If this is a reports-only user, set tab to mslreport
          if (msl.reportsOnly) {
            setTab('mslreport')
          }
        }
      }
      setUser(firebaseUser)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  function handleLogout() {
    signOut(auth).catch(e => console.error('Logout error:', e))
    setMslInfo(null)
    setTab('log')
  }

  async function reloadConfig() {
    const cfg = await getSharedConfig()
    setConfig(cfg)
  }

  if (loading) return <div style={{padding: '20px'}}>Loading...</div>

  return (
    <div className={night ? 'app night' : 'app'}>
      <header>
        <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
          <div style={{
            width: '36px',
            height: '36px',
            background: 'linear-gradient(135deg, #FEED00 0%, #FFC800 100%)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            color: '#000',
            fontSize: '1.1em',
            boxShadow: '0 4px 15px rgba(254, 237, 0, 0.3)'
          }}>D</div>
          <div className="brand">Denk MSL</div>
        </div>
        <div className="spacer" />
        <label className="toggle">
          <input type="checkbox" checked={night} onChange={e => setNight(e.target.checked)} /> Night
        </label>
      </header>

      <main>
        {!user ? (
          <FirebaseLogin 
            onSuccess={() => {}}
            onLogout={() => setMslInfo(null)}
          />
        ) : !mslInfo ? (
          <div className="card" style={{margin: '20px', padding: '20px', background: '#fee2e2', border: '2px solid #ec4899', borderRadius: '8px'}}>
            <h2 style={{color: '#ec4899', marginBottom: '12px'}}>⚠️ Account Not Configured</h2>
            <p>Your Firebase account is not found in the system configuration.</p>
            <p style={{marginTop: '12px', marginBottom: '12px', fontSize: '0.95em', fontFamily: 'monospace', background: '#fff', padding: '12px', borderRadius: '4px', wordBreak: 'break-all'}}>
              <strong>Your Firebase Email:</strong> {user?.email || 'N/A'}<br/>
              <strong>Your Firebase UID:</strong> {user?.uid || 'N/A'}
            </p>
            <p>Please provide the above details to your administrator.</p>
            <p style={{marginTop: '12px', fontSize: '0.9em', color: '#555'}}>Configured accounts:</p>
            <ul style={{marginLeft: '20px', marginTop: '8px', fontSize: '0.9em'}}>
              {config?.msls?.map((msl, idx) => (
                <li key={idx}>{msl.name} ({msl.email || 'no email'}) - UID: {msl.uid || 'no uid'}</li>
              )) || <li>No MSLs configured</li>}
            </ul>
            <button onClick={handleLogout} style={{marginTop: '16px', padding: '8px 16px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9em'}}>Logout</button>
          </div>
        ) : (
          <div>
            <div className="tabs">
              {!mslInfo?.reportsOnly && (
                <>
                  <button onClick={() => setTab('log')} className={tab==='log'? 'active':''}>Log Call</button>
                  <button onClick={() => setTab('plan')} className={tab==='plan'? 'active':''}>Plan</button>
                  <button onClick={() => setTab('edit')} className={tab==='edit'? 'active':''}>Messages</button>
                  <button onClick={() => setTab('products')} className={tab==='products'? 'active':''}>Products</button>
                  <button onClick={() => setTab('medreps')} className={tab==='medreps'? 'active':''}>Med Reps</button>
                </>
              )}
              <button onClick={() => setTab('mslreport')} className={tab==='mslreport'? 'active':''}>MSL Report</button>
            </div>

            <div className="meta">
              <strong>{mslInfo?.name || user.email}</strong> 
              {mslInfo?.manager && ' (Manager)'}
              <button onClick={handleLogout} style={{marginLeft: 8}}>Logout</button>
            </div>

            {config && mslInfo && (
              <>
                {tab==='log' && <LogCall user={user} mslId={mslInfo.id} config={config} />}
                {tab==='plan' && <PlanManager mslId={mslInfo.id} mslName={mslInfo.name} config={config} />}
                {tab==='edit' && <MessagesEdit mslId={mslInfo.id} config={config} />}
                {tab==='products' && <ProductManager config={config} onProductAdded={reloadConfig} />}
                {tab==='medreps' && <MedRepManager config={config} onMedRepsUpdated={reloadConfig} />}
                {tab==='mslreport' && <Reports mslId={mslInfo.id} mslName={mslInfo.name} isManager={mslInfo?.manager || false} config={config} />}
              </>
            )}
          </div>
        )}
      </main>

      <footer>
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'wrap'}}>
          <span style={{fontWeight: 600}}>Denk MSL</span>
          <span>•</span>
          <span>Medical Science Liaison Management Platform</span>
        </div>
      </footer>
    </div>
  )
}
