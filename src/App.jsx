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
        
        // Find MSL details by email
        const msl = cfg.msls.find(m => m.email === firebaseUser.email)
        if (msl) {
          setMslInfo(msl)
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
        <div className="brand">Denk MSL</div>
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
        ) : (
          <div>
            <div className="tabs">
              <button onClick={() => setTab('log')} className={tab==='log'? 'active':''}>Log Call</button>
              <button onClick={() => setTab('edit')} className={tab==='edit'? 'active':''}>Messages</button>
              <button onClick={() => setTab('products')} className={tab==='products'? 'active':''}>Products</button>
              <button onClick={() => setTab('medreps')} className={tab==='medreps'? 'active':''}>Med Reps</button>
              <button onClick={() => setTab('report')} className={tab==='report'? 'active':''}>Report</button>
              {mslInfo?.manager && <button onClick={() => setTab('team')} className={tab==='team'? 'active':''}>Team</button>}
            </div>

            <div className="meta">
              <strong>{mslInfo?.name || user.email}</strong> 
              {mslInfo?.manager && ' (Manager)'}
              <button onClick={handleLogout} style={{marginLeft: 8}}>Logout</button>
            </div>

            {config && (
              <>
                {tab==='log' && <LogCall user={user} mslId={mslInfo.id} config={config} />}
                {tab==='edit' && <MessagesEdit mslId={mslInfo.id} config={config} />}
                {tab==='products' && <ProductManager config={config} onProductAdded={reloadConfig} />}
                {tab==='medreps' && <MedRepManager config={config} onMedRepsUpdated={reloadConfig} />}
                {tab==='report' && <Reports mslId={mslInfo.id} mslName={mslInfo.name} isManager={false} config={config} />}
                {tab==='team' && mslInfo?.manager && <Reports mslId={mslInfo.id} mslName={mslInfo.name} isManager={true} config={config} />}
              </>
            )}
          </div>
        )}
      </main>

      <footer>
        <div>Denk MSL • Powered by Firebase</div>
      </footer>
    </div>
  )
}
