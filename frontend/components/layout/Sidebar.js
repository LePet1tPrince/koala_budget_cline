import { useEffect, useState } from 'react';

import Link from 'next/link';
import { SidebarStyles as styles } from '../../styles/modules';

export default function Sidebar({ activePage }) {
  const [accountsExpanded, setAccountsExpanded] = useState(false);

  // Auto-expand the accounts section if any of its sub-pages are active
  useEffect(() => {
    if (['accounts', 'categories', 'goals'].includes(activePage)) {
      setAccountsExpanded(true);
    }
  }, [activePage]);

  // Toggle the accounts accordion
  const toggleAccounts = () => {
    setAccountsExpanded(!accountsExpanded);
  };

  // Check if any accounts sub-page is active
  const isAccountsActive = ['accounts', 'categories', 'goals'].includes(activePage);

  return (
    <aside className={styles.sidebar}>
      <nav className={styles.sidebarNav}>
        <ul className={styles.sidebarMenu}>
          <li className={styles.sidebarMenuItem}>
            <Link
              href="/dashboard"
              className={`${styles.sidebarMenuLink} ${activePage === 'dashboard' ? styles.active : ''}`}
            >
              <span className={styles.sidebarMenuIcon}>📊</span>
              Dashboard
            </Link>
          </li>

          {/* Accounts Accordion */}
          <li className={styles.sidebarMenuItem}>
            <button
              onClick={toggleAccounts}
              className={`${styles.sidebarMenuLink} ${styles.accordionButton} ${isAccountsActive ? styles.active : ''}`}
            >
              <span className={styles.sidebarMenuIcon}>💰</span>
              Accounts
              <span className={styles.accordionIcon}>
                {accountsExpanded ? '▼' : '▶'}
              </span>
            </button>

            {/* Sub-menu items */}
            {accountsExpanded && (
              <ul className={styles.submenu}>
                <li className={styles.submenuItem}>
                  <Link
                    href="/accounts"
                    className={`${styles.sidebarMenuLink} ${styles.submenuLink} ${activePage === 'accounts' ? styles.active : ''}`}
                  >
                    <span className={styles.sidebarMenuIcon}>💳</span>
                    Accounts
                  </Link>
                </li>
                <li className={styles.submenuItem}>
                  <Link
                    href="/categories"
                    className={`${styles.sidebarMenuLink} ${styles.submenuLink} ${activePage === 'categories' ? styles.active : ''}`}
                  >
                    <span className={styles.sidebarMenuIcon}>📋</span>
                    Categories
                  </Link>
                </li>
                <li className={styles.submenuItem}>
                  <Link
                    href="/goals"
                    className={`${styles.sidebarMenuLink} ${styles.submenuLink} ${activePage === 'goals' ? styles.active : ''}`}
                  >
                    <span className={styles.sidebarMenuIcon}>🎯</span>
                    Goals
                  </Link>
                </li>
              </ul>
            )}
          </li>
          <li className={styles.sidebarMenuItem}>
            <Link
              href="/transactions"
              className={`${styles.sidebarMenuLink} ${activePage === 'transactions' ? styles.active : ''}`}
            >
              <span className={styles.sidebarMenuIcon}>💸</span>
              Transactions
            </Link>
          </li>
          <li className={styles.sidebarMenuItem}>
            <Link
              href="/budgeting"
              className={`${styles.sidebarMenuLink} ${activePage === 'budgeting' ? styles.active : ''}`}
            >
              <span className={styles.sidebarMenuIcon}>📊</span>
              Budgeting
            </Link>
          </li>
          <li className={styles.sidebarMenuItem}>
            <Link
              href="/reports"
              className={`${styles.sidebarMenuLink} ${activePage === 'reports' ? styles.active : ''}`}
            >
              <span className={styles.sidebarMenuIcon}>📈</span>
              Reports
            </Link>
          </li>
          <li className={styles.sidebarMenuItem}>
            <Link
              href="/profile"
              className={`${styles.sidebarMenuLink} ${activePage === 'profile' ? styles.active : ''}`}
            >
              <span className={styles.sidebarMenuIcon}>👤</span>
              Profile
            </Link>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
