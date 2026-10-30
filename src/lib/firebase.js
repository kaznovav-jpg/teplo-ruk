import { initializeApp } from 'firebase/app'
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendPasswordResetEmail, GoogleAuthProvider, signInWithPopup, updateProfile } from 'firebase/auth'
import { getFirestore, doc, getDoc, setDoc, collection, addDoc, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore'
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage'

const env = import.meta.env
const cfg = {
  apiKey: env.VITE_FIREBASE_API_KEY, authDomain: env.VITE_FIREBASE_AUTH_DOMAIN, projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET, messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID, appId: env.VITE_FIREBASE_APP_ID,
}
// 설정값이 없으면 Firebase 없이 "로컬 모드"로 동작합니다.
export const isFirebase = Boolean(cfg.apiKey && cfg.projectId)
const app = isFirebase ? initializeApp(cfg) : null
export const auth = app ? getAuth(app) : null
export const db = app ? getFirestore(app) : null
export const storage = app ? getStorage(app) : null
export { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendPasswordResetEmail, GoogleAuthProvider, signInWithPopup, updateProfile,
  doc, getDoc, setDoc, collection, addDoc, query, where, orderBy, limit, onSnapshot, ref, uploadString, getDownloadURL }
