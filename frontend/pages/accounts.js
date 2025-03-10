import {
  AccountTableStyles,
  ButtonStyles,
  FormStyles,
  LayoutStyles,
  ModalStyles
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

export default function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [accountTypes, setAccountTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentAccount, setCurrentAccount] = useState(null);

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

    // Set up an interval to refresh accounts data every 5 seconds
    const refreshInterval = setInterval(refreshAccounts, 5000);

    // Clean up the interval when the component unmounts
    return () => clearInterval(refreshInterval);
  }, []);

  // Handle account creation
  const handleAddAccount = async (accountData) => {
    try {
      const newAccount = await createAccount(accountData);
      setAccounts([...accounts, newAccount]);
      setIsAddModalOpen(false);
    } catch (err) {
      console.error('Error creating account:', err);
      alert('Failed to create account. Please try again.');
    }
  };

  // Handle account update
  const handleUpdateAccount = async (accountData) => {
    try {
      const updatedAccount = await updateAccount(currentAccount.id, accountData);
      setAccounts(accounts.map(account =>
        account.id === currentAccount.id ? updatedAccount : account
      ));
      setIsEditModalOpen(false);
      setCurrentAccount(null);
    } catch (err) {
      console.error('Error updating account:', err);
      alert('Failed to update account. Please try again.');
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    try {
      await deleteAccount(currentAccount.id);
      setAccounts(accounts.filter(account => account.id !== currentAccount.id));
      setIsDeleteModalOpen(false);
      setCurrentAccount(null);
    } catch (err) {
      console.error('Error deleting account:', err);
      alert('Failed to delete account. Please try again.');
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
    <Layout title="Accounts" activePage="accounts">
      <h1 className={styles.title}>Your Accounts</h1>

      {/* Add Account Button */}
      <button
        className={styles.addButton}
        onClick={() => setIsAddModalOpen(true)}
      >
        + Add Account
      </button>

      {/* Error Message */}
      {error && <p className={styles.errorText}>{error}</p>}

      {/* Accounts Table */}
      {loading ? (
        <p>Loading accounts...</p>
      ) : accounts.length === 0 ? (
        <div className={styles.widget}>
          <h2>No Accounts Found</h2>
          <p>You haven't added any accounts yet. Click the "Add Account" button to get started.</p>
        </div>
      ) : (
        <table className={styles.accountsTable}>
          <thead>
            <tr>
              <th>Account Number</th>
              <th>Name</th>
              <th>Type</th>
              <th>Sub Type</th>
              <th>Balance</th>
              <th>Bank Feed</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map(account => (
              <tr key={account.id}>
                <td>{account.num}</td>
                <td>{account.name}</td>
                <td>{account.type}</td>
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
                <td>{account.inBankFeed ? 'Yes' : 'No'}</td>
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

      {/* Add Account Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Account"
      >
        <AccountForm
          accountTypes={accountTypes}
          onSubmit={handleAddAccount}
          onCancel={() => setIsAddModalOpen(false)}
        />
      </Modal>

      {/* Edit Account Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Account"
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
          <p>Are you sure you want to delete the account "{currentAccount?.name}"?</p>
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
