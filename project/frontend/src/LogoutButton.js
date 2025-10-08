import React from 'react';
import { signOut } from 'firebase/auth';
import { auth } from './firebase';

const LogoutButton = () => {
    const handleLogout = async () => {
        try {
            await signOut(auth);
            alert('You have been logged out.');
        } catch (error) {
            console.error('Error during logout:', error);
            alert('Logout failed.');
        }
    };

    return (
        <button onClick={handleLogout}>Log Out</button>
    );
};

export default LogoutButton;