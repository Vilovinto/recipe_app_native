import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import Config from 'react-native-config';

const firebaseConfig = {
  apiKey: Config.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: Config.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: Config.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: Config.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: Config.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: Config.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const db = getFirestore(app);
export const storage = getStorage(app);
