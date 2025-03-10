import Layout from '../components/Layout';
import styles from '../styles/Dashboard.module.css';

export default function Dashboard() {
  return (
    <Layout title="Dashboard" activePage="dashboard">
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
    </Layout>
  );
}
