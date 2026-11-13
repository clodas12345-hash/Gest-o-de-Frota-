import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import config from '../firebase-applet-config.json';

const isPreview = window.location.hostname.includes('ais-pre');

export const app: FirebaseApp = isPreview ? ({} as FirebaseApp) : initializeApp({
  apiKey: config.apiKey,
  authDomain: config.authDomain,
  projectId: config.projectId,
  storageBucket: config.storageBucket,
  messagingSenderId: config.messagingSenderId,
  appId: config.appId,
  measurementId: config.measurementId || undefined
});

const dbId = config.firestoreDatabaseId && config.firestoreDatabaseId !== '(default)' ? config.firestoreDatabaseId : undefined;

export const db: Firestore = isPreview ? ({} as Firestore) : (dbId ? getFirestore(app, dbId) : getFirestore(app));

