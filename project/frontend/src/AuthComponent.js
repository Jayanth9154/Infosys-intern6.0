import React, { useState, useContext } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { AuthContext } from './AuthContext';
import { auth } from './firebase';
import LogoutButton from './LogoutButton';
import Alert from './Alert';

const AuthComponent = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState(null);
  const { currentUser, role } = useContext(AuthContext);

  // Validation function
  const validateForm = (email, password, isLogin = false) => {
    const errors = {};
    
    // Email validation
    if (!email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Email address is invalid';
    }
    
    // Password validation
    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    } else if (!isLogin && !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      errors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }
    
    return errors;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    // Validate form
    const formErrors = validateForm(email, password, false);
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }
    
    // Clear errors if validation passes
    setErrors({});
    
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setAlert({
        message: 'Registration successful! You are now logged in.',
        type: 'success'
      });
    } catch (error) {
      let errorMessage = 'Registration failed';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Email is already in use';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak';
      }
      setErrors({ general: errorMessage });
      console.error(error);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Validate form
    const formErrors = validateForm(email, password, true);
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }
    
    // Clear errors if validation passes
    setErrors({});
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setAlert({
        message: 'Login successful!',
        type: 'success'
      });
    } catch (error) {
      let errorMessage = 'Login failed';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No user found with this email';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      }
      setErrors({ general: errorMessage });
      console.error(error);
    }
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    // Clear email error when user starts typing
    if (errors.email) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.email;
        return newErrors;
      });
    }
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    // Clear password error when user starts typing
    if (errors.password) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.password;
        return newErrors;
      });
    }
  };

  if (currentUser) {
    return (
      <div className="panel">
        {alert && (
          <Alert 
            message={alert.message} 
            type={alert.type} 
            onClose={() => setAlert(null)} 
          />
        )}
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
      {alert && (
        <Alert 
          message={alert.message} 
          type={alert.type} 
          onClose={() => setAlert(null)} 
        />
      )}
      <h2>Register or Login</h2>
      
      {/* General Error Message */}
      {errors.general && (
        <div className="error-message">
          <p>{errors.general}</p>
        </div>
      )}
      
      <form className="row" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div style={{ width: '100%' }}>
          <input
            className={`input ${errors.email ? 'error' : ''}`}
            type="email"
            placeholder="Email"
            value={email}
            onChange={handleEmailChange}
          />
          {errors.email && <div className="error-text">{errors.email}</div>}
        </div>
        <div style={{ width: '100%' }}>
          <input
            className={`input ${errors.password ? 'error' : ''}`}
            type="password"
            placeholder="Password"
            value={password}
            onChange={handlePasswordChange}
          />
          {errors.password && <div className="error-text">{errors.password}</div>}
        </div>
        <div className="row">
          <button className="button" type="submit" onClick={handleRegister}>Register</button>
          <button className="button outline" type="submit" onClick={handleLogin}>Login</button>
        </div>
      </form>
      
      <style>{`
        .error-message {
          background-color: #dc2626;
          color: white;
          padding: 12px;
          border-radius: 6px;
          margin-bottom: 16px;
          font-size: 14px;
        }
        
        .input.error {
          border: 2px solid #dc2626;
          background-color: #fef2f2;
        }
        
        .error-text {
          color: #dc2626;
          font-size: 12px;
          margin-top: 4px;
        }
      `}</style>
    </div>
  );
};

export default AuthComponent;
