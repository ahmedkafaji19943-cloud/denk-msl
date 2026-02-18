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
  serverTimestamp
} from 'firebase/firestore'
import { db } from './firebase'

const MSL_DATA = {
  msls: [
    { id: 'msl1', name: 'Khaldoon Sattar', email: 'khaldoon@denk.local', manager: true },
    { id: 'msl2', name: 'Ahmed AbdulKareem', email: 'ahmed@denk.local' },
    { id: 'msl3', name: 'Ahmed Rabah', email: 'rabah@denk.local' },
    { id: 'msl4', name: 'Ali Kamil', email: 'ali@denk.local' }
  ],
  medReps: [
    { name: 'Yaman Ali', zone: 'North', line: '' },
    { name: 'Mohammed Luqman', zone: 'Central', line: '' },
    { name: 'Erjwan Thaar', zone: 'South', line: '' },
    { name: 'Sabreen Majid', zone: 'East', line: '' },
    { name: 'Ibraheem Jumaa', zone: 'West', line: '' }
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
const CACHE_DURATION = 30000 // Cache for 30 seconds

export async function getSharedConfig(bypassCache = false) {
  try {
    // Return cached config if recent and not bypassed
    if (!bypassCache && configCache && Date.now() - cacheTime < CACHE_DURATION) {
      return configCache
    }

    const snap = await getDoc(doc(db, 'config', 'app'))
    if (!snap.exists()) {
      console.warn('Config not found, initializing...')
      await initializeSharedData()
      // Retry once after initialization
      const retrySnap = await getDoc(doc(db, 'config', 'app'))
      if (retrySnap.exists()) {
        configCache = retrySnap.data()
        cacheTime = Date.now()
        return configCache
      }
      return MSL_DATA
    }
    
    configCache = snap.data() || MSL_DATA
    cacheTime = Date.now()
    return configCache
  } catch (err) {
    console.error('Error fetching config:', err)
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
export async function addOrUpdateMedRep(medRepName, zone = '', line = '') {
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
      return typeof m === 'string' ? { name: m, zone: '', line: '' } : m
    }).filter(m => m !== null)
    
    // Update or add
    const idx = medReps.findIndex(m => m.name === medRepName)
    if (idx >= 0) {
      medReps[idx] = { name: medRepName, zone: zone || '', line: line || '' }
    } else {
      medReps.push({ name: medRepName, zone: zone || '', line: line || '' })
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
      return typeof m === 'string' ? { name: m, zone: '', line: '' } : m
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
