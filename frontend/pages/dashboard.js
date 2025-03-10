import { getCurrentUser, logout } from '../services/authService';
import { useEffect, useState } from 'react';

import Head from 'next/head';
import Link from 'next/link';
import styles from '../styles/Dashboard.module.css';
import { useRouter } from 'next/router';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if we're in the browser
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (!token) {
        router.replace('/login');
        return;
      }

      fetchUserData();
    }
  }, []);

  const fetchUserData = async () => {
    try {
      const userData = await getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('Error fetching user data:', error);
      // If there's an error fetching user data, log the user out
      handleLogout();
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading your data...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Dashboard - Koala Budget</title>
        <meta name="description" content="Koala Budget Dashboard" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className={styles.header}>
        <div className={styles.logo}>
          <Link href="/">
            Koala Budget
          </Link>
        </div>
        <div className={styles.userArea}>
          <span className={styles.welcome}>Welcome, {user && user.first_name}</span>
          <button onClick={handleLogout} className={styles.logoutButton}>
            Logout
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <h1 className={styles.title}>Your Dashboard</h1>
        <div className={styles.dashboardContent}>
          <div className={styles.widget}>
            <h2>Quick Overview</h2>
            <p>Welcome to your budget dashboard. Here you can track your finances and manage your budget.</p>
            <p>This is a placeholder dashboard. Real functionality will be added soon!</p>
          </div>

          <div className={styles.widget}>
            <h2>Recent Transactions</h2>
            <p className={styles.placeholder}>Your transactions will appear here once you start adding them.</p>
          </div>
        </div>
      </main>

      <footer className={styles.footer}>
        <p>© {new Date().getFullYear()} Koala Budget. All rights reserved.</p>
      </footer>
    </div>
  );
}
