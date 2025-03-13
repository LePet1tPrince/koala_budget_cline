import {
  AccountTableStyles,
  ButtonStyles,
  FormStyles,
  LayoutStyles,
  ModalStyles,
  StatusToggleStyles,
  ToggleStyles
} from '../styles/modules';
import { createAccount, deleteAccount, getAccounts, getSubAccountTypes, updateAccount } from '../services/accountService';
import { useEffect, useState } from 'react';

import AccountForm from '../components/accounts/AccountForm';
import Layout from '../components/layout/Layout';
import Modal from '../components/common/Modal';

// Combine styles from different modules
const styles = {
  ...LayoutStyles,
  ...ButtonStyles,
  ...ModalStyles,
  ...AccountTableStyles,
  ...FormStyles
};

export default function Goals() {
  const [accounts, setAccounts] = useState([]);
  const [accountTypes, setAccountTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [typeFilter, setTypeFilter] = useState('all');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentAccount, setCurrentAccount] = useState(null);

  // Get unique account types for the filter
  const uniqueAccountTypes = ['all', ...new Set(accounts.filter(account => account.type).map(account => account.type))];

  // Filter accounts based on search query and type filter
  // Only show Goal accounts on this page
  const filteredAccounts = accounts.filter(account => {
    // Only include Goal accounts
    if (account.type !== 'Goal') return false;

    // Then filter by search query
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    return (
      (account.num && String(account.num).toLowerCase().includes(query)) ||
      (account.name && String(account.name).toLowerCase().includes(query)) ||
      (account.sub_type && typeof account.sub_type === 'object' &&
        account.sub_type.sub_type && String(account.sub_type.sub_type).toLowerCase().includes(query))
    );
  });

  // Sort accounts based on sort field and direction
  const sortedAccounts = [...filteredAccounts].sort((a, b) => {
    if (!sortField) return 0;

    // Get values to compare
    let aValue = a[sortField];
    let bValue = b[sortField];

    // Handle special cases
    if (sortField === 'sub_type') {
      aValue = a.sub_type && typeof a.sub_type === 'object' ? a.sub_type.sub_type : '';
      bValue = b.sub_type && typeof b.sub_type === 'object' ? b.sub_type.sub_type : '';
    } else if (sortField === 'balance') {
      aValue = parseFloat(a.balance) || 0;
      bValue = parseFloat(b.balance) || 0;
    }

    // Convert to strings for comparison if they're not numbers
    if (sortField !== 'balance') {
      aValue = aValue ? String(aValue).toLowerCase() : '';
      bValue = bValue ? String(bValue).toLowerCase() : '';
    }

    // Compare based on direction
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Handle sort when a header is clicked
  const handleSort = (field) => {
    const newDirection = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(newDirection);
  };

  // Function to refresh accounts data
  const refreshAccounts = async () => {
    try {
      setLoading(true);
      const accountsData = await getAccounts();
      setAccounts(accountsData);
      setError(null);
    } catch (err) {
      console.error('Error refreshing accounts:', err);
      setError('Failed to refresh accounts. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch accounts and account types on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [accountsData, typesData] = await Promise.all([
          getAccounts(),
          getSubAccountTypes()
        ]);
        setAccounts(accountsData);
        setAccountTypes(typesData);
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load accounts. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // No automatic refresh interval - we'll refresh only when accounts are modified
  }, []);

  // Handle account creation
  const handleAddAccount = async (accountData) => {
    try {
      // Ensure the account type is set to Goal
      const goalAccountData = {
        ...accountData,
        type: 'Goal'
      };

      const newAccount = await createAccount(goalAccountData);
      // Refresh accounts data to ensure we have the latest data
      await refreshAccounts();
      setIsAddModalOpen(false);
    } catch (err) {
      console.error('Error creating goal:', err);
      alert('Failed to create goal. Please try again.');
    }
  };

  // Handle account update
  const handleUpdateAccount = async (accountData) => {
    try {
      // Ensure the account type is set to Goal
      const goalAccountData = {
        ...accountData,
        type: 'Goal'
      };

      const updatedAccount = await updateAccount(currentAccount.id, goalAccountData);
      // Refresh accounts data to ensure we have the latest data
      await refreshAccounts();
      setIsEditModalOpen(false);
      setCurrentAccount(null);
    } catch (err) {
      console.error('Error updating goal:', err);
      alert('Failed to update goal. Please try again.');
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    try {
      await deleteAccount(currentAccount.id);
      // Refresh accounts data to ensure we have the latest data
      await refreshAccounts();
      setIsDeleteModalOpen(false);
      setCurrentAccount(null);
    } catch (err) {
      console.error('Error deleting goal:', err);
      alert('Failed to delete goal. Please try again.');
    }
  };

  // Open edit modal with selected account
  const openEditModal = (account) => {
    setCurrentAccount(account);
    setIsEditModalOpen(true);
  };

  // Open delete confirmation modal
  const openDeleteModal = (account) => {
    setCurrentAccount(account);
    setIsDeleteModalOpen(true);
  };

  return (
    <Layout title="Goals" activePage="goals">
      <h1 className={styles.title}>Your Goals</h1>

      {/* Add Goal Button */}
      <button
        className={styles.addButton}
        onClick={() => setIsAddModalOpen(true)}
      >
        + Add Goal
      </button>

      {/* Error Message */}
      {error && <p className={styles.errorText}>{error}</p>}

      {/* Search Controls */}
      <div className={styles.controlsContainer}>
        <div className={styles.searchContainer}>
          <label htmlFor="accountSearch" className={styles.searchLabel}>Search Goals:</label>
          <input
            id="accountSearch"
            type="text"
            className={styles.searchInput}
            placeholder="Search by name or number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <span className={styles.resultsInfo}>
              Found {filteredAccounts.length} of {filteredAccounts.length} goals
            </span>
          )}
        </div>
      </div>

      {/* Goals Table */}
      {loading ? (
        <p>Loading goals...</p>
      ) : accounts.length === 0 ? (
        <div className={styles.widget}>
          <h2>No Goals Found</h2>
          <p>You haven't added any goals yet. Click the "Add Goal" button to get started.</p>
        </div>
      ) : sortedAccounts.length === 0 ? (
        <div className={styles.widget}>
          <h2>No Matching Goals</h2>
          <p>No goals match your search query. Try a different search term.</p>
        </div>
      ) : (
        <table className={styles.accountsTable}>
          <thead>
            <tr>
              <th onClick={() => handleSort('icon')} className={styles.sortableHeader}>
                Icon
                {sortField === 'icon' && (
                  <span className={styles.sortIcon}>
                    {sortDirection === 'asc' ? ' ↑' : ' ↓'}
                  </span>
                )}
              </th>
              <th onClick={() => handleSort('num')} className={styles.sortableHeader}>
                Goal Number
                {sortField === 'num' && (
                  <span className={styles.sortIcon}>
                    {sortDirection === 'asc' ? ' ↑' : ' ↓'}
                  </span>
                )}
              </th>
              <th onClick={() => handleSort('name')} className={styles.sortableHeader}>
                Name
                {sortField === 'name' && (
                  <span className={styles.sortIcon}>
                    {sortDirection === 'asc' ? ' ↑' : ' ↓'}
                  </span>
                )}
              </th>
              <th onClick={() => handleSort('sub_type')} className={styles.sortableHeader}>
                Sub Type
                {sortField === 'sub_type' && (
                  <span className={styles.sortIcon}>
                    {sortDirection === 'asc' ? ' ↑' : ' ↓'}
                  </span>
                )}
              </th>
              <th onClick={() => handleSort('balance')} className={styles.sortableHeader}>
                Balance
                {sortField === 'balance' && (
                  <span className={styles.sortIcon}>
                    {sortDirection === 'asc' ? ' ↑' : ' ↓'}
                  </span>
                )}
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedAccounts.map(account => (
              <tr key={account.id}>
                <td className={styles.iconCell}>{account.icon || '🎯'}</td>
                <td>{account.num}</td>
                <td>{account.name}</td>
                <td>{account.sub_type && typeof account.sub_type === 'object' ? account.sub_type.sub_type : '-'}</td>
                <td>${(() => {
                  // Handle different types of balance values
                  if (account.balance === null || account.balance === undefined) {
                    return '0.00';
                  }

                  // If it's a number, format it
                  if (typeof account.balance === 'number') {
                    return account.balance.toFixed(2);
                  }

                  // If it's a string, try to parse it as a number
                  const parsedBalance = parseFloat(account.balance);
                  if (!isNaN(parsedBalance)) {
                    return parsedBalance.toFixed(2);
                  }

                  return '0.00';
                })()}</td>
                <td className={styles.accountActions}>
                  <button
                    className={styles.editButton}
                    onClick={() => openEditModal(account)}
                  >
                    Edit
                  </button>
                  <button
                    className={styles.deleteButton}
                    onClick={() => openDeleteModal(account)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Add Goal Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Goal"
      >
        <AccountForm
          accountTypes={accountTypes}
          onSubmit={handleAddAccount}
          onCancel={() => setIsAddModalOpen(false)}
        />
      </Modal>

      {/* Edit Goal Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Goal"
      >
        <AccountForm
          account={currentAccount}
          accountTypes={accountTypes}
          onSubmit={handleUpdateAccount}
          onCancel={() => setIsEditModalOpen(false)}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Deletion"
      >
        <div className={styles.confirmDialog}>
          <p>Are you sure you want to delete the goal "{currentAccount?.name}"?</p>
          <p>This action cannot be undone.</p>

          <div className={styles.confirmActions}>
            <button
              className={styles.deleteButton}
              onClick={handleDeleteAccount}
            >
              Delete
            </button>
            <button
              className={styles.cancelButton}
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}
