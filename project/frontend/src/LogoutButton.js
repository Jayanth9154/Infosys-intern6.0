import React from 'react';
import { signOut } from 'firebase/auth';
import { auth } from './firebase';
import Alert from './Alert';

const LogoutButton = () => {
    const handleLogout = async () => {
        try {
            await signOut(auth);
            // We can't show an alert here because the component will be unmounted
            // The alert will be shown in the App component after logout
        } catch (error) {
            console.error('Error during logout:', error);
            // We can't show an alert here because the component will be unmounted
        }
    };

    return (
        <button onClick={handleLogout}>Log Out</button>
    );
};

export default LogoutButton;
