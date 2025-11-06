import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import Config from 'react-native-config';
import { Platform } from 'react-native';
import { auth, db } from '../config/firebase';

interface AuthContextType {
  user: User | null;
  userData: {
    firstName?: string;
    lastName?: string;
    email?: string;
  } | null;
  loading: boolean;
  isGoogleConfigured: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<{ firstName?: string; lastName?: string; email?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGoogleConfigured, setIsGoogleConfigured] = useState(false);

  useEffect(() => {
    const webClientId = (Config?.GOOGLE_WEB_CLIENT_ID as string)?.trim() || 
      '854166057167-5ofe3q93k3k86v778u2ll9memvbmr59r.apps.googleusercontent.com';
    const iosClientId = (Config?.GOOGLE_IOS_CLIENT_ID as string)?.trim() || 
      '854166057167-5ofe3q93k3k86v778u2ll9memvbmr59r.apps.googleusercontent.com';

    try {
      if (Platform.OS === 'ios') {
        if (!iosClientId) {
          console.error('iOS Client ID is required for iOS platform');
          setIsGoogleConfigured(false);
          return;
        }
        GoogleSignin.configure({
          webClientId: webClientId || undefined,
          iosClientId: iosClientId,
          offlineAccess: true,
        });
        setIsGoogleConfigured(true);
      } else {
        if (!webClientId) {
          console.error('Web Client ID is required for Android platform');
          setIsGoogleConfigured(false);
          return;
        }
        GoogleSignin.configure({
          webClientId: webClientId,
          offlineAccess: true,
        });
        setIsGoogleConfigured(true);
      }
    } catch (error) {
      console.error('Failed to configure Google Sign-In:', error);
      setIsGoogleConfigured(false);
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data() as { firstName: string; lastName: string; email: string });
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await setDoc(doc(db, 'users', user.uid), {
      firstName,
      lastName,
      email,
      createdAt: new Date(),
    });

    setUserData({ firstName, lastName, email });
  };

  const signInWithGoogle = async () => {
    try {
      if (!isGoogleConfigured) {
        throw new Error('Google Sign-In is not configured: add GOOGLE_WEB_CLIENT_ID and iOS URL scheme.');
      }
      if (Platform.OS === 'android') {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      }
      const userInfo = await GoogleSignin.signIn();
      
      if (!userInfo.idToken) {
        throw new Error('Google Sign-In failed: No ID token');
      }

      const googleCredential = GoogleAuthProvider.credential(userInfo.idToken);
      const userCredential = await signInWithCredential(auth, googleCredential);
      const user = userCredential.user;

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        const nameParts = user.displayName?.split(' ') || [];
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        await setDoc(doc(db, 'users', user.uid), {
          firstName,
          lastName,
          email: user.email || '',
          createdAt: new Date(),
        });

        setUserData({ firstName, lastName, email: user.email || '' });
      } else {
        const data = userDoc.data();
        setUserData(data as { firstName: string; lastName: string; email: string });
      }
    } catch (error: any) {
      console.error('Google Sign-In Error:', error);
      if (error.code === 'SIGN_IN_CANCELLED') {
        throw new Error('Google sign-in cancelled');
      } else if (error.code === 'IN_PROGRESS') {
        throw new Error('Google sign-in already in progress');
      } else if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
        throw new Error('Google Play Services not available');
      }
      throw error;
    }
  };

  const signOutUser = async () => {
    await signOut(auth);
    setUserData(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userData,
        loading,
        isGoogleConfigured,
        signIn,
        signUp,
        signOutUser,
        signInWithGoogle,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
