// src/firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getMessaging } from "firebase/messaging";
import {
    getFirestore,
    initializeFirestore,
    persistentLocalCache,
    persistentMultipleTabManager,
} from "firebase/firestore";
// Type for Firebase config
interface FirebaseConfig {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
}

// Your Firebase configuration
const firebaseConfig: FirebaseConfig = {
    apiKey: "AIzaSyCSwgFDnHkF1oq0ZGya2MdDTYSCts3-PSY",
    authDomain: "contech-30b16.firebaseapp.com",
    projectId: "contech-30b16",
    storageBucket: "contech-30b16.firebasestorage.app",
    messagingSenderId: "416478136900",
    appId: "1:416478136900:web:abd56c93760c42059eca11",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
initializeFirestore(app, {
    localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(), // avoids multi-tab conflicts
    }),
});
// Initialize Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const messaging = getMessaging(app);
export default app;

