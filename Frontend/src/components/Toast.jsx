import React from 'react';
import { useToast } from '../ToastContext';
import './Toast.css';

function Toast() {
    const { toasts, removeToast } = useToast();

    return (
        <div className="toast-container">
            {toasts.map(toast => (
                <div key={toast.id} className={`toast toast-${toast.type}`}>
                    <div className="toast-content">
                        <span className="toast-icon">
                            {toast.type === 'success' && '✓'}
                            {toast.type === 'error' && '✕'}
                            {toast.type === 'info' && 'ℹ'}
                            {toast.type === 'warning' && '⚠'}
                        </span>
                        <p className="toast-message">{toast.message}</p>
                    </div>
                    <button
                        className="toast-close"
                        onClick={() => removeToast(toast.id)}
                        aria-label="Close notification"
                    >
                        ×
                    </button>
                </div>
            ))}
        </div>
    );
}

export default Toast;
