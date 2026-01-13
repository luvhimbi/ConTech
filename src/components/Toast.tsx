// src/components/Toast.tsx
import { useEffect, useRef } from 'react';

export interface ToastProps {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
    onClose: (id: string) => void;
    duration?: number;
}

const Toast = ({ id, message, type, onClose, duration = 3000 }: ToastProps) => {
    const onCloseRef = useRef(onClose);
    
    // Keep the ref updated
    useEffect(() => {
        onCloseRef.current = onClose;
    }, [onClose]);

    useEffect(() => {
        const timer = setTimeout(() => {
            onCloseRef.current(id);
        }, duration);

        return () => clearTimeout(timer);
    }, [id, duration]);

    const handleClose = () => {
        onCloseRef.current(id);
    };

    return (
        <div className={`toast toast-${type}`} role="alert">
            <div className="toast-content">
                <span className="toast-message">{message}</span>
                <button 
                    className="toast-close" 
                    onClick={handleClose}
                    aria-label="Close"
                    type="button"
                >
                    ×
                </button>
            </div>
        </div>
    );
};

export default Toast;

