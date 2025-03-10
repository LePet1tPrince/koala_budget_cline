import { useEffect, useState } from 'react';

import { FormStyles as styles } from '../styles/modules';

const AccountForm = ({
  account = null,
  accountTypes,
  onSubmit,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    name: '',
    num: '',
    type: 'Asset',
    sub_type_id: '',
    inBankFeed: false,
    balance: '0.00'
  });

  const [errors, setErrors] = useState({});

  // If editing an existing account, populate the form
  useEffect(() => {
    if (account) {
      setFormData({
        name: account.name || '',
        num: account.num || '',
        type: account.type || 'Asset',
        sub_type_id: account.sub_type ? account.sub_type.id : '',
        inBankFeed: account.inBankFeed || false,
        balance: account.balance ? account.balance.toString() : '0.00'
      });
    }
  }, [account]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Account name is required';
    }

    if (!formData.num) {
      newErrors.num = 'Account number is required';
    } else if (isNaN(formData.num)) {
      newErrors.num = 'Account number must be a number';
    }

    if (!formData.type) {
      newErrors.type = 'Account type is required';
    }

    if (formData.balance && isNaN(parseFloat(formData.balance))) {
      newErrors.balance = 'Balance must be a number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm()) {
      // Convert numeric fields
      const submissionData = {
        ...formData,
        num: parseInt(formData.num, 10),
        balance: parseFloat(formData.balance),
        sub_type_id: formData.sub_type_id ? parseInt(formData.sub_type_id, 10) : null
      };

      onSubmit(submissionData);
    }
  };

  // Filter account types based on selected account type
  const filteredSubTypes = Array.isArray(accountTypes)
    ? accountTypes.filter(
        type => type && type.account_type === formData.type
      )
    : [];

  return (
    <form onSubmit={handleSubmit} className={styles.accountForm}>
      <div className={styles.formGroup}>
        <label htmlFor="name">Account Name</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className={errors.name ? styles.inputError : styles.input}
        />
        {errors.name && <p className={styles.errorText}>{errors.name}</p>}
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="num">Account Number</label>
        <input
          type="text"
          id="num"
          name="num"
          value={formData.num}
          onChange={handleChange}
          className={errors.num ? styles.inputError : styles.input}
        />
        {errors.num && <p className={styles.errorText}>{errors.num}</p>}
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="type">Account Type</label>
        <select
          id="type"
          name="type"
          value={formData.type}
          onChange={handleChange}
          className={errors.type ? styles.inputError : styles.input}
        >
          <option value="Asset">Asset</option>
          <option value="Liability">Liability</option>
          <option value="Income">Income</option>
          <option value="Expense">Expense</option>
          <option value="Equity">Equity</option>
          <option value="Goal">Goal</option>
        </select>
        {errors.type && <p className={styles.errorText}>{errors.type}</p>}
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="sub_type_id">Sub Type</label>
        <select
          id="sub_type_id"
          name="sub_type_id"
          value={formData.sub_type_id}
          onChange={handleChange}
          className={styles.input}
        >
          <option value="">-- Select Sub Type --</option>
          {filteredSubTypes.map(type => (
            <option key={type.id} value={type.id}>
              {type.sub_type}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="balance">Balance</label>
        <input
          type="text"
          id="balance"
          name="balance"
          value={formData.balance}
          onChange={handleChange}
          className={errors.balance ? styles.inputError : styles.input}
        />
        {errors.balance && <p className={styles.errorText}>{errors.balance}</p>}
      </div>

      <div className={styles.formGroup}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            name="inBankFeed"
            checked={formData.inBankFeed}
            onChange={handleChange}
          />
          Include in Bank Feed
        </label>
      </div>

      <div className={styles.formActions}>
        <button type="submit" className={styles.submitButton}>
          {account ? 'Update Account' : 'Create Account'}
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

export default AccountForm;
