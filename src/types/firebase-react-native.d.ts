declare module 'firebase/auth/dist/rn/index.cjs.js' {
  import type { Persistence, PersistenceStorage } from 'firebase/auth';

  export function getReactNativePersistence(storage: PersistenceStorage): Persistence;
}

 