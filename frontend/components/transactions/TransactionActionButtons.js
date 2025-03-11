import { ButtonStyles } from '../../styles/modules';

const TransactionActionButtons = ({
  onAddClick,
  onImportClick,
  onPlaidConnect,
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

      <button
        className={ButtonStyles.plaidButton}
        onClick={onPlaidConnect}
        disabled={!selectedAccountId}
        title={!selectedAccountId ? "Please select an account first" : "Connect to your bank account"}
      >
        Connect to Bank
      </button>
    </div>
  );
};

export default TransactionActionButtons;
