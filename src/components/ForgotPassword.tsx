// src/components/ForgotPassword.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { useToast } from '../contexts/ToastContext';

const ForgotPassword: React.FC = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const { showToast } = useToast();

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess(false);
        setLoading(true);

        try {
            await sendPasswordResetEmail(auth, email);
            setSuccess(true);
            showToast('Password reset email sent. Check your inbox.', 'success');
        } catch (err: any) {
            const errorMessage =
                err?.message || 'Failed to send password reset email';
            setError(errorMessage);
            showToast(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-content mt-7">
            <div className="auth-container">

                <div className="auth-header">
                    <h1 className="auth-title">Reset Password</h1>
                    <p className="auth-subtitle">
                        Enter your email and we’ll send you a reset link
                    </p>
                </div>

                <form onSubmit={handleResetPassword} className="auth-form">

                    <div className="form-group">
                        <label htmlFor="email" className="form-label">
                            Email Address
                        </label>
                        <input
                            id="email"
                            type="email"
                            className="form-control"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="john.doe@example.com"
                            required
                        />
                    </div>

                    {error && (
                        <div className="alert alert-error">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="alert alert-success">
                            Password reset link sent. Please check your email.
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn btn-primary btn-full"
                        disabled={loading}
                    >
                        {loading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                </form>

                <div className="auth-footer">
                    Remembered your password?{' '}
                    <Link to="/login">Back to login</Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
