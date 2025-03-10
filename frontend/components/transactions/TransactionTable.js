import { ButtonStyles, FormStyles, TransactionTableStyles as styles } from '../../styles/modules';

import { useState } from 'react';

const TransactionTable = ({
  transactions,
  accounts,
  selectedAccountId,
  sortField,
  sortDirection,
  onSort,
  onUpdate,
  onDelete,
  onUpdateStatus
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
      return transaction.credit_account ? transaction.credit_account.name : getAccountName(transaction.credit);
    } else {
      return transaction.debit_account ? transaction.debit_account.name : getAccountName(transaction.debit);
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

  // Render table row based on whether it's being edited
  const renderRow = (transaction) => {
    if (editingId === transaction.id) {
      return (
        <tr key={transaction.id} className={styles.editingRow}>
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
      <tr key={transaction.id}>
        <td>{formatDate(transaction.date)}</td>
        <td className={styles.amountCell}>
          ${getAdjustedAmount(transaction)}
        </td>
        <td>{getCategoryName(transaction)}</td>
        <td>{transaction.notes}</td>
        <td>
          {transaction.status === 'review' ? (
            <button
              type="button"
              onClick={() => onUpdateStatus(transaction.id, 'categorized')}
              className={`${styles.statusTransitionButton} ${styles.reviewToCategorizingButton}`}
            >
              Mark as Categorized
            </button>
          ) : transaction.status === 'categorized' ? (
            <button
              type="button"
              onClick={() => onUpdateStatus(transaction.id, 'reconciled')}
              className={`${styles.statusTransitionButton} ${styles.categorizedToReconciledButton}`}
            >
              Mark as Reconciled
            </button>
          ) : null}
        </td>
        <td className={styles.actionButtons}>
          <button
            type="button"
            onClick={() => handleEditClick(transaction)}
            className={styles.editButton}
          >
            <span className={styles.buttonIcon}>✏️</span>
            Edit
          </button>
          <button
            type="button"
            onClick={() => onDelete(transaction.id)}
            className={styles.deleteButton}
          >
            <span className={styles.buttonIcon}>❌</span>
            Delete
          </button>
        </td>
      </tr>
    );
  };

  return (
    <div className={styles.tableContainer}>
      {transactions.length === 0 ? (
        <div className={styles.noTransactions}>
          <p>No transactions found for this account.</p>
        </div>
      ) : (
        <table className={styles.transactionsTable}>
          <thead>
            <tr>
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
              <th>Actions</th>
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
