import React, { useEffect, useState } from 'react';

import { formatDate } from './utils/transactionFormatters';

const ColumnFilters = ({
  onFilterChange,
  accounts,
  merchants = [],
  styles
}) => {
  // Filter state
  const [filters, setFilters] = useState({
    date: { from: '', to: '' },
    merchant: '',
    amount: { min: '', max: '' },
    debit: '',
    credit: '',
    description: '',
    status: ''
  });

  // Status options
  const statusOptions = [
    { id: '', label: 'All' },
    { id: 'review', label: 'Review' },
    { id: 'categorized', label: 'Categorized' },
    { id: 'reconciled', label: 'Reconciled' }
  ];

  // Handle filter changes
  const handleFilterChange = (field, value) => {
    let newFilters;

    if (field === 'date.from' || field === 'date.to') {
      // Handle nested date fields
      const [parent, child] = field.split('.');
      newFilters = {
        ...filters,
        [parent]: {
          ...filters[parent],
          [child]: value
        }
      };
    } else if (field === 'amount.min' || field === 'amount.max') {
      // Handle nested amount fields
      const [parent, child] = field.split('.');
      newFilters = {
        ...filters,
        [parent]: {
          ...filters[parent],
          [child]: value
        }
      };
    } else {
      // Handle regular fields
      newFilters = {
        ...filters,
        [field]: value
      };
    }

    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  // Reset all filters
  const resetFilters = () => {
    const resetState = {
      date: { from: '', to: '' },
      merchant: '',
      amount: { min: '', max: '' },
      debit: '',
      credit: '',
      description: '',
      status: ''
    };

    setFilters(resetState);
    onFilterChange(resetState);
  };

  return (
    <div className={styles.columnFiltersContainer}>
      <h3>Filter Transactions</h3>

      <div className={styles.filtersGrid}>
        {/* Date Filter */}
        <div className={styles.filterGroup}>
          <label>Date</label>
          <div className={styles.dateRangeInputs}>
            <input
              type="date"
              placeholder="From"
              value={filters.date.from}
              onChange={(e) => handleFilterChange('date.from', e.target.value)}
              className={styles.filterInput}
            />
            <span>to</span>
            <input
              type="date"
              placeholder="To"
              value={filters.date.to}
              onChange={(e) => handleFilterChange('date.to', e.target.value)}
              className={styles.filterInput}
            />
          </div>
        </div>

        {/* Merchant Filter */}
        <div className={styles.filterGroup}>
          <label>Merchant</label>
          <select
            value={filters.merchant}
            onChange={(e) => handleFilterChange('merchant', e.target.value)}
            className={styles.filterInput}
          >
            <option value="">All Merchants</option>
            {merchants.map(merchant => (
              <option key={merchant} value={merchant}>
                {merchant}
              </option>
            ))}
          </select>
        </div>

        {/* Amount Filter */}
        <div className={styles.filterGroup}>
          <label>Amount</label>
          <div className={styles.rangeInputs}>
            <input
              type="number"
              placeholder="Min"
              value={filters.amount.min}
              onChange={(e) => handleFilterChange('amount.min', e.target.value)}
              className={styles.filterInput}
              step="0.01"
            />
            <span>to</span>
            <input
              type="number"
              placeholder="Max"
              value={filters.amount.max}
              onChange={(e) => handleFilterChange('amount.max', e.target.value)}
              className={styles.filterInput}
              step="0.01"
            />
          </div>
        </div>

        {/* Debit Account Filter */}
        <div className={styles.filterGroup}>
          <label>Debit Account</label>
          <select
            value={filters.debit}
            onChange={(e) => handleFilterChange('debit', e.target.value)}
            className={styles.filterInput}
          >
            <option value="">All Accounts</option>
            {accounts.map(account => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </div>

        {/* Credit Account Filter */}
        <div className={styles.filterGroup}>
          <label>Credit Account</label>
          <select
            value={filters.credit}
            onChange={(e) => handleFilterChange('credit', e.target.value)}
            className={styles.filterInput}
          >
            <option value="">All Accounts</option>
            {accounts.map(account => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </div>

        {/* Description Filter */}
        <div className={styles.filterGroup}>
          <label>Description</label>
          <input
            type="text"
            placeholder="Search in description..."
            value={filters.description}
            onChange={(e) => handleFilterChange('description', e.target.value)}
            className={styles.filterInput}
          />
        </div>

        {/* Status Filter */}
        <div className={styles.filterGroup}>
          <label>Status</label>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className={styles.filterInput}
          >
            {statusOptions.map(option => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.filterActions}>
        <button
          onClick={resetFilters}
          className={styles.resetButton}
        >
          Reset Filters
        </button>
      </div>
    </div>
  );
};

export default ColumnFilters;
