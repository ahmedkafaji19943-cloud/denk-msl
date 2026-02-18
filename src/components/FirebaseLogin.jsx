import React, { useState } from 'react'
import { signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { auth } from '../firebase'

export default function FirebaseLogin({ onSuccess, onLogout }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState(null)

  function handleLogin() {
    if (!email || !password) {
      setError('Please enter email and password')
      return
    }
    setLoading(true)
    setError('')
    signInWithEmailAndPassword(auth, email, password)
      .then(res => {
        setUser(res.user)
        onSuccess(res.user)
      })
      .catch(err => {
        setError(err.message)
      })
      .finally(() => setLoading(false))
  }

  function handleLogout() {
    signOut(auth).then(() => {
      setUser(null)
      setEmail('')
      setPassword('')
      onLogout()
    })
  }

  return (
    <div className="card">
      {!user ? (
        <div>
          <h2>Denk MSL — Login</h2>
          <label>Email</label>
          <input type="email" placeholder="e.g., khaldoon@denk.local" value={email} onChange={e => setEmail(e.target.value)} />
          <label>Password</label>
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
          {error && <div className="error">{error}</div>}
          <button className="primary" onClick={handleLogin} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
          <div className="muted" style={{marginTop: 16, fontSize: '0.85em'}}>
            <strong>Demo Accounts:</strong><br/>
            khaldoon@denk.local | ahmed@denk.local | rabah@denk.local | ali@denk.local<br/>
            Password: Denk2024!
          </div>
        </div>
      ) : (
        <div>
          <h2>Signed in as</h2>
          <div className="muted">{user.email}</div>
          <button className="secondary" onClick={handleLogout} style={{marginTop: 12}}>Sign Out</button>
        </div>
      )}
    </div>
  )
}
