import React, { useState } from 'react';
import { LogIn, UserPlus, X } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';

interface UserAuthProps {
  onClose?: () => void;
}

export default function UserAuth({ onClose }: UserAuthProps) {
  const { state, dispatch } = useWorkspace();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim()) {
      alert('Please fill in all fields');
      return;
    }

    // Create a simple user ID (in a real app, this would come from a server)
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newUser = {
      id: userId,
      name: formData.name.trim(),
      email: formData.email.trim(),
      createdAt: new Date(),
      lastActiveAt: new Date(),
    };

    // In a real app, this would be an API call
    dispatch({
      type: 'SET_CURRENT_USER',
      payload: { user: newUser },
    });

    setFormData({ name: '', email: '' });
    onClose?.();
  };

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
  };

  if (state.currentUser) {
    return (
      <div className="user-profile">
        <div className="user-info">
          <div className="user-avatar">
            {state.currentUser.name.charAt(0).toUpperCase()}
          </div>
          <div className="user-details">
            <div className="user-name">{state.currentUser.name}</div>
            <div className="user-email">{state.currentUser.email}</div>
          </div>
        </div>
        <button className="logout-button" onClick={handleLogout}>
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="auth-modal">
      <div className="auth-content">
        <div className="auth-header">
          <h2>{isLogin ? 'Sign In' : 'Sign Up'}</h2>
          <button className="close-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter your name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Enter your email"
              required
            />
          </div>

          <button type="submit" className="auth-submit-button">
            {isLogin ? (
              <>
                <LogIn size={16} />
                Sign In
              </>
            ) : (
              <>
                <UserPlus size={16} />
                Sign Up
              </>
            )}
          </button>
        </form>

        <div className="auth-switch">
          <p>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              className="switch-button"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
