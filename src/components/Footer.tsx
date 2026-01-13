// src/components/Footer.tsx
import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-content">
                    <div className="footer-section">
                        <h4 className="footer-title">CONTECH</h4>
                        <p className="footer-text">Empowering small to medium construction companies to manage their goals and projects efficiently.</p>
                    </div>
                    <div className="footer-section">
                        <h5 className="footer-heading">Quick Links</h5>
                        <ul className="footer-links">
                            <li><Link to="/dashboard">Dashboard</Link></li>
                            <li><Link to="/projects">Projects</Link></li>
                            <li><Link to="/profile">Profile</Link></li>
                        </ul>
                    </div>
                    <div className="footer-section">
                        <h5 className="footer-heading">Support</h5>
                        <ul className="footer-links">
                            <li><a href="#help">Help Center</a></li>
                            <li><a href="#contact">Contact Us</a></li>
                        </ul>
                    </div>
                </div>
                <div className="footer-bottom text-sm-center">
                    <p>&copy; {currentYear} CONTECH. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;

