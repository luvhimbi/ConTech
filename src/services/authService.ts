// src/services/authService.ts
import { auth, db } from "../firebaseConfig";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut
} from "firebase/auth";
import { doc, setDoc, getDoc, Timestamp } from "firebase/firestore";

export interface UserProfile {
    firstName: string;
    lastName: string;
    companyName: string;
    email: string;
    createdAt: Date;
    updatedAt?: Date;
}

export const registerUser = async (
    email: string,
    password: string,
    profile: { firstName: string; lastName: string; companyName: string }
) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Save user profile to Firestore
        const userProfile = {
            firstName: profile.firstName,
            lastName: profile.lastName,
            companyName: profile.companyName,
            email: email,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        };

        await setDoc(doc(db, "users", user.uid), userProfile);

        return user;
    } catch (error: any) {
        throw error.message;
    }
};

export const loginUser = async (email: string, password: string) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return userCredential.user;
    } catch (error: any) {
        throw error.message;
    }
};

export const logoutUser = async () => {
    try {
        await signOut(auth);
    } catch (error: any) {
        throw error.message;
    }
};

// Added helper to fetch profile data
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return docSnap.data() as UserProfile;
    }
    return null;
};