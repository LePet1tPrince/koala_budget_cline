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
  styles,
  merchants = [],
  showAllColumns = false // New prop to control which columns to show
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
        merchants={merchants}
        showAllColumns={showAllColumns}
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
      showAllColumns={showAllColumns}
    />
  );
};

export default TransactionRow;
