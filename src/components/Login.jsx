import React, { useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged
} from 'firebase/auth';
import { auth, realtimeDB, authReady } from '../firebase';
import { User, Mail, Lock, UserPlus, LogIn, PartyPopper, Sparkles } from 'lucide-react';
import Footer from './Footer';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const onLoginRef = React.useRef(onLogin);
  const lastHandledUidRef = React.useRef(null);

  const clearForm = React.useCallback(() => {
    setEmail('');
    setPassword('');
    setName('');
    setError('');
  }, []);

  React.useEffect(() => {
    onLoginRef.current = onLogin;
  }, [onLogin]);

  React.useEffect(() => {
    if (!error) {
      return undefined;
    }

    const timer = setTimeout(() => setError(''), 5000);
    return () => clearTimeout(timer);
  }, [error]);

  const syncEmailProfile = React.useCallback(async (user, displayNameHint) => {
    const now = new Date().toISOString();
    const fallbackName = displayNameHint || user.displayName || (user.email ? user.email.split('@')[0] : 'Guest');

    try {
      let existingProfile = await realtimeDB.getUserProfile(user.uid);

      if (existingProfile) {
        const updated = await realtimeDB.updateUserProfile(user.uid, {
          lastLoginAt: now
        });
        existingProfile = {
          ...existingProfile,
          ...updated
        };
        return existingProfile.displayName || fallbackName;
      }

      const createdProfile = await realtimeDB.saveUserProfile(user.uid, {
        uid: user.uid,
        email: user.email,
        displayName: fallbackName,
        provider: 'email',
        createdAt: now,
        lastLoginAt: now
      });
      return createdProfile.displayName || fallbackName;
    } catch (profileError) {
      console.error('Failed to sync email profile:', profileError);
      return fallbackName;
    }
  }, []);

  const handleAuthUser = React.useCallback(async (user, options = {}) => {
    if (!user) {
      return;
    }

    const {
      displayNameOverride,
      force = false
    } = options;

    if (!force && lastHandledUidRef.current === user.uid) {
      return;
    }

    let resolvedDisplayName = displayNameOverride || user.displayName || 'Guest';

    try {
      resolvedDisplayName = await syncEmailProfile(user, displayNameOverride);
    } catch (profileError) {
      console.error('Failed to handle auth user:', profileError);
    }

    clearForm();
    lastHandledUidRef.current = user.uid;
    onLoginRef.current?.(user, resolvedDisplayName || 'Guest');
  }, [clearForm, syncEmailProfile]);

  React.useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const run = async () => {
        if (!isMounted) {
          return;
        }

        await authReady;

        if (user) {
          setLoading(true);
          await handleAuthUser(user);
        } else {
          lastHandledUidRef.current = null;
        }

        if (isMounted) {
          setLoading(false);
        }
      };

      run().catch((stateError) => {
        console.error('Failed to handle auth state change:', stateError);
        if (isMounted) {
          setLoading(false);
        }
      });
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [handleAuthUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const userCredential = isSignUp
        ? await createUserWithEmailAndPassword(auth, email, password)
        : await signInWithEmailAndPassword(auth, email, password);

      await handleAuthUser(userCredential.user, {
        displayNameOverride: name,
        force: true
      });
    } catch (authError) {
      console.error('Authentication error:', authError);
      setError(authError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 flex items-center justify-center p-4">
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
      </main>
      <Footer />
    </div>
  );
};

export default Login;