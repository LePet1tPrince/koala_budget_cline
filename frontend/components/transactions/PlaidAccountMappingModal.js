import { mapAccounts, syncTransactions } from '../../services/plaidService';
import { useEffect, useState } from 'react';

import Modal from '../common/Modal';
import { getAllAccounts } from '../../services/accountService';
import { useNotification } from '../../contexts/NotificationContext';

const PlaidAccountMappingModal = ({
  isOpen,
  onClose,
  plaidAccounts,
  accessToken,
  itemId,
  institutionName,
  onSuccess
}) => {
  const [accountMapping, setAccountMapping] = useState({});
  const [appAccounts, setAppAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { showSuccess, showError } = useNotification();

  // Load app accounts
  useEffect(() => {
    if (isOpen) {
      loadAccounts();
    }
  }, [isOpen]);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const accounts = await getAllAccounts();
      setAppAccounts(accounts);
    } catch (err) {
      console.error('Error loading accounts:', err);
      setError('Failed to load accounts. Please try again later.');
      showError('Failed to load accounts: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate that at least one account is mapped
      if (Object.keys(accountMapping).length === 0) {
        setError('Please map at least one account.');
        return;
      }

      // Log the account mapping for debugging
      console.log('Submitting account mapping:', accountMapping);

      // Validate that all selected accounts have valid values
      for (const [plaidAccountId, appAccountId] of Object.entries(accountMapping)) {
        if (!appAccountId) {
          setError(`Please select an account for all mapped bank accounts or remove the mapping.`);
          setLoading(false);
          return;
        }
      }

      // Submit the mapping to the backend
      const result = await mapAccounts(
        accessToken,
        itemId,
        institutionName,
        accountMapping
      );

      // Sync transactions for each mapped account
      const syncPromises = result.plaid_item_ids.map(id => syncTransactions(id));
      const syncResults = await Promise.all(syncPromises);

      // Calculate total transactions added
      const totalAdded = syncResults.reduce((sum, result) => sum + result.added, 0);

      // Show success message
      showSuccess(`Successfully connected ${result.mapped_accounts} accounts. Added ${totalAdded} transactions.`);

      // Call the success callback
      if (onSuccess) {
        onSuccess(result);
      }

      // Close the modal
      onClose();
    } catch (err) {
      console.error('Error mapping accounts:', err);
      setError('Failed to map accounts. Please try again later.');
      showError('Failed to map accounts: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Map Your Accounts"
    >
      <div style={{ padding: '1rem' }}>
        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <div>
            <p style={{ color: 'red' }}>{error}</p>
          </div>
        ) : (
          <>
            <p>Please select which of your accounts to connect to each bank account:</p>

            {plaidAccounts.map(plaidAccount => (
              <div key={plaidAccount.account_id} style={{ marginBottom: '1.5rem', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '0.375rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                  {plaidAccount.name || 'Unnamed Account'} {plaidAccount.mask ? `(${plaidAccount.mask})` : ''}
                </h3>
                <p style={{ marginBottom: '0.5rem' }}>
                  Type: {plaidAccount.type || 'Unknown'} {plaidAccount.subtype ? `/ ${plaidAccount.subtype}` : ''}
                </p>
                <p style={{ marginBottom: '1rem' }}>
                  Balance: ${plaidAccount.balances?.current != null ? Number(plaidAccount.balances.current).toFixed(2) : '0.00'}
                </p>

                <select
                  value={accountMapping[plaidAccount.account_id] || ''}
                  onChange={e => setAccountMapping({
                    ...accountMapping,
                    [plaidAccount.account_id]: e.target.value
                  })}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    borderRadius: '0.25rem',
                    border: '1px solid #cbd5e0'
                  }}
                >
                  <option value="">-- Select an account --</option>
                  {appAccounts.map(account => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
              </div>
            ))}

            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={onClose}
                style={{
                  backgroundColor: '#e2e8f0',
                  color: '#1a202c',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.25rem',
                  border: 'none',
                  marginRight: '0.5rem',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || Object.keys(accountMapping).length === 0}
                style={{
                  backgroundColor: '#4299e1',
                  color: 'white',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.25rem',
                  border: 'none',
                  cursor: Object.keys(accountMapping).length === 0 ? 'not-allowed' : 'pointer',
                  opacity: Object.keys(accountMapping).length === 0 ? 0.7 : 1
                }}
              >
                Connect Accounts
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default PlaidAccountMappingModal;
