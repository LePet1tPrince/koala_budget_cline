import React from 'react';

const BulkActionsBar = ({
  selectedTransactions,
  transactions,
  handleBulkEdit,
  handleBulkDelete,
  handleBulkStatusUpdate,
  styles
}) => {
  // If no transactions are selected, return a placeholder to maintain layout
  if (selectedTransactions.length === 0) {
    return <div className={styles.bulkActionsPlaceholder}></div>;
  }

  // Determine the statuses of selected transactions
  const selectedTransactionObjects = transactions.filter(t => selectedTransactions.includes(t.id));
  const hasReviewTransactions = selectedTransactionObjects.some(t => t.status === 'review');
  const hasCategorizedTransactions = selectedTransactionObjects.some(t => t.status === 'categorized');
  const hasReconciledTransactions = selectedTransactionObjects.some(t => t.status === 'reconciled');

  // Determine which status buttons to show based on the rules
  const showMarkAsReview = hasCategorizedTransactions || hasReconciledTransactions;
  const showMarkAsCategorized = hasReviewTransactions || hasReconciledTransactions;
  const showMarkAsReconciled = hasCategorizedTransactions; // Only categorized can be marked as reconciled

  return (
    <div className={styles.bulkActionsContainer}>
      <span className={styles.selectedCount}>
        {selectedTransactions.length} transaction{selectedTransactions.length !== 1 ? 's' : ''} selected
      </span>
      <button
        className={`${styles.bulkActionButton} ${styles.editButton}`}
        onClick={handleBulkEdit}
      >
        Edit Transactions
      </button>
      <button
        className={`${styles.bulkActionButton} ${styles.deleteButton}`}
        onClick={handleBulkDelete}
      >
        Delete Transactions
      </button>

      {/* Status update buttons */}
      {showMarkAsReview && (
        <button
          className={`${styles.bulkActionButton} ${styles.reviewButton}`}
          onClick={() => handleBulkStatusUpdate('review')}
        >
          Mark as Review
        </button>
      )}

      {showMarkAsCategorized && (
        <button
          className={`${styles.bulkActionButton} ${styles.categorizeButton}`}
          onClick={() => handleBulkStatusUpdate('categorized')}
        >
          Mark as Categorized
        </button>
      )}

      {showMarkAsReconciled && (
        <button
          className={`${styles.bulkActionButton} ${styles.reconcileButton}`}
          onClick={() => handleBulkStatusUpdate('reconciled')}
        >
          Mark as Reconciled
        </button>
      )}
    </div>
  );
};

export default BulkActionsBar;
