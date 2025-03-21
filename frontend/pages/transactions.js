import {
  createTransaction,
  deleteTransaction,
  getTransactions,
  getTransactionsByAccount,
  updateTransaction,
  updateTransactionStatus,
  uploadCSVTransactions
} from '../services/transactionService';
import {
  getAccounts,
  getBankFeedAccounts
} from '../services/accountService';
import { useEffect, useState } from 'react';

import BankFeedAccountsList from '../components/accounts/BankFeedAccountsList';
import CSVUploadModal from '../components/transactions/CSVUploadModal';
import DeleteTransactionModal from '../components/transactions/DeleteTransactionModal';
import Layout from '../components/layout/Layout';
import { LayoutStyles } from '../styles/modules';
import Modal from '../components/common/Modal';
import TransactionActionButtons from '../components/transactions/TransactionActionButtons';
import TransactionFilters from '../components/transactions/TransactionFilters';
import TransactionForm from '../components/transactions/TransactionForm';
import TransactionList from '../components/transactions/TransactionList';
import { getMerchants } from '../services/merchantService';
import { useNotification } from '../contexts/NotificationContext';

// Layout components



// Account components


// Transaction components







// Services



// Styles
const styles = {
  ...LayoutStyles
};

export default function Transactions() {
  // State for accounts and transactions
  const [bankFeedAccounts, setBankFeedAccounts] = useState([]);
  const [allAccounts, setAllAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uniqueMerchants, setUniqueMerchants] = useState([]);

  // Status filter state
  const [statusFilter, setStatusFilter] = useState('review'); // 'review', 'categorized', 'reconciled', 'all'

  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Sorting state
  const [sortField, setSortField] = useState('date'); // Default sort by date
  const [sortDirection, setSortDirection] = useState('desc'); // Default newest first

  // Reset to page 1 when filter or selected account changes
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, selectedAccountId]);

  // Handle sorting
  const handleSort = (field) => {
    if (field === sortField) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field with default direction
      setSortField(field);
      setSortDirection('asc');
    }
    // Reset to page 1 when sort changes
    setCurrentPage(1);
  };

  // Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCSVUploadModalOpen, setIsCSVUploadModalOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);

  // Notification context
  const { showSuccess, showError } = useNotification();

  // Extract unique merchant names from transactions
  useEffect(() => {
    if (transactions && transactions.length > 0) {
      const merchants = transactions
        .map(t => t.merchant_details ? t.merchant_details.name : '')
        .filter(merchant => merchant && merchant.trim() !== '')
        .filter((merchant, index, self) => self.indexOf(merchant) === index)
        .sort();

      setUniqueMerchants(merchants);
    }
  }, [transactions]);

  // Fetch accounts, transactions, and merchants on component mount
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

        // Fetch merchants for the merchant dropdown
        try {
          const merchantsData = await getMerchants();
          console.log('Merchants:', merchantsData);
          const merchantNames = merchantsData.map(m => m.name);
          setUniqueMerchants(merchantNames);
        } catch (merchantErr) {
          console.error('Error fetching merchants:', merchantErr);
          // Don't set an error, just continue with empty merchants list
        }

        // Get the saved account ID from localStorage
        const savedAccountId = localStorage.getItem('selectedAccountId');
        let accountToLoad = null;

        // If there's a saved account ID and it exists in the bank feed accounts, use it
        if (savedAccountId && bankFeedData.some(acc => acc.id === parseInt(savedAccountId))) {
          accountToLoad = parseInt(savedAccountId);
          setSelectedAccountId(accountToLoad);
        }
        // Otherwise, if there are bank feed accounts, select the first one by default
        else if (bankFeedData && bankFeedData.length > 0) {
          accountToLoad = bankFeedData[0].id;
          setSelectedAccountId(accountToLoad);
        }

        if (accountToLoad) {
          try {
            // Fetch transactions for the selected account
            const transactionsData = await getTransactionsByAccount(accountToLoad);
            console.log('Transactions for account:', transactionsData);
            // Debug: Log individual transaction data to check amount field
            if (transactionsData && transactionsData.length > 0) {
              console.log('First transaction data:', transactionsData[0]);
              console.log('Amount type:', typeof transactionsData[0].amount);
              console.log('Amount value:', transactionsData[0].amount);
            }
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

      // Save selected account ID to localStorage
      localStorage.setItem('selectedAccountId', accountId);

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

  // Helper function to refresh account balances
  const refreshAccountBalances = async () => {
    try {
      // Refresh bank feed accounts to update balances
      const updatedBankFeedAccounts = await getBankFeedAccounts();
      setBankFeedAccounts(updatedBankFeedAccounts);
    } catch (err) {
      console.error('Error refreshing account balances:', err);
    }
  };

  // Set up an interval to refresh account balances periodically
  useEffect(() => {
    // Refresh account balances every 5 seconds
    const refreshInterval = setInterval(refreshAccountBalances, 5000);

    // Clean up the interval when the component unmounts
    return () => clearInterval(refreshInterval);
  }, []);

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

      // Refresh account balances
      await refreshAccountBalances();

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

      // Refresh account balances
      await refreshAccountBalances();

      setError(null);
    } catch (err) {
      console.error(`Error updating transaction ${id}:`, err);
      alert('Failed to update transaction. Error: ' + (err.message || 'Unknown error'));
    }
  };

  // Open delete confirmation modal
  const handleDeleteClick = (ids) => {
    // If ids is a single number, convert it to an array for consistency
    const transactionIds = Array.isArray(ids) ? ids : [ids];
    setTransactionToDelete(transactionIds);
    setIsDeleteModalOpen(true);
  };

  // Handle deleting transactions
  const handleDeleteTransaction = async () => {
    try {
      // If transactionToDelete is an array, delete all transactions
      if (Array.isArray(transactionToDelete)) {
        await Promise.all(transactionToDelete.map(id => deleteTransaction(id)));
        console.log(`Deleted ${transactionToDelete.length} transactions`);
      } else {
        // Fallback for single transaction (should not happen with updated code)
        await deleteTransaction(transactionToDelete);
        console.log(`Deleted transaction ${transactionToDelete}`);
      }

      // Refresh transactions list after deleting transactions
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

      // Refresh account balances
      await refreshAccountBalances();

      setIsDeleteModalOpen(false);
      setTransactionToDelete(null);
      setError(null);
    } catch (err) {
      console.error(`Error deleting transactions:`, err);
      alert('Failed to delete transactions. Error: ' + (err.message || 'Unknown error'));
    }
  };

  // Handle updating transaction status
  const handleUpdateStatus = async (id, status) => {
    try {
      const updatedTransaction = await updateTransactionStatus(id, status);
      console.log(`Updated transaction ${id} status to ${status}:`, updatedTransaction);

      // Refresh transactions list after updating a transaction status
      if (selectedAccountId) {
        // If an account is selected, fetch transactions for that account
        const updatedTransactions = await getTransactionsByAccount(selectedAccountId);
        console.log('Updated transactions for account after status update:', updatedTransactions);
        setTransactions(updatedTransactions || []);
      } else {
        // Otherwise fetch all transactions
        const allTransactions = await getTransactions();
        console.log('All transactions after status update:', allTransactions);
        setTransactions(allTransactions || []);
      }

      // Refresh account balances
      await refreshAccountBalances();

      setError(null);
    } catch (err) {
      console.error(`Error updating transaction ${id} status:`, err);
      showError('Failed to update transaction status: ' + (err.message || 'Unknown error'));
    }
  };

  // Handle CSV upload
  const handleCSVUpload = async (fileContent, columnMapping, accountId) => {
    try {
      setLoading(true);

      // Debug logging
      console.log('CSV Upload - File content length:', fileContent.length);
      console.log('CSV Upload - Column mapping:', columnMapping);
      console.log('CSV Upload - Account ID:', accountId);

      // Call the API to upload CSV transactions
      const result = await uploadCSVTransactions(fileContent, columnMapping, accountId);

      // Debug logging
      console.log('CSV Upload - API response:', result);

      // Show success message
      const successCount = result.success || 0;
      showSuccess(`Successfully imported ${successCount} transactions`);

      // If there were errors, show them
      if (result.errors && result.errors.length > 0) {
        console.warn('CSV Upload - Errors:', result.errors);
        showError(`${result.errors.length} rows had errors. Check console for details.`);
      }

      // Refresh transactions list
      if (selectedAccountId) {
        const updatedTransactions = await getTransactionsByAccount(selectedAccountId);
        setTransactions(updatedTransactions || []);
      } else {
        const allTransactions = await getTransactions();
        setTransactions(allTransactions || []);
      }

      // Refresh account balances
      await refreshAccountBalances();

      return result;
    } catch (err) {
      console.error('Error uploading CSV transactions:', err);
      showError('Failed to upload CSV: ' + (err.message || 'Unknown error'));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Transactions" activePage="transactions">
      <h1 className={styles.title}>Your Transactions</h1>

      {/* Error Message */}
      {error && <p className={styles.errorText}>{error}</p>}

      {/* Bank Feed Account Cards */}
      <BankFeedAccountsList
        accounts={bankFeedAccounts}
        selectedAccountId={selectedAccountId}
        onAccountSelect={handleAccountSelect}
      />

      {/* Action Buttons */}
      <TransactionActionButtons
        onAddClick={() => setIsAddModalOpen(true)}
        onImportClick={() => setIsCSVUploadModalOpen(true)}
        selectedAccountId={selectedAccountId}
      />

      {/* Status Filter and Search */}
      <TransactionFilters
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onSearchChange={setSearchTerm}
      />

      {/* Transactions List */}
      {loading ? (
        <p>Loading transactions...</p>
      ) : (
        <TransactionList
          transactions={transactions}
          accounts={allAccounts}
          selectedAccountId={selectedAccountId}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
          onUpdate={handleUpdateTransaction}
          onDelete={handleDeleteClick}
          onUpdateStatus={handleUpdateStatus}
          statusFilter={statusFilter}
          searchTerm={searchTerm}
          pageSize={pageSize}
          merchants={uniqueMerchants}
          onRefresh={async () => {
            // Dedicated refresh function that doesn't rely on updating a transaction
            try {
              setLoading(true);
              if (selectedAccountId) {
                // If an account is selected, fetch transactions for that account
                const updatedTransactions = await getTransactionsByAccount(selectedAccountId);
                console.log('Refreshed transactions for account:', updatedTransactions);
                setTransactions(updatedTransactions || []);
              } else {
                // Otherwise fetch all transactions
                const allTransactions = await getTransactions();
                console.log('Refreshed all transactions:', allTransactions);
                setTransactions(allTransactions || []);
              }

              // Also refresh account balances
              await refreshAccountBalances();

              setError(null);
            } catch (err) {
              console.error('Error refreshing transactions:', err);
              setError('Failed to refresh transactions. Error: ' + (err.message || 'Unknown error'));
            } finally {
              setLoading(false);
            }
          }}
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
          selectedAccountId={selectedAccountId}
          onSubmit={handleAddTransaction}
          onCancel={() => setIsAddModalOpen(false)}
          merchants={uniqueMerchants}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <DeleteTransactionModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteTransaction}
        transactionCount={Array.isArray(transactionToDelete) ? transactionToDelete.length : 1}
      />

      {/* CSV Upload Modal */}
      <CSVUploadModal
        isOpen={isCSVUploadModalOpen}
        onClose={() => setIsCSVUploadModalOpen(false)}
        onUpload={handleCSVUpload}
        selectedAccountId={selectedAccountId}
      />
    </Layout>
  );
}
