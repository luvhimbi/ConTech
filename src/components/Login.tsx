// src/components/Login.tsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser } from '../services/authService';
import { useToast } from '../contexts/ToastContext';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { showToast } = useToast();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await loginUser(email, password);
            showToast('Welcome back!', 'success');
            navigate('/dashboard');
        } catch (err: any) {
            const errorMessage = err.message || 'Invalid email or password';
            setError(errorMessage);
            showToast(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-content">
            <div className="auth-container">
                <div className="auth-header">
                    <h1 className="auth-title">Sign In</h1>
                    <p className="auth-subtitle">Enter your credentials to access your workspace</p>
                </div>

                <form onSubmit={handleLogin} className="auth-form">
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

                            <div className="form-group">
                                <label htmlFor="password" className="form-label">
                                    Password
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    className="form-control"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                />
                            </div>

                            {error && (
                                <div className="alert alert-error">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                className="btn btn-primary btn-full"
                                disabled={loading}
                            >
                                {loading ? 'Signing In...' : 'Sign In'}
                            </button>
                        </form>

                <div className="auth-footer">
                    New here? <Link to="/register">Create an account</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;