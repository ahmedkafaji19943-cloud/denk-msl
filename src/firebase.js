import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyDmvirapiN3eKvVwybexmTEejuYNqz74GY",
  authDomain: "denk-msl.firebaseapp.com",
  projectId: "denk-msl",
  storageBucket: "denk-msl.firebasestorage.app",
  messagingSenderId: "774140204179",
  appId: "1:774140204179:web:895288dddb2238c4636966",
  measurementId: "G-4QKLLYYVXC"
}

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
