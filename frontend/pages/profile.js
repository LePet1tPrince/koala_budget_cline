import { LayoutStyles, ProfileStyles } from '../styles/modules';
import { useEffect, useState } from 'react';

import Layout from '../components/layout/Layout';
import { getCurrentUser } from '../services/authService';

// Use LayoutStyles instead of styles
const styles = LayoutStyles;

// Format date for display
const formatDate = (dateString) => {
  if (!dateString) return '';
  // Parse the date string and ensure it's interpreted in local timezone
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

export default function Profile() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUser();
  }, []);

  return (
    <Layout title="Profile" activePage="profile">
      <h1 className={styles.title}>Your Profile</h1>
      <div className={styles.dashboardContent}>
        <div className={styles.widget}>
          <h2>User Information</h2>
          {user && (
            <div className={ProfileStyles.profileInfo}>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>First Name:</strong> {user.first_name}</p>
              <p><strong>Last Name:</strong> {user.last_name}</p>
              <p><strong>Member Since:</strong> {formatDate(user.date_joined)}</p>
            </div>
          )}
        </div>

        <div className={styles.widget}>
          <h2>Account Settings</h2>
          <p>This is where you'll be able to update your profile information and change your password.</p>
          <p className={styles.placeholder}>Account settings functionality coming soon!</p>
        </div>
      </div>
    </Layout>
  );
}
