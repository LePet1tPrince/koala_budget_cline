import TransactionTable from './TransactionTable';
import { TransactionTableStyles as styles } from '../../styles/modules';
import { useState } from 'react';

const TransactionList = ({
  transactions,
  accounts,
  selectedAccountId,
  sortField,
  sortDirection,
  onSort,
  onUpdate,
  onDelete,
  onUpdateStatus,
  statusFilter,
  searchTerm = '',
  pageSize = 10,
  onRefresh, // New prop for refreshing transactions
  merchants = []
}) => {
  const [currentPage, setCurrentPage] = useState(1);

  // Filter transactions based on status and search term
  const filteredTransactions = transactions.filter(transaction => {
    // First filter by status
    if (statusFilter !== 'all' && transaction.status !== statusFilter) {
      return false;
    }

    // Then filter by search term if provided
    if (searchTerm.trim() !== '') {
      const searchLower = searchTerm.toLowerCase();

      // Search in amount
      const amount = parseFloat(transaction.amount) || 0;
      const amountStr = amount.toString();

      // Search in category (account name)
      const categoryName = transaction.debit === selectedAccountId
        ? (transaction.credit_account ? transaction.credit_account.name : '')
        : (transaction.debit_account ? transaction.debit_account.name : '');

      // Search in merchant
      const merchant = transaction.merchant || '';

      // Search in description (notes)
      const description = transaction.notes || '';

      return (
        amountStr.includes(searchLower) ||
        categoryName.toLowerCase().includes(searchLower) ||
        merchant.toLowerCase().includes(searchLower) ||
        description.toLowerCase().includes(searchLower)
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
      case 'amount':
        // Use the getAdjustedAmount logic for sorting
        const aAmount = parseFloat(a.amount) || 0;
        const bAmount = parseFloat(b.amount) || 0;
        aValue = a.credit === selectedAccountId ? -aAmount : aAmount;
        bValue = b.credit === selectedAccountId ? -bAmount : bAmount;
        break;
      case 'merchant':
        aValue = (a.merchant || '').toLowerCase();
        bValue = (b.merchant || '').toLowerCase();
        break;
      case 'category':
        // Use the category name logic for sorting
        aValue = a.debit === selectedAccountId
          ? (a.credit_account ? a.credit_account.name : '')
          : (a.debit_account ? a.debit_account.name : '');
        bValue = b.debit === selectedAccountId
          ? (b.credit_account ? b.credit_account.name : '')
          : (b.debit_account ? b.debit_account.name : '');
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
        break;
      case 'description':
        aValue = (a.notes || '').toLowerCase();
        bValue = (b.notes || '').toLowerCase();
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
  const totalPages = Math.ceil(filteredTransactions.length / pageSize);

  return (
    <>
      <TransactionTable
        transactions={paginatedTransactions}
        accounts={accounts}
        selectedAccountId={selectedAccountId}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={onSort}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onUpdateStatus={onUpdateStatus}
        onRefresh={onRefresh} // Pass the refresh function to TransactionTable
        merchants={merchants}
      />

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
  );
};

export default TransactionList;
