// src/components/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { auth } from '../firebaseConfig';
import { getUserProfile, type UserProfile } from '../services/authService';

const Dashboard: React.FC = () => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            const user = auth.currentUser;
            if (user) {
                try {
                    const data = await getUserProfile(user.uid);
                    setProfile(data);
                } catch (error) {
                    console.error("Error fetching profile:", error);
                }
            }
            setLoading(false);
        };

        fetchProfile();
    }, []);

    return (
        <div  style={{ paddingTop: 'var(--spacing-lg)' }}>
            <div className="container ">
                {/* Header section moved to the top and left-aligned */}
                <div className="profile-header" style={{ textAlign: 'left', marginBottom: 'var(--spacing-xl)' }}>
                    <h1 className="profile-title" style={{ margin: 0 }}>
                        {loading ? "Loading..." : `Welcome, ${profile?.firstName || 'User'}!`}
                    </h1>
                    <p className="profile-subtitle" style={{ marginTop: 'var(--spacing-xs)' }}>
                        {profile?.companyName ? `Managing ${profile.companyName}` : "Welcome to your dashboard"}
                    </p>
                </div>

                {/* Content section below the header */}
                <div className="dashboard-actions" style={{ display: 'flex', gap: '1rem' }}>
                    <Link to="/profile" className="btn btn-primary">
                        Go to Profile
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;