import { useEffect, useState } from 'react';

import { FormStyles } from '../../styles/modules';
import Modal from '../common/Modal';

const BulkEditModal = ({
  isOpen,
  onClose,
  onSubmit,
  transactionIds,
  accounts,
  selectedAccountId
}) => {
  const [formData, setFormData] = useState({
    category: '',
    notes: ''
  });

  const [fieldsToUpdate, setFieldsToUpdate] = useState({
    category: false,
    notes: false
  });

  const [validationErrors, setValidationErrors] = useState({});
  const [isValid, setIsValid] = useState(true);

  // Validate form data whenever it changes
  useEffect(() => {
    const errors = {};

    // Check if category is selected for update but empty
    if (fieldsToUpdate.category && !formData.category) {
      errors.category = 'Please select a category';
    }

    // Check if notes is selected for update but empty
    if (fieldsToUpdate.notes && formData.notes.trim() === '') {
      errors.notes = 'Please enter notes';
    }

    setValidationErrors(errors);
    setIsValid(Object.keys(errors).length === 0);
  }, [formData, fieldsToUpdate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFieldsToUpdate({
      ...fieldsToUpdate,
      [name]: checked
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate before submitting
    if (!isValid) {
      return;
    }

    // Only include fields that are checked for update
    const dataToUpdate = {};
    if (fieldsToUpdate.category) dataToUpdate.category = formData.category;
    if (fieldsToUpdate.notes) dataToUpdate.notes = formData.notes;

    // Make sure we have at least one field to update
    if (Object.keys(dataToUpdate).length === 0) {
      setValidationErrors({ form: 'Please select at least one field to update' });
      return;
    }

    console.log('BulkEditModal - submitting with data:', dataToUpdate);
    console.log('BulkEditModal - transactionIds:', transactionIds);
    console.log('BulkEditModal - selectedAccountId:', selectedAccountId);

    onSubmit(transactionIds, dataToUpdate);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit ${transactionIds?.length || 0} Transactions`}>
      <form onSubmit={handleSubmit} className={FormStyles.form}>
        <div className={FormStyles.formGroup}>
          <div className={FormStyles.checkboxContainer}>
            <input
              type="checkbox"
              id="updateCategory"
              name="category"
              checked={fieldsToUpdate.category}
              onChange={handleCheckboxChange}
              className={FormStyles.checkbox}
            />
            <label htmlFor="updateCategory" className={FormStyles.checkboxLabel}>Update Category</label>
          </div>

          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            disabled={!fieldsToUpdate.category}
            className={`${FormStyles.select} ${validationErrors.category ? FormStyles.inputError : ''}`}
          >
            <option value="">Select Category</option>
            {accounts
              .filter(account => account.id !== selectedAccountId)
              .map(account => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
          </select>
          {validationErrors.category && (
            <div className={FormStyles.errorText}>{validationErrors.category}</div>
          )}
        </div>

        <div className={FormStyles.formGroup}>
          <div className={FormStyles.checkboxContainer}>
            <input
              type="checkbox"
              id="updateNotes"
              name="notes"
              checked={fieldsToUpdate.notes}
              onChange={handleCheckboxChange}
              className={FormStyles.checkbox}
            />
            <label htmlFor="updateNotes" className={FormStyles.checkboxLabel}>Update Notes</label>
          </div>

          <input
            type="text"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            disabled={!fieldsToUpdate.notes}
            placeholder="Enter notes"
            className={`${FormStyles.input} ${validationErrors.notes ? FormStyles.inputError : ''}`}
          />
          {validationErrors.notes && (
            <div className={FormStyles.errorText}>{validationErrors.notes}</div>
          )}
        </div>


        {validationErrors.form && (
          <div className={FormStyles.formError}>{validationErrors.form}</div>
        )}

        <div className={FormStyles.buttonGroup}>
          <button
            type="submit"
            className={FormStyles.submitButton}
            disabled={!isValid || Object.keys(fieldsToUpdate).every(key => !fieldsToUpdate[key])}
          >
            Update Transactions
          </button>
          <button type="button" onClick={onClose} className={FormStyles.cancelButton}>Cancel</button>
        </div>
      </form>
    </Modal>
  );
};

export default BulkEditModal;
