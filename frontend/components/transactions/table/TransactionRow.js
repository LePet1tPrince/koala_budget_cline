import EditableRow from './EditableRow';
import React from 'react';
import ReadOnlyRow from './ReadOnlyRow';

const TransactionRow = ({
  transaction,
  editingId,
  editFormData,
  handleEditFormChange,
  handleSaveClick,
  handleCancelClick,
  handleRowClick,
  selectedAccountId,
  accounts,
  isSelected,
  onSelect,
  styles
}) => {
  // Determine if this row is being edited
  const isEditing = editingId === transaction.id;

  // Render either the editable or read-only row based on edit state
  if (isEditing) {
    return (
      <EditableRow
        transaction={transaction}
        editFormData={editFormData}
        handleEditFormChange={handleEditFormChange}
        handleSaveClick={handleSaveClick}
        handleCancelClick={handleCancelClick}
        selectedAccountId={selectedAccountId}
        accounts={accounts}
        isSelected={isSelected}
        onSelect={onSelect}
        styles={styles}
      />
    );
  }

  return (
    <ReadOnlyRow
      transaction={transaction}
      selectedAccountId={selectedAccountId}
      accounts={accounts}
      isSelected={isSelected}
      onSelect={onSelect}
      onClick={handleRowClick}
      styles={styles}
    />
  );
};

export default TransactionRow;
