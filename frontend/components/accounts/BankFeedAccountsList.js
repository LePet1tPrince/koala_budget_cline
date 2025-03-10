import AccountCard from './AccountCard';
import { AccountCardStyles } from '../../styles/modules';

const BankFeedAccountsList = ({ accounts, selectedAccountId, onAccountSelect }) => {
  if (!accounts || accounts.length === 0) {
    return (
      <div className={AccountCardStyles.widget}>
        <h2>No Bank Feed Accounts</h2>
        <p>You don't have any accounts set up for bank feed. Go to the Accounts page to add accounts to your bank feed.</p>
      </div>
    );
  }

  return (
    <div>
      <h2>Bank Feed Accounts</h2>
      <div className={AccountCardStyles.accountCardsContainer}>
        {accounts.map(account => (
          <AccountCard
            key={account.id}
            account={account}
            isSelected={selectedAccountId === account.id}
            onClick={onAccountSelect}
          />
        ))}
      </div>
    </div>
  );
};

export default BankFeedAccountsList;
