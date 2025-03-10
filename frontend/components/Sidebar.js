import Link from 'next/link';
import { SidebarStyles as styles } from '../styles/modules';

export default function Sidebar({ activePage }) {
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
          <li className={styles.sidebarMenuItem}>
            <Link
              href="/accounts"
              className={`${styles.sidebarMenuLink} ${activePage === 'accounts' ? styles.active : ''}`}
            >
              <span className={styles.sidebarMenuIcon}>💰</span>
              Accounts
            </Link>
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
