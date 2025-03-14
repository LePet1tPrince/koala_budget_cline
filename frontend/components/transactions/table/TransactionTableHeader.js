import React from 'react';

const TransactionTableHeader = ({
  selectAll,
  handleSelectAll,
  sortField,
  sortDirection,
  onSort,
  styles
}) => {
  return (
    <thead>
      <tr>
        <th className={styles.checkboxColumn}>
          <input
            type="checkbox"
            checked={selectAll}
            onChange={handleSelectAll}
            className={`${styles.checkbox} ${styles.selectAllCheckbox}`}
          />
        </th>
        <th
          onClick={() => onSort('date')}
          className={styles.sortableHeader}
        >
          Date {sortField === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
        </th>
        <th
          onClick={() => onSort('amount')}
          className={styles.sortableHeader}
        >
          Amount {sortField === 'amount' && (sortDirection === 'asc' ? '↑' : '↓')}
        </th>
        <th
          onClick={() => onSort('category')}
          className={styles.sortableHeader}
        >
          Category {sortField === 'category' && (sortDirection === 'asc' ? '↑' : '↓')}
        </th>
        <th
          onClick={() => onSort('description')}
          className={styles.sortableHeader}
        >
          Description {sortField === 'description' && (sortDirection === 'asc' ? '↑' : '↓')}
        </th>
        {/* Add an extra column for action buttons in edit mode */}
        <th className={styles.actionColumn}></th>
      </tr>
    </thead>
  );
};

export default TransactionTableHeader;
