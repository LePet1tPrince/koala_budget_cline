import Head from 'next/head';
import Link from 'next/link';
import { register } from '../services/authService';
import styles from '../styles/Login.module.css'; // Reusing login styles
import { useRouter } from 'next/router';
import { useState } from 'react';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Basic validation
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      setLoading(false);
      return;
    }

    try {
      console.log('Submitting registration form with:', {
        email,
        password: '********', // Don't log actual password
        firstName,
        lastName
      });

      const result = await register(email, password, firstName, lastName);
      console.log('Registration successful:', result);

      // Redirect to login with success message
      router.push('/login?registered=success');
    } catch (err) {
      console.error('Registration error:', err);

      // Improved error handling that won't cause "Cannot read properties of undefined" error
      if (err && err.response) {
        // Handle API response errors
        if (err.response.data) {
          const errorData = err.response.data;
          if (errorData.detail) {
            setError(errorData.detail);
          } else if (typeof errorData === 'object') {
            // Handle object with multiple error messages
            const errorMessages = Object.entries(errorData)
              .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
              .join('\n');
            setError(errorMessages);
          }
        } else if (err.response.status) {
          // Handle status code errors
          setError(`Error ${err.response.status}: Registration failed`);
        }
      } else {
        // Handle network errors or other unexpected errors
        setError(err.message || 'An error occurred during registration. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Sign Up - Koala Budget</title>
        <meta name="description" content="Create an account for Koala Budget" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <div className={styles.loginBox}>
          <h1 className={styles.title}>Create Account</h1>

          {error && <p className={styles.error}>{error}</p>}

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
              <label htmlFor="firstName">First Name</label>
              <input
                type="text"
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="lastName">Last Name</label>
              <input
                type="text"
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
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

            <div className={styles.formGroup}>
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className={styles.input}
              />
            </div>

            <button
              type="submit"
              className={styles.button}
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>

          <p className={styles.register}>
            Already have an account?{' '}
            <Link href="/login">
              <span className={styles.link}>Login</span>
            </Link>
          </p>

          <Link href="/">
            <span className={styles.backLink}>← Back to Home</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
