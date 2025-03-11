import { AccountCardStyles as styles } from '../../styles/modules';
import { useState } from 'react';

// Link icon SVG component
const LinkIcon = () => (
  <svg
    className={styles.linkIcon}
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
  </svg>
);

const AccountCard = ({ account, isSelected, onClick }) => {
  // Determine card color based on account type
  const getCardColorClass = () => {
    switch (account.type) {
      case 'Asset':
        return styles.assetCard;
      case 'Liability':
        return styles.liabilityCard;
      case 'Income':
        return styles.incomeCard;
      case 'Expense':
        return styles.expenseCard;
      case 'Equity':
        return styles.equityCard;
      case 'Goal':
        return styles.goalCard;
      default:
        return '';
    }
  };

  return (
    <div
      className={`${styles.accountCard} ${getCardColorClass()} ${isSelected ? styles.selectedCard : ''}`}
      onClick={() => onClick(account.id)}
    >
      {account.is_plaid_linked && (
        <div className={styles.plaidLinkedIndicator}>
          <LinkIcon />
        </div>
      )}
      <h3 className={styles.accountCardName}>{account.name}</h3>
      <div className={styles.accountCardNumber}>#{account.num}</div>
      <div className={styles.accountCardBalance}>
        ${(() => {
          // Handle different types of balance values
          if (account.balance === null || account.balance === undefined) {
            return '0.00';
          }

          // If it's a number, format it
          if (typeof account.balance === 'number') {
            return account.balance.toFixed(2);
          }

          // If it's a string, try to parse it as a number
          const parsedBalance = parseFloat(account.balance);
          if (!isNaN(parsedBalance)) {
            return parsedBalance.toFixed(2);
          }

          return '0.00';
        })()}
      </div>
      {account.sub_type && (
        <div className={styles.accountCardType}>
          {account.sub_type.sub_type}
        </div>
      )}
    </div>
  );
};

export default AccountCard;
