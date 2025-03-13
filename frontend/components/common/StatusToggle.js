import { StatusToggleStyles as styles } from '../../styles/modules';

const StatusToggle = ({ value, onChange }) => {
  const statuses = [
    { id: 'review', label: 'Review' },
    { id: 'categorized', label: 'Categorized' },
    { id: 'reconciled', label: 'Reconciled' },
    { id: 'all', label: 'All' }
  ];

  return (
    <div className={styles.statusToggleContainer}>
      {statuses.map(status => (
        <button
          key={status.id}
          className={`${styles.statusButton} ${styles[status.id]} ${value === status.id ? styles.active : ''}`}
          onClick={() => onChange(status.id)}
        >
          {status.label}
        </button>
      ))}
    </div>
  );
};

export default StatusToggle;
