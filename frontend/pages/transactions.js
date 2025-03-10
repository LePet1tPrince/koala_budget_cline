import Layout from '../components/Layout';
import styles from '../styles/Dashboard.module.css';

export default function Transactions() {
  return (
    <Layout title="Transactions" activePage="transactions">
      <h1 className={styles.title}>Your Transactions</h1>
      <div className={styles.dashboardContent}>
        <div className={styles.widget}>
          <h2>Transaction History</h2>
          <p>This is where you'll track your income and expenses.</p>
          <p className={styles.placeholder}>No transactions have been recorded yet. Add your first transaction to get started!</p>
        </div>
      </div>
    </Layout>
  );
}
