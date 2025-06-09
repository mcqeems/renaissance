// src/context/authContext.tsx
import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '~/firebase'; // Pastikan path '~/firebase' benar dan mengekspor 'auth' dan 'db'
import { doc, getDoc, onSnapshot, type Timestamp } from 'firebase/firestore'; // Impor Timestamp

// Definisikan tipe untuk data profil Anda
export interface UserProfile {
  uid: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt?: Timestamp | Date; // Gunakan Timestamp dari Firebase atau Date
  // field lain
}

// EXPORT AuthContextType
export interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  initialAuthChecked: boolean;
  // Opsional: Tambahkan fungsi untuk mendapatkan token jika sering digunakan
  // getToken: () => Promise<string | null>;
}

const defaultAuthContextValue: AuthContextType = {
  currentUser: null,
  userProfile: null,
  loading: true,
  initialAuthChecked: false,
  // getToken: async () => null,
};

// EXPORT AuthContext
export const AuthContext = createContext<AuthContextType>(defaultAuthContextValue);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialAuthChecked, setInitialAuthChecked] = useState(false);

  useEffect(() => {
    setLoading(true); // Set loading true di awal effect
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setInitialAuthChecked(true);

      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const unsubscribeProfile = onSnapshot(
          userDocRef,
          (docSnap) => {
            if (docSnap.exists()) {
              // Konversi createdAt jika itu adalah Firestore Timestamp
              const profileData = docSnap.data() as UserProfile;
              if (
                profileData.createdAt &&
                typeof profileData.createdAt !== 'string' &&
                'toDate' in profileData.createdAt
              ) {
                profileData.createdAt = (profileData.createdAt as Timestamp).toDate();
              }
              setUserProfile(profileData);
            } else {
              console.log('No such user profile document for UID:', user.uid);
              setUserProfile(null);
            }
            setLoading(false);
          },
          (error) => {
            console.error('Error fetching user profile:', error);
            setUserProfile(null);
            setLoading(false);
          }
        );
        return () => unsubscribeProfile(); // Cleanup listener profil
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth(); // Cleanup listener auth
  }, []);

  // Opsional: Fungsi untuk mendapatkan token dengan mudah
  // const getToken = async (): Promise<string | null> => {
  //   if (currentUser) {
  //     return currentUser.getIdToken();
  //   }
  //   return null;
  // };

  const value = {
    currentUser,
    userProfile,
    loading,
    initialAuthChecked,
    // getToken, // Uncomment jika Anda menambahkan fungsi getToken
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
