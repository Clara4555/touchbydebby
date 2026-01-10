import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Lock, UserPlus, LogIn } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [requiresSetup, setRequiresSetup] = useState(false);
  
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm();

  // Check if admin setup is required on component mount
  useEffect(() => {
    console.log("🔄 AdminLogin component mounted");
    checkAdminSetup();
  }, []);

  const checkAdminSetup = async () => {
    try {
      console.log("🔍 Checking if admin setup is required");
      const response = await axios.get('http://localhost:5000/api/auth/check-setup');
      console.log("Setup check response:", response.data);
      
      if (response.data.requiresSetup) {
        console.log("⚠️ No admin found - showing setup form");
        setRequiresSetup(true);
        toast.info('No admin account found. Please create one.', { duration: 5000 });
      } else {
        console.log("✅ Admin exists");
        setRequiresSetup(false);
      }
    } catch (error) {
      console.error("❌ Check setup error:", error.message);
      console.error("Error response:", error.response?.data);
      
      if (error.response?.data?.requiresSetup) {
        setRequiresSetup(true);
        toast.info('No admin account found. Please create one.', { duration: 5000 });
      }
    }
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    console.log(`📝 ${isRegistering ? 'Registering' : 'Logging in'} with data:`, data);
    
    try {
      if (isRegistering) {
        // Register new admin
        console.log("📤 Sending registration request...");
        const response = await axios.post('http://localhost:5000/api/auth/setup', data);
        console.log("✅ Registration response:", response.data);
        
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        toast.success('Admin account created successfully!');
        navigate('/admin/dashboard');
      } else {
        // Login existing admin
        console.log("📤 Sending login request...");
        const response = await axios.post('http://localhost:5000/api/auth/login', data);
        console.log("✅ Login response:", response.data);
        
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        toast.success('Login successful!');
        navigate('/admin/dashboard');
      }
    } catch (error) {
      console.error("❌ Form submission error:", error.message);
      console.error("Error response:", error.response?.data);
      
      if (error.response?.data?.requiresSetup) {
        console.log("⚠️ Requires setup - switching to registration");
        setRequiresSetup(true);
        toast.info('No admin account found. Please create one.');
        setIsRegistering(true);
        reset(); // Clear form
      } else {
        const errorMessage = error.response?.data?.error || (isRegistering ? 'Registration failed' : 'Login failed');
        console.log("❌ Error:", errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    console.log(`🔄 Switching to ${isRegistering ? 'login' : 'register'} mode`);
    setIsRegistering(!isRegistering);
    reset(); // Clear form when switching modes
  };

  // Password validation for registration
  const password = watch('password');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-nude-50 py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <div className="p-3 rounded-full bg-pink-600">
              {isRegistering ? (
                <UserPlus className="h-12 w-12 text-white" />
              ) : (
                <Lock className="h-12 w-12 text-white" />
              )}
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-cormorant font-bold text-gray-800">
            {isRegistering ? 'Create Admin Account' : 'Admin Dashboard'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isRegistering 
              ? 'Create your administrator account'
              : 'Sign in to manage appointments and content'
            }
          </p>
          
          {requiresSetup && !isRegistering && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800 text-center">
                ⚠️ No admin account found. Please click "Register" to create one.
              </p>
            </div>
          )}
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            {isRegistering && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  {...register('name', { 
                    required: isRegistering && 'Name is required',
                    minLength: {
                      value: 2,
                      message: 'Name must be at least 2 characters'
                    }
                  })}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="Enter your full name"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                })}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder={isRegistering ? "your@email.com" : "admin@touchbydebby.com"}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password *
              </label>
              <input
                type="password"
                {...register('password', { 
                  required: 'Password is required',
                  minLength: {
                    value: isRegistering ? 8 : 1,
                    message: isRegistering ? 'Password must be at least 8 characters' : 'Password is required'
                  },
                  ...(isRegistering && {
                    pattern: {
                      value: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/,
                      message: 'Password must contain letters and numbers'
                    }
                  })
                })}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder={isRegistering ? "Minimum 8 characters" : "Enter your password"}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
              
              {isRegistering && password && (
                <div className="mt-2 space-y-1">
                  <p className={`text-xs ${password.length >= 8 ? 'text-green-600' : 'text-red-600'}`}>
                    {password.length >= 8 ? '✓' : '✗'} At least 8 characters
                  </p>
                  <p className={`text-xs ${/[A-Za-z]/.test(password) && /\d/.test(password) ? 'text-green-600' : 'text-red-600'}`}>
                    {/[A-Za-z]/.test(password) && /\d/.test(password) ? '✓' : '✗'} Letters and numbers
                  </p>
                </div>
              )}
            </div>

            {isRegistering && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: value => value === password || 'Passwords do not match'
                  })}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="Re-enter your password"
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                )}
              </div>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-pink-600 hover:bg-pink-700 text-white rounded-lg font-medium disabled:opacity-50 flex items-center justify-center"
            >
              {isLoading ? (
                <span>Processing...</span>
              ) : isRegistering ? (
                <>
                  <UserPlus className="h-5 w-5 mr-2" />
                  Create Account
                </>
              ) : (
                <>
                  <LogIn className="h-5 w-5 mr-2" />
                  Sign In
                </>
              )}
            </button>
          </div>
          
          <div className="text-center pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={toggleMode}
              className="text-pink-600 hover:text-pink-800 text-sm font-medium"
            >
              {isRegistering 
                ? 'Already have an account? Sign in'
                : 'Need to create an admin account? Register'
              }
            </button>
            
            {!isRegistering && (
              <p className="mt-2 text-xs text-gray-500">
                First time? Click "Register" above to create an admin account.
              </p>
            )}
            
            {isRegistering && (
              <p className="mt-2 text-xs text-gray-500">
                This will create the first administrator account.
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;