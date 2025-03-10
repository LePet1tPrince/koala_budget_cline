import { FormStyles as styles } from '../styles/modules';
import { useState } from 'react';

const TransactionForm = ({ accounts, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0], // Current date in YYYY-MM-DD format
    amount: '',
    debit: '',
    credit: '',
    notes: '',
    is_reconciled: false
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
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

    if (!formData.debit) {
      newErrors.debit = 'Debit account is required';
    }

    if (!formData.credit) {
      newErrors.credit = 'Credit account is required';
    }

    if (formData.debit === formData.credit && formData.debit !== '') {
      newErrors.debit = 'Debit and credit accounts must be different';
      newErrors.credit = 'Debit and credit accounts must be different';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm()) {
      // Convert amount to number and account IDs to integers
      const submissionData = {
        ...formData,
        amount: parseFloat(formData.amount),
        debit: parseInt(formData.debit, 10),
        credit: parseInt(formData.credit, 10)
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
        <label htmlFor="debit">Debit Account (To)</label>
        <select
          id="debit"
          name="debit"
          value={formData.debit}
          onChange={handleChange}
          className={errors.debit ? styles.inputError : styles.input}
        >
          <option value="">Select Account</option>
          {accounts.map(account => (
            <option key={`debit-${account.id}`} value={account.id}>
              {account.name} ({account.type})
            </option>
          ))}
        </select>
        {errors.debit && <p className={styles.errorText}>{errors.debit}</p>}
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="credit">Credit Account (From)</label>
        <select
          id="credit"
          name="credit"
          value={formData.credit}
          onChange={handleChange}
          className={errors.credit ? styles.inputError : styles.input}
        >
          <option value="">Select Account</option>
          {accounts.map(account => (
            <option key={`credit-${account.id}`} value={account.id}>
              {account.name} ({account.type})
            </option>
          ))}
        </select>
        {errors.credit && <p className={styles.errorText}>{errors.credit}</p>}
      </div>

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
