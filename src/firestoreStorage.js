import {
  collection,
  doc,
  getDoc,
  setDoc,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  serverTimestamp,
  deleteDoc
} from 'firebase/firestore'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { db, auth } from './firebase'

const MSL_DATA = {
  msls: [
    { id: 'msl1', name: 'Khaldoon Sattar', email: 'khaldoon@denk.local' },
    { id: 'msl2', name: 'Ahmed AbdulKareem', email: 'ahmed@denk.local', manager: true },
    { id: 'msl3', name: 'Ahmed Rabah', email: 'rabah@denk.local' },
    { id: 'msl4', name: 'Ali Kamil', email: 'ali@denk.local' },
    { id: 'msl5', name: 'Obaidi', email: 'obaidi@denk.local', uid: 'CBtwsJOTekNbqs08XFiKESZnu3y1', reportsOnly: true },
    { id: 'msl6', name: 'Haitham', email: 'haitham90@denk.local', uid: 'IiorJDRbaPWNN0qoC3ZVIh70ZSb2', reportsOnly: true }
  ],
  medReps: [
    { name: 'Yaman Ali', province: 'Baghdad', zone: 'North', line: '' },
    { name: 'Mohammed Luqman', province: 'Baghdad', zone: 'Central', line: '' },
    { name: 'Erjwan Thaar', province: 'Baghdad', zone: 'South', line: '' },
    { name: 'Sabreen Majid', province: 'Baghdad', zone: 'East', line: '' },
    { name: 'Ibraheem Jumaa', province: 'Baghdad', zone: 'West', line: '' }
  ],
  products: [
    {
      id: 'panto',
      name: 'PantoDenk',
      messages: [
        'A. Pantoprazole is as effective as esomeprazole to relieve symptoms of GERD after 4 weeks of treatment and superior regarding the prevention of symptomatic relapse.',
        'B. Pantoprazole does not have any Drug food interaction compared to esomeprazole.',
        'C. Pantoprazole has the least drug-drug interaction compared to all other PPI.',
        'D. Pantoprazole has the least effect on the ECL cells and does not cause gastric atrophy or metaplasia; safe on prolonged use.',
        'E. Rapid onset, dose linearity.',
        'F. Pregnancy category B'
      ]
    }
  ]
}

// Initialize shared data in Firestore (run once)
export async function initializeSharedData() {
  try {
    const configRef = doc(db, 'config', 'app')
    const snap = await getDoc(configRef)
    if (!snap.exists()) {
      await setDoc(configRef, {
        msls: MSL_DATA.msls,
        medReps: MSL_DATA.medReps,
        products: MSL_DATA.products,
        createdAt: serverTimestamp()
      })
      console.log('Config initialized')
    } else {
      console.log('Config already exists')
    }
  } catch (err) {
    console.error('Init error:', err)
  }
}

// Get shared config (MSLs, med reps, products) - with caching
let configCache = null
let cacheTime = 0
const CACHE_DURATION = 5000 // Cache for only 5 seconds to ensure fresh data on login

export async function getSharedConfig(bypassCache = false) {
  try {
    // Return cached config if recent and not bypassed
    if (!bypassCache && configCache && Date.now() - cacheTime < CACHE_DURATION) {
      return configCache
    }

    const snap = await getDoc(doc(db, 'config', 'app'))
    let config = snap.exists() ? snap.data() : MSL_DATA
    
    // Always use MSL_DATA's msls as source of truth (ensures new MSLs are available)
    // But preserve Firestore medReps and products data if it exists
    config = {
      ...config,
      msls: MSL_DATA.msls
    }
    
    // Ensure all products have messages field (fix for missing messages)
    if (config.products && Array.isArray(config.products)) {
      config.products = config.products.map(product => {
        if (!product.messages || !Array.isArray(product.messages) || product.messages.length === 0) {
          return {
            ...product,
            messages: [
              'Key benefit 1',
              'Key benefit 2',
              'Key benefit 3',
              'Clinical data',
              'Safety profile',
              'Usage recommendation'
            ]
          }
        }
        return product
      })
    }
    
    configCache = config
    cacheTime = Date.now()
    return configCache
  } catch (err) {
    console.error('Error fetching config:', err)
    // If error, return MSL_DATA as fallback
    return configCache || MSL_DATA
  }
}

// Refresh cache in background without blocking
export async function refreshConfigInBackground() {
  try {
    const snap = await getDoc(doc(db, 'config', 'app'))
    if (snap.exists()) {
      configCache = snap.data()
      cacheTime = Date.now()
    }
  } catch (err) {
    console.error('Background config refresh failed:', err)
  }
}

// Save a call
export async function saveCall(call) {
  try {
    const callsRef = collection(db, 'calls')
    await addDoc(callsRef, {
      ...call,
      createdAt: serverTimestamp()
    })
  } catch (err) {
    console.error('Error saving call:', err)
    throw err
  }
}

// Delete a call
export async function deleteCall(callId) {
  try {
    await deleteDoc(doc(db, 'calls', callId))
  } catch (err) {
    console.error('Error deleting call:', err)
    throw err
  }
}

// Get all calls for an MSL
export async function getCallsForMSL(mslId) {
  try {
    const q = query(collection(db, 'calls'), where('mslId', '==', mslId))
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ ...d.data(), id: d.id }))
  } catch (err) {
    console.error('Error fetching calls:', err)
    return []
  }
}

// Get all calls (for manager)
export async function getAllCalls() {
  try {
    const snap = await getDocs(collection(db, 'calls'))
    return snap.docs.map(d => ({ ...d.data(), id: d.id }))
  } catch (err) {
    console.error('Error fetching calls:', err)
    return []
  }
}

// Update MSL's preset messages for a product
export async function updateMessagesForMSL(mslId, productId, messages) {
  try {
    const ref = doc(db, 'mslMessages', `${mslId}_${productId}`)
    await setDoc(ref, { mslId, productId, messages, updatedAt: serverTimestamp() })
  } catch (err) {
    console.error('Error updating messages:', err)
    throw err
  }
}

// Get MSL's custom messages (or defaults if not set)
export async function getMessagesForMSL(mslId, productId, defaultMessages) {
  try {
    const ref = doc(db, 'mslMessages', `${mslId}_${productId}`)
    const snap = await getDoc(ref)
    return snap.exists() ? snap.data().messages : defaultMessages
  } catch (err) {
    console.error('Error fetching messages:', err)
    return defaultMessages
  }
}

// Add a new message to MSL's product messages
export async function addMessageToProduct(mslId, productId, newMessage, defaultMessages) {
  try {
    const ref = doc(db, 'mslMessages', `${mslId}_${productId}`)
    const snap = await getDoc(ref)
    const messages = snap.exists() ? snap.data().messages : defaultMessages.slice()
    messages.push(newMessage)
    await setDoc(ref, { mslId, productId, messages, updatedAt: serverTimestamp() })
    return messages
  } catch (err) {
    console.error('Error adding message:', err)
    throw err
  }
}

// Create a new product globally
export async function createProduct(productName, initialMessages) {
  try {
    const productId = productName.toLowerCase().replace(/\s+/g, '_')
    const ref = doc(db, 'config', 'app')
    const snap = await getDoc(ref)
    
    if (!snap.exists()) {
      throw new Error('Config document missing. Please refresh and try again.')
    }
    
    let data = snap.data()
    if (!data || !Array.isArray(data.products)) {
      throw new Error('Invalid config data. Please refresh.')
    }
    
    let products = data.products.slice()
    
    const newProduct = {
      id: productId,
      name: productName,
      messages: (initialMessages && initialMessages.filter(m => m)) || [
        'Key benefit 1',
        'Key benefit 2',
        'Key benefit 3',
        'Clinical data',
        'Safety profile',
        'Usage recommendation'
      ]
    }
    
    // Add only if doesn't exist
    const existing = products.find(p => p && p.id === productId)
    if (!existing) {
      products.push(newProduct)
      await setDoc(ref, {
        ...data,
        products,
        updatedAt: serverTimestamp()
      })
      configCache = null // Clear cache
    }
    
    return newProduct
  } catch (err) {
    console.error('Error creating product:', err)
    throw err
  }
}

// Update a product
export async function updateProduct(productId, newName, newMessages) {
  try {
    const ref = doc(db, 'config', 'app')
    const snap = await getDoc(ref)
    
    if (!snap.exists()) {
      throw new Error('Config document missing.')
    }
    
    let data = snap.data()
    if (!data || !Array.isArray(data.products)) {
      throw new Error('Invalid config data.')
    }
    
    let products = data.products.slice()
    const idx = products.findIndex(p => p && p.id === productId)
    
    if (idx >= 0) {
      products[idx] = {
        id: productId,
        name: newName,
        messages: newMessages
      }
    }
    
    await setDoc(ref, {
      ...data,
      products,
      updatedAt: serverTimestamp()
    })
    
    configCache = null // Clear cache
    return products[idx]
  } catch (err) {
    console.error('Error updating product:', err)
    throw err
  }
}

// Delete a product
export async function deleteProduct(productId) {
  try {
    const ref = doc(db, 'config', 'app')
    const snap = await getDoc(ref)
    
    if (!snap.exists()) {
      throw new Error('Config document missing.')
    }
    
    let data = snap.data()
    if (!data || !Array.isArray(data.products)) {
      throw new Error('Invalid config data.')
    }
    
    const products = data.products.filter(p => p && p.id !== productId)
    
    await setDoc(ref, {
      ...data,
      products,
      updatedAt: serverTimestamp()
    })
    
    configCache = null // Clear cache
  } catch (err) {
    console.error('Error deleting product:', err)
    throw err
  }
}

// Add or update a med rep
export async function addOrUpdateMedRep(medRepName, province = '', zone = '', line = '') {
  try {
    const ref = doc(db, 'config', 'app')
    const snap = await getDoc(ref)
    
    if (!snap.exists()) {
      throw new Error('Config document missing. Please refresh and try again.')
    }
    
    let data = snap.data()
    if (!data || !Array.isArray(data.medReps)) {
      throw new Error('Invalid config data. Please refresh.')
    }
    
    // Copy and convert med reps
    let medReps = data.medReps.map(m => {
      if (!m) return null
      return typeof m === 'string' ? { name: m, province: '', zone: '', line: '' } : m
    }).filter(m => m !== null)
    
    // Update or add
    const idx = medReps.findIndex(m => m.name === medRepName)
    if (idx >= 0) {
      medReps[idx] = { name: medRepName, province: province || '', zone: zone || '', line: line || '' }
    } else {
      medReps.push({ name: medRepName, province: province || '', zone: zone || '', line: line || '' })
    }
    
    // Save with updated data
    await setDoc(ref, {
      ...data,
      medReps,
      updatedAt: serverTimestamp()
    })
    
    configCache = null // Clear cache
    return medReps
  } catch (err) {
    console.error('Error adding med rep:', err)
    throw err
  }
}

// Remove a med rep
export async function removeMedRep(medRepName) {
  try {
    const ref = doc(db, 'config', 'app')
    const snap = await getDoc(ref)
    
    if (!snap.exists()) {
      throw new Error('Config document missing. Please refresh and try again.')
    }
    
    let data = snap.data()
    if (!data || !Array.isArray(data.medReps)) {
      throw new Error('Invalid config data. Please refresh.')
    }
    
    let medReps = data.medReps.map(m => {
      if (!m) return null
      return typeof m === 'string' ? { name: m, province: '', zone: '', line: '' } : m
    }).filter(m => m !== null)
    
    const filteredReps = medReps.filter(m => m.name !== medRepName)
    
    await setDoc(ref, {
      ...data,
      medReps: filteredReps,
      updatedAt: serverTimestamp()
    })
    
    configCache = null // Clear cache
    return filteredReps
  } catch (err) {
    console.error('Error removing med rep:', err)
    throw err
  }
}

// Save a plan (daily call schedule)
export async function savePlan(plan) {
  try {
    const plansRef = collection(db, 'plans')
    await addDoc(plansRef, {
      ...plan,
      createdAt: serverTimestamp()
    })
  } catch (err) {
    console.error('Error saving plan:', err)
    throw err
  }
}

// Get all plans
export async function getAllPlans() {
  try {
    const snap = await getDocs(collection(db, 'plans'))
    return snap.docs.map(d => ({ ...d.data(), id: d.id }))
  } catch (err) {
    console.error('Error fetching plans:', err)
    return []
  }
}

// Check if message was used with specific med rep
export async function wasMessageUsedWithMedRep(medRep, productId, message, mslId) {
  try {
    const q = query(
      collection(db, 'calls'),
      where('mslId', '==', mslId),
      where('medRep', '==', medRep),
      where('productId', '==', productId)
    )
    const snap = await getDocs(q)
    return snap.docs.some(d => d.data().messages?.includes(message))
  } catch (err) {
    console.error('Error checking history:', err)
    return false
  }
}

// Account Management Functions

// Get user settings (permissions, provinces, etc.)
export async function getUserSettings(mslId) {
  try {
    console.log(`[getUserSettings] Loading settings for MSL ID: "${mslId}"`)
    const ref = doc(db, 'userSettings', mslId)
    const snap = await getDoc(ref)
    
    if (snap.exists()) {
      const data = snap.data()
      console.log(`[getUserSettings] ✅ Found settings for MSL ID "${mslId}":`, data)
      return data
    } else {
      console.log(`[getUserSettings] ℹ️ No settings found for MSL ID "${mslId}" (document doesn't exist)`)
      return null
    }
  } catch (err) {
    console.error(`[getUserSettings] Error fetching user settings for ${mslId}:`, err)
    return null
  }
}

// Save/update user settings
export async function saveUserSettings(mslId, settings) {
  try {
    console.log(`[saveUserSettings] Saving settings for MSL: ${mslId}`, settings)
    
    // Ensure proper data structure - filter out undefined values
    const dataToSave = {}
    dataToSave.mslId = mslId
    dataToSave.displayName = settings.displayName || settings.name || mslId
    dataToSave.allowedTabs = Array.isArray(settings.allowedTabs) ? settings.allowedTabs : []
    dataToSave.allowedProvinces = Array.isArray(settings.allowedProvinces) ? settings.allowedProvinces : []
    
    // Only add uid if it's defined
    if (settings.uid) {
      dataToSave.uid = settings.uid
    }
    
    // Copy any other fields from settings (password, email, etc.)
    Object.keys(settings).forEach(key => {
      if (!['mslId', 'displayName', 'allowedTabs', 'allowedProvinces', 'uid'].includes(key)) {
        const value = settings[key]
        // Only include non-undefined values
        if (value !== undefined) {
          dataToSave[key] = value
        }
      }
    })
    
    dataToSave.updatedAt = serverTimestamp()
    
    console.log(`[saveUserSettings] Final data being saved:`, dataToSave)
    const ref = doc(db, 'userSettings', mslId)
    await setDoc(ref, dataToSave)
    console.log(`[saveUserSettings] Successfully saved settings for ${mslId}`)
  } catch (err) {
    console.error('Error saving user settings:', err)
    throw err
  }
}

// Get all user settings (for management)
export async function getAllUserSettings() {
  try {
    const snap = await getDocs(collection(db, 'userSettings'))
    return snap.docs.map(d => d.data())
  } catch (err) {
    console.error('Error fetching all user settings:', err)
    return []
  }
}

// Get all available provinces from med reps
export async function getAllProvinces() {
  try {
    const cfg = await getSharedConfig()
    const provinces = new Set()
    cfg.medReps?.forEach(rep => {
      if (rep.province) {
        provinces.add(rep.province)
      }
    })
    return Array.from(provinces).sort()
  } catch (err) {
    console.error('Error fetching provinces:', err)
    return []
  }
}

// Ensure default settings exist for a user (especially reports-only users)
export async function ensureUserSettings(msl) {
  try {
    console.log(`[ensureUserSettings] Loading settings for MSL: ${msl.id} (${msl.name})`)
    const ref = doc(db, 'userSettings', msl.id)
    const snap = await getDoc(ref)
    
    // If settings already exist, return them
    if (snap.exists()) {
      const data = snap.data()
      console.log(`[ensureUserSettings] Found existing settings for ${msl.name}:`, data)
      
      // Validate and normalize the data structure
      const normalizedSettings = {
        mslId: data.mslId || msl.id,
        uid: data.uid || msl.uid || msl.id,
        displayName: data.displayName || msl.name,
        allowedTabs: Array.isArray(data.allowedTabs) ? data.allowedTabs : ['mslReport', 'mrReport'],
        allowedProvinces: Array.isArray(data.allowedProvinces) ? data.allowedProvinces : [],
        ...data
      }
      console.log(`[ensureUserSettings] Normalized settings:`, normalizedSettings)
      return normalizedSettings
    }
    
    // Create default settings for this user
    const defaultSettings = {
      mslId: msl.id,
      uid: msl.uid || msl.id,
      displayName: msl.name,
      allowedTabs: msl.reportsOnly ? ['mslReport', 'mrReport'] : ['logCall', 'plan', 'messages', 'products', 'medReps', 'mslReport', 'mrReport'],
      allowedProvinces: msl.reportsOnly ? ['Mosul'] : [],  // Reports-only users see only Mosul by default
      createdAt: serverTimestamp()
    }
    
    console.log(`[ensureUserSettings] Creating new default settings for ${msl.name}:`, defaultSettings)
    await setDoc(ref, defaultSettings)
    return defaultSettings
  } catch (err) {
    console.error('Error ensuring user settings:', err)
    return null
  }
}

// Create new MSL user
export async function createNewMslUser(newUser) {
  try {
    // newUser should have: name, email, allowedTabs, allowedProvinces, isReportsOnly, password
    
    console.log('Step 1: Creating Firebase Auth account for', newUser.email)
    // Step 1: Create Firebase Authentication account
    let authResult
    try {
      authResult = await createUserWithEmailAndPassword(auth, newUser.email, newUser.password)
      console.log('Auth account created successfully:', authResult.user.uid)
    } catch (authErr) {
      console.error('Firebase Auth creation failed:', authErr.code, authErr.message)
      throw new Error(`Auth Error (${authErr.code}): ${authErr.message}`)
    }
    
    const uid = authResult.user.uid
    
    console.log('Step 2: Getting config...')
    // Generate next MSL ID
    const cfg = await getSharedConfig()
    const existingIds = cfg.msls.map(m => {
      const match = m.id?.match(/msl(\d+)/)
      return match ? parseInt(match[1]) : 0
    })
    const nextId = Math.max(...existingIds, 0) + 1
    const mslId = `msl${nextId}`
    
    console.log('Step 3: Updating config document...')
    // Step 2: Update config with new MSL
    const configRef = doc(db, 'config', 'app')
    const snap = await getDoc(configRef)
    if (!snap.exists()) {
      throw new Error('Config document missing.')
    }
    
    let data = snap.data()
    const newMslEntry = {
      id: mslId,
      name: newUser.name,
      email: newUser.email,
      uid: uid,
      reportsOnly: newUser.isReportsOnly || false
    }
    
    data.msls = [...(data.msls || []), newMslEntry]
    await setDoc(configRef, { ...data, updatedAt: serverTimestamp() })
    console.log('Config updated with new MSL:', mslId)
    
    console.log('Step 4: Saving user settings...')
    // Step 3: Save user settings
    await saveUserSettings(mslId, {
      mslId,
      uid: uid,
      allowedTabs: newUser.allowedTabs || ['mslReport', 'mrReport'],
      allowedProvinces: newUser.allowedProvinces || [],
      displayName: newUser.name,
      email: newUser.email,
      recoveryEmail: newUser.recoveryEmail || 'ahmedkafaji1994@gmail.com',
      createdAt: serverTimestamp()
    })
    console.log('User settings saved')
    
    // Clear cache so new user appears immediately
    configCache = null
    
    console.log('User creation complete:', mslId, uid)
    return { id: mslId, uid: uid, ...newMslEntry }
  } catch (err) {
    console.error('Error creating new MSL user:', err)
    throw err
  }
}

// Debug function - export for console access
export async function debugCheckUserSettings(mslId) {
  console.log(`\n========== DEBUG: Checking settings for MSL ID "${mslId}" ==========`)
  try {
    const ref = doc(db, 'userSettings', mslId)
    const snap = await getDoc(ref)
    
    if (snap.exists()) {
      const data = snap.data()
      console.log(`✅ Found document userSettings/${mslId}:`)
      console.log(data)
      console.log(`   - allowedTabs: ${Array.isArray(data.allowedTabs) ? data.allowedTabs.join(', ') : 'NOT AN ARRAY'}`)
      console.log(`   - allowedProvinces: ${Array.isArray(data.allowedProvinces) ? data.allowedProvinces.join(', ') : 'NOT AN ARRAY'}`)
    } else {
      console.log(`❌ No document found at userSettings/${mslId}`)
    }
  } catch (err) {
    console.error('Error checking settings:', err)
  }
  console.log('==========\n')
}


