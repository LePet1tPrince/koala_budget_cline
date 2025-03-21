// Utility functions for formatting transaction data

/**
 * Format date for display
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {string} Formatted date string
 */
export const formatDate = (dateString) => {
  if (!dateString) return '';
  // Parse the date string and ensure it's interpreted in local timezone
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day); // month is 0-indexed in JS Date
  const options = {
    month: 'short',  // "mmm"
    day: 'numeric',  // "dd"
    year: 'numeric'  // "yyyy"
  };
  return date.toLocaleDateString('en-US', options);
};

/**
 * Get account name by ID
 * @param {Array} accounts - Array of account objects
 * @param {number} accountId - Account ID to find
 * @returns {string} Account name or "Unknown Account" if not found
 */
export const getAccountName = (accounts, accountId) => {
  const account = accounts.find(acc => acc.id === accountId);
  return account ? account.name : 'Unknown Account';
};

/**
 * Get the category name (the account that isn't the selected bank feed account)
 * @param {Object} transaction - Transaction object
 * @param {number} selectedAccountId - ID of the selected account
 * @param {Array} accounts - Array of account objects
 * @param {Object} styles - CSS module styles
 * @returns {JSX.Element|string} Category name with icon if available
 */
export const getCategoryName = (transaction, selectedAccountId, accounts, styles) => {
  if (transaction.debit === selectedAccountId) {
    return transaction.credit_account ? (
      <span className={styles.categoryWithIcon}>
        <span className={styles.categoryIcon}>{transaction.credit_account.icon || '💰'}</span>
        {transaction.credit_account.name}
      </span>
    ) : 'Select Category';
  } else {
    return transaction.debit_account ? (
      <span className={styles.categoryWithIcon}>
        <span className={styles.categoryIcon}>{transaction.debit_account.icon || '💰'}</span>
        {transaction.debit_account.name}
      </span>
    ) : 'Select Category';
  }
};

/**
 * Get the adjusted amount based on whether the selected account is debit or credit
 * @param {Object} transaction - Transaction object
 * @param {number} selectedAccountId - ID of the selected account
 * @returns {string} Formatted amount with proper sign
 */
export const getAdjustedAmount = (transaction, selectedAccountId) => {
  let amount = 0;

  // Parse the amount to a number
  if (typeof transaction.amount === 'number') {
    amount = transaction.amount;
  } else if (typeof transaction.amount === 'string') {
    amount = parseFloat(transaction.amount);
    if (isNaN(amount)) amount = 0;
  }

  // Adjust sign based on whether selected account is debit or credit
  if (transaction.credit === selectedAccountId) {
    amount = -amount;
  }

  return amount.toFixed(2);
};
