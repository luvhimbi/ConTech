// src/components/LogoutButton.tsx
import { signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';

const LogoutButton = () => {
    const handleLogout = () => signOut(auth);
    return <button onClick={handleLogout}>Log Out</button>;
};

export default LogoutButton;