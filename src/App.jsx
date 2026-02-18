import React, { useState } from 'react'
import Login from './components/Login'
import LogCall from './components/LogCall'
import MessagesEdit from './components/MessagesEdit'
import Reports from './components/Reports'
import { getState, resetDemo } from './storage'

export default function App() {
  const [msl, setMsl] = useState(null)
  const [tab, setTab] = useState('log')
  const [night, setNight] = useState(false)
  const state = getState()

  function logout() { setMsl(null); setTab('log') }

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
        {!msl ? (
          <Login onSelect={m => setMsl(m)} />
        ) : (
          <div>
            <div className="tabs">
              <button onClick={() => setTab('log')} className={tab==='log'? 'active':''}>Log Call</button>
              <button onClick={() => setTab('edit')} className={tab==='edit'? 'active':''}>Edit Messages</button>
              <button onClick={() => setTab('report')} className={tab==='report'? 'active':''}>Report</button>
              {msl.manager && <button onClick={() => setTab('team')} className={tab==='team'? 'active':''}>Team Reports</button>}
            </div>

            <div className="meta">Signed in as <strong>{msl.name}</strong> <button onClick={logout}>Switch</button></div>

            {tab==='log' && <LogCall msl={msl} />}
            {tab==='edit' && <MessagesEdit msl={msl} />}
            {tab==='report' && <Reports msl={msl} />}
            {tab==='team' && <div className="card">
              <h2>Team Reports</h2>
              {state.msls.filter(x=>!x.manager).map(mm => (
                <div key={mm.id} className="team-item">
                  <h4>{mm.name}</h4>
                  <Reports msl={mm} />
                </div>
              ))}
            </div>}

            <div style={{marginTop:12}}>
              <button onClick={() => { if(confirm('Reset demo data?')) resetDemo(); location.reload() }} className="muted">Reset Demo</button>
            </div>
          </div>
        )}
      </main>

      <footer>
        <div>Theme colors: #FEED00 / #FFFFFF</div>
      </footer>
    </div>
  )
}
