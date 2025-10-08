import React, { useState, useContext } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { AuthContext } from './AuthContext';
import { auth } from './firebase';
import LogoutButton from './LogoutButton';

const AuthComponent = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { currentUser, role } = useContext(AuthContext);

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      alert('Registration successful! You are now logged in.');
    } catch (error) {
      alert(`Registration failed: ${error.message}`);
      console.error(error);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert('Login successful!');
    } catch (error) {
      alert(`Login failed: ${error.message}`);
      console.error(error);
    }
  };

  if (currentUser) {
    return (
      <div className="panel">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ margin: 0 }}>Welcome, {currentUser.email}!</h2>
            <span className="badge">Role: {role || 'user'}</span>
          </div>
          <LogoutButton />
        </div>
      </div>
    );
  }

  return (
    <div className="panel">
      <h2>Register or Login</h2>
      <form className="row" style={{ flexWrap: 'wrap', gap: 12 }}>
        <input
          className="input"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div className="row">
          <button className="button" type="submit" onClick={handleRegister}>Register</button>
          <button className="button outline" type="submit" onClick={handleLogin}>Login</button>
        </div>
      </form>
    </div>
  );
};

export default AuthComponent;