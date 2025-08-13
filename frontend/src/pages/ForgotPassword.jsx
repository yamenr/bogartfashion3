import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaEnvelope } from 'react-icons/fa';
import './AuthForm.css';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        if (!email) {
            setError('Please enter your email address.');
            return;
        }

        try {
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (response.ok) {
                let displayMessage = data.message || 'If an account with that email exists, a password reset link has been sent.';
                
                // If email failed but reset URL is provided, show the URL
                if (data.resetUrl) {
                    displayMessage += `\n\nSince email delivery failed, you can use this direct link:\n${data.resetUrl}`;
                }
                
                setMessage(displayMessage);
            } else {
                setError(data.message || 'Failed to send reset link. Please try again.');
            }
        } catch (err) {
            console.error('Forgot password error:', err);
            setError('An unexpected error occurred. Please try again later.');
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-form-wrapper">
                <h2>Forgot Password?</h2>
                <p className="auth-form-subtitle">Enter your email address and we'll send you a link to reset your password</p>

                <form onSubmit={handleSubmit} className="auth-form" noValidate>
                    {message && <p className="auth-message success">{message}</p>}
                    {error && <p className="auth-message error">{error}</p>}

                    <div className="auth-input-group">
                        <FaEnvelope className="auth-input-icon" />
                        <input
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="auth-submit-button"
                    >
                        Send Reset Link
                    </button>
                </form>

                <div className="auth-redirect-link">
                    <Link to="/login">← Back to Sign In</Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword; 