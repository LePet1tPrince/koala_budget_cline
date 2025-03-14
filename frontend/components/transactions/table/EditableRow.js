import React from 'react';

const EditableRow = ({
  transaction,
  editFormData,
  handleEditFormChange,
  handleSaveClick,
  handleCancelClick,
  selectedAccountId,
  accounts,
  isSelected,
  onSelect,
  styles
}) => {
  // Handle checkbox click without triggering row click
  const handleCheckboxClick = (e) => {
    e.stopPropagation();
    onSelect(e, transaction.id);
  };

  return (
    <tr className={styles.editingRow}>
      <td className={styles.checkboxColumn}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={handleCheckboxClick}
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
          <select
            name="category"
            value={editFormData.category}
            onChange={handleEditFormChange}
            className={styles.editInput}
          >
            <option value="">Select Category</option>
            {(() => {
              // Get all account types
              const accountTypes = [...new Set(accounts
                .filter(account => account.id !== selectedAccountId)
                .map(account => account.type))];

              // Return grouped options
              return accountTypes.map(type => (
                <optgroup key={`type-${type}`} label={type}>
                  {accounts
                    .filter(account => account.type === type && account.id !== selectedAccountId)
                    .map(account => (
                      <option key={`category-${account.id}`} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                </optgroup>
              ));
            })()}
          </select>
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
};

export default EditableRow;
