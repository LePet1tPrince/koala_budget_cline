import TransactionTable from './TransactionTable';
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
  pageSize = 10
}) => {
  const [currentPage, setCurrentPage] = useState(1);

  // Filter transactions based on status
  const filteredTransactions = statusFilter === 'all'
    ? transactions
    : transactions.filter(t => t.status === statusFilter);

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
      />

      {totalPages > 1 && (
        <div className="paginationControls">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="paginationButton"
          >
            Previous
          </button>

          <span className="paginationInfo">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="paginationButton"
          >
            Next
          </button>
        </div>
      )}
    </>
  );
};

export default TransactionList;
