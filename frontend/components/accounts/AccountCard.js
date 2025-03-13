import { AccountCardStyles as styles } from '../../styles/modules';
import { useState } from 'react';

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
      <h3 className={styles.accountCardName}>
        <span className={styles.accountCardIcon}>{account.icon || '💰'}</span>
        {account.name}
      </h3>
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
