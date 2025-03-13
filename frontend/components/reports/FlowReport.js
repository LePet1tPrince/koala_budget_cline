import { Fragment, useEffect, useState } from 'react';

import DateRangePicker from '../common/DateRangePicker';
import FlowDashboard from './FlowDashboard';
import { getAccounts } from '../../services/accountService';
import { getTransactionsByDateRange } from '../../services/reportService';
import { ReportsStyles as styles } from '../../styles/modules';

const FlowReport = () => {
  const [activeSubTab, setActiveSubTab] = useState('report');
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);

  // Initialize with last 30 days
  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 29); // 30 days including today

  const [startDate, setStartDate] = useState(thirtyDaysAgo.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);
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

        // Fetch transactions for the selected date range
        const transactionsData = await getTransactionsByDateRange(startDate, endDate);
        setTransactions(transactionsData);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [startDate, endDate]);

  // Handle date range change
  const handleDateRangeChange = (newStartDate, newEndDate) => {
    setStartDate(newStartDate);
    setEndDate(newEndDate);
  };

  // Filter accounts to only include Income and Expense types
  const filteredAccounts = accounts.filter(account =>
    account.type === 'Income' || account.type === 'Expense'
  );

  // Group accounts by type
  const groupedAccounts = filteredAccounts.reduce((acc, account) => {
    if (!acc[account.type]) {
      acc[account.type] = [];
    }
    acc[account.type].push(account);
    return acc;
  }, {});

  // Group expense accounts by subaccount type
  const groupExpenseAccountsBySubType = () => {
    const expenseAccounts = groupedAccounts['Expense'] || [];
    return expenseAccounts.reduce((acc, account) => {
      const subType = account.sub_type ? account.sub_type.sub_type : 'Other';
      if (!acc[subType]) {
        acc[subType] = [];
      }
      acc[subType].push(account);
      return acc;
    }, {});
  };

  // Calculate transaction total for an account
  const calculateAccountTotal = (accountId) => {
    let total = 0;

    transactions.forEach(transaction => {
      if (transaction.debit === accountId) {
        // Money coming into this account (debit)
        total += parseFloat(transaction.amount);
      } else if (transaction.credit === accountId) {
        // Money going out of this account (credit)
        total -= parseFloat(transaction.amount);
      }
    });

    return total;
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
  // For expense accounts: debits are positive, credits are negative
  // For income accounts: credits are positive, debits are negative
  const formatAmount = (account, amount) => {
    if (account.type === 'Income') {
      // For income accounts, we want credits to be positive
      return formatCurrency(amount * -1);
    } else {
      // For expense accounts, we want debits to be positive
      return formatCurrency(amount);
    }
  };

  // Calculate totals for each account type
  const calculateTotals = (accountType) => {
    const accountsOfType = groupedAccounts[accountType] || [];

    return accountsOfType.reduce((total, account) => {
      const accountTotal = calculateAccountTotal(account.id);
      return total + (accountType === 'Income' ? -accountTotal : accountTotal);
    }, 0);
  };

  // Calculate subtotals for a group of accounts
  const calculateSubtotals = (accounts) => {
    return accounts.reduce((total, account) => {
      const accountTotal = calculateAccountTotal(account.id);
      return total + (account.type === 'Income' ? -accountTotal : accountTotal);
    }, 0);
  };

  // Render a single account row
  const renderAccountRow = (account) => {
    const accountTotal = calculateAccountTotal(account.id);
    const formattedAmount = formatAmount(account, accountTotal);

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

  // Render the report content
  const renderReportContent = () => {
    if (loading) {
      return <p>Loading report data...</p>;
    }

    if (error) {
      return <p className="error">{error}</p>;
    }

    return (
      <div className={styles.tableContainer}>
        <table className={styles.reportTable}>
          <thead>
            <tr>
              <th>Account</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {/* Income Accounts */}
            {groupedAccounts['Income'] && groupedAccounts['Income'].length > 0 && (
              <Fragment>
                {/* Income Header */}
                <tr className={styles.accountTypeRow}>
                  <td colSpan={2}>Income Accounts</td>
                </tr>

                {/* Income Accounts */}
                {groupedAccounts['Income'].map(account => renderAccountRow(account))}

                {/* Income Total */}
                <tr className={styles.totalRow}>
                  <td><strong>Income Total</strong></td>
                  <td className={styles.currencyCell}>
                    <strong>{formatCurrency(calculateTotals('Income'))}</strong>
                  </td>
                </tr>
              </Fragment>
            )}

            {/* Expense Accounts */}
            {groupedAccounts['Expense'] && groupedAccounts['Expense'].length > 0 && (
              <Fragment>
                {/* Expense Header */}
                <tr className={styles.accountTypeRow}>
                  <td colSpan={2}>Expense Accounts</td>
                </tr>

                {/* Expense Accounts by Subtype */}
                {Object.entries(groupExpenseAccountsBySubType()).map(([subType, accounts]) => (
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

                {/* Expense Total */}
                <tr className={styles.totalRow}>
                  <td><strong>Expense Total</strong></td>
                  <td className={styles.currencyCell}>
                    <strong>{formatCurrency(calculateTotals('Expense'))}</strong>
                  </td>
                </tr>
              </Fragment>
            )}

            {/* Net Income (Income - Expense) */}
            {filteredAccounts.length > 0 && (
              <tr className={styles.grandTotalRow}>
                <td><strong>Net Income</strong></td>
                <td className={`${styles.currencyCell} ${calculateTotals('Income') - calculateTotals('Expense') >= 0 ? styles.positive : styles.negative}`}>
                  <strong>{formatCurrency(calculateTotals('Income') - calculateTotals('Expense'))}</strong>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  // Render the report view
  const renderReportView = () => {
    return (
      <div>
        <p>
          This report shows income and expense accounts with their transaction totals for the selected period.
          Income amounts are reported with credits as positive. Expense amounts are reported with debits as positive.
        </p>
        {renderReportContent()}
      </div>
    );
  };

  return (
    <div>
      <h2>Flow Report</h2>

      {/* Sub-Tab Navigation */}
      <div className={styles.tabContainer}>
        <button
          className={`${styles.tabButton} ${activeSubTab === 'report' ? styles.activeTab : ''}`}
          onClick={() => setActiveSubTab('report')}
        >
          Report
        </button>
        <button
          className={`${styles.tabButton} ${activeSubTab === 'dashboard' ? styles.activeTab : ''}`}
          onClick={() => setActiveSubTab('dashboard')}
        >
          Dashboard
        </button>
      </div>

      {/* Date Range Picker */}
      <div className={styles.dateRangePickerContainer}>
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onApply={handleDateRangeChange}
        />
      </div>

      {/* Content based on active sub-tab */}
      {activeSubTab === 'report' ? (
        renderReportView()
      ) : (
        <FlowDashboard
          startDate={startDate}
          endDate={endDate}
        />
      )}
    </div>
  );
};

export default FlowReport;
