import React, { useState } from 'react'
import { signInWithEmailAndPassword, signOut, signInWithCustomToken } from 'firebase/auth'
import { auth } from '../firebase'
import { getSharedConfig, getUserSettings } from '../firestoreStorage'

export default function FirebaseLogin({ onSuccess, onLogout }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState(null)

  async function handleLogin() {
    if (!email || !password) {
      setError('Please enter email and password')
      return
    }
    setLoading(true)
    setError('')
    
    try {
      // First, try Firebase Auth login
      try {
        const res = await signInWithEmailAndPassword(auth, email, password)
        setUser(res.user)
        onSuccess(res.user)
        return
      } catch (firebaseErr) {
        // If Firebase Auth fails, try Firestore password verification
        const config = await getSharedConfig()
        const msl = config.msls.find(m => m.email.toLowerCase() === email.toLowerCase())
        
        if (!msl) {
          setError('User not found')
          return
        }
        
        // Get user settings with password stored in Firestore
        const settings = await getUserSettings(msl.id)
        
        if (!settings || !settings.password) {
          setError('Password not configured. Please contact administrator.')
          return
        }
        
        // Verify password from Firestore
        if (settings.password !== password) {
          setError('Incorrect password')
          return
        }
        
        // Password matches! Create a custom user object that mimics Firebase user
        const customUser = {
          email: msl.email,
          uid: msl.uid || msl.id,
          emailVerified: true,
          isAnonymous: false,
          metadata: { creationTime: new Date().toISOString() }
        }
        
        setUser(customUser)
        onSuccess(customUser)
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('Login failed: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleLogout() {
    // Try to sign out from Firebase Auth (will fail silently if user is from Firestore)
    signOut(auth).catch(() => {
      // Ignore error for Firestore-authenticated users
    }).finally(() => {
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
