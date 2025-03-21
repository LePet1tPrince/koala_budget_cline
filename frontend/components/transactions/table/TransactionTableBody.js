import React from 'react';
import TransactionRow from './TransactionRow';

const TransactionTableBody = ({
  transactions,
  editingId,
  editFormData,
  handleEditFormChange,
  handleSaveClick,
  handleCancelClick,
  handleRowClick,
  selectedAccountId,
  accounts,
  selectedTransactions,
  handleSelectTransaction,
  styles,
  merchants = [],
  showAllColumns = false // New prop to control which columns to show
}) => {
  if (transactions.length === 0) {
    return (
      <tbody>
        <tr>
          <td colSpan={showAllColumns ? "9" : "7"} className={styles.noTransactions}>
            <p>No transactions found for this account.</p>
          </td>
        </tr>
      </tbody>
    );
  }

  return (
    <tbody>
      {transactions.map(transaction => (
        <TransactionRow
          key={transaction.id}
          transaction={transaction}
          editingId={editingId}
          editFormData={editFormData}
          handleEditFormChange={handleEditFormChange}
          handleSaveClick={handleSaveClick}
          handleCancelClick={handleCancelClick}
          handleRowClick={handleRowClick}
          selectedAccountId={selectedAccountId}
          accounts={accounts}
          isSelected={selectedTransactions.includes(transaction.id)}
          onSelect={handleSelectTransaction}
          styles={styles}
          merchants={merchants}
          showAllColumns={showAllColumns}
        />
      ))}
    </tbody>
  );
};

export default TransactionTableBody;
