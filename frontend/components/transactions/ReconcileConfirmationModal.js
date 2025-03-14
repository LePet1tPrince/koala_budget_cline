import { ButtonStyles, ModalStyles } from '../../styles/modules';
import { useEffect, useState } from 'react';

import Modal from '../common/Modal';

const ReconcileConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  transactions,
  selectedAccountId,
  currentReconciledBalance,
  accounts
}) => {
  const [totalAmount, setTotalAmount] = useState(0);
  const [newReconciledBalance, setNewReconciledBalance] = useState(0);
  const [isReconciling, setIsReconciling] = useState(true);
  const [targetStatus, setTargetStatus] = useState('reconciled');

  // Calculate the total amount and new reconciled balance when transactions change
  useEffect(() => {
    if (transactions && transactions.length > 0 && selectedAccountId) {
      // Determine if we're reconciling or unreconciling
      const hasReconciledTransactions = transactions.some(t => t.status === 'reconciled');
      const isReconcilingOp = !hasReconciledTransactions;
      setIsReconciling(isReconcilingOp);

      // Set the target status based on whether we're reconciling or unreconciling
      const newTargetStatus = isReconcilingOp ? 'reconciled' : 'review';
      setTargetStatus(newTargetStatus);

      // Calculate the total amount being reconciled/unreconciled
      let sum = 0;

      transactions.forEach(transaction => {
        // Skip transactions that are already in the target status
        if (transaction.status === newTargetStatus) {
          return;
        }

        // Parse the amount to a number
        let amount = 0;
        if (typeof transaction.amount === 'number') {
          amount = transaction.amount;
        } else if (typeof transaction.amount === 'string') {
          amount = parseFloat(transaction.amount);
          if (isNaN(amount)) amount = 0;
        }

        // Adjust sign based on whether selected account is debit or credit
        // Use the same sign convention for both reconciling and unreconciling
        if (transaction.credit === selectedAccountId) {
          // For credit transactions, the amount is negative (money leaving the account)
          amount = -amount;
        }

        // We don't negate for unreconciling anymore - we want to show the same sign
        // convention for both reconciling and unreconciling

        sum += amount;
      });

      setTotalAmount(sum);

      // Calculate the new reconciled balance
      const currentBalance = parseFloat(currentReconciledBalance) || 0;
      setNewReconciledBalance(currentBalance + sum);
    } else {
      setTotalAmount(0);
      setNewReconciledBalance(parseFloat(currentReconciledBalance) || 0);
      setIsReconciling(true);
      setTargetStatus('reconciled');
    }
  }, [transactions, selectedAccountId, currentReconciledBalance]);

  // Get the selected account name
  const getAccountName = () => {
    if (!accounts || !selectedAccountId) return 'Selected Account';
    const account = accounts.find(acc => acc.id === selectedAccountId);
    return account ? account.name : 'Selected Account';
  };

  // Get the appropriate title and message based on whether we're reconciling or unreconciling
  const getTitle = () => {
    return isReconciling ? "Confirm Reconciliation" : "Confirm Unreconciliation";
  };

  const getMessage = () => {
    const action = isReconciling ? "reconcile" : "unreconcile";
    return `You are about to ${action} ${transactions?.length || 0} transaction${transactions?.length !== 1 ? 's' : ''} for account: <strong>${getAccountName()}</strong>`;
  };

  const getAmountLabel = () => {
    return isReconciling ? "Amount Being Reconciled:" : "Amount Being Unreconciled:";
  };

  // Format amount with proper sign and color
  const formatAmount = (amount) => {
    const formattedAmount = Math.abs(amount).toFixed(2);
    if (amount < 0) {
      return `-$${formattedAmount}`;
    }
    return `$${formattedAmount}`;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={getTitle()}
    >
      <div className={ModalStyles.modalBody}>
        <p dangerouslySetInnerHTML={{ __html: getMessage() }} />

        <div className={ModalStyles.reconcileDetails}>
          <div className={ModalStyles.reconcileRow}>
            <span>Current Reconciled Balance:</span>
            <span className={ModalStyles.amount}>${parseFloat(currentReconciledBalance || 0).toFixed(2)}</span>
          </div>

          <div className={ModalStyles.reconcileRow}>
            <span>{getAmountLabel()}</span>
            <span className={ModalStyles.amount}>{formatAmount(totalAmount)}</span>
          </div>

          <div className={`${ModalStyles.reconcileRow} ${ModalStyles.newBalance}`}>
            <span>New Reconciled Balance:</span>
            <span className={ModalStyles.amount}>${newReconciledBalance.toFixed(2)}</span>
          </div>
        </div>

        <p>Is this correct?</p>

        <div className={ModalStyles.modalActions}>
          <button
            onClick={onClose}
            className={`${ButtonStyles.button} ${ButtonStyles.secondaryButton} ${ModalStyles.cancelButton}`}
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(transactions.map(t => t.id), targetStatus)}
            className={`${ButtonStyles.button} ${ButtonStyles.primaryButton} ${ModalStyles.confirmButton}`}
          >
            Confirm
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ReconcileConfirmationModal;
