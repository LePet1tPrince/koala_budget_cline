import React, { useEffect, useState } from 'react';
import {
  checkSubtypeHasAccounts,
  createAccount,
  createSubAccountType,
  deleteAccount,
  deleteSubAccountType,
  getAccounts,
  getSubAccountTypes,
  updateAccount,
  updateSubAccountType
} from '../services/accountService';

import AccountForm from '../components/accounts/AccountForm';
import CategoryGroup from '../components/categories/CategoryGroup';
import Layout from '../components/layout/Layout';
import Modal from '../components/common/Modal';
import SubtypeForm from '../components/categories/SubtypeForm';
import styles from '../styles/modules/categories/CategoryGroup.module.css';
import { useNotification } from '../contexts/NotificationContext';

export default function Categories() {
  const { showWarning, showError } = useNotification();

  // State for data
  const [accounts, setAccounts] = useState([]);
  const [subtypes, setSubtypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for organizing data
  const [incomeSubtypes, setIncomeSubtypes] = useState([]);
  const [expenseSubtypes, setExpenseSubtypes] = useState([]);

  // State for subtype forms
  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingSubtype, setEditingSubtype] = useState(null);

  // State for account modals
  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false);
  const [isEditAccountModalOpen, setIsEditAccountModalOpen] = useState(false);
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] = useState(false);
  const [currentAccount, setCurrentAccount] = useState(null);
  const [selectedAccountType, setSelectedAccountType] = useState('Income');

  // State for subtype deletion confirmation
  const [isDeletingSubtype, setIsDeletingSubtype] = useState(false);
  const [subtypeToDelete, setSubtypeToDelete] = useState(null);

  // Function to refresh data
  const refreshData = async () => {
    try {
      setLoading(true);
      const [accountsData, subtypesData] = await Promise.all([
        getAccounts(),
        getSubAccountTypes()
      ]);

      setAccounts(accountsData);
      setSubtypes(subtypesData);

      // Organize subtypes by account type
      organizeData(accountsData, subtypesData);

      setError(null);
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError('Failed to refresh data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Organize data into income and expense categories
  const organizeData = (accountsData, subtypesData) => {
    // Filter subtypes by account type
    const incomeTypes = subtypesData.filter(st => st.account_type === 'Income');
    const expenseTypes = subtypesData.filter(st => st.account_type === 'Expense');

    // Add accounts to each subtype
    const incomeWithAccounts = incomeTypes.map(subtype => ({
      ...subtype,
      accounts: accountsData.filter(account =>
        account.sub_type && account.sub_type.id === subtype.id
      )
    }));

    const expenseWithAccounts = expenseTypes.map(subtype => ({
      ...subtype,
      accounts: accountsData.filter(account =>
        account.sub_type && account.sub_type.id === subtype.id
      )
    }));

    setIncomeSubtypes(incomeWithAccounts);
    setExpenseSubtypes(expenseWithAccounts);
  };

  // Fetch data on component mount
  useEffect(() => {
    refreshData();
  }, []);

  // Handle moving accounts between subtypes
  const moveAccount = (fromSubtypeId, fromIndex, toSubtypeId, toIndex) => {
    // This function is kept for future implementation
    console.log('Move account functionality is currently disabled');
  };

  // Handle subtype creation
  const handleCreateSubtype = async (subtypeData) => {
    try {
      const newSubtype = await createSubAccountType(subtypeData);
      await refreshData();

      // Close the form
      if (subtypeData.account_type === 'Income') {
        setShowIncomeForm(false);
      } else {
        setShowExpenseForm(false);
      }
    } catch (err) {
      console.error('Error creating subtype:', err);
      showError('Failed to create category. Please try again.');
    }
  };

  // Handle subtype update
  const handleUpdateSubtype = async (subtypeData) => {
    try {
      const updatedSubtype = await updateSubAccountType(editingSubtype.id, subtypeData);
      await refreshData();

      // Reset editing state
      setEditingSubtype(null);
    } catch (err) {
      console.error('Error updating subtype:', err);
      showError('Failed to update category. Please try again.');
    }
  };

  // Handle subtype deletion confirmation
  const handleConfirmDeleteSubtype = (subtype) => {
    console.log('Setting up deletion for subtype:', subtype);
    setSubtypeToDelete(subtype);
    setIsDeletingSubtype(true);
  };

  // Confirm and execute subtype deletion
  const confirmDeleteSubtype = async () => {
    console.log('Confirming deletion of subtype:', subtypeToDelete);

    if (!subtypeToDelete) {
      console.error('No subtype to delete');
      return;
    }

    try {
      console.log('Deleting subtype with ID:', subtypeToDelete.id);
      const result = await deleteSubAccountType(subtypeToDelete.id);
      console.log('Deletion result:', result);
      await refreshData();
      setIsDeletingSubtype(false);
      setSubtypeToDelete(null);
    } catch (err) {
      console.error('Error deleting subtype:', err);
      showError('Failed to delete category. Please try again.');
    }
  };

  // Handle subtype deletion
  const handleDeleteSubtype = async (subtypeId) => {
    console.log('Handling delete for subtype ID:', subtypeId);

    try {
      // Find the subtype first to get its details
      const subtype = subtypes.find(st => st.id === subtypeId);
      if (!subtype) {
        console.error('Subtype not found:', subtypeId);
        return;
      }

      console.log('Found subtype:', subtype);

      // Check if the subtype has accounts
      const hasAccounts = subtype.accounts && subtype.accounts.length > 0;
      console.log(`Local check: Subtype ${subtypeId} has accounts: ${hasAccounts}`);

      // Double-check with the API
      const apiHasAccounts = await checkSubtypeHasAccounts(subtypeId);
      console.log(`API check: Subtype ${subtypeId} has accounts: ${apiHasAccounts}`);

      if (hasAccounts || apiHasAccounts) {
        showWarning('Cannot delete a category that contains accounts. Please move or delete the accounts first.');
        return;
      }

      // Proceed with deletion confirmation
      handleConfirmDeleteSubtype(subtype);
    } catch (err) {
      console.error('Error checking subtype accounts:', err);
      showError('Failed to check category accounts. Please try again.');
    }
  };

  // Handle editing a subtype
  const handleEditSubtype = (subtype) => {
    setEditingSubtype(subtype);
  };

  // Handle account creation
  const handleAddAccount = async (accountData) => {
    try {
      const newAccount = await createAccount(accountData);
      await refreshData();
      setIsAddAccountModalOpen(false);
    } catch (err) {
      console.error('Error creating account:', err);
      showError('Failed to create account. Please try again.');
    }
  };

  // Handle account update
  const handleUpdateAccount = async (accountData) => {
    try {
      const updatedAccount = await updateAccount(currentAccount.id, accountData);
      await refreshData();
      setIsEditAccountModalOpen(false);
      setCurrentAccount(null);
    } catch (err) {
      console.error('Error updating account:', err);
      showError('Failed to update account. Please try again.');
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    try {
      await deleteAccount(currentAccount.id);
      await refreshData();
      setIsDeleteAccountModalOpen(false);
      setCurrentAccount(null);
    } catch (err) {
      console.error('Error deleting account:', err);
      showError('Failed to delete account. Please try again.');
    }
  };

  // Open account modals
  const openAddAccountModal = (accountType, subtypeId = null) => {
    setSelectedAccountType(accountType);

    // If a subtypeId is provided, pre-select that subtype
    if (subtypeId) {
      const selectedSubtype = subtypes.find(st => st.id === subtypeId);
      if (selectedSubtype) {
        setCurrentAccount({ sub_type_id: subtypeId, type: accountType });
      }
    } else {
      setCurrentAccount({ type: accountType });
    }

    setIsAddAccountModalOpen(true);
  };

  const openEditAccountModal = (account) => {
    setCurrentAccount(account);
    setIsEditAccountModalOpen(true);
  };

  const openDeleteAccountModal = (account) => {
    setCurrentAccount(account);
    setIsDeleteAccountModalOpen(true);
  };

  // Make openAddAccountModal available globally for the CategoryGroup component
  useEffect(() => {
    window.openAddAccountModal = openAddAccountModal;

    // Clean up when component unmounts
    return () => {
      delete window.openAddAccountModal;
    };
  }, [subtypes]); // Re-create when subtypes change

  return (
    <Layout title="Categories" activePage="categories">
      <div className={styles.container}>
        <h1 className={styles.title}>Categories</h1>

        {error && <p className={styles.errorText}>{error}</p>}

        {loading ? (
          <p>Loading categories...</p>
        ) : (
          <>
            {/* Income Section */}
            <div className={styles.sectionContainer}>
              <h2 className={styles.sectionTitle}>Income</h2>

              {incomeSubtypes.length === 0 ? (
                <p>No income categories found. Create one below.</p>
              ) : (
                incomeSubtypes.map((subtype) => (
                  <CategoryGroup
                    key={subtype.id}
                    subtype={subtype}
                    accounts={subtype.accounts}
                    onEdit={handleEditSubtype}
                    onDelete={handleDeleteSubtype}
                    onMoveAccount={moveAccount}
                    onEditAccount={openEditAccountModal}
                  />
                ))
              )}

              {/* Create Income Category Form */}
              {showIncomeForm ? (
                <SubtypeForm
                  accountType="Income"
                  existingSubtypes={subtypes}
                  onSubmit={handleCreateSubtype}
                  onCancel={() => setShowIncomeForm(false)}
                />
              ) : (
                <button
                  className={styles.createCategoryButton}
                  onClick={() => setShowIncomeForm(true)}
                >
                  + Create Income Category
                </button>
              )}
            </div>

            {/* Expense Section */}
            <div className={styles.sectionContainer}>
              <h2 className={styles.sectionTitle}>Expenses</h2>

              {expenseSubtypes.length === 0 ? (
                <p>No expense categories found. Create one below.</p>
              ) : (
                expenseSubtypes.map((subtype) => (
                  <CategoryGroup
                    key={subtype.id}
                    subtype={subtype}
                    accounts={subtype.accounts}
                    onEdit={handleEditSubtype}
                    onDelete={handleDeleteSubtype}
                    onMoveAccount={moveAccount}
                    onEditAccount={openEditAccountModal}
                  />
                ))
              )}

              {/* Create Expense Category Form */}
              {showExpenseForm ? (
                <SubtypeForm
                  accountType="Expense"
                  existingSubtypes={subtypes}
                  onSubmit={handleCreateSubtype}
                  onCancel={() => setShowExpenseForm(false)}
                />
              ) : (
                <button
                  className={styles.createCategoryButton}
                  onClick={() => setShowExpenseForm(true)}
                >
                  + Create Expense Category
                </button>
              )}
            </div>
          </>
        )}

        {/* Edit Subtype Form */}
        {editingSubtype && (
          <div className={styles.editFormOverlay}>
            <div className={styles.editFormContainer}>
              <SubtypeForm
                accountType={editingSubtype.account_type}
                existingSubtypes={subtypes}
                subtype={editingSubtype}
                onSubmit={handleUpdateSubtype}
                onCancel={() => setEditingSubtype(null)}
              />
            </div>
          </div>
        )}

        {/* Account Modals */}
        <Modal
          isOpen={isAddAccountModalOpen}
          onClose={() => setIsAddAccountModalOpen(false)}
          title={`Add New ${selectedAccountType} Account`}
        >
          <AccountForm
            accountTypes={subtypes.filter(st => st.account_type === selectedAccountType)}
            onSubmit={handleAddAccount}
            onCancel={() => setIsAddAccountModalOpen(false)}
          />
        </Modal>

        <Modal
          isOpen={isEditAccountModalOpen}
          onClose={() => setIsEditAccountModalOpen(false)}
          title="Edit Account"
        >
          <AccountForm
            account={currentAccount}
            accountTypes={subtypes}
            onSubmit={handleUpdateAccount}
            onCancel={() => setIsEditAccountModalOpen(false)}
          />
        </Modal>

        <Modal
          isOpen={isDeleteAccountModalOpen}
          onClose={() => setIsDeleteAccountModalOpen(false)}
          title="Confirm Deletion"
        >
          <div className={styles.confirmDialog}>
            <p>Are you sure you want to delete the account "{currentAccount?.name}"?</p>
            <p>This action cannot be undone.</p>

            <div className={styles.formActions}>
              <button
                className={styles.cancelButton}
                onClick={() => setIsDeleteAccountModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className={styles.submitButton}
                onClick={handleDeleteAccount}
              >
                Delete
              </button>
            </div>
          </div>
        </Modal>

        {/* Subtype Delete Confirmation Modal */}
        <Modal
          isOpen={isDeletingSubtype}
          onClose={() => setIsDeletingSubtype(false)}
          title="Confirm Category Deletion"
        >
          <div className={styles.confirmDialog}>
            <p>Are you sure you want to delete the category "{subtypeToDelete?.sub_type}"?</p>
            <p>This action cannot be undone.</p>

            <div className={styles.formActions}>
              <button
                className={styles.cancelButton}
                onClick={() => setIsDeletingSubtype(false)}
              >
                Cancel
              </button>
              <button
                className={styles.submitButton}
                onClick={confirmDeleteSubtype}
              >
                Delete
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </Layout>
  );
}
