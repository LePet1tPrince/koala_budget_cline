import { ButtonStyles, FormStyles, TransactionTableStyles as styles } from '../../styles/modules';
import { useEffect, useState } from 'react';

import BulkActionsBar from './table/BulkActionsBar';
import ModalContainer from './table/ModalContainer';
import TransactionTableBody from './table/TransactionTableBody';
import TransactionTableHeader from './table/TransactionTableHeader';
import { bulkUpdateTransactions } from '../../services/transactionService';
import { getAccountById } from '../../services/accountService';

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
  onRefresh,
  merchants = []
}) => {
  // Debug: Log transactions to see their structure
  console.log('Transactions in table:', transactions);
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    date: '',
    merchant: '',
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

  // State for reconciliation confirmation
  const [isReconcileModalOpen, setIsReconcileModalOpen] = useState(false);
  const [transactionsToReconcile, setTransactionsToReconcile] = useState([]);
  const [currentReconciledBalance, setCurrentReconciledBalance] = useState(0);

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

  // Handle reconciliation confirmation
  const handleReconcileConfirm = async (transactionIds, targetStatus) => {
    // Close the modal
    setIsReconcileModalOpen(false);

    try {
      // Update the transactions to the target status
      await Promise.all(transactionIds.map(id => onUpdateStatus(id, targetStatus)));

      // Refresh the account data to get the updated reconciled balance
      if (selectedAccountId) {
        const updatedAccount = await getAccountById(selectedAccountId);
        console.log('Updated account data:', updatedAccount);
      }

      // Refresh the transactions data
      if (onRefresh) {
        await onRefresh();
      }
    } catch (error) {
      console.error('Error updating transaction status:', error);
      alert('Failed to update status for some transactions. Please try again.');
    }
  };

  // Handle bulk status update
  const handleBulkStatusUpdate = async (status) => {
    // Get the selected transactions
    const selectedTransactionObjects = transactions.filter(t => selectedTransactions.includes(t.id));

    // Get the current reconciled balance from the selected account
    const selectedAccount = accounts.find(acc => acc.id === selectedAccountId);
    const reconciledBalance = selectedAccount ? selectedAccount.reconciled_balance : 0;

    // Check if any of the selected transactions are currently reconciled
    const hasReconciledTransactions = selectedTransactionObjects.some(t => t.status === 'reconciled');

    // Show confirmation modal when:
    // 1. Marking transactions as reconciled
    // 2. Changing status of any reconciled transactions (unreconciling)
    if (status === 'reconciled' || hasReconciledTransactions) {
      // Set the state for the reconciliation confirmation modal
      setTransactionsToReconcile(selectedTransactionObjects);
      setCurrentReconciledBalance(reconciledBalance);
      setIsReconcileModalOpen(true);
    } else {
      // For other statuses with no reconciliation impact, just update directly
      try {
        await Promise.all(selectedTransactions.map(id => onUpdateStatus(id, status)));

        // Refresh the account data to get the updated reconciled balance
        if (selectedAccountId) {
          const updatedAccount = await getAccountById(selectedAccountId);
          console.log('Updated account data:', updatedAccount);
        }

        // Refresh the transactions data
        if (onRefresh) {
          await onRefresh();
        }
      } catch (error) {
        console.error('Error updating transaction status:', error);
        alert('Failed to update status for some transactions. Please try again.');
      }
    }
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
      merchant: transaction.merchant_details ? transaction.merchant_details.name : '',
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
      merchant_name: editFormData.merchant,
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

  // Row click handler
  const handleRowClick = (transaction) => {
    // Only open edit mode if we're not already editing and the row isn't in the selected transactions
    if (editingId !== transaction.id) {
      handleEditClick(transaction);
    }
  };

  return (
    <div className={styles.tableContainer}>
      {/* Modals */}
      <ModalContainer
        isBulkEditModalOpen={isBulkEditModalOpen}
        isReconcileModalOpen={isReconcileModalOpen}
        bulkEditError={bulkEditError}
        transactionsToReconcile={transactionsToReconcile}
        currentReconciledBalance={currentReconciledBalance}
        selectedTransactions={selectedTransactions}
        selectedAccountId={selectedAccountId}
        accounts={accounts}
        onCloseBulkEditModal={() => setIsBulkEditModalOpen(false)}
        onCloseReconcileModal={() => setIsReconcileModalOpen(false)}
        onBulkEditSubmit={handleBulkEditSubmit}
        onReconcileConfirm={handleReconcileConfirm}
        styles={styles}
      />

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedTransactions={selectedTransactions}
        transactions={transactions}
        handleBulkEdit={handleBulkEdit}
        handleBulkDelete={handleBulkDelete}
        handleBulkStatusUpdate={handleBulkStatusUpdate}
        styles={styles}
      />

      {transactions.length === 0 ? (
        <div className={styles.noTransactions}>
          <p>No transactions found for this account.</p>
        </div>
      ) : (
        <table className={styles.transactionsTable}>
          {/* Table Header */}
          <TransactionTableHeader
            selectAll={selectAll}
            handleSelectAll={handleSelectAll}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={onSort}
            styles={styles}
          />

          {/* Table Body */}
          <TransactionTableBody
            transactions={transactions}
            editingId={editingId}
            editFormData={editFormData}
            handleEditFormChange={handleEditFormChange}
            handleSaveClick={handleSaveClick}
            handleCancelClick={handleCancelClick}
            handleRowClick={handleRowClick}
            selectedAccountId={selectedAccountId}
            accounts={accounts}
            selectedTransactions={selectedTransactions}
            handleSelectTransaction={handleSelectTransaction}
            styles={styles}
            merchants={merchants}
          />
        </table>
      )}
    </div>
  );
};

export default TransactionTable;
