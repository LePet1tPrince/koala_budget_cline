import { AccountCardStyles as styles } from '../styles/modules';
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
      <h3 className={styles.accountCardName}>{account.name}</h3>
      <div className={styles.accountCardNumber}>#{account.num}</div>
      <div className={styles.accountCardBalance}>
        ${typeof account.balance === 'number' ? account.balance.toFixed(2) : '0.00'}
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
