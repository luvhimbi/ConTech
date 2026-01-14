import React from 'react';
import BrandLink from './BrandLink';

const Footer: React.FC = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="app-footer">
            <div className="container">
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.35rem',
                    }}
                >
                    {/* Logo */}
                    <BrandLink size="sm" />

                    {/* Copyright */}
                    <p className="footer-text text-center">
                        © {currentYear} CONTECH All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
