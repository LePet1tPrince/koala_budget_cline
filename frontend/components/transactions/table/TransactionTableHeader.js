import React, { useState } from 'react';

import ColumnFilterTooltip from '../ColumnFilterTooltip';

const TransactionTableHeader = ({
  selectAll,
  handleSelectAll,
  sortField,
  sortDirection,
  onSort,
  styles,
  showAllColumns = false, // New prop to control which columns to show
  columnFilters = {},
  showFilters = true, // New prop to control whether to show filter buttons
  onColumnFilterChange,
  accounts = [],
  merchants = []
}) => {
  // State to track which column's filter tooltip is open
  const [openFilterTooltip, setOpenFilterTooltip] = useState(null);
  // State to track tooltip position
  const [tooltipPosition, setTooltipPosition] = useState({ left: 0, top: 0 });
  // State to track temporary filter values (before applying)
  const [tempFilterValue, setTempFilterValue] = useState(null);

  // Handle filter button click
  const handleFilterClick = (e, column) => {
    e.stopPropagation(); // Prevent sort from triggering

    // Calculate position for the tooltip
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      left: rect.left,
      top: rect.bottom + window.scrollY
    });

    // Set the temporary filter value to the current filter value
    if (column === 'date' || column === 'amount') {
      setTempFilterValue(columnFilters[column] || { from: '', to: '' });
    } else {
      setTempFilterValue(columnFilters[column] || '');
    }

    // Toggle the tooltip
    setOpenFilterTooltip(openFilterTooltip === column ? null : column);
  };

  // Handle applying the filter
  const handleApplyFilter = () => {
    if (openFilterTooltip) {
      onColumnFilterChange(openFilterTooltip, tempFilterValue);
    }
  };
  return (
    <>
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
          <th className={styles.sortableHeader}>
            <div className={styles.headerContent}>
              <span onClick={() => onSort('date')}>
                Date {sortField === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
              </span>
              {showFilters && (
                <button
                  className={`${styles.filterButton} ${columnFilters.date && (columnFilters.date.from || columnFilters.date.to) ? styles.filterActive : ''}`}
                  onClick={(e) => handleFilterClick(e, 'date')}
                >
                  <span className={styles.filterIcon}>⚡</span>
                </button>
              )}
            </div>
          </th>
          <th className={styles.sortableHeader}>
            <div className={styles.headerContent}>
              <span onClick={() => onSort('merchant')}>
                Merchant {sortField === 'merchant' && (sortDirection === 'asc' ? '↑' : '↓')}
              </span>
              {showFilters && (
                <button
                  className={`${styles.filterButton} ${columnFilters.merchant ? styles.filterActive : ''}`}
                  onClick={(e) => handleFilterClick(e, 'merchant')}
                >
                  <span className={styles.filterIcon}>⚡</span>
                </button>
              )}
            </div>
          </th>
          <th className={styles.sortableHeader}>
            <div className={styles.headerContent}>
              <span onClick={() => onSort('amount')}>
                Amount {sortField === 'amount' && (sortDirection === 'asc' ? '↑' : '↓')}
              </span>
              {showFilters && (
                <button
                  className={`${styles.filterButton} ${columnFilters.amount && (columnFilters.amount.min || columnFilters.amount.max) ? styles.filterActive : ''}`}
                  onClick={(e) => handleFilterClick(e, 'amount')}
                >
                  <span className={styles.filterIcon}>⚡</span>
                </button>
              )}
            </div>
          </th>

          {/* Show debit and credit columns in All Transactions view */}
          {showAllColumns && (
            <th className={styles.sortableHeader}>
              <div className={styles.headerContent}>
                <span onClick={() => onSort('debit')}>
                  Debit Account {sortField === 'debit' && (sortDirection === 'asc' ? '↑' : '↓')}
                </span>
                {showFilters && (
                  <button
                    className={`${styles.filterButton} ${columnFilters.debit ? styles.filterActive : ''}`}
                    onClick={(e) => handleFilterClick(e, 'debit')}
                  >
                    <span className={styles.filterIcon}>⚡</span>
                  </button>
                )}
              </div>
            </th>
          )}

          {showAllColumns && (
            <th className={styles.sortableHeader}>
              <div className={styles.headerContent}>
                <span onClick={() => onSort('credit')}>
                  Credit Account {sortField === 'credit' && (sortDirection === 'asc' ? '↑' : '↓')}
                </span>
                {showFilters && (
                  <button
                    className={`${styles.filterButton} ${columnFilters.credit ? styles.filterActive : ''}`}
                    onClick={(e) => handleFilterClick(e, 'credit')}
                  >
                    <span className={styles.filterIcon}>⚡</span>
                  </button>
                )}
              </div>
            </th>
          )}

          {/* Show Category column in Bank Feed view */}
          {!showAllColumns && (
            <th className={styles.sortableHeader}>
              <div className={styles.headerContent}>
                <span onClick={() => onSort('category')}>
                  Category {sortField === 'category' && (sortDirection === 'asc' ? '↑' : '↓')}
                </span>
                {showFilters && (
                  <button
                    className={`${styles.filterButton} ${columnFilters.category ? styles.filterActive : ''}`}
                    onClick={(e) => handleFilterClick(e, 'category')}
                  >
                    <span className={styles.filterIcon}>⚡</span>
                  </button>
                )}
              </div>
            </th>
          )}

          <th className={styles.sortableHeader}>
            <div className={styles.headerContent}>
              <span onClick={() => onSort('description')}>
                Description {sortField === 'description' && (sortDirection === 'asc' ? '↑' : '↓')}
              </span>
              {showFilters && (
                <button
                  className={`${styles.filterButton} ${columnFilters.description ? styles.filterActive : ''}`}
                  onClick={(e) => handleFilterClick(e, 'description')}
                >
                  <span className={styles.filterIcon}>⚡</span>
                </button>
              )}
            </div>
          </th>

          {/* Status column */}
          {showAllColumns && (
            <th className={styles.sortableHeader}>
              <div className={styles.headerContent}>
                <span onClick={() => onSort('status')}>
                  Status {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
                </span>
                {showFilters && (
                  <button
                    className={`${styles.filterButton} ${columnFilters.status ? styles.filterActive : ''}`}
                    onClick={(e) => handleFilterClick(e, 'status')}
                  >
                    <span className={styles.filterIcon}>⚡</span>
                  </button>
                )}
              </div>
            </th>
          )}

        </tr>
      </thead>

      {/* Column Filter Tooltips */}
      {openFilterTooltip && (
        <ColumnFilterTooltip
          column={openFilterTooltip}
          position={tooltipPosition}
          isOpen={!!openFilterTooltip}
          onClose={() => setOpenFilterTooltip(null)}
          onApply={handleApplyFilter}
          filterValue={tempFilterValue}
          onFilterChange={setTempFilterValue}
          accounts={accounts}
          merchants={merchants}
          styles={styles}
        />
      )}
    </>
  );
};

export default TransactionTableHeader;
