import { ButtonStyles } from '../../styles/modules';

const TransactionActionButtons = ({
  onAddClick,
  onImportClick,
  selectedAccountId
}) => {
  return (
    <div className={ButtonStyles.actionButtons}>
      <button
        className={ButtonStyles.addButton}
        onClick={onAddClick}
      >
        + Add Transaction
      </button>

      <button
        className={ButtonStyles.importButton}
        onClick={onImportClick}
        disabled={!selectedAccountId}
        title={!selectedAccountId ? "Please select an account first" : "Import transactions from CSV"}
      >
        Import CSV
      </button>
    </div>
  );
};

export default TransactionActionButtons;
