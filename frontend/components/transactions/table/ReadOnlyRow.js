import { formatDate, getAccountName, getAdjustedAmount, getCategoryName } from '../utils/transactionFormatters';

import React from 'react';

const ReadOnlyRow = ({
  transaction,
  selectedAccountId,
  accounts,
  isSelected,
  onSelect,
  onClick,
  styles,
  showAllColumns = false // New prop to control which columns to show
}) => {
  // Handle checkbox click without triggering row click
  const handleCheckboxClick = (e) => {
    e.stopPropagation();
    onSelect(e, transaction.id);
  };

  // Get status display text
  const getStatusDisplay = (status) => {
    switch (status) {
      case 'review':
        return 'Review';
      case 'categorized':
        return 'Categorized';
      case 'reconciled':
        return 'Reconciled';
      default:
        return status || '';
    }
  };

  return (
    <tr
      className={styles.clickableRow}
      onClick={() => onClick(transaction)}
    >
      <td className={styles.checkboxColumn} onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={handleCheckboxClick}
          className={styles.checkbox}
        />
      </td>
      <td>{formatDate(transaction.date)}</td>
      <td>{transaction.merchant_details ? transaction.merchant_details.name : ''}</td>
      <td className={styles.amountCell}>
        ${getAdjustedAmount(transaction, selectedAccountId)}
      </td>

      {/* Show debit account in All Transactions view */}
      {showAllColumns && (
        <td>
          {transaction.debit_account ? (
            <span className={styles.categoryWithIcon}>
              <span className={styles.categoryIcon}>{transaction.debit_account.icon || '💰'}</span>
              {transaction.debit_account.name}
            </span>
          ) : (
            getAccountName(accounts, transaction.debit)
          )}
        </td>
      )}

      {/* Show credit account in All Transactions view */}
      {showAllColumns && (
        <td>
          {transaction.credit_account ? (
            <span className={styles.categoryWithIcon}>
              <span className={styles.categoryIcon}>{transaction.credit_account.icon || '💰'}</span>
              {transaction.credit_account.name}
            </span>
          ) : (
            getAccountName(accounts, transaction.credit)
          )}
        </td>
      )}

      {/* Show Category column in Bank Feed view */}
      {!showAllColumns && (
        <td>{getCategoryName(transaction, selectedAccountId, accounts, styles)}</td>
      )}

      <td>{transaction.notes}</td>

      {/* Status column */}
      {showAllColumns && (
        <td className={`${styles.statusCell} ${styles[transaction.status] || ''}`}>
          {getStatusDisplay(transaction.status)}
        </td>
      )}
    </tr>
  );
};

export default ReadOnlyRow;
