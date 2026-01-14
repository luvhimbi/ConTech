import React, { useState } from "react";

const Contact: React.FC = () => {
    const [sent, setSent] = useState(false);

    return (
        <div className="container" style={{ maxWidth: 900, padding: "48px 0" }}>
            <h1 style={{ margin: 0, fontSize: "clamp(24px, 3vw, 34px)", letterSpacing: "-0.02em" }}>Contact</h1>
            <p style={{ marginTop: 8, color: "var(--color-text-secondary)", maxWidth: 700 }}>
                For now this is a simple form. Later you can connect it to Firestore or email.
            </p>

            <div
                style={{
                    marginTop: 18,
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--border-radius)",
                    background: "var(--color-background)",
                    padding: "var(--spacing-xl)",
                    boxShadow: "var(--shadow-sm)",
                }}
            >
                {sent ? (
                    <div style={{ color: "var(--color-text-secondary)" }}>Message sent. We’ll get back to you.</div>
                ) : (
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            setSent(true);
                        }}
                        style={{ display: "grid", gap: 12 }}
                    >
                        <div>
                            <label style={{ display: "block", fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", marginBottom: 6 }}>
                                Name
                            </label>
                            <input className="form-control" required />
                        </div>

                        <div>
                            <label style={{ display: "block", fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", marginBottom: 6 }}>
                                Email
                            </label>
                            <input className="form-control" type="email" required />
                        </div>

                        <div>
                            <label style={{ display: "block", fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", marginBottom: 6 }}>
                                Message
                            </label>
                            <textarea className="form-control" rows={5} required />
                        </div>

                        <div>
                            <button className="btn btn-primary" type="submit">
                                Send message
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default Contact;
