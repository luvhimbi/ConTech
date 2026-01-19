// src/services/authService.ts
import { auth, db } from "../firebaseConfig";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    deleteUser,
    type User,
} from "firebase/auth";
import {
    doc,
    setDoc,
    getDoc,
    serverTimestamp,
    type Timestamp,
} from "firebase/firestore";

/**
 * Keep stored types consistent: Firestore stores timestamps, not JS Date.
 * If you need JS Date in UI, convert via `toDate()`.
 */
export interface UserProfile {
    firstName: string;
    lastName: string;
    companyName: string;
    email: string;
    createdAt: Timestamp | ReturnType<typeof serverTimestamp>;
    updatedAt: Timestamp | ReturnType<typeof serverTimestamp>;
}

type RegisterProfileInput = {
    firstName: string;
    lastName: string;
    companyName: string;
};

/**
 * Registers a user with Email/Password and creates a Firestore Profile.
 * If Firestore fails, Auth account is deleted to avoid "ghost" accounts.
 */
export const registerUser = async (
    email: string,
    password: string,
    profile: RegisterProfileInput
): Promise<User> => {
    let user: User | null = null;

    try {
        // 1) Create Auth account (also signs the user in)
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        user = userCredential.user;

        // 2) Build profile payload
        const userProfile: UserProfile = {
            firstName: profile.firstName.trim(),
            lastName: profile.lastName.trim(),
            companyName: profile.companyName.trim(),
            email: user.email ?? email, // prefer auth email if present
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        const userDocRef = doc(db, "users", user.uid);

        // 3) Save to Firestore
        try {
            await setDoc(userDocRef, userProfile, { merge: false });

            // 4) Verify immediately (debug-friendly)
            const snap = await getDoc(userDocRef);
            if (!snap.exists()) {
                // This would be unusual, but if it happens it points to config/project mismatch
                throw new Error("Profile write did not persist. Possible project/config mismatch.");
            }

            return user;
        } catch (firestoreError: any) {
            // IMPORTANT: Log the real firestore error info
            console.error("Firestore profile creation error:", {
                code: firestoreError?.code,
                message: firestoreError?.message,
                name: firestoreError?.name,
                stack: firestoreError?.stack,
            });

            // Rollback auth user so they can retry with same email
            if (user) {
                try {
                    await deleteUser(user);
                } catch (rollbackError: any) {
                    console.error("Rollback deleteUser failed:", {
                        code: rollbackError?.code,
                        message: rollbackError?.message,
                    });
                }
            }

            // Surface a helpful error
            const code = firestoreError?.code || "unknown";
            if (code === "permission-denied") {
                throw new Error(
                    "Profile creation blocked by Firestore rules (permission-denied). Check /users/{uid} write rules."
                );
            }

            throw new Error(firestoreError?.message || "Profile creation failed (Firestore error).");
        }
    } catch (error: any) {
        console.error("Registration Error:", {
            code: error?.code,
            message: error?.message,
        });

        throw new Error(error?.message || "An unknown error occurred during registration.");
    }
};

export const loginUser = async (email: string, password: string): Promise<User> => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return userCredential.user;
    } catch (error: any) {
        throw new Error(error?.message || "Login failed.");
    }
};

export const logoutUser = async (): Promise<void> => {
    try {
        await signOut(auth);
    } catch (error: any) {
        throw new Error(error?.message || "Logout failed.");
    }
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
    try {
        const docRef = doc(db, "users", uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return docSnap.data() as UserProfile;
        }
        return null;
    } catch (error: any) {
        throw new Error(error?.message || "Failed to fetch profile.");
    }
};

// export const updateUserProfile = async (
//     uid: string,
//     updates: Partial<UserProfile>
// ): Promise<void> => {
//     try {
//         const docRef = doc(db, "users", uid);
//
//         await setDoc(
//             docRef,
//             {
//                 ...updates,
//                 updatedAt: serverTimestamp(),
//             },
//             { merge: true }
//         );
//     } catch (error: any) {
//         throw new Error(error?.message || "Failed to update profile.");
//     }

