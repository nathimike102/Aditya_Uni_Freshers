import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, signInWithRedirect, getRedirectResult } from 'firebase/auth';
import { auth, googleProvider, realtimeDB } from '../firebase';
import { User, Mail, Lock, UserPlus, LogIn, PartyPopper, Sparkles } from 'lucide-react';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const clearForm = () => {
    setEmail('');
    setPassword('');
    setName('');
    setError('');
  };

  React.useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError('');
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [error]);

  React.useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        console.log('Checking for redirect result...');
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 500));
        const result = await getRedirectResult(auth);
        sessionStorage.removeItem('googleSignInInProgress');
        if (result && result.user) {
          const profileData = {
            uid: result.user.uid,
            email: result.user.email,
            displayName: result.user.displayName || 'Guest',
            photoURL: result.user.photoURL,
            provider: 'google',
            lastLoginAt: new Date().toISOString()
          };
          
          try {
            const existingProfile = await realtimeDB.getUserProfile(result.user.uid);
            if (existingProfile) {
              await realtimeDB.updateUserProfile(result.user.uid, {
                lastLoginAt: new Date().toISOString(),
                photoURL: result.user.photoURL
              });
            } else {
              profileData.createdAt = new Date().toISOString();
              await realtimeDB.saveUserProfile(result.user.uid, profileData);
            }
            console.log('User profile saved/updated successfully');
          } catch (profileError) {
            console.error('Failed to save user profile:', profileError);
          }
          
          clearForm();
          onLogin(result.user, result.user.displayName || 'Guest');
        } else {
          console.log('No redirect result found');
        }
      } catch (error) {
        console.error('Redirect result error:', error);
        if (error.code === 'auth/network-request-failed') {
          setError('Network connection error. Please check your internet and try again.');
        } else if (error.code === 'auth/popup-closed-by-user') {
          setError('Sign-in was cancelled. Please try again.');
        } else if (error.code === 'auth/account-exists-with-different-credential') {
          setError('An account with this email already exists. Try signing in with email/password.');
        } else {
          setError(`Sign-in failed: ${error.message}`);
        }
      } finally {
        setLoading(false);
      }
    };
    
    handleRedirectResult();
  }, [onLogin]);

  React.useEffect(() => {
    clearForm();
    const signInInProgress = sessionStorage.getItem('googleSignInInProgress');
    if (signInInProgress === 'true') {
      console.log('Detected Google sign-in in progress, setting loading state');
      setLoading(true);
    }
  }, []);



  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let userCredential;
      let profileData;

      if (isSignUp) {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        profileData = {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          displayName: name,
          provider: 'email',
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString()
        };
        
        try {
          await realtimeDB.saveUserProfile(userCredential.user.uid, profileData);
          console.log('New user profile created and saved');
        } catch (profileError) {
          console.error('Failed to save new user profile:', profileError);
        }
        
        clearForm();
        onLogin(userCredential.user, name);
      } else {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        try {
          await realtimeDB.updateUserProfile(userCredential.user.uid, {
            lastLoginAt: new Date().toISOString()
          });
          
          const existingProfile = await realtimeDB.getUserProfile(userCredential.user.uid);
          const displayName = existingProfile?.displayName || userCredential.user.displayName || name || 'Guest';
          
          clearForm();
          onLogin(userCredential.user, displayName);
        } catch (profileError) {
          console.error('Failed to update user profile:', profileError);
          clearForm();
          onLogin(userCredential.user, userCredential.user.displayName || name || 'Guest');
        }
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    
    console.log('Starting Google Sign-In...');

    try {
      const isMobile = window.innerWidth <= 768 || 
                      /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                      ('ontouchstart' in window) ||
                      (navigator.maxTouchPoints > 0);
      
      if (isMobile) {
        console.log('Using redirect method for mobile device');
        
        const button = document.activeElement;
        if (button) button.disabled = true;
        sessionStorage.setItem('googleSignInInProgress', 'true');
        
        try {
          await signInWithRedirect(auth, googleProvider);
        } catch (redirectError) {
          console.error('Mobile Redirect Sign-In Error:', redirectError);
          setError('Sign-in failed on mobile. Please try again.');
          sessionStorage.removeItem('googleSignInInProgress');
          if (button) button.disabled = false;
          setLoading(false);
        }
        return;
      }
      
      console.log('Using popup method for desktop');
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      console.log('Google Sign-In successful:', user.email);
      
      const profileData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || 'Guest',
        photoURL: user.photoURL,
        provider: 'google',
        lastLoginAt: new Date().toISOString()
      };
      
      try {
        const existingProfile = await realtimeDB.getUserProfile(user.uid);
        if (existingProfile) {
          await realtimeDB.updateUserProfile(user.uid, {
            lastLoginAt: new Date().toISOString(),
            photoURL: user.photoURL
          });
        } else {
          profileData.createdAt = new Date().toISOString();
          await realtimeDB.saveUserProfile(user.uid, profileData);
        }
        console.log('Google user profile saved/updated successfully');
      } catch (profileError) {
        console.error('Failed to save Google user profile:', profileError);
      }
      
      clearForm();
      onLogin(user, user.displayName || 'Guest');
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      
      switch (error.code) {
        case 'auth/popup-blocked':
          console.log('Popup blocked, trying redirect method');
          try {
            await signInWithRedirect(auth, googleProvider);
          } catch (redirectError) {
            console.error('Redirect Sign-In Error:', redirectError);
            setError('Sign-in was blocked. Please allow popups for this site or try again.');
          }
          break;
          
        case 'auth/popup-closed-by-user':
          setError('Sign-in was cancelled. Please try again.');
          break;
          
        case 'auth/unauthorized-domain':
          const currentDomain = window.location.hostname;
          const port = window.location.port ? ':' + window.location.port : '';
          setError(`Domain "${currentDomain}${port}" is not authorized. Please contact support.`);
          console.log('Current domain that needs to be authorized:', currentDomain + port);
          break;
          
        case 'auth/network-request-failed':
          setError('Network error. Please check your internet connection and try again.');
          break;
          
        case 'auth/too-many-requests':
          setError('Too many failed attempts. Please wait a moment and try again.');
          break;
          
        default:
          setError(`Sign-in failed: ${error.message}`);
      }
    } finally {
      if (!isMobile) {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-effect rounded-3xl shadow-2xl p-10 w-full max-w-md animate-fade-in backdrop-blur-xl border border-purple-400/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-transparent to-cyan-500/10 animate-pulse"></div>
        <div className="relative z-10">
          <div className="text-center mb-8">
            <div className="relative inline-flex items-center justify-center w-20 h-20 mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 rounded-full animate-spin"></div>
              <div className="relative bg-white rounded-full w-16 h-16 flex items-center justify-center">
                <PartyPopper className="w-8 h-8 text-purple-600 animate-bounce" />
              </div>
              <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-400 animate-sparkle" />
            </div>
            <h2 className="text-3xl font-bold gradient-text mb-3 animate-float">
              Welcome to Aditya University ✨
            </h2>
            <p className="text-white/80 text-lg">International Students Community 🎉</p>
          </div>

        <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off" noValidate>
          {isSignUp && (
            <div className="relative group">
              <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60 group-focus-within:text-purple-400 transition-colors" />
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 backdrop-blur-sm transition-all duration-300 hover:bg-white/15 focus:bg-white/20 focus:border-purple-400 touch-manipulation"
                autoComplete="off"
                autoCapitalize="words"
                spellCheck="false"
                inputMode="text"
                required
              />
            </div>
          )}

          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60 group-focus-within:text-purple-400 transition-colors animate-float" />
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 backdrop-blur-sm transition-all duration-300 hover:bg-white/15 focus:bg-white/20 focus:border-purple-400 touch-manipulation"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck="false"
              inputMode="email"
              required
            />
          </div>

          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60 group-focus-within:text-cyan-400 transition-colors animate-float" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 backdrop-blur-sm transition-all duration-300 hover:bg-white/15 focus:bg-white/20 focus:border-cyan-400 touch-manipulation"
              autoComplete={isSignUp ? "new-password" : "current-password"}
              autoCapitalize="none"
              spellCheck="false"
              required
            />
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-3 animate-fade-in">
              <p className="text-red-200 text-sm text-center">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-4 text-lg font-semibold flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] transition-all duration-200 touch-manipulation active:scale-95"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                {isSignUp ? <UserPlus className="w-6 h-6" /> : <LogIn className="w-6 h-6" />}
                <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
              </>
            )}
          </button>
        </form>

        <div className="flex items-center my-8">
          <div className="flex-1 border-t border-white/20"></div>
          <span className="px-4 text-white/60 text-sm">or continue with</span>
          <div className="flex-1 border-t border-white/20"></div>
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full bg-white hover:bg-gray-50 text-gray-800 font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] border border-white/20 touch-manipulation active:scale-95"
        >
          {loading ? (
            <>
              <div className="w-6 h-6 border-2 border-gray-800 border-t-transparent rounded-full animate-spin"></div>
              <span>
                {sessionStorage.getItem('googleSignInInProgress') === 'true' ? 'Redirecting...' : 'Signing in...'}
              </span>
            </>
          ) : (
            <>
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Continue with Google</span>
            </>
          )}
        </button>

        <div className="text-center mt-8">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-white/80 hover:text-white font-medium transition-colors duration-200 hover:underline decoration-purple-400"
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>
        </div>
      </div>
    </div>
  );
};

export default Login;