// src/services/projectService.ts
import { db } from '../firebaseConfig';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, Timestamp } from 'firebase/firestore';

export interface Project {
    id?: string;
    name: string;
    location: string;
    status: 'not_started' | 'started';
    userId: string;
    createdAt: Date;
    updatedAt: Date;
}

export const createProject = async (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    try {
        const projectData = {
            ...project,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        };
        const docRef = await addDoc(collection(db, 'projects'), projectData);
        return docRef.id;
    } catch (error: any) {
        throw new Error('Failed to create project: ' + error.message);
    }
};

export const getUserProjects = async (userId: string): Promise<Project[]> => {
    try {
        const q = query(
            collection(db, 'projects'),
            where('userId', '==', userId)
        );
        const querySnapshot = await getDocs(q);
        const projects: Project[] = [];
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            projects.push({
                id: doc.id,
                name: data.name,
                location: data.location,
                status: data.status,
                userId: data.userId,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
                updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
            });
        });
        
        // Sort by createdAt descending in memory to avoid index requirement
        projects.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        
        return projects;
    } catch (error: any) {
        throw new Error('Failed to fetch projects: ' + error.message);
    }
};

export const updateProject = async (projectId: string, updates: Partial<Project>): Promise<void> => {
    try {
        const projectRef = doc(db, 'projects', projectId);
        const { createdAt, updatedAt, ...updateFields } = updates;
        await updateDoc(projectRef, {
            ...updateFields,
            updatedAt: Timestamp.now(),
        });
    } catch (error: any) {
        throw new Error('Failed to update project: ' + error.message);
    }
};

export const deleteProject = async (projectId: string): Promise<void> => {
    try {
        await deleteDoc(doc(db, 'projects', projectId));
    } catch (error: any) {
        throw new Error('Failed to delete project: ' + error.message);
    }
};

