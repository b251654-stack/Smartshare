import { useState, type FormEvent } from 'react';
import { supabase } from './supabase';

type AuthDialogProps = {
  onClose: () => void;
};

export default function AuthDialog({ onClose }: AuthDialogProps) {
  const client = supabase;
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  if (!client) return null;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    setErrorMessage('');

    try {
      if (mode === 'sign-up') {
        const { data, error } = await client.auth.signUp({ email, password });
        if (error) throw error;

        if (!data.session) {
          setMessage('Check your email to confirm your new account, then sign in.');
          return;
        }
      } else {
        const { error } = await client.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }

      onClose();
    } catch (error) {
      console.error('Authentication failed.', error);
      setErrorMessage(error instanceof Error ? error.message : 'Authentication failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-backdrop" onMouseDown={event => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section
        className="auth-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
      >
        <button className="auth-close" type="button" onClick={onClose} aria-label="Close sign in">×</button>
        <div className="auth-mark">S</div>
        <h2 id="auth-title">{mode === 'sign-in' ? 'Welcome back' : 'Create your account'}</h2>
        <p>Sign in to sync your SmartShare projects across devices.</p>

        <form onSubmit={submit}>
          <label htmlFor="auth-email">Email</label>
          <input
            id="auth-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={event => setEmail(event.target.value)}
            required
          />

          <label htmlFor="auth-password">Password</label>
          <input
            id="auth-password"
            type="password"
            autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
            value={password}
            onChange={event => setPassword(event.target.value)}
            minLength={8}
            required
          />

          {message && <p className="auth-message" role="status">{message}</p>}
          {errorMessage && <p className="auth-error" role="alert">{errorMessage}</p>}

          <button className="auth-submit" type="submit" disabled={busy}>
            {busy ? 'Please wait…' : mode === 'sign-in' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <button
          className="auth-mode-toggle"
          type="button"
          onClick={() => {
            setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in');
            setMessage('');
            setErrorMessage('');
          }}
        >
          {mode === 'sign-in' ? 'New to SmartShare? Create an account' : 'Already have an account? Sign in'}
        </button>
      </section>
    </div>
  );
}
