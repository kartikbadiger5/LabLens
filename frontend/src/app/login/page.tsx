// app/login/page.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { 
  UserCircleIcon,
  LockClosedIcon,
  EnvelopeIcon,
  GlobeAltIcon
} from '@heroicons/react/24/solid';
import { useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import { loginUser, registerUser } from '@/app/lib/api/endpoints';

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
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Visual Panel */}
          <div className="w-full md:w-1/2 bg-gradient-to-br from-blue-600/20 to-purple-600/20 p-8 md:p-12 relative">
            <motion.div
              className="absolute inset-0 bg-white/5 backdrop-blur-lg"
              animate={{
                x: isLogin ? '0%' : '-100%',
              }}
              transition={{ type: 'spring', stiffness: 200, damping: 30 }}
              style={{ 
                width: '200%',
                pointerEvents: 'none'
              }}
            />

            <div className="relative z-10 h-full flex flex-col items-center justify-center text-center space-y-8">
              <GlobeAltIcon className="h-20 w-20 text-white/30" />
              <h3 className="text-2xl font-bold text-white">
                {isLogin ? 'Welcome Back!' : 'Join Our Platform'}
              </h3>
              <p className="text-white/80 max-w-xs mx-auto">
                {isLogin
                  ? 'Continue your journey to better health management'
                  : 'Start your personalized health analysis experience'}
              </p>
              
              <div className="w-full max-w-xs space-y-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  className="w-full bg-white/5 text-white py-3 rounded-lg font-medium hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z"/>
                  </svg>
                  Continue with Google
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  className="w-full bg-white/5 text-white py-3 rounded-lg font-medium hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.6.113.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                  </svg>
                  Continue with GitHub
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
