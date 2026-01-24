// src/components/Profile.tsx
import React, { useMemo, useState, useEffect } from "react";
import { auth, storage } from "../firebaseConfig";
import { onAuthStateChanged, updatePassword, type User } from "firebase/auth";
import { getUserProfile, updateUserProfile } from "../services/profileService";
import { useToast } from "../contexts/ToastContext";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { serverTimestamp } from "firebase/firestore";

interface ProfileData {
    firstName: string;
    lastName: string;
    companyName: string;
    branding?: {
        logoUrl?: string | null;
        logoPath?: string | null;
        updatedAt?: any;
    };
}

const MAX_LOGO_SIZE_MB = 2;
const MAX_LOGO_SIZE_BYTES = MAX_LOGO_SIZE_MB * 1024 * 1024;
const MIN_LOGO_WIDTH = 400;
const MIN_LOGO_HEIGHT = 400;

function loadImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            const dims = { width: img.naturalWidth, height: img.naturalHeight };
            URL.revokeObjectURL(url);
            resolve(dims);
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error("Image dimension error"));
        };
        img.src = url;
    });
}

function appendCacheBuster(url: string) {
    // If url already has a query string, append with &
    return url.includes("?") ? `${url}&v=${Date.now()}` : `${url}?v=${Date.now()}`;
}

function getFileExt(file: File) {
    const name = file.name || "";
    const dot = name.lastIndexOf(".");
    const ext = dot >= 0 ? name.slice(dot + 1).toLowerCase() : "";
    // fallback if no extension (or weird)
    return ext || "png";
}

function randomId(len = 10) {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let out = "";
    for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
    return out;
}

const Profile: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoUploading, setLogoUploading] = useState(false);
    const [logoError, setLogoError] = useState("");

    const { showToast } = useToast();

    const [formData, setFormData] = useState<ProfileData>({
        firstName: "",
        lastName: "",
        companyName: "",
        branding: { logoUrl: null, logoPath: null },
    });

    const [passwordData, setPasswordData] = useState({ newPassword: "", confirmPassword: "" });

    const logoPreviewUrl = useMemo(() => (logoFile ? URL.createObjectURL(logoFile) : null), [logoFile]);

    useEffect(() => {
        return () => {
            if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl);
        };
    }, [logoPreviewUrl]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);

            if (currentUser) {
                try {
                    const userProfile = await getUserProfile(currentUser.uid);

                    if (userProfile) {
                        setFormData({
                            firstName: userProfile.firstName || "",
                            lastName: userProfile.lastName || "",
                            companyName: userProfile.companyName || "",
                            branding: {
                                logoUrl: userProfile.branding?.logoUrl ?? null,
                                logoPath: userProfile.branding?.logoPath ?? null,
                                updatedAt: userProfile.branding?.updatedAt ?? null,
                            },
                        });
                    }
                } catch (e) {
                    showToast("Failed to load profile", "error");
                }
            }

            setLoading(false);
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
            await updateUserProfile(user.uid, {
                firstName: formData.firstName,
                lastName: formData.lastName,
                companyName: formData.companyName,
                updatedAt: serverTimestamp(),
            });

            setIsEditing(false);
            showToast("Profile updated successfully!", "success");
        } catch (error: any) {
            showToast(error.message ?? "Failed to update profile", "error");
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordUpdate = async () => {
        if (!user) return;

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            showToast("Passwords do not match", "error");
            return;
        }

        if (passwordData.newPassword.length < 6) {
            showToast("Password must be at least 6 characters", "error");
            return;
        }

        setSaving(true);

        try {
            await updatePassword(user, passwordData.newPassword);
            setPasswordData({ newPassword: "", confirmPassword: "" });
            showToast("Password updated successfully!", "success");
        } catch (error: any) {
            showToast(error.message ?? "Failed to update password", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleLogoPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
        setLogoError("");

        const file = e.target.files?.[0] ?? null;
        if (!file) return;

        // Optional client-side type check (rules enforce it too)
        if (!file.type.startsWith("image/")) {
            setLogoError("Please select an image file.");
            return;
        }

        if (file.size > MAX_LOGO_SIZE_BYTES) {
            setLogoError(`Max size is ${MAX_LOGO_SIZE_MB}MB.`);
            return;
        }

        try {
            const { width, height } = await loadImageDimensions(file);

            if (width < MIN_LOGO_WIDTH || height < MIN_LOGO_HEIGHT) {
                setLogoError(`Min ${MIN_LOGO_WIDTH}x${MIN_LOGO_HEIGHT}px required.`);
                return;
            }

            setLogoFile(file);
        } catch (err) {
            setLogoError("Image load error.");
        }
    };

    /**
     * Upload approach aligned with rules:
     * - Path is under users/{uid}/branding/**
     * - Only image/*
     * - Under 2MB
     * - Uses unique filename (avoids caching issues)
     * - Updates Firestore branding with logoUrl/logoPath/updatedAt
     * - Deletes old logo after successful Firestore update (cleanup)
     */
    const handleUploadLogo = async () => {
        const currentUser = auth.currentUser;
        if (!currentUser || !logoFile) return;

        setLogoUploading(true);

        try {
            const uid = currentUser.uid;

            const oldLogoPath = formData.branding?.logoPath ?? null;

            const ext = getFileExt(logoFile);
            const logoPath = `users/${uid}/branding/logo-${Date.now()}-${randomId(6)}.${ext}`;
            const logoRef = ref(storage, logoPath);

            // Upload
            await uploadBytes(logoRef, logoFile, { contentType: logoFile.type });

            // URL
            const rawUrl = await getDownloadURL(logoRef);
            const logoUrl = appendCacheBuster(rawUrl);

            // Save to Firestore (consistent with your validBranding validator)
            await updateUserProfile(uid, {
                branding: {
                    logoUrl,
                    logoPath,
                    updatedAt: serverTimestamp(),
                },
                updatedAt: serverTimestamp(),
            });

            // Delete previous logo (best-effort cleanup)
            if (oldLogoPath && oldLogoPath !== logoPath) {
                try {
                    await deleteObject(ref(storage, oldLogoPath));
                } catch (e) {
                    // cleanup failure should not block success
                    console.warn("Old logo cleanup failed:", e);
                }
            }

            // Update UI state
            setFormData((prev) => ({
                ...prev,
                branding: { ...(prev.branding ?? {}), logoUrl, logoPath, updatedAt: new Date() },
            }));

            setLogoFile(null);
            showToast("Logo updated!", "success");
        } catch (error: any) {
            showToast(error?.message ?? "Logo upload failed", "error");
        } finally {
            setLogoUploading(false);
        }
    };

    /**
     * Delete approach aligned with rules:
     * - Storage delete allowed for owner on users/{uid}/branding/**
     * - We delete the file FIRST, then clear Firestore branding.
     *   (If you clear Firestore first and delete fails, you lose the path reference.)
     */
    const handleRemoveLogo = async () => {
        if (!user) return;

        const existingPath = formData.branding?.logoPath ?? null;
        const existingUrl = formData.branding?.logoUrl ?? null;

        if (!existingPath && !existingUrl) return;

        if (!window.confirm("Are you sure you want to remove your company logo?")) return;

        setLogoUploading(true);

        try {
            // 1) Delete storage object if we have path
            if (existingPath) {
                await deleteObject(ref(storage, existingPath));
            }

            // 2) Clear firestore branding
            await updateUserProfile(user.uid, {
                branding: { logoUrl: null, logoPath: null, updatedAt: serverTimestamp() },
                updatedAt: serverTimestamp(),
            });

            // 3) Update UI state
            setFormData((prev) => ({
                ...prev,
                branding: { logoUrl: null, logoPath: null, updatedAt: new Date() },
            }));

            showToast("Logo removed", "success");
        } catch (error: any) {
            showToast(error?.message ?? "Failed to remove logo", "error");
        } finally {
            setLogoUploading(false);
        }
    };

    if (loading) {
        return (
            <div className="page-content">
                <div className="container">Loading...</div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="page-content">
                <div className="container">Please log in.</div>
            </div>
        );
    }

    const currentLogoUrl = logoPreviewUrl || formData.branding?.logoUrl || null;
    const isExistingLogo = !!formData.branding?.logoUrl && !logoFile;

    return (
        <div className="page-content">
            <div className="container container-md">
                <div className="profile-header">
                    <h1 className="profile-title">Profile</h1>
                    <p className="profile-subtitle">Manage your personal information</p>
                </div>

                <div className="profile-section">
                    {!isEditing ? (
                        <button className="btn btn-outline" onClick={() => setIsEditing(true)}>
                            Edit Profile
                        </button>
                    ) : (
                        <div className="profile-actions">
                            <button className="btn btn-outline" onClick={() => setIsEditing(false)}>
                                Cancel
                            </button>
                            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                                {saving ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    )}

                    <div className="profile-section" style={{ marginTop: "2rem" }}>
                        <div className="section-header" style={{ marginBottom: "1.5rem" }}>
                            <h3 style={{ marginBottom: "0.5rem" }}>Company Branding</h3>
                            <div className="alert alert-info" style={{ fontSize: "14px", lineHeight: "1.5" }}>
                                <strong>Pro Tip:</strong> Please upload a high-resolution image. This logo will be used for
                                white-labeling on your navbar, quotations, invoices, and public forms.
                            </div>
                        </div>

                        <div
                            style={{
                                display: "flex",
                                gap: "2rem",
                                alignItems: "flex-start",
                                padding: "1.5rem",
                                background: "var(--color-background-offset, #f8f9fa)",
                                borderRadius: "8px",
                                border: "1px solid var(--color-border)",
                            }}
                        >
                            <div style={{ textAlign: "center" }}>
                                <label
                                    style={{
                                        display: "block",
                                        fontSize: "12px",
                                        fontWeight: 600,
                                        color: "var(--color-text-secondary)",
                                        marginBottom: "8px",
                                        textTransform: "uppercase",
                                    }}
                                >
                                    Preview
                                </label>

                                <div
                                    style={{
                                        width: 120,
                                        height: 120,
                                        border: "2px dashed var(--color-border)",
                                        background: "#fff",
                                        display: "grid",
                                        placeItems: "center",
                                        borderRadius: "4px",
                                        overflow: "hidden",
                                        marginBottom: "10px",
                                    }}
                                >
                                    {currentLogoUrl ? (
                                        <img
                                            src={currentLogoUrl}
                                            alt="Logo"
                                            style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                                        />
                                    ) : (
                                        <span style={{ fontSize: "13px", color: "#999" }}>No logo</span>
                                    )}
                                </div>

                                {isExistingLogo && (
                                    <button
                                        onClick={handleRemoveLogo}
                                        disabled={logoUploading}
                                        style={{
                                            background: "none",
                                            border: "none",
                                            color: "var(--color-danger, #dc3545)",
                                            fontSize: "12px",
                                            cursor: "pointer",
                                            fontWeight: 500,
                                        }}
                                    >
                                        Remove Logo
                                    </button>
                                )}
                            </div>

                            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "1rem" }}>
                                <div>
                                    <label className="form-label" style={{ fontWeight: 600 }}>
                                        Select Image File
                                    </label>
                                    <input
                                        type="file"
                                        className="form-control"
                                        accept="image/*"
                                        onChange={handleLogoPick}
                                        style={{ marginTop: "4px" }}
                                    />
                                    <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginTop: "6px" }}>
                                        Recommended: PNG or SVG with transparent background. Min 400x400px.
                                    </p>
                                </div>

                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                    <button
                                        className="btn btn-primary"
                                        onClick={handleUploadLogo}
                                        disabled={logoUploading || !logoFile}
                                    >
                                        {logoUploading ? "Uploading..." : "Save Branding Logo"}
                                    </button>

                                    {logoFile && !logoUploading && (
                                        <button
                                            className="btn btn-outline"
                                            onClick={() => setLogoFile(null)}
                                            style={{ color: "var(--color-danger)" }}
                                        >
                                            Clear
                                        </button>
                                    )}
                                </div>

                                {logoError && (
                                    <div style={{ color: "var(--color-danger)", fontSize: "13px", fontWeight: 500 }}>
                                        ⚠️ {logoError}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="profile-form" style={{ marginTop: "2rem" }}>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">First Name</label>
                                <input
                                    name="firstName"
                                    className="form-control"
                                    value={formData.firstName}
                                    onChange={handleInputChange}
                                    disabled={!isEditing}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Last Name</label>
                                <input
                                    name="lastName"
                                    className="form-control"
                                    value={formData.lastName}
                                    onChange={handleInputChange}
                                    disabled={!isEditing}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Email Address</label>
                            <input className="form-control" value={user.email || ""} disabled />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Company Name</label>
                            <input
                                name="companyName"
                                className="form-control"
                                value={formData.companyName}
                                onChange={handleInputChange}
                                disabled={!isEditing}
                            />
                        </div>
                    </div>

                    <div className="profile-section" style={{ marginTop: "3rem" }}>
                        <h3>Change Password</h3>
                        <div className="profile-form">
                            <div className="form-group">
                                <label className="form-label">New Password</label>
                                <input
                                    name="newPassword"
                                    type="password"
                                    className="form-control"
                                    value={passwordData.newPassword}
                                    onChange={handlePasswordChange}
                                    placeholder="Enter new password"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Confirm Password</label>
                                <input
                                    name="confirmPassword"
                                    type="password"
                                    className="form-control"
                                    value={passwordData.confirmPassword}
                                    onChange={handlePasswordChange}
                                    placeholder="Confirm new password"
                                />
                            </div>
                            <button
                                className="btn btn-primary"
                                onClick={handlePasswordUpdate}
                                disabled={saving || !passwordData.newPassword || !passwordData.confirmPassword}
                            >
                                {saving ? "Updating..." : "Update Password"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
