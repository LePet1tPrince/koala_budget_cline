import { Fragment, useEffect, useState } from 'react';

import DateRangePicker from '../common/DateRangePicker';
import { getAccounts } from '../../services/accountService';
import { getTransactionsSummedToDate } from '../../services/reportService';
import { ReportsStyles as styles } from '../../styles/modules';

const BalanceReport = () => {
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);

  // Initialize with current date
  const today = new Date();
  const [asOfDate, setAsOfDate] = useState(today.toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load accounts and transactions
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch accounts
        const accountsData = await getAccounts();
        setAccounts(accountsData);

        // Fetch transactions summed up to the selected date
        if (asOfDate) {
          const transactionsData = await getTransactionsSummedToDate(asOfDate);
          setTransactions(transactionsData);
        } else {
          setTransactions([]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [asOfDate]);

  // Handle date change
  const handleDateChange = (startDate, endDate) => {
    // For balance report, we only care about the end date
    setAsOfDate(endDate || startDate);
  };

  // Filter accounts to only include Asset and Liability types
  const filteredAccounts = accounts.filter(account =>
    account.type === 'Asset' || account.type === 'Liability'
  );

  // Group accounts by type
  const groupedAccounts = filteredAccounts.reduce((acc, account) => {
    if (!acc[account.type]) {
      acc[account.type] = [];
    }
    acc[account.type].push(account);
    return acc;
  }, {});

  // Group accounts by subaccount type
  const groupAccountsBySubType = (accountType) => {
    const accountsOfType = groupedAccounts[accountType] || [];
    return accountsOfType.reduce((acc, account) => {
      const subType = account.sub_type ? account.sub_type.sub_type : 'Other';
      if (!acc[subType]) {
        acc[subType] = [];
      }
      acc[subType].push(account);
      return acc;
    }, {});
  };

  // Get account balance from transactions
  const getAccountBalance = (accountId) => {
    const accountTransaction = transactions.find(t => t.account_id === accountId);
    return accountTransaction ? parseFloat(accountTransaction.balance) : 0;
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Format amount based on account type
  // For asset accounts: debits are positive, credits are negative
  // For liability accounts: credits are positive, debits are negative
  const formatAmount = (account, amount) => {
    if (account.type === 'Liability') {
      // For liability accounts, we want credits to be positive
      return formatCurrency(amount * -1);
    } else {
      // For asset accounts, we want debits to be positive
      return formatCurrency(amount);
    }
  };

  // Calculate totals for each account type
  const calculateTotals = (accountType) => {
    const accountsOfType = groupedAccounts[accountType] || [];

    return accountsOfType.reduce((total, account) => {
      const balance = getAccountBalance(account.id);
      return total + (accountType === 'Liability' ? -balance : balance);
    }, 0);
  };

  // Calculate subtotals for a group of accounts
  const calculateSubtotals = (accounts) => {
    return accounts.reduce((total, account) => {
      const balance = getAccountBalance(account.id);
      return total + (account.type === 'Liability' ? -balance : balance);
    }, 0);
  };

  // Calculate net worth (Assets - Liabilities)
  const calculateNetWorth = () => {
    const assetTotal = calculateTotals('Asset');
    const liabilityTotal = calculateTotals('Liability');
    return assetTotal - liabilityTotal;
  };

  // Render a single account row
  const renderAccountRow = (account) => {
    const balance = getAccountBalance(account.id);
    const formattedAmount = formatAmount(account, balance);

    return (
      <tr key={account.id}>
        <td className={styles.accountNameCell}>
          <span className={styles.accountIcon}>{account.icon || '💰'}</span>
          {account.name}
        </td>
        <td className={styles.currencyCell}>{formattedAmount}</td>
      </tr>
    );
  };

  return (
    <div>
      <h2>Balance Report</h2>
      <p>
        This report shows asset and liability accounts with their balances as of the end of the selected month.
        Asset amounts are positive when debits. Liability amounts are positive when credits.
      </p>

      {/* Date Picker */}
      <div className={styles.dateRangePickerContainer}>
        <DateRangePicker
          startDate=""
          endDate={asOfDate}
          onApply={handleDateChange}
        />
      </div>

      {loading ? (
        <p>Loading report data...</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.reportTable}>
            <thead>
              <tr>
                <th>Account</th>
                <th>Balance</th>
              </tr>
            </thead>
            <tbody>
              {/* Asset Accounts */}
              {groupedAccounts['Asset'] && groupedAccounts['Asset'].length > 0 && (
                <Fragment>
                  {/* Asset Header */}
                  <tr className={styles.accountTypeRow}>
                    <td colSpan={2}>Asset Accounts</td>
                  </tr>

                  {/* Asset Accounts by Subtype */}
                  {Object.entries(groupAccountsBySubType('Asset')).map(([subType, accounts]) => (
                    <Fragment key={subType}>
                      {/* Subtype Header */}
                      <tr className={styles.subAccountTypeRow}>
                        <td colSpan={2}>{subType}</td>
                      </tr>

                      {/* Accounts of this subtype */}
                      {accounts.map(account => renderAccountRow(account))}

                      {/* Subtype Total */}
                      <tr className={styles.subTotalRow}>
                        <td><strong>{subType} Total</strong></td>
                        <td className={styles.currencyCell}>
                          <strong>{formatCurrency(calculateSubtotals(accounts))}</strong>
                        </td>
                      </tr>
                    </Fragment>
                  ))}

                  {/* Asset Total */}
                  <tr className={styles.totalRow}>
                    <td><strong>Asset Total</strong></td>
                    <td className={styles.currencyCell}>
                      <strong>{formatCurrency(calculateTotals('Asset'))}</strong>
                    </td>
                  </tr>
                </Fragment>
              )}

              {/* Liability Accounts */}
              {groupedAccounts['Liability'] && groupedAccounts['Liability'].length > 0 && (
                <Fragment>
                  {/* Liability Header */}
                  <tr className={styles.accountTypeRow}>
                    <td colSpan={2}>Liability Accounts</td>
                  </tr>

                  {/* Liability Accounts by Subtype */}
                  {Object.entries(groupAccountsBySubType('Liability')).map(([subType, accounts]) => (
                    <Fragment key={subType}>
                      {/* Subtype Header */}
                      <tr className={styles.subAccountTypeRow}>
                        <td colSpan={2}>{subType}</td>
                      </tr>

                      {/* Accounts of this subtype */}
                      {accounts.map(account => renderAccountRow(account))}

                      {/* Subtype Total */}
                      <tr className={styles.subTotalRow}>
                        <td><strong>{subType} Total</strong></td>
                        <td className={styles.currencyCell}>
                          <strong>{formatCurrency(calculateSubtotals(accounts))}</strong>
                        </td>
                      </tr>
                    </Fragment>
                  ))}

                  {/* Liability Total */}
                  <tr className={styles.totalRow}>
                    <td><strong>Liability Total</strong></td>
                    <td className={styles.currencyCell}>
                      <strong>{formatCurrency(calculateTotals('Liability'))}</strong>
                    </td>
                  </tr>
                </Fragment>
              )}

              {/* Net Worth (Assets - Liabilities) */}
              {filteredAccounts.length > 0 && (
                <tr className={styles.grandTotalRow}>
                  <td><strong>Total Net Worth</strong></td>
                  <td className={`${styles.currencyCell} ${calculateNetWorth() >= 0 ? styles.positive : styles.negative}`}>
                    <strong>{formatCurrency(calculateNetWorth())}</strong>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default BalanceReport;
