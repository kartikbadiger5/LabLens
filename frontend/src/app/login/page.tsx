'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { 
  UserCircleIcon,
  LockClosedIcon,
  EnvelopeIcon,
  CpuChipIcon
  
} from '@heroicons/react/24/solid';
import { useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import { loginUser, registerUser } from '@/app/lib/api/endpoints';
import { signIn } from 'next-auth/react'; // Import signIn from NextAuth
import Link from 'next/link';

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    confirmPassword: '',
    otp: ''
  });
  const [errors, setErrors] = useState({
    email: '',
    password: '',
    username: '',
    confirmPassword: '',
    otp: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Replace submissionError with submissionMessage and messageType
  const [submissionMessage, setSubmissionMessage] = useState('');
  const [messageType, setMessageType] = useState<'error' | 'success'>('error');
  // When OTP is sent from API, set to true so the OTP field appears.
  const [isOtpSent, setIsOtpSent] = useState(false);

  const validateForm = () => {   
    let valid = true;
    const newErrors = {
      email: '',
      password: '',
      username: '',
      confirmPassword: '',
      otp: ''
    };

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
      valid = false;
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
      valid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      valid = false;
    }

    // Username validation for signup
    if (!isLogin && !formData.username) {
      newErrors.username = 'Username is required';
      valid = false;
    }

    // Confirm password validation for signup
    if (!isLogin && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      valid = false;
    }

    // If OTP has been sent, require a 6-digit OTP.
    if (!isLogin && isOtpSent) {
      if (formData.otp.length !== 6) {
        newErrors.otp = 'Please enter a valid 6-digit OTP';
        valid = false;
      }
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmissionMessage('');
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (isLogin) {
        // Login flow: call the login endpoint
        const data = await loginUser({ email: formData.email, password: formData.password });
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);
        router.push('/dashboard');
      } else {
        // Signup flow:
        if (!isOtpSent) {
          // First submission: send user details to trigger sending OTP email.
          const data = await registerUser({ name: formData.username, email: formData.email, password: formData.password });
          // Expecting the API to return a success message that the OTP has been sent.
          setIsOtpSent(true);
          setSubmissionMessage('OTP sent to your email. Please enter the 6-digit OTP to complete registration.');
          setMessageType('success');
        } else {
          // Second submission: include the OTP to complete registration.
          const data = await registerUser({ name: formData.username, email: formData.email, password: formData.password, otp: formData.otp });
          // Registration complete, reset the form and switch to login mode.
          setIsOtpSent(false);
          setFormData({ email: '', password: '', username: '', confirmPassword: '', otp: '' });
          setSubmissionMessage('Registration successful! Please login.');
          setMessageType('success');
          setIsLogin(true);
        }
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      setSubmissionMessage(
        error.response?.data?.detail ||
        (isLogin
          ? 'Login failed. Please check your credentials.'
          : 'Sign up failed. Please try again.')
      );
      setMessageType('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleForm = () => {
    setIsLogin(prevIsLogin => !prevIsLogin);
    setFormData({ email: '', password: '', username: '', confirmPassword: '', otp: '' });
    setErrors({ email: '', password: '', username: '', confirmPassword: '', otp: '' });
    setSubmissionMessage('');
    setIsOtpSent(false);
  };

  useEffect(() => {
    console.log('Form mode changed:', isLogin ? 'Login' : 'Signup');
  }, [isLogin]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white/5 backdrop-blur-lg rounded-2xl shadow-xl overflow-hidden border border-white/10 relative">
        <div className="flex flex-col md:flex-row min-h-[600px]">
          {/* Form Container */}
          <div className="flex-1 p-8 md:p-12">
            <AnimatePresence mode="wait">
              <motion.div
                key={isLogin ? 'login' : 'signup'}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20, pointerEvents: "none" }}
                transition={{ duration: 0.4 }}
                className="h-full flex flex-col"
              >
                <h2 className="text-3xl font-bold text-white mb-6">
                  {isLogin ? 'Welcome Back' : 'Create Account'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6 flex-1">
                  {!isLogin && (
                    <div className="space-y-1">
                      <label className="text-sm text-white/80 flex items-center gap-2">
                        <UserCircleIcon className="h-5 w-5 text-blue-400" />
                        Username
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 bg-white/5 rounded-lg text-white placeholder-white/50 border border-white/10 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none"
                        placeholder="Enter your username"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      />
                      {errors.username && (
                        <p className="text-red-400 text-sm">{errors.username}</p>
                      )}
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-sm text-white/80 flex items-center gap-2">
                      <EnvelopeIcon className="h-5 w-5 text-blue-400" />
                      Email
                    </label>
                    <input
                      type="email"
                      className="w-full px-4 py-3 bg-white/5 rounded-lg text-white placeholder-white/50 border border-white/10 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                    {errors.email && (
                      <p className="text-red-400 text-sm">{errors.email}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm text-white/80 flex items-center gap-2">
                      <LockClosedIcon className="h-5 w-5 text-blue-400" />
                      Password
                    </label>
                    <input
                      type="password"
                      className="w-full px-4 py-3 bg-white/5 rounded-lg text-white placeholder-white/50 border border-white/10 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                    {errors.password && (
                      <p className="text-red-400 text-sm">{errors.password}</p>
                    )}
                  </div>

                  {!isLogin && (
                    <>
                      <div className="space-y-1">
                        <label className="text-sm text-white/80 flex items-center gap-2">
                          <LockClosedIcon className="h-5 w-5 text-blue-400" />
                          Confirm Password
                        </label>
                        <input
                          type="password"
                          className="w-full px-4 py-3 bg-white/5 rounded-lg text-white placeholder-white/50 border border-white/10 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none"
                          placeholder="Confirm your password"
                          value={formData.confirmPassword}
                          onChange={(e) => {
                            setFormData({ ...formData, confirmPassword: e.target.value });
                            setErrors({ ...errors, confirmPassword: '' });
                          }}
                        />
                        {errors.confirmPassword && (
                          <p className="text-red-400 text-sm">{errors.confirmPassword}</p>
                        )}
                      </div>

                      {/* OTP Field: Shown only after the initial signup submission triggers OTP */}
                      {isOtpSent && (
                        <div className="space-y-1">
                          <label className="text-sm text-white/80 flex items-center gap-2">
                            <LockClosedIcon className="h-5 w-5 text-blue-400" />
                            OTP Verification
                          </label>
                          <input
                            type="text"
                            className="w-full px-4 py-3 bg-white/5 rounded-lg text-white placeholder-white/50 border border-white/10 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none"
                            placeholder="Enter 6-digit OTP"
                            value={formData.otp}
                            onChange={(e) => {
                              setFormData({ ...formData, otp: e.target.value });
                              setErrors({ ...errors, otp: '' });
                            }}
                            maxLength={6}
                          />
                          {errors.otp && <p className="text-red-400 text-sm">{errors.otp}</p>}
                        </div>
                      )}
                    </>
                  )}

                  {submissionMessage && (
                    <div
                      className={`px-4 py-2 rounded-lg ${
                        messageType === 'error'
                          ? 'bg-red-500/20 border border-red-500/50 text-red-200'
                          : 'bg-green-500/20 border border-green-500/50 text-green-200'
                      }`}
                    >
                      {submissionMessage}
                    </div>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isSubmitting || (!isLogin && isOtpSent && !formData.otp)}
                    className={`w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      <>
                        {isLogin ? 'Login' : 'Sign Up'}
                        {!isLogin && <CheckCircle className="h-5 w-5 ml-2" />}
                      </>
                    )}
                  </motion.button>
                </form>

                <div className="mt-6 text-center">
                  <button
                    onClick={toggleForm}
                    className="text-white/80 hover:text-white transition-colors text-sm"
                    type="button"
                  >
                    {isLogin 
                      ? "Don't have an account? Sign Up"
                      : "Already have an account? Login"}
                  </button>
                </div>

                {/* Add Previous Button */}
                <div className="mt-4 text-center">
                  <Link
                    href="/"
                    className="text-white/80 hover:text-white transition-colors text-sm"
                  >
                    ← Previous
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Visual Panel */}
          <div className="w-full md:w-1/2 bg-gradient-to-br from-blue-600/20 to-purple-600/20 p-8 md:p-12 relative">
            {/* Modified this animation to maintain consistent appearance between login and signup */}
            <div className="absolute inset-0 bg-white/5 backdrop-blur-lg" style={{ pointerEvents: 'none' }} />

            <div className="relative z-10 h-full flex flex-col items-center justify-center text-center space-y-8">
              <CpuChipIcon className="h-20 w-20 text-/30 text-blue-400" />
              <h3 className="text-2xl font-bold text-white">
                {isLogin ? 'Welcome Back to LabLens!' : 'Join Our Platform'}
              </h3>
              <p className="text-white/80 max-w-xs mx-auto">
                {isLogin
                  ? 'Continue your journey to better health management'
                  : 'Start your personalized health analysis experience'}
              </p>
              
              
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}