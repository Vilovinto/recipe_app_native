import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export const fetchSigninHeroImage = async (): Promise<string | null> => {
  try {
    const ref = doc(db, 'appConfig', 'ui');
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data() as { signinHeroUrl?: string };
      return data.signinHeroUrl || null;
    }
    return null;
  } catch {
    return null;
  }
};


