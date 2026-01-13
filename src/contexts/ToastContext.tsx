// src/contexts/ToastContext.tsx
import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import Toast from '../components/Toast';

export interface ToastMessage {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
}

interface ToastContextType {
    showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        // Return a no-op function instead of throwing to prevent crashes
        console.warn('useToast called outside ToastProvider');
        return {
            showToast: () => {
                // No-op function
            }
        };
    }
    return context;
};

interface ToastProviderProps {
    children: ReactNode;
}

export const ToastProvider = ({ children }: ToastProviderProps) => {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
        try {
            const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
            setToasts((prev) => [...prev, { id, message, type }]);
        } catch (error) {
            console.error('Error showing toast:', error);
        }
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {toasts.length > 0 && (
                <div className="toast-container">
                    {toasts.map((toast) => (
                        <Toast
                            key={toast.id}
                            id={toast.id}
                            message={toast.message}
                            type={toast.type}
                            onClose={removeToast}
                        />
                    ))}
                </div>
            )}
        </ToastContext.Provider>
    );
};

