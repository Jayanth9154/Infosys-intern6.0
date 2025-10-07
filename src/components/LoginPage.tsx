import React, { useState } from 'react';
import { Brain, Car, Shield, ArrowRight } from 'lucide-react';

interface LoginPageProps {
  onLogin: () => void;
  onSwitchToRegister: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onSwitchToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // For demo purposes, determine user type based on email
    if (email.includes('customer')) {
      (onLogin as any)('customer');
    } else if (email.includes('driver')) {
      (onLogin as any)('driver');
    } else {
      (onLogin as any)('fleet_manager');
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Traffic Background */}
      <div 
        className="absolute inset-0 bg-gray-900"
        style={{
          backgroundImage: `url('https://images.pexels.com/photos/2842474/pexels-photo-2842474.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'grayscale(100%) brightness(0.3)'
        }}
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/80 via-slate-900/60 to-teal-900/80" />
      
      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          {/* Logo & Brand */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-gradient-to-r from-purple-500 to-teal-500 p-3 rounded-2xl">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <Car className="w-6 h-6 text-orange-400 ml-2" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">NeuroFleetX</h1>
            <p className="text-gray-300">AI-Powered Fleet Intelligence</p>
          </div>

          {/* Login Form */}
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
            <h2 className="text-2xl font-semibold text-white mb-6 text-center">Welcome Back</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/50 transition-all"
                  placeholder="your.email@company.com"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/50 transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-teal-600 text-white py-3 px-6 rounded-xl hover:from-purple-700 hover:to-teal-700 transition-all duration-300 transform hover:scale-105 flex items-center justify-center group"
              >
                Sign In to Dashboard
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-400">
                Don't have an account?{' '}
                <button
                  onClick={onSwitchToRegister}
                  className="text-teal-400 hover:text-teal-300 font-medium transition-colors"
                >
                  Create Account
                </button>
              </p>
            </div>
          </div>

          {/* Features */}
          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            <div className="text-gray-300">
              <Shield className="w-6 h-6 mx-auto mb-2 text-purple-400" />
              <span className="text-sm">Secure</span>
            </div>
            <div className="text-gray-300">
              <Brain className="w-6 h-6 mx-auto mb-2 text-teal-400" />
              <span className="text-sm">AI-Powered</span>
            </div>
            <div className="text-gray-300">
              <Car className="w-6 h-6 mx-auto mb-2 text-orange-400" />
              <span className="text-sm">Real-time</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;