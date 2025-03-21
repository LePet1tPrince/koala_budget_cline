import { useRef, useState } from 'react';

import styles from '../../styles/modules/categories/CategoryGroup.module.css';
import { useNotification } from '../../contexts/NotificationContext';

const CategoryGroup = ({
  subtype,
  accounts,
  onEdit,
  onDelete,
  onMoveAccount,
  onEditAccount
}) => {
  const { showWarning } = useNotification();
  const [isExpanded, setIsExpanded] = useState(true);

  // Handle delete button click
  const handleDelete = () => {
    onDelete(subtype.id);
  };

  return (
    <div className={styles.categoryGroup}>
      <div className={styles.categoryHeader}>
        <div className={styles.categoryTitle} onClick={() => setIsExpanded(!isExpanded)}>
          {subtype.sub_type}
          <span className={styles.expandIcon}>
            {isExpanded ? '▼' : '▶'}
          </span>
        </div>

        <div className={styles.categoryActions}>
          <button
            className={styles.editButton}
            onClick={() => onEdit(subtype)}
          >
            Edit
          </button>
          <button
            className={styles.deleteButton}
            onClick={handleDelete}
          >
            Delete
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className={styles.categoryItems}>
          {accounts && accounts.length > 0 ? (
            accounts.map((account, accountIndex) => (
              <CategoryItem
                key={account.id}
                account={account}
                onEdit={onEditAccount}
              />
            ))
          ) : (
            <div className={styles.emptyMessage}>No accounts in this category</div>
          )}

          <button
            className={styles.addAccountButton}
            onClick={(e) => {
              e.stopPropagation(); // Prevent category collapse when clicking the button
              const accountType = subtype.account_type;
              window.openAddAccountModal && window.openAddAccountModal(accountType, subtype.id);
            }}
          >
            + Add Category
          </button>
        </div>
      )}
    </div>
  );
};

// CategoryItem component for individual accounts
const CategoryItem = ({ account, onEdit }) => {
  const handleClick = () => {
    if (onEdit) {
      onEdit(account);
    }
  };

  return (
    <div className={styles.categoryItem} onClick={handleClick}>
      <div className={styles.itemIcon}>{account.icon || '💰'}</div>
      <div className={styles.itemName}>{account.name}</div>
    </div>
  );
};

export default CategoryGroup;
