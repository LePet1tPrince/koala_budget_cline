import { LayoutStyles, TransactionTableStyles } from '../styles/modules';
import { useEffect, useState } from 'react';

import Layout from '../components/layout/Layout';
import TransactionTable from '../components/transactions/TransactionTable';
import { formatDate } from '../components/transactions/utils/transactionFormatters';
import { getAccounts } from '../services/accountService';
import { getMerchants } from '../services/merchantService';
import { getTransactions } from '../services/transactionService';
import { useNotification } from '../contexts/NotificationContext';

// Combine styles
const styles = {
  ...LayoutStyles,
  ...TransactionTableStyles
};

export default function AllTransactions() {
  // State for transactions and accounts
  const [transactions, setTransactions] = useState([]);
  const [allAccounts, setAllAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uniqueMerchants, setUniqueMerchants] = useState([]);

  // Sorting state
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Column filters state
  const [columnFilters, setColumnFilters] = useState({
    date: { from: '', to: '' },
    merchant: '',
    amount: { min: '', max: '' },
    debit: '',
    credit: '',
    description: '',
    status: ''
  });

  // Search term state
  const [searchTerm, setSearchTerm] = useState('');

  // Notification context
  const { showSuccess, showError } = useNotification();

  // Fetch transactions, accounts, and merchants on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all accounts
        const accountsData = await getAccounts();
        console.log('All accounts:', accountsData);
        setAllAccounts(accountsData);

        // Fetch all transactions
        const transactionsData = await getTransactions();
        console.log('All transactions:', transactionsData);
        setTransactions(transactionsData || []);

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
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again later. Error: ' + (err.message || 'Unknown error'));
        setTransactions([]);
        setAllAccounts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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

  // Handle column filters change
  const handleColumnFiltersChange = (filters) => {
    setColumnFilters(filters);
    setCurrentPage(1); // Reset to page 1 when filters change
  };

  // Handle transaction update, including column filter changes
  const handleTransactionUpdate = (type, data) => {
    if (type === 'columnFilters') {
      handleColumnFiltersChange(data);
    } else {
      refreshTransactions();
    }
  };

  // Apply filters to transactions
  const filteredTransactions = transactions.filter(transaction => {
    // Date filter
    if (columnFilters.date && columnFilters.date.from && new Date(transaction.date) < new Date(columnFilters.date.from)) {
      return false;
    }
    if (columnFilters.date && columnFilters.date.to && new Date(transaction.date) > new Date(columnFilters.date.to)) {
      return false;
    }

    // Merchant filter
    if (columnFilters.merchant &&
        (!transaction.merchant_details ||
         transaction.merchant_details.name !== columnFilters.merchant)) {
      return false;
    }

    // Amount filter
    const amount = parseFloat(transaction.amount) || 0;
    if (columnFilters.amount && columnFilters.amount.min && amount < parseFloat(columnFilters.amount.min)) {
      return false;
    }
    if (columnFilters.amount && columnFilters.amount.max && amount > parseFloat(columnFilters.amount.max)) {
      return false;
    }

    // Debit account filter
    if (columnFilters.debit && transaction.debit !== parseInt(columnFilters.debit)) {
      return false;
    }

    // Credit account filter
    if (columnFilters.credit && transaction.credit !== parseInt(columnFilters.credit)) {
      return false;
    }

    // Description filter
    if (columnFilters.description &&
        (!transaction.notes ||
         !transaction.notes.toLowerCase().includes(columnFilters.description.toLowerCase()))) {
      return false;
    }

    // Status filter
    if (columnFilters.status && transaction.status !== columnFilters.status) {
      return false;
    }

    // Apply search term filter if provided
    if (searchTerm.trim() !== '') {
      const searchLower = searchTerm.toLowerCase();

      // Search in amount
      const amountStr = amount.toString();

      // Search in merchant
      const merchant = transaction.merchant_details ? transaction.merchant_details.name : '';

      // Search in description (notes)
      const description = transaction.notes || '';

      // Search in debit account
      const debitAccount = allAccounts.find(acc => acc.id === transaction.debit);
      const debitName = debitAccount ? debitAccount.name.toLowerCase() : '';

      // Search in credit account
      const creditAccount = allAccounts.find(acc => acc.id === transaction.credit);
      const creditName = creditAccount ? creditAccount.name.toLowerCase() : '';

      return (
        amountStr.includes(searchLower) ||
        merchant.toLowerCase().includes(searchLower) ||
        description.toLowerCase().includes(searchLower) ||
        debitName.includes(searchLower) ||
        creditName.includes(searchLower)
      );
    }

    return true;
  });

  // Sort the filtered transactions
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    let aValue, bValue;

    // Get values based on sort field
    switch (sortField) {
      case 'date':
        aValue = new Date(a.date);
        bValue = new Date(b.date);
        break;
      case 'merchant':
        aValue = (a.merchant_details ? a.merchant_details.name : '').toLowerCase();
        bValue = (b.merchant_details ? b.merchant_details.name : '').toLowerCase();
        break;
      case 'amount':
        aValue = parseFloat(a.amount) || 0;
        bValue = parseFloat(b.amount) || 0;
        break;
      case 'debit':
        const aDebitAccount = allAccounts.find(acc => acc.id === a.debit);
        const bDebitAccount = allAccounts.find(acc => acc.id === b.debit);
        aValue = aDebitAccount ? aDebitAccount.name.toLowerCase() : '';
        bValue = bDebitAccount ? bDebitAccount.name.toLowerCase() : '';
        break;
      case 'credit':
        const aCreditAccount = allAccounts.find(acc => acc.id === a.credit);
        const bCreditAccount = allAccounts.find(acc => acc.id === b.credit);
        aValue = aCreditAccount ? aCreditAccount.name.toLowerCase() : '';
        bValue = bCreditAccount ? bCreditAccount.name.toLowerCase() : '';
        break;
      case 'description':
        aValue = (a.notes || '').toLowerCase();
        bValue = (b.notes || '').toLowerCase();
        break;
      case 'status':
        aValue = a.status || '';
        bValue = b.status || '';
        break;
      default:
        return 0;
    }

    // Compare values based on direction
    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
    } else {
      return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
    }
  });

  // Paginate the sorted transactions
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedTransactions = sortedTransactions.slice(startIndex, startIndex + pageSize);

  // Calculate total pages
  const totalPages = Math.ceil(sortedTransactions.length / pageSize);

  // Refresh transactions
  const refreshTransactions = async () => {
    try {
      setLoading(true);
      const transactionsData = await getTransactions();
      setTransactions(transactionsData || []);
      setError(null);
    } catch (err) {
      console.error('Error refreshing transactions:', err);
      setError('Failed to refresh transactions. Error: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="All Transactions" activePage="all-transactions">
      <h1 className={styles.title}>All Transactions</h1>

      {/* Error Message */}
      {error && <p className={styles.errorText}>{error}</p>}

      {/* Search */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '300px',
              padding: '8px 12px',
              borderRadius: '20px',
              border: '1px solid #ccc',
              fontSize: '14px',
              backgroundColor: 'rgba(138, 140, 142, 0.1)',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}
          />
        </div>
      </div>

      {/* Transactions Table */}
      {loading ? (
        <p>Loading transactions...</p>
      ) : (
        <>
          <TransactionTable
            transactions={paginatedTransactions}
            accounts={allAccounts}
            selectedAccountId={null}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
            onUpdate={handleTransactionUpdate}
            onDelete={() => refreshTransactions()}
            onUpdateStatus={() => refreshTransactions()}
            onRefresh={refreshTransactions}
            merchants={uniqueMerchants}
            showAllColumns={true}
            initialColumnFilters={columnFilters}
          />

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className={styles.paginationControls}>
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={styles.paginationButton}
              >
                Previous
              </button>

              <span className={styles.paginationInfo}>
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={styles.paginationButton}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </Layout>
  );
}
