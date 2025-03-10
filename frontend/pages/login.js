import { useEffect, useState } from 'react';

import Head from 'next/head';
import Link from 'next/link';
import { login } from '../services/authService';
import styles from '../styles/Login.module.css';
import { useRouter } from 'next/router';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  // Show success message if redirected from signup
  useEffect(() => {
    if (router.query.registered === 'success') {
      setSuccess('Account created successfully! You can now login.');
    }
  }, [router.query]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await login(email, password);

      // Store tokens in localStorage
      localStorage.setItem('token', data.access);
      localStorage.setItem('refreshToken', data.refresh);

      // Redirect to dashboard or home page
      router.push('/dashboard');
    } catch (err) {
      console.error('Login error:', err);

      // Improved error handling to avoid undefined properties
      if (err.response && err.response.data) {
        const errorData = err.response.data;

        if (errorData.detail) {
          setError(errorData.detail);
        } else if (typeof errorData === 'object') {
          // Handle object with multiple error messages
          const errorMessages = Object.entries(errorData)
            .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
            .join('\n');
          setError(errorMessages);
        } else {
          setError('Login failed. Please check your credentials and try again.');
        }
      } else {
        // Handle the case when err.response is undefined
        setError(err.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Login - Koala Budget</title>
        <meta name="description" content="Login to Koala Budget" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <div className={styles.loginBox}>
          <h1 className={styles.title}>Login</h1>

          {error && <p className={styles.error}>{error}</p>}
          {success && <p className={styles.success}>{success}</p>}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={styles.input}
              />
            </div>

            <button
              type="submit"
              className={styles.button}
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className={styles.links}>
            <p className={styles.register}>
              Don't have an account?{' '}
              <Link href="/signup">
                <span className={styles.link}>Sign up</span>
              </Link>
            </p>

            <p className={styles.forgotPassword}>
              <Link href="/forgot-password">
                <span className={styles.link}>Forgot password?</span>
              </Link>
            </p>
          </div>

          <Link href="/">
            <span className={styles.backLink}>← Back to Home</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
