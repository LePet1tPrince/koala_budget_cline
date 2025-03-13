import { useEffect, useState } from 'react';

import styles from '../../styles/modules/categories/CategoryGroup.module.css';

const SubtypeForm = ({
  accountType,
  existingSubtypes = [],
  subtype = null,
  onSubmit,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    sub_type: '',
    account_type: accountType
  });

  const [error, setError] = useState('');

  // If editing an existing subtype, populate the form
  useEffect(() => {
    if (subtype) {
      setFormData({
        sub_type: subtype.sub_type || '',
        account_type: subtype.account_type || accountType
      });
    }
  }, [subtype, accountType]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // Clear error when user types
    if (error) {
      setError('');
    }
  };

  const validateForm = () => {
    // Check if name is empty
    if (!formData.sub_type.trim()) {
      setError('Category name is required');
      return false;
    }

    // Check if name is unique among existing subtypes
    const isDuplicate = existingSubtypes.some(
      st => st.sub_type.toLowerCase() === formData.sub_type.toLowerCase() &&
           (!subtype || st.id !== subtype.id)
    );

    if (isDuplicate) {
      setError('A category with this name already exists');
      return false;
    }

    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <form className={styles.createCategoryForm} onSubmit={handleSubmit}>
      <h4 className={styles.formTitle}>
        {subtype ? 'Edit Category' : `Create New ${accountType} Category`}
      </h4>

      <div className={styles.formGroup}>
        <label htmlFor="sub_type" className={styles.formLabel}>
          Category Name
        </label>
        <input
          type="text"
          id="sub_type"
          name="sub_type"
          value={formData.sub_type}
          onChange={handleChange}
          className={styles.formInput}
          placeholder="Enter category name"
          autoFocus
        />
        {error && <p className={styles.errorText}>{error}</p>}
      </div>

      <div className={styles.formActions}>
        <button
          type="button"
          className={styles.cancelButton}
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          type="submit"
          className={styles.submitButton}
        >
          {subtype ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
};

export default SubtypeForm;
