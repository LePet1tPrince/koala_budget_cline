import StatusToggle from '../common/StatusToggle';
import { StatusToggleStyles } from '../../styles/modules';

const TransactionFilters = ({ statusFilter, onStatusFilterChange }) => {
  return (
    <div>
      <h3>Filter by Status</h3>
      <StatusToggle
        value={statusFilter}
        onChange={onStatusFilterChange}
      />
    </div>
  );
};

export default TransactionFilters;
