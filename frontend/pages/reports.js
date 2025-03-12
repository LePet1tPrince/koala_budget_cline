import BalanceReport from '../components/reports/BalanceReport';
import FlowReport from '../components/reports/FlowReport';
import { FormStyles } from '../styles/modules';
import Layout from '../components/layout/Layout';
import { ReportsStyles as styles } from '../styles/modules';
import { useState } from 'react';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('flow');

  return (
    <Layout activePage="reports">
      <div className={FormStyles.container}>
        <h1 className={FormStyles.title}>Reports</h1>

        {/* Tab Navigation */}
        <div className={styles.tabContainer}>
          <button
            className={`${styles.tabButton} ${activeTab === 'flow' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('flow')}
          >
            Flow
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'balance' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('balance')}
          >
            Balance
          </button>
        </div>

        {/* Report Content */}
        <div className={styles.reportContainer}>
          {activeTab === 'flow' ? (
            <FlowReport />
          ) : (
            <BalanceReport />
          )}
        </div>
      </div>
    </Layout>
  );
}
