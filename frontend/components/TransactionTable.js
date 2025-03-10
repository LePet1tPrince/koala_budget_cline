import { ButtonStyles, FormStyles, TransactionTableStyles as styles } from '../styles/modules';

import { useState } from 'react';

const TransactionTable = ({
  transactions,
  accounts,
  onUpdate,
  onDelete
}) => {
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
    setEditFormData({
      date: transaction.date,
      amount: transaction.amount,
      debit: transaction.debit,
      credit: transaction.credit,
      notes: transaction.notes || '',
      is_reconciled: transaction.is_reconciled
    });
  };

  // Handle form field changes
  const handleEditFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditFormData({
      ...editFormData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Save edited transaction
  const handleSaveClick = async () => {
    // Validate form data
    if (!editFormData.date || !editFormData.amount || !editFormData.debit || !editFormData.credit) {
      alert('Please fill in all required fields');
      return;
    }

    // Convert amount to number
    const amount = parseFloat(editFormData.amount);
    if (isNaN(amount)) {
      alert('Amount must be a valid number');
      return;
    }

    // Prepare data for API
    const updatedTransaction = {
      ...editFormData,
      amount
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
    return date.toLocaleDateString();
  };

  // Get account name by ID
  const getAccountName = (accountId) => {
    const account = accounts.find(acc => acc.id === accountId);
    return account ? account.name : 'Unknown Account';
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
              type="text"
              name="notes"
              value={editFormData.notes}
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
          <td>
            <select
              name="debit"
              value={editFormData.debit}
              onChange={handleEditFormChange}
              className={styles.editInput}
            >
              <option value="">Select Account</option>
              {accounts.map(account => (
                <option key={`debit-${account.id}`} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </td>
          <td>
            <select
              name="credit"
              value={editFormData.credit}
              onChange={handleEditFormChange}
              className={styles.editInput}
            >
              <option value="">Select Account</option>
              {accounts.map(account => (
                <option key={`credit-${account.id}`} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </td>
          <td>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="is_reconciled"
                checked={editFormData.is_reconciled}
                onChange={handleEditFormChange}
              />
              Reconciled
            </label>
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
        <td>{transaction.notes}</td>
        <td className={styles.amountCell}>
          ${typeof transaction.amount === 'number' ? transaction.amount.toFixed(2) : '0.00'}
        </td>
        <td>{transaction.debit_account ? transaction.debit_account.name : getAccountName(transaction.debit)}</td>
        <td>{transaction.credit_account ? transaction.credit_account.name : getAccountName(transaction.credit)}</td>
        <td>{transaction.is_reconciled ? 'Yes' : 'No'}</td>
        <td className={styles.actionButtons}>
          <button
            type="button"
            onClick={() => handleEditClick(transaction)}
            className={styles.editButton}
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => onDelete(transaction.id)}
            className={styles.deleteButton}
          >
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
              <th>Date</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Debit Account</th>
              <th>Credit Account</th>
              <th>Reconciled</th>
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
