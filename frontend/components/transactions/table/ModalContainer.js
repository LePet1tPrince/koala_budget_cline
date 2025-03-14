import BulkEditModal from '../BulkEditModal';
import React from 'react';
import ReconcileConfirmationModal from '../ReconcileConfirmationModal';

const ModalContainer = ({
  isBulkEditModalOpen,
  isReconcileModalOpen,
  bulkEditError,
  transactionsToReconcile,
  currentReconciledBalance,
  selectedTransactions,
  selectedAccountId,
  accounts,
  onCloseBulkEditModal,
  onCloseReconcileModal,
  onBulkEditSubmit,
  onReconcileConfirm,
  styles
}) => {
  return (
    <>
      {/* Bulk Edit Modal */}
      <BulkEditModal
        isOpen={isBulkEditModalOpen}
        onClose={onCloseBulkEditModal}
        onSubmit={onBulkEditSubmit}
        transactionIds={selectedTransactions}
        accounts={accounts}
        selectedAccountId={selectedAccountId}
      />

      {/* Reconcile Confirmation Modal */}
      <ReconcileConfirmationModal
        isOpen={isReconcileModalOpen}
        onClose={onCloseReconcileModal}
        onConfirm={onReconcileConfirm}
        transactions={transactionsToReconcile}
        selectedAccountId={selectedAccountId}
        currentReconciledBalance={currentReconciledBalance}
        accounts={accounts}
      />

      {/* Error message for bulk edit */}
      {bulkEditError && (
        <div className={styles.errorMessage}>
          {bulkEditError}
        </div>
      )}
    </>
  );
};

export default ModalContainer;
