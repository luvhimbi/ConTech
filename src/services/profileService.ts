// src/services/profileService.ts
import { db } from '../firebaseConfig';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';

export interface UserProfile {
    firstName: string;
    lastName: string;
    companyName: string;
    email: string;
    createdAt: Date;
    updatedAt: Date;
}

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
    try {
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists()) {
            const data = userDoc.data();
            // Handle Firestore Timestamp conversion
            const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt || new Date());
            const updatedAt = data.updatedAt?.toDate ? data.updatedAt.toDate() : (data.updatedAt || new Date());
            
            return {
                firstName: data.firstName || '',
                lastName: data.lastName || '',
                companyName: data.companyName || '',
                email: data.email || '',
                createdAt: createdAt instanceof Date ? createdAt : new Date(createdAt),
                updatedAt: updatedAt instanceof Date ? updatedAt : new Date(updatedAt),
            } as UserProfile;
        }
        return null;
    } catch (error: any) {
        throw new Error('Failed to fetch user profile: ' + error.message);
    }
};

export const updateUserProfile = async (
    uid: string,
    updates: { firstName: string; lastName: string; companyName: string }
): Promise<void> => {
    try {
        const userRef = doc(db, 'users', uid);
        const currentDoc = await getDoc(userRef);
        
        if (!currentDoc.exists()) {
            throw new Error('User profile not found');
        }
        
        const currentData = currentDoc.data();
        
        // Include all fields so rules can validate them
        await updateDoc(userRef, {
            firstName: updates.firstName,
            lastName: updates.lastName,
            companyName: updates.companyName,
            email: currentData.email, // Preserve email
            createdAt: currentData.createdAt, // Preserve createdAt (must be Timestamp)
            updatedAt: Timestamp.now(),
        });
    } catch (error: any) {
        throw new Error('Failed to update user profile: ' + error.message);
    }
};
