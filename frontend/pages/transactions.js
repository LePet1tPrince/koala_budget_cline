import {
  AccountCardStyles,
  ButtonStyles,
  FormStyles,
  LayoutStyles,
  ModalStyles
} from '../styles/modules';
import { createTransaction, deleteTransaction, getTransactions, getTransactionsByAccount, updateTransaction } from '../services/transactionService';
import { getAccounts, getBankFeedAccounts } from '../services/accountService';
import { useEffect, useState } from 'react';

import AccountCard from '../components/AccountCard';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import TransactionForm from '../components/TransactionForm';
import TransactionTable from '../components/TransactionTable';

// Combine styles from different modules
const styles = {
  ...LayoutStyles,
  ...AccountCardStyles,
  ...ButtonStyles,
  ...FormStyles,
  ...ModalStyles
};

export default function Transactions() {
  // State for accounts and transactions
  const [bankFeedAccounts, setBankFeedAccounts] = useState([]);
  const [allAccounts, setAllAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);

  // Fetch accounts and transactions on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all accounts for transaction form dropdowns
        const accountsData = await getAccounts();
        console.log('All accounts:', accountsData);
        setAllAccounts(accountsData);

        // Fetch bank feed accounts for the cards
        const bankFeedData = await getBankFeedAccounts();
        console.log('Bank feed accounts:', bankFeedData);
        setBankFeedAccounts(bankFeedData);

        // If there are bank feed accounts, select the first one by default
        if (bankFeedData && bankFeedData.length > 0) {
          setSelectedAccountId(bankFeedData[0].id);

          try {
            // Fetch transactions for the selected account
            const transactionsData = await getTransactionsByAccount(bankFeedData[0].id);
            console.log('Transactions for account:', transactionsData);
            setTransactions(transactionsData || []);
          } catch (transactionErr) {
            console.error('Error fetching transactions for account:', transactionErr);
            setTransactions([]);
            setError('Could not load transactions for the selected account. You may still create new transactions.');
          }
        } else {
          // If no bank feed accounts, fetch all transactions
          try {
            const transactionsData = await getTransactions();
            console.log('All transactions:', transactionsData);
            setTransactions(transactionsData || []);
          } catch (transactionErr) {
            console.error('Error fetching all transactions:', transactionErr);
            setTransactions([]);
            setError('Could not load transactions. You may still create new transactions.');
          }

          // Show a more specific error about bank feed accounts
          if (bankFeedData && bankFeedData.length === 0) {
            setError('No bank feed accounts found. Please enable bank feed for at least one account on the Accounts page.');
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again later. Error: ' + (err.message || 'Unknown error'));
        setTransactions([]);
        setBankFeedAccounts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle account selection
  const handleAccountSelect = async (accountId) => {
    try {
      setLoading(true);
      setSelectedAccountId(accountId);
      setError(null);

      // Fetch transactions for the selected account
      const transactionsData = await getTransactionsByAccount(accountId);
      console.log(`Transactions for account ${accountId}:`, transactionsData);

      // Handle case where transactionsData is null or undefined
      if (!transactionsData) {
        setTransactions([]);
        setError('No transactions found for this account.');
      } else {
        setTransactions(transactionsData);
      }
    } catch (err) {
      console.error(`Error fetching transactions for account ${accountId}:`, err);
      setTransactions([]);
      setError('Failed to load transactions. Error: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  // Handle adding a new transaction
  const handleAddTransaction = async (transactionData) => {
    try {
      const newTransaction = await createTransaction(transactionData);
      console.log('Created new transaction:', newTransaction);

      // Refresh transactions list after adding a new transaction
      if (selectedAccountId) {
        // If an account is selected, fetch transactions for that account
        const updatedTransactions = await getTransactionsByAccount(selectedAccountId);
        console.log('Updated transactions for account:', updatedTransactions);
        setTransactions(updatedTransactions || []);
      } else {
        // Otherwise fetch all transactions
        const allTransactions = await getTransactions();
        console.log('All transactions after adding new one:', allTransactions);
        setTransactions(allTransactions || []);
      }

      setIsAddModalOpen(false);
      setError(null);
    } catch (err) {
      console.error('Error creating transaction:', err);
      alert('Failed to create transaction. Error: ' + (err.message || 'Unknown error'));
    }
  };

  // Handle updating a transaction
  const handleUpdateTransaction = async (id, transactionData) => {
    try {
      const updatedTransaction = await updateTransaction(id, transactionData);
      console.log(`Updated transaction ${id}:`, updatedTransaction);

      // Refresh transactions list after updating a transaction
      if (selectedAccountId) {
        // If an account is selected, fetch transactions for that account
        const updatedTransactions = await getTransactionsByAccount(selectedAccountId);
        console.log('Updated transactions for account after update:', updatedTransactions);
        setTransactions(updatedTransactions || []);
      } else {
        // Otherwise fetch all transactions
        const allTransactions = await getTransactions();
        console.log('All transactions after update:', allTransactions);
        setTransactions(allTransactions || []);
      }

      setError(null);
    } catch (err) {
      console.error(`Error updating transaction ${id}:`, err);
      alert('Failed to update transaction. Error: ' + (err.message || 'Unknown error'));
    }
  };

  // Open delete confirmation modal
  const handleDeleteClick = (id) => {
    setTransactionToDelete(id);
    setIsDeleteModalOpen(true);
  };

  // Handle deleting a transaction
  const handleDeleteTransaction = async () => {
    try {
      await deleteTransaction(transactionToDelete);
      console.log(`Deleted transaction ${transactionToDelete}`);

      // Refresh transactions list after deleting a transaction
      if (selectedAccountId) {
        // If an account is selected, fetch transactions for that account
        const updatedTransactions = await getTransactionsByAccount(selectedAccountId);
        console.log('Updated transactions for account after delete:', updatedTransactions);
        setTransactions(updatedTransactions || []);
      } else {
        // Otherwise fetch all transactions
        const allTransactions = await getTransactions();
        console.log('All transactions after delete:', allTransactions);
        setTransactions(allTransactions || []);
      }

      setIsDeleteModalOpen(false);
      setTransactionToDelete(null);
      setError(null);
    } catch (err) {
      console.error(`Error deleting transaction ${transactionToDelete}:`, err);
      alert('Failed to delete transaction. Error: ' + (err.message || 'Unknown error'));
    }
  };

  return (
    <Layout title="Transactions" activePage="transactions">
      <h1 className={styles.title}>Your Transactions</h1>

      {/* Error Message */}
      {error && <p className={styles.errorText}>{error}</p>}

      {/* Bank Feed Account Cards */}
      {bankFeedAccounts.length > 0 ? (
        <div>
          <h2>Bank Feed Accounts</h2>
          <div className={styles.accountCardsContainer}>
            {bankFeedAccounts.map(account => (
              <AccountCard
                key={account.id}
                account={account}
                isSelected={selectedAccountId === account.id}
                onClick={handleAccountSelect}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className={styles.widget}>
          <h2>No Bank Feed Accounts</h2>
          <p>You don't have any accounts set up for bank feed. Go to the Accounts page to add accounts to your bank feed.</p>
        </div>
      )}

      {/* Add Transaction Button */}
      <button
        className={styles.addButton}
        onClick={() => setIsAddModalOpen(true)}
      >
        + Add Transaction
      </button>

      {/* Transactions Table */}
      {loading ? (
        <p>Loading transactions...</p>
      ) : (
        <TransactionTable
          transactions={transactions}
          accounts={allAccounts}
          onUpdate={handleUpdateTransaction}
          onDelete={handleDeleteClick}
        />
      )}

      {/* Add Transaction Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Transaction"
      >
        <TransactionForm
          accounts={allAccounts}
          onSubmit={handleAddTransaction}
          onCancel={() => setIsAddModalOpen(false)}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Deletion"
      >
        <div className={styles.confirmDialog}>
          <p>Are you sure you want to delete this transaction?</p>
          <p>This action cannot be undone.</p>

          <div className={styles.confirmActions}>
            <button
              className={styles.deleteButton}
              onClick={handleDeleteTransaction}
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
