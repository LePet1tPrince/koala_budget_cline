import { useEffect, useRef, useState } from 'react';

import { FormStyles as styles } from '../../styles/modules';

const TransactionForm = ({ accounts, selectedAccountId, onSubmit, onCancel, merchants = [] }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0], // Current date in YYYY-MM-DD format
    merchant: '',
    amount: '',
    category: '',
    debit: '',
    credit: '',
    notes: '',
    is_reconciled: false
  });

  const [errors, setErrors] = useState({});
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const merchantInputRef = useRef(null);
  const [filteredMerchants, setFilteredMerchants] = useState([]);

  // Update filtered merchants when merchant input or merchants list changes
  useEffect(() => {
    if (formData.merchant && formData.merchant.length > 0) {
      const filtered = merchants
        .filter(merchant =>
          merchant.toLowerCase().includes(formData.merchant.toLowerCase()) &&
          merchant.toLowerCase() !== formData.merchant.toLowerCase()
        )
        .slice(0, 5);

      setFilteredMerchants(filtered);

      // Reset selected index when filtered list changes
      setSelectedSuggestionIndex(-1);
    } else {
      setFilteredMerchants([]);
      setSelectedSuggestionIndex(-1);
    }
  }, [formData.merchant, merchants]);

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
          setFormData({
            ...formData,
            merchant: filteredMerchants[selectedSuggestionIndex]
          });
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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === 'category') {
      // When category changes, update the appropriate debit/credit field
      // based on the amount sign
      const amount = parseFloat(formData.amount) || 0;

      if (amount >= 0) {
        // Positive amount: selected account is debit, category is credit
        setFormData({
          ...formData,
          category: value,
          credit: value,
          debit: selectedAccountId || ''
        });
      } else {
        // Negative amount: selected account is credit, category is debit
        setFormData({
          ...formData,
          category: value,
          debit: value,
          credit: selectedAccountId || ''
        });
      }
    } else if (name === 'amount') {
      // When amount changes, we may need to swap debit and credit
      const newAmount = parseFloat(value) || 0;
      const oldAmount = parseFloat(formData.amount) || 0;
      const categoryId = formData.category;

      // If sign changed and we have a category selected, swap debit and credit
      if (categoryId && ((newAmount >= 0 && oldAmount < 0) || (newAmount < 0 && oldAmount >= 0))) {
        setFormData({
          ...formData,
          amount: value,
          debit: newAmount >= 0 ? selectedAccountId : categoryId,
          credit: newAmount >= 0 ? categoryId : selectedAccountId
        });
      } else {
        // Sign didn't change or no category selected, just update the amount
        setFormData({
          ...formData,
          amount: value
        });
      }
    } else {
      // For other fields, just update normally
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : value
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    if (!formData.amount) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(parseFloat(formData.amount))) {
      newErrors.amount = 'Amount must be a number';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (!selectedAccountId) {
      newErrors.general = 'A bank feed account must be selected';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm()) {
      // Convert amount to number and account IDs to integers
      let amount = parseFloat(formData.amount);

      // Ensure amount is always positive in the database
      // The sign is determined by which account is debit vs credit
      amount = Math.abs(amount);

      const submissionData = {
        date: formData.date,
        merchant_name: formData.merchant,
        amount,
        debit: parseInt(formData.debit, 10),
        credit: parseInt(formData.credit, 10),
        notes: formData.notes,
        is_reconciled: formData.is_reconciled
      };

      onSubmit(submissionData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.transactionForm}>
      <div className={styles.formGroup}>
        <label htmlFor="date">Date</label>
        <input
          type="date"
          id="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          className={errors.date ? styles.inputError : styles.input}
        />
        {errors.date && <p className={styles.errorText}>{errors.date}</p>}
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="merchant">Merchant</label>
        <div className={styles.autocompleteContainer}>
          <input
            type="text"
            id="merchant"
            name="merchant"
            value={formData.merchant}
            onChange={handleChange}
            onKeyDown={handleMerchantKeyDown}
            ref={merchantInputRef}
            className={styles.input}
            autoComplete="off"
            placeholder="Start typing to see suggestions..."
          />
          {filteredMerchants.length > 0 && (
            <div className={styles.suggestionsList}>
              {filteredMerchants.map((merchant, index) => (
                <div
                  key={merchant}
                  className={`${styles.suggestionItem} ${index === selectedSuggestionIndex ? styles.selectedSuggestion : ''}`}
                  onClick={() => {
                    setFormData({
                      ...formData,
                      merchant: merchant
                    });
                    setFilteredMerchants([]);
                  }}
                >
                  {merchant}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="amount">Amount</label>
        <input
          type="number"
          id="amount"
          name="amount"
          value={formData.amount}
          onChange={handleChange}
          step="0.01"
          className={errors.amount ? styles.inputError : styles.input}
        />
        {errors.amount && <p className={styles.errorText}>{errors.amount}</p>}
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="category">Category</label>
        <select
          id="category"
          name="category"
          value={formData.category}
          onChange={handleChange}
          className={errors.category ? styles.inputError : styles.input}
        >
          <option value="">Select Category</option>
          {accounts
            .filter(account => account.id !== selectedAccountId)
            .map(account => (
              <option key={`category-${account.id}`} value={account.id}>
                {account.name} ({account.type})
              </option>
            ))}
        </select>
        {errors.category && <p className={styles.errorText}>{errors.category}</p>}

        <div className={styles.categoryHint}>
          {parseFloat(formData.amount) >= 0
            ? 'Money going to selected account'
            : 'Money coming from selected account'}
        </div>
      </div>

      {errors.general && <p className={styles.errorText}>{errors.general}</p>}

      <div className={styles.formGroup}>
        <label htmlFor="notes">Description</label>
        <input
          type="text"
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          className={styles.input}
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            name="is_reconciled"
            checked={formData.is_reconciled}
            onChange={handleChange}
          />
          Reconciled
        </label>
      </div>

      <div className={styles.formActions}>
        <button type="submit" className={styles.submitButton}>
          Add Transaction
        </button>
        <button
          type="button"
          className={styles.cancelButton}
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default TransactionForm;
