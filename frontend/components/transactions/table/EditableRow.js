import React, { useEffect, useRef, useState } from 'react';

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
  styles,
  merchants = []
}) => {
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const merchantInputRef = useRef(null);
  const [filteredMerchants, setFilteredMerchants] = useState([]);

  // Update filtered merchants when merchant input or merchants list changes
  useEffect(() => {
    if (editFormData.merchant && editFormData.merchant.length > 0) {
      const filtered = merchants
        .filter(merchant =>
          merchant.toLowerCase().includes(editFormData.merchant.toLowerCase()) &&
          merchant.toLowerCase() !== editFormData.merchant.toLowerCase()
        )
        .slice(0, 5);

      setFilteredMerchants(filtered);

      // Reset selected index when filtered list changes
      setSelectedSuggestionIndex(-1);
    } else {
      setFilteredMerchants([]);
      setSelectedSuggestionIndex(-1);
    }
  }, [editFormData.merchant, merchants]);

  // Handle keyboard navigation for merchant suggestions
  const handleMerchantKeyDown = (e) => {
    // Only process if we have suggestions
    if (filteredMerchants.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prevIndex =>
          prevIndex < filteredMerchants.length - 1 ? prevIndex + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prevIndex =>
          prevIndex > 0 ? prevIndex - 1 : filteredMerchants.length - 1
        );
        break;
      case 'Enter':
        // If a suggestion is selected, use it
        if (selectedSuggestionIndex >= 0 && selectedSuggestionIndex < filteredMerchants.length) {
          e.preventDefault();
          const event = {
            target: {
              name: 'merchant',
              value: filteredMerchants[selectedSuggestionIndex],
              type: 'text'
            }
          };
          handleEditFormChange(event);
          setSelectedSuggestionIndex(-1);
          setFilteredMerchants([]);
        }
        break;
      case 'Escape':
        // Close suggestions
        setSelectedSuggestionIndex(-1);
        setFilteredMerchants([]);
        break;
      default:
        break;
    }
  };

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
        <div className={styles.autocompleteContainer}>
          <input
            type="text"
            name="merchant"
            value={editFormData.merchant || ''}
            onChange={handleEditFormChange}
            onKeyDown={handleMerchantKeyDown}
            ref={merchantInputRef}
            className={styles.editInput}
            autoComplete="off"
            placeholder="Start typing..."
          />
          {filteredMerchants.length > 0 && (
            <div className={styles.suggestionsList}>
              {filteredMerchants.map((merchant, index) => (
                <div
                  key={merchant}
                  className={`${styles.suggestionItem} ${index === selectedSuggestionIndex ? styles.selectedSuggestion : ''}`}
                  onClick={() => {
                    // Update the form data with the selected merchant
                    const e = {
                      target: {
                        name: 'merchant',
                        value: merchant,
                        type: 'text'
                      }
                    };
                    handleEditFormChange(e);
                    setFilteredMerchants([]);
                  }}
                >
                  {merchant}
                </div>
              ))}
            </div>
          )}
        </div>
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
