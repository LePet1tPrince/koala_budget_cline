import { createLinkToken, exchangePublicToken, getPlaidAccounts } from '../../services/plaidService';
import { useCallback, useEffect, useRef, useState } from 'react';

import Modal from '../common/Modal';
import PlaidAccountMappingModal from './PlaidAccountMappingModal';
import { useNotification } from '../../contexts/NotificationContext';
import { usePlaidLink } from 'react-plaid-link';

const PlaidLinkModal = ({ isOpen, onClose, accountId, onSuccess }) => {
  const [linkToken, setLinkToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showMappingModal, setShowMappingModal] = useState(false);
  const [plaidAccounts, setPlaidAccounts] = useState([]);
  const [plaidAccessToken, setPlaidAccessToken] = useState(null);
  const [plaidItemId, setPlaidItemId] = useState(null);
  const [institutionName, setInstitutionName] = useState(null);
  const [hasAuthenticated, setHasAuthenticated] = useState(false);
  const { showSuccess, showError } = useNotification();

  // Use a ref to track if Plaid Link has been opened in this session
  const plaidLinkOpened = useRef(false);

  // Get a link token when the modal opens and reset state
  useEffect(() => {
    if (isOpen && accountId) {
      // Reset state when modal is opened
      setHasAuthenticated(false);
      plaidLinkOpened.current = false;
      setShowMappingModal(false);
      setError(null);
      getLinkToken();
    }
  }, [isOpen, accountId]);

  // Function to get a link token
  const getLinkToken = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await createLinkToken(accountId);
      setLinkToken(token);
    } catch (err) {
      console.error('Error getting link token:', err);
      setError('Failed to initialize Plaid Link. Please try again later.');
      showError('Failed to initialize Plaid Link: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  // Handle successful link
  const handleSuccess = useCallback(async (publicToken, metadata) => {
    try {
      setLoading(true);

      // Mark as authenticated to prevent re-opening Plaid Link
      setHasAuthenticated(true);
      console.log('Plaid authentication successful, preventing re-open');

      // Exchange the public token for an access token
      const response = await exchangePublicToken(
        publicToken,
        accountId,
        metadata.institution.institution_id
      );

      // Store the access token and item ID for the mapping modal
      setPlaidAccessToken(response.access_token);
      setPlaidItemId(response.item_id);
      setInstitutionName(metadata.institution.name);

      // Get accounts from Plaid
      const accounts = await getPlaidAccounts(response.access_token);

      // Validate that we received accounts
      if (!accounts || !Array.isArray(accounts) || accounts.length === 0) {
        throw new Error('No accounts received from Plaid');
      }

      console.log('Plaid accounts received:', accounts);
      setPlaidAccounts(accounts);

      // Show the account mapping modal
      setShowMappingModal(true);
    } catch (err) {
      console.error('Error in Plaid Link success handler:', err);
      setError('Failed to connect to your bank. Please try again later.');
      showError('Failed to connect to your bank: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [accountId, showError]);

  // Handle account mapping success
  const handleMappingSuccess = useCallback((result) => {
    // Close the Plaid Link modal
    onClose();

    // Call the success callback
    if (onSuccess) {
      onSuccess(result);
    }
  }, [onClose, onSuccess]);

  // Handle Plaid Link exit
  const handleExit = useCallback((err) => {
    if (err != null && err.error_code !== 'USER_EXITED') {
      console.error('Plaid Link error:', err);
      setError(`Error: ${err.error_code}: ${err.error_message}`);
      showError(`Plaid Link error: ${err.error_message}`);
    }
    onClose();
  }, [onClose, showError]);

  // Configure Plaid Link
  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: handleSuccess,
    onExit: handleExit,
  });

  // Open Plaid Link when it's ready
  useEffect(() => {
    // Only open Plaid Link if:
    // 1. It's ready to be opened
    // 2. The modal is open
    // 3. We're not loading
    // 4. There's no error
    // 5. The user hasn't already authenticated
    // 6. We haven't already opened Plaid Link in this session
    if (ready && isOpen && !loading && !error && !hasAuthenticated && !plaidLinkOpened.current) {
      console.log('Opening Plaid Link UI');
      plaidLinkOpened.current = true;
      open();
    }
  }, [ready, isOpen, loading, error, open, hasAuthenticated]);

  return (
    <>
      <Modal
        isOpen={isOpen && !showMappingModal}
        onClose={onClose}
        title="Connect to Your Bank"
      >
        <div style={{ padding: '1rem' }}>
          {loading ? (
            <p>Loading...</p>
          ) : error ? (
            <div>
              <p style={{ color: 'red' }}>{error}</p>
              <button
                onClick={getLinkToken}
                style={{
                  backgroundColor: '#4299e1',
                  color: 'white',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer',
                  marginTop: '1rem'
                }}
              >
                Try Again
              </button>
            </div>
          ) : (
            <p>Initializing connection to your bank...</p>
          )}
        </div>
      </Modal>

      {showMappingModal && (
        <PlaidAccountMappingModal
          isOpen={showMappingModal}
          onClose={() => {
            setShowMappingModal(false);
            onClose();
          }}
          plaidAccounts={plaidAccounts}
          accessToken={plaidAccessToken}
          itemId={plaidItemId}
          institutionName={institutionName}
          onSuccess={handleMappingSuccess}
        />
      )}
    </>
  );
};

export default PlaidLinkModal;
