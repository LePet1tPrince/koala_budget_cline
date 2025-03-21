import React, { useEffect, useRef } from 'react';

const ColumnFilterTooltip = ({
  column,
  position,
  isOpen,
  onClose,
  onApply,
  filterValue,
  onFilterChange,
  accounts = [],
  merchants = [],
  styles
}) => {
  const tooltipRef = useRef(null);

  // Handle clicks outside the tooltip to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Status options for dropdown
  const statusOptions = [
    { id: '', label: 'All' },
    { id: 'review', label: 'Review' },
    { id: 'categorized', label: 'Categorized' },
    { id: 'reconciled', label: 'Reconciled' }
  ];

  // Render different filter controls based on column type
  const renderFilterControl = () => {
    switch (column) {
      case 'date':
        return (
          <div className={styles.tooltipFilterGroup}>
            <label>From:</label>
            <input
              type="date"
              value={filterValue.from || ''}
              onChange={(e) => onFilterChange({ ...filterValue, from: e.target.value })}
              className={styles.tooltipFilterInput}
            />
            <label>To:</label>
            <input
              type="date"
              value={filterValue.to || ''}
              onChange={(e) => onFilterChange({ ...filterValue, to: e.target.value })}
              className={styles.tooltipFilterInput}
            />
          </div>
        );

      case 'merchant':
        return (
          <div className={styles.tooltipFilterGroup}>
            <select
              value={filterValue || ''}
              onChange={(e) => onFilterChange(e.target.value)}
              className={styles.tooltipFilterInput}
            >
              <option value="">All Merchants</option>
              {merchants.map(merchant => (
                <option key={merchant} value={merchant}>
                  {merchant}
                </option>
              ))}
            </select>
          </div>
        );

      case 'amount':
        return (
          <div className={styles.tooltipFilterGroup}>
            <label>Min:</label>
            <input
              type="number"
              placeholder="Min"
              value={filterValue.min || ''}
              onChange={(e) => onFilterChange({ ...filterValue, min: e.target.value })}
              className={styles.tooltipFilterInput}
              step="0.01"
            />
            <label>Max:</label>
            <input
              type="number"
              placeholder="Max"
              value={filterValue.max || ''}
              onChange={(e) => onFilterChange({ ...filterValue, max: e.target.value })}
              className={styles.tooltipFilterInput}
              step="0.01"
            />
          </div>
        );

      case 'debit':
        return (
          <div className={styles.tooltipFilterGroup}>
            <select
              value={filterValue || ''}
              onChange={(e) => onFilterChange(e.target.value)}
              className={styles.tooltipFilterInput}
            >
              <option value="">All Accounts</option>
              {accounts.map(account => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </div>
        );

      case 'credit':
        return (
          <div className={styles.tooltipFilterGroup}>
            <select
              value={filterValue || ''}
              onChange={(e) => onFilterChange(e.target.value)}
              className={styles.tooltipFilterInput}
            >
              <option value="">All Accounts</option>
              {accounts.map(account => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </div>
        );

      case 'description':
        return (
          <div className={styles.tooltipFilterGroup}>
            <input
              type="text"
              placeholder="Search in description..."
              value={filterValue || ''}
              onChange={(e) => onFilterChange(e.target.value)}
              className={styles.tooltipFilterInput}
            />
          </div>
        );

      case 'status':
        return (
          <div className={styles.tooltipFilterGroup}>
            <select
              value={filterValue || ''}
              onChange={(e) => onFilterChange(e.target.value)}
              className={styles.tooltipFilterInput}
            >
              {statusOptions.map(option => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={styles.columnFilterTooltip}
      style={{
        left: `${position.left}px`,
        top: `${position.top}px`
      }}
      ref={tooltipRef}
    >
      <div className={styles.tooltipArrow} />
      <div className={styles.tooltipHeader}>
        <h4>Filter {column}</h4>
        <button
          className={styles.tooltipCloseButton}
          onClick={onClose}
        >
          ×
        </button>
      </div>
      <div className={styles.tooltipContent}>
        {renderFilterControl()}
      </div>
      <div className={styles.tooltipFooter}>
        <button
          className={styles.tooltipClearButton}
          onClick={() => {
            // Clear the filter based on column type
            switch (column) {
              case 'date':
                onFilterChange({ from: '', to: '' });
                break;
              case 'amount':
                onFilterChange({ min: '', max: '' });
                break;
              default:
                onFilterChange('');
            }
          }}
        >
          Clear
        </button>
        <button
          className={styles.tooltipApplyButton}
          onClick={() => {
            onApply();
            onClose();
          }}
        >
          Apply
        </button>
      </div>
    </div>
  );
};

export default ColumnFilterTooltip;
