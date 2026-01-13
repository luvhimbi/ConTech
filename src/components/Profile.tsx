// src/components/Profile.tsx
import React, { useState, useEffect } from 'react';
import { auth } from '../firebaseConfig';
import { onAuthStateChanged, updatePassword, type User } from 'firebase/auth';
import { getUserProfile, updateUserProfile } from '../services/profileService';
import { useToast } from '../contexts/ToastContext';

interface ProfileData {
    firstName: string;
    lastName: string;
    companyName: string;
}

const Profile: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { showToast } = useToast();

    const [formData, setFormData] = useState<ProfileData>({
        firstName: '',
        lastName: '',
        companyName: '',
    });

    const [passwordData, setPasswordData] = useState({
        newPassword: '',
        confirmPassword: '',
    });

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                try {
                    const userProfile = await getUserProfile(currentUser.uid);
                    if (userProfile) {
                        setProfile(userProfile);
                        setFormData({
                            firstName: userProfile.firstName || '',
                            lastName: userProfile.lastName || '',
                            companyName: userProfile.companyName || '',
                        });
                    }
                } catch (error: any) {
                    showToast('Failed to load profile: ' + error.message, 'error');
                } finally {
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, [showToast]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPasswordData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        if (!user) return;

        setSaving(true);
        try {
            await updateUserProfile(user.uid, formData);
            const updatedProfile = await getUserProfile(user.uid);
            if (updatedProfile) {
                setProfile(updatedProfile);
            }
            setIsEditing(false);
            showToast('Profile updated successfully!', 'success');
        } catch (error: any) {
            showToast('Failed to update profile: ' + error.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordUpdate = async () => {
        if (!user) return;

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            showToast('Passwords do not match', 'error');
            return;
        }

        if (passwordData.newPassword.length < 6) {
            showToast('Password must be at least 6 characters', 'error');
            return;
        }

        setSaving(true);
        try {
            await updatePassword(user, passwordData.newPassword);
            setPasswordData({ newPassword: '', confirmPassword: '' });
            showToast('Password updated successfully!', 'success');
        } catch (error: any) {
            showToast('Failed to update password: ' + error.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        if (profile) {
            setFormData({
                firstName: profile.firstName || '',
                lastName: profile.lastName || '',
                companyName: profile.companyName || '',
            });
        }
        setIsEditing(false);
    };

    if (loading) {
        return (
            <div className="page-content">
                <div className="container">
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="page-content">
                <div className="container">
                    <p>Please log in to view your profile.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page-content">
            <div className="container container-md">
                <div className="profile-header">
                    <h1 className="profile-title">Profile</h1>
                    <p className="profile-subtitle">Manage your personal information</p>
                </div>

                <div className="profile-section">
                    {!isEditing ? (
                        <button
                            className="btn btn-outline"
                            onClick={() => setIsEditing(true)}
                        >
                            Edit Profile
                        </button>
                    ) : (
                        <div className="profile-actions">
                            <button
                                className="btn btn-outline"
                                onClick={handleCancel}
                                disabled={saving}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleSave}
                                disabled={saving}
                            >
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    )}

                    <div className="profile-form">
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="firstName" className="form-label">
                                    First Name
                                </label>
                                <input
                                    id="firstName"
                                    name="firstName"
                                    type="text"
                                    className="form-control"
                                    value={formData.firstName}
                                    onChange={handleInputChange}
                                    disabled={!isEditing}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="lastName" className="form-label">
                                    Last Name
                                </label>
                                <input
                                    id="lastName"
                                    name="lastName"
                                    type="text"
                                    className="form-control"
                                    value={formData.lastName}
                                    onChange={handleInputChange}
                                    disabled={!isEditing}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="email" className="form-label">
                                Email Address
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                className="form-control"
                                value={user.email || ''}
                                disabled
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="companyName" className="form-label">
                                Company Name
                            </label>
                            <input
                                id="companyName"
                                name="companyName"
                                type="text"
                                className="form-control"
                                value={formData.companyName}
                                onChange={handleInputChange}
                                disabled={!isEditing}
                            />
                        </div>
                    </div>

                    <div className="profile-section" style={{ marginTop: 'var(--spacing-3xl)' }}>
                        <h3 style={{ marginBottom: 'var(--spacing-lg)', fontSize: 'var(--font-size-xl)' }}>Change Password</h3>
                        <div className="profile-form">
                            <div className="form-group">
                                <label htmlFor="newPassword" className="form-label">
                                    New Password
                                </label>
                                <input
                                    id="newPassword"
                                    name="newPassword"
                                    type="password"
                                    className="form-control"
                                    value={passwordData.newPassword}
                                    onChange={handlePasswordChange}
                                    placeholder="Enter new password"
                                    minLength={6}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="confirmPassword" className="form-label">
                                    Confirm Password
                                </label>
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    className="form-control"
                                    value={passwordData.confirmPassword}
                                    onChange={handlePasswordChange}
                                    placeholder="Confirm new password"
                                    minLength={6}
                                />
                            </div>

                            <button
                                className="btn btn-primary"
                                onClick={handlePasswordUpdate}
                                disabled={saving || !passwordData.newPassword || !passwordData.confirmPassword}
                            >
                                {saving ? 'Updating...' : 'Update Password'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
