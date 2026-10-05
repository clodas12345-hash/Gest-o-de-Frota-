import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import config from '../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: config.apiKey,
  authDomain: config.authDomain,
  projectId: config.projectId,
  storageBucket: config.storageBucket,
  messagingSenderId: config.messagingSenderId,
  appId: config.appId,
  measurementId: config.measurementId || undefined
};

export const app = initializeApp(firebaseConfig);

const dbId = config.firestoreDatabaseId && config.firestoreDatabaseId !== '(default)' ? config.firestoreDatabaseId : undefined;

export const db = dbId ? getFirestore(app, dbId) : getFirestore(app);
