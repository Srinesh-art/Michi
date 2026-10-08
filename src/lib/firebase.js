import{initializeApp}from"firebase/app";import{getAuth,GoogleAuthProvider,signInWithPopup,signInWithEmailAndPassword,createUserWithEmailAndPassword,signOut,onAuthStateChanged}from"firebase/auth";import{getFirestore,doc,setDoc,getDoc,collection,writeBatch}from"firebase/firestore";
const config={apiKey:import.meta.env.VITE_FIREBASE_API_KEY,authDomain:import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,projectId:import.meta.env.VITE_FIREBASE_PROJECT_ID,storageBucket:import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,messagingSenderId:import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,appId:import.meta.env.VITE_FIREBASE_APP_ID};
export const firebaseConfigured=Object.values(config).every(Boolean);
export const firebaseApp=firebaseConfigured?initializeApp(config):null;
export const auth=firebaseApp?getAuth(firebaseApp):null;
export const db=firebaseApp?getFirestore(firebaseApp):null;
export const googleProvider=new GoogleAuthProvider();
export const loginWithGoogle=()=>signInWithPopup(auth,googleProvider);export const loginWithEmail=(email,password)=>signInWithEmailAndPassword(auth,email,password);export const registerWithEmail=(email,password)=>createUserWithEmailAndPassword(auth,email,password);
export const logout=()=>signOut(auth);
export const watchAuth=(cb)=>auth?onAuthStateChanged(auth,cb):()=>cb(null);
export async function loadProgress(uid){if(!db||!uid)return[];const s=await getDoc(doc(db,"users",uid));return s.exists()?(s.data().completedDays||[]):[]}
export async function saveProgress(uid,completedDays){if(!db||!uid)return;await setDoc(doc(db,"users",uid),{completedDays,updatedAt:new Date().toISOString()},{merge:true})}
export async function saveAttempt(uid,day,score){if(!db||!uid)return;await setDoc(doc(db,"users",uid,"progress",String(day)),{day,score,completed:score===100,updatedAt:new Date().toISOString()},{merge:true})}
export async function loadLesson(day){if(!db)return null;const s=await getDoc(doc(db,"lessons",String(day)));return s.exists()?s.data():null}
export async function seedLessons(lessons){if(!db)throw new Error("Firebase is not configured");for(let i=0;i<lessons.length;i+=400){const batch=writeBatch(db);lessons.slice(i,i+400).forEach(l=>batch.set(doc(db,"lessons",String(l.day)),l));await batch.commit()}}
