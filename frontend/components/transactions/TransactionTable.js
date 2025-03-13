import { ButtonStyles, FormStyles, TransactionTableStyles as styles } from '../../styles/modules';
import { useEffect, useState } from 'react';

import BulkEditModal from './BulkEditModal';
import { bulkUpdateTransactions } from '../../services/transactionService';

const TransactionTable = ({
  transactions,
  accounts,
  selectedAccountId,
  sortField,
  sortDirection,
  onSort,
  onUpdate,
  onDelete,
  onUpdateStatus,
  onRefresh
}) => {
  // Debug: Log transactions to see their structure
  console.log('Transactions in table:', transactions);
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    date: '',
    amount: '',
    debit: '',
    credit: '',
    notes: '',
    is_reconciled: false
  });

  // State for selected transactions
  const [selectedTransactions, setSelectedTransactions] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
  const [bulkEditError, setBulkEditError] = useState(null);

  // Instead of resetting selections when transactions change,
  // we'll maintain selections for IDs that still exist
  useEffect(() => {
    if (selectedTransactions.length > 0) {
      const existingIds = transactions.map(t => t.id);
      const stillSelectedIds = selectedTransactions.filter(id =>
        existingIds.includes(id)
      );

      setSelectedTransactions(stillSelectedIds);
      setSelectAll(stillSelectedIds.length === transactions.length && transactions.length > 0);
    }
  }, [transactions]);

  // Selection handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedTransactions(transactions.map(t => t.id));
      setSelectAll(true);
    } else {
      setSelectedTransactions([]);
      setSelectAll(false);
    }
  };

  const handleSelectTransaction = (e, id) => {
    // Stop propagation to prevent row click from triggering
    e.stopPropagation();

    if (selectedTransactions.includes(id)) {
      setSelectedTransactions(selectedTransactions.filter(tId => tId !== id));
      setSelectAll(false);
    } else {
      setSelectedTransactions([...selectedTransactions, id]);
      if (selectedTransactions.length + 1 === transactions.length) {
        setSelectAll(true);
      }
    }
  };

  // Bulk action handlers
  const handleBulkDelete = () => {
    if (confirm(`Are you sure you want to delete ${selectedTransactions.length} transactions?`)) {
      Promise.all(selectedTransactions.map(id => onDelete(id)))
        .then(() => {
          setSelectedTransactions([]);
          setSelectAll(false);
        })
        .catch(error => {
          console.error('Error deleting transactions:', error);
          alert('Failed to delete some transactions. Please try again.');
        });
    }
  };

  const handleBulkEdit = () => {
    setIsBulkEditModalOpen(true);
    setBulkEditError(null);
  };

  const handleBulkEditSubmit = async (transactionIds, updateData) => {
    try {
      // Validate that we have transaction IDs
      if (!transactionIds || transactionIds.length === 0) {
        setBulkEditError('No transactions selected for update');
        return;
      }

      // Validate that we have data to update
      if (!updateData || Object.keys(updateData).length === 0) {
        setBulkEditError('No fields selected for update');
        return;
      }

      console.log('Bulk edit submit - transactionIds:', transactionIds);
      console.log('Bulk edit submit - updateData:', updateData);
      console.log('Bulk edit submit - selectedAccountId:', selectedAccountId);

      // Pass the selectedAccountId to the bulkUpdateTransactions function
      const result = await bulkUpdateTransactions(transactionIds, updateData, selectedAccountId);
      console.log('Bulk update result:', result);

      // Refresh transactions after bulk update using the dedicated refresh function
      // This avoids the issue of trying to update a transaction with an empty object
      if (onRefresh) {
        await onRefresh();
      }

      // Only clear selections if the update was successful and the user wants to clear them
      // For now, we'll keep the selections to allow for multiple operations
      setIsBulkEditModalOpen(false);

      // Show success message
      setBulkEditError(null);
    } catch (error) {
      console.error('Error in bulk edit:', error);

      // Extract detailed error information
      let errorMessage = 'Failed to update transactions';

      if (error.response?.data) {
        const errorData = error.response.data;
        console.error('Error details:', errorData);

        if (errorData.detail) {
          errorMessage += `: ${errorData.detail}`;
        }

        if (errorData.missing_ids) {
          errorMessage += `. Missing transaction IDs: ${errorData.missing_ids.join(', ')}`;
        }
      } else if (error.message) {
        errorMessage += `: ${error.message}`;
      }

      setBulkEditError(errorMessage);
    }
  };

  const handleBulkStatusUpdate = (status) => {
    Promise.all(selectedTransactions.map(id => onUpdateStatus(id, status)))
      .then(() => {
        // Keep selections after status update to allow for multiple operations
        // The user can manually deselect if needed
      })
      .catch(error => {
        console.error('Error updating transaction status:', error);
        alert('Failed to update status for some transactions. Please try again.');
      });
  };

  // Start editing a transaction
  const handleEditClick = (transaction) => {
    setEditingId(transaction.id);

    // Determine if the amount should be positive or negative in the form
    let displayAmount = transaction.amount;
    if (transaction.credit === selectedAccountId) {
      displayAmount = -parseFloat(displayAmount);
    }

    // For category, we store the "other" account (not the selected bank feed account)
    const categoryAccountId = transaction.debit === selectedAccountId
      ? transaction.credit
      : transaction.debit;

    setEditFormData({
      date: transaction.date,
      amount: displayAmount,
      category: categoryAccountId,
      debit: transaction.debit,
      credit: transaction.credit,
      notes: transaction.notes || '',
      is_reconciled: transaction.is_reconciled
    });
  };

  // Handle form field changes
  const handleEditFormChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === 'category') {
      // When category changes, update the appropriate debit/credit field
      // based on the amount sign
      const amount = parseFloat(editFormData.amount) || 0;

      if (amount >= 0) {
        // Positive amount: selected account is debit, category is credit
        setEditFormData({
          ...editFormData,
          category: value,
          credit: value,
          debit: selectedAccountId
        });
      } else {
        // Negative amount: selected account is credit, category is debit
        setEditFormData({
          ...editFormData,
          category: value,
          debit: value,
          credit: selectedAccountId
        });
      }
    } else if (name === 'amount') {
      // When amount changes, we may need to swap debit and credit
      const newAmount = parseFloat(value) || 0;
      const oldAmount = parseFloat(editFormData.amount) || 0;
      const categoryId = editFormData.category;

      // If sign changed, swap debit and credit
      if ((newAmount >= 0 && oldAmount < 0) || (newAmount < 0 && oldAmount >= 0)) {
        setEditFormData({
          ...editFormData,
          amount: value,
          debit: newAmount >= 0 ? selectedAccountId : categoryId,
          credit: newAmount >= 0 ? categoryId : selectedAccountId
        });
      } else {
        // Sign didn't change, just update the amount
        setEditFormData({
          ...editFormData,
          amount: value
        });
      }
    } else {
      // For other fields, just update normally
      setEditFormData({
        ...editFormData,
        [name]: type === 'checkbox' ? checked : value
      });
    }
  };

  // Save edited transaction
  const handleSaveClick = async () => {
    // Validate form data
    if (!editFormData.date || !editFormData.amount || !editFormData.category) {
      alert('Please fill in all required fields');
      return;
    }

    // Convert amount to number
    let amount = parseFloat(editFormData.amount);
    if (isNaN(amount)) {
      alert('Amount must be a valid number');
      return;
    }

    // Ensure amount is always positive in the database
    // The sign is determined by which account is debit vs credit
    amount = Math.abs(amount);

    // Prepare data for API
    const updatedTransaction = {
      date: editFormData.date,
      amount,
      debit: editFormData.debit,
      credit: editFormData.credit,
      notes: editFormData.notes,
      is_reconciled: editFormData.is_reconciled
    };

    try {
      await onUpdate(editingId, updatedTransaction);
      setEditingId(null);
    } catch (error) {
      console.error('Error updating transaction:', error);
      alert('Failed to update transaction. Please try again.');
    }
  };

  // Cancel editing
  const handleCancelClick = () => {
    setEditingId(null);
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = {
      month: 'short',  // "mmm"
      day: 'numeric',  // "dd"
      year: 'numeric'  // "yyyy"
    };
    return date.toLocaleDateString('en-US', options);
  };

  // Get account name by ID
  const getAccountName = (accountId) => {
    const account = accounts.find(acc => acc.id === accountId);
    return account ? account.name : 'Unknown Account';
  };

  // Get the category name (the account that isn't the selected bank feed account)
  const getCategoryName = (transaction) => {
    if (transaction.debit === selectedAccountId) {
      return transaction.credit_account ? (
        <span className={styles.categoryWithIcon}>
          <span className={styles.categoryIcon}>{transaction.credit_account.icon || '💰'}</span>
          {transaction.credit_account.name}
        </span>
      ) : getAccountName(transaction.credit);
    } else {
      return transaction.debit_account ? (
        <span className={styles.categoryWithIcon}>
          <span className={styles.categoryIcon}>{transaction.debit_account.icon || '💰'}</span>
          {transaction.debit_account.name}
        </span>
      ) : getAccountName(transaction.debit);
    }
  };

  // Get the adjusted amount based on whether the selected account is debit or credit
  const getAdjustedAmount = (transaction) => {
    let amount = 0;

    // Parse the amount to a number
    if (typeof transaction.amount === 'number') {
      amount = transaction.amount;
    } else if (typeof transaction.amount === 'string') {
      amount = parseFloat(transaction.amount);
      if (isNaN(amount)) amount = 0;
    }

    // Adjust sign based on whether selected account is debit or credit
    if (transaction.credit === selectedAccountId) {
      amount = -amount;
    }

    return amount.toFixed(2);
  };

  // Row click handler
  const handleRowClick = (transaction) => {
    // Only open edit mode if we're not already editing and the row isn't in the selected transactions
    if (editingId !== transaction.id) {
      handleEditClick(transaction);
    }
  };

  // Render table row based on whether it's being edited
  const renderRow = (transaction) => {
    if (editingId === transaction.id) {
      return (
        <tr key={transaction.id} className={styles.editingRow}>
          <td className={styles.checkboxColumn}>
            <input
              type="checkbox"
              checked={selectedTransactions.includes(transaction.id)}
              onChange={(e) => handleSelectTransaction(e, transaction.id)}
              className={styles.checkbox}
              onClick={(e) => e.stopPropagation()}
            />
          </td>
          <td>
            <input
              type="date"
              name="date"
              value={editFormData.date}
              onChange={handleEditFormChange}
              className={styles.editInput}
            />
          </td>
          <td>
            <input
              type="number"
              name="amount"
              value={editFormData.amount}
              onChange={handleEditFormChange}
              step="0.01"
              className={styles.editInput}
            />
          </td>
          <td className={styles.accountSelects}>
            <div className={styles.accountSelectContainer}>
              <label>Category:</label>
              <select
                name="category"
                value={editFormData.category}
                onChange={handleEditFormChange}
                className={styles.editInput}
              >
                <option value="">Select Category</option>
                {accounts
                  .filter(account => account.id !== selectedAccountId)
                  .map(account => (
                    <option key={`category-${account.id}`} value={account.id}>
                      {account.name}
                    </option>
                  ))}
              </select>
              <div className={styles.categoryHint}>
                {parseFloat(editFormData.amount) >= 0
                  ? 'Money going to selected account'
                  : 'Money coming from selected account'}
              </div>
            </div>
            <div className={styles.reconcileCheckbox}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="is_reconciled"
                  checked={editFormData.is_reconciled}
                  onChange={handleEditFormChange}
                />
                Reconciled
              </label>
            </div>
          </td>
          <td>
            <input
              type="text"
              name="notes"
              value={editFormData.notes}
              onChange={handleEditFormChange}
              className={styles.editInput}
            />
          </td>
          <td className={styles.actionButtons}>
            <button
              type="button"
              onClick={handleSaveClick}
              className={styles.saveButton}
            >
              Save
            </button>
            <button
              type="button"
              onClick={handleCancelClick}
              className={styles.cancelButton}
            >
              Cancel
            </button>
          </td>
        </tr>
      );
    }

    return (
      <tr
        key={transaction.id}
        className={styles.clickableRow}
        onClick={() => handleRowClick(transaction)}
      >
        <td className={styles.checkboxColumn} onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={selectedTransactions.includes(transaction.id)}
            onChange={(e) => handleSelectTransaction(e, transaction.id)}
            className={styles.checkbox}
          />
        </td>
        <td>{formatDate(transaction.date)}</td>
        <td className={styles.amountCell}>
          ${getAdjustedAmount(transaction)}
        </td>
        <td>{getCategoryName(transaction)}</td>
        <td>{transaction.notes}</td>
        <td>
          {transaction.status === 'review' || transaction.status === 'categorized' ? (
            <span className={styles.statusText}>
              {transaction.status === 'review' ? 'Review' : 'Categorized'}
            </span>
          ) : (
            <span className={styles.statusText}>Reconciled</span>
          )}
        </td>
      </tr>
    );
  };

  return (
    <div className={styles.tableContainer}>
      {/* Bulk Edit Modal */}
      <BulkEditModal
        isOpen={isBulkEditModalOpen}
        onClose={() => setIsBulkEditModalOpen(false)}
        onSubmit={handleBulkEditSubmit}
        transactionIds={selectedTransactions}
        accounts={accounts}
        selectedAccountId={selectedAccountId}
      />

      {/* Error message for bulk edit */}
      {bulkEditError && (
        <div className={styles.errorMessage}>
          {bulkEditError}
        </div>
      )}

      {/* Placeholder for bulk actions - only shown when no transactions are selected */}
      {selectedTransactions.length === 0 && (
        <div className={styles.bulkActionsPlaceholder}></div>
      )}

      {/* Bulk Actions Bar - only shown when transactions are selected */}
      {selectedTransactions.length > 0 && (
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
          <button
            className={`${styles.bulkActionButton} ${styles.categorizeButton}`}
            onClick={() => handleBulkStatusUpdate('categorized')}
          >
            Mark as Categorized
          </button>
          <button
            className={`${styles.bulkActionButton} ${styles.reconcileButton}`}
            onClick={() => handleBulkStatusUpdate('reconciled')}
          >
            Mark as Reconciled
          </button>
        </div>
      )}

      {transactions.length === 0 ? (
        <div className={styles.noTransactions}>
          <p>No transactions found for this account.</p>
        </div>
      ) : (
        <table className={styles.transactionsTable}>
          <thead>
            <tr>
              <th className={styles.checkboxColumn}>
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleSelectAll}
                  className={`${styles.checkbox} ${styles.selectAllCheckbox}`}
                />
              </th>
              <th
                onClick={() => onSort('date')}
                className={styles.sortableHeader}
              >
                Date {sortField === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th
                onClick={() => onSort('amount')}
                className={styles.sortableHeader}
              >
                Amount {sortField === 'amount' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th
                onClick={() => onSort('category')}
                className={styles.sortableHeader}
              >
                Category {sortField === 'category' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th
                onClick={() => onSort('description')}
                className={styles.sortableHeader}
              >
                Description {sortField === 'description' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th
                onClick={() => onSort('status')}
                className={styles.sortableHeader}
              >
                Status {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
            </tr>
          </thead>
          <tbody>
            {transactions.map(transaction => renderRow(transaction))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default TransactionTable;
