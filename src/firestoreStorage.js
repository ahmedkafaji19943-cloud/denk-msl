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

// Get shared config (MSLs, med reps, products)
export async function getSharedConfig() {
  try {
    const snap = await getDoc(doc(db, 'config', 'app'))
    if (!snap.exists()) {
      console.warn('Config not found, initializing...')
      await initializeSharedData()
      return await getSharedConfig() // Retry
    }
    return snap.data() || MSL_DATA
  } catch (err) {
    console.error('Error fetching config:', err)
    return MSL_DATA
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
      console.warn('Config not found, initializing fresh')
      await initializeSharedData()
      return await createProduct(productName, initialMessages) // Retry
    }
    
    let data = snap.data()
    if (!data) {
      console.warn('Config data is empty, reinitializing')
      await initializeSharedData()
      return await createProduct(productName, initialMessages) // Retry
    }
    
    let products = data.products || []
    if (!Array.isArray(products)) {
      products = []
    }
    
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
    
    // Add to products array if not exists
    const existing = products.find(p => p && p.id === productId)
    if (!existing) {
      products.push(newProduct)
    }
    
    const updatedData = {
      ...data,
      products,
      msls: data.msls || [],
      medReps: data.medReps || [],
      updatedAt: serverTimestamp()
    }
    
    await setDoc(ref, updatedData)
    return newProduct
  } catch (err) {
    console.error('Error creating product:', err)
    throw err
  }
}

// Add or update a med rep
export async function addOrUpdateMedRep(medRepName, zone = '', line = '') {
  try {
    const ref = doc(db, 'config', 'app')
    const snap = await getDoc(ref)
    
    if (!snap.exists()) {
      console.warn('Config not found, initializing fresh config')
      await initializeSharedData()
      return await addOrUpdateMedRep(medRepName, zone, line) // Retry
    }
    
    let data = snap.data()
    if (!data) {
      console.warn('Config data is empty, reinitializing')
      await initializeSharedData()
      return await addOrUpdateMedRep(medRepName, zone, line) // Retry
    }
    
    // Ensure medReps array exists and is properly formatted
    let medReps = data.medReps || []
    if (!Array.isArray(medReps)) {
      medReps = []
    }
    
    // Convert old string format to object if needed
    medReps = medReps.map(m => {
      if (!m) return null
      return typeof m === 'string' ? { name: m, zone: '', line: '' } : m
    }).filter(m => m !== null)
    
    // Check if already exists and update or add
    const existing = medReps.findIndex(m => m && m.name === medRepName)
    if (existing >= 0) {
      medReps[existing] = { name: medRepName, zone: zone || '', line: line || '' }
    } else {
      medReps.push({ name: medRepName, zone: zone || '', line: line || '' })
    }
    
    // Ensure other required fields exist
    const updatedData = {
      ...data,
      medReps,
      msls: data.msls || [],
      products: data.products || [],
      updatedAt: serverTimestamp()
    }
    
    await setDoc(ref, updatedData)
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
      console.warn('Config not found, initializing fresh')
      await initializeSharedData()
      return await removeMedRep(medRepName) // Retry
    }
    
    let data = snap.data()
    if (!data) {
      console.warn('Config data is empty, reinitializing')
      await initializeSharedData()
      return await removeMedRep(medRepName) // Retry
    }
    
    let medReps = data.medReps || []
    if (!Array.isArray(medReps)) {
      medReps = []
    }
    
    // Convert old string format to object if needed
    medReps = medReps.map(m => {
      if (!m) return null
      return typeof m === 'string' ? { name: m, zone: '', line: '' } : m
    }).filter(m => m !== null)
    
    const filteredReps = medReps.filter(m => m.name !== medRepName)
    
    const updatedData = {
      ...data,
      medReps: filteredReps,
      msls: data.msls || [],
      products: data.products || [],
      updatedAt: serverTimestamp()
    }
    
    await setDoc(ref, updatedData)
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
