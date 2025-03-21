import { formatDate, getAdjustedAmount, getCategoryName } from '../utils/transactionFormatters';

import React from 'react';

const ReadOnlyRow = ({
  transaction,
  selectedAccountId,
  accounts,
  isSelected,
  onSelect,
  onClick,
  styles
}) => {
  // Handle checkbox click without triggering row click
  const handleCheckboxClick = (e) => {
    e.stopPropagation();
    onSelect(e, transaction.id);
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
      <td>{getCategoryName(transaction, selectedAccountId, accounts, styles)}</td>
      <td>{transaction.notes}</td>
    </tr>
  );
};

export default ReadOnlyRow;
