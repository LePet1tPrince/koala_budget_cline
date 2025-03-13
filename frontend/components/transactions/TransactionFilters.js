import StatusToggle from '../common/StatusToggle';
import { StatusToggleStyles } from '../../styles/modules';
import { useState } from 'react';

const TransactionFilters = ({ statusFilter, onStatusFilterChange, onSearchChange }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearchChange(value);
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div style={{ marginRight: '20px', flex: '1' }}>
        <h3>Filter by Status</h3>
        <StatusToggle
          value={statusFilter}
          onChange={onStatusFilterChange}
        />
      </div>

      <div style={{ width: '300px' }}>
        <h3>Search Transactions</h3>
        <input
          type="text"
          placeholder="Search by amount, category, or description..."
          value={searchTerm}
          onChange={handleSearchChange}
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: '20px',
            border: '1px solid #ccc',
            fontSize: '14px',
            backgroundColor: 'rgba(138, 140, 142, 0.1)',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}
        />
      </div>
    </div>
  );
};

export default TransactionFilters;
