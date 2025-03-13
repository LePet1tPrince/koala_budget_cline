import { Fragment, useEffect, useState } from 'react';

import { BudgetTableStyles as styles } from '../../styles/modules';

const BudgetTable = ({ accounts, budgets, onBudgetUpdate }) => {
  const [budgetValues, setBudgetValues] = useState({});

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

  // Order of account types to display
  const accountTypeOrder = ['Income', 'Expense'];

  // Initialize budget values from props
  useEffect(() => {
    const initialValues = {};
    filteredAccounts.forEach(account => {
      const budget = getBudgetForAccount(account.id);
      initialValues[account.id] = budget ? budget.budgeted_amount : '0';
    });
    setBudgetValues(initialValues);
  }, [accounts, budgets]);

  // Get budget for an account
  const getBudgetForAccount = (accountId) => {
    return budgets.find(b => b.account === accountId);
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

  // Format actual amount based on account type
  // For expense accounts: debits are positive, credits are negative
  // For income accounts: credits are positive, debits are negative
  // The backend already calculates this correctly, we just need to display it
  const formatActualAmount = (account, actualAmount) => {
    return formatCurrency(actualAmount);
  };

  // Format actual amount for account type
  const formatActualForType = (accountType, actualAmount) => {
    return formatCurrency(actualAmount);
  };

  // Handle budget input change
  const handleBudgetChange = (accountId, value) => {
    setBudgetValues({
      ...budgetValues,
      [accountId]: value
    });
  };

  // Handle budget save on blur
  const handleBudgetBlur = (accountId) => {
    const value = budgetValues[accountId];
    onBudgetUpdate(accountId, parseFloat(value) || 0);
  };

  // Handle key down event for budget input
  const handleKeyDown = (e, accountId) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleBudgetBlur(accountId);
      // Blur the input field
      e.target.blur();
    }
  };

  // Calculate totals for each account type
  const calculateTotals = (accountType) => {
    const accountsOfType = groupedAccounts[accountType] || [];

    return accountsOfType.reduce((totals, account) => {
      const budget = getBudgetForAccount(account.id);
      const budgetedAmount = budget ? parseFloat(budget.budgeted_amount) : 0;
      const actualAmount = budget ? parseFloat(budget.actual_amount) : 0;
      const difference = calculateDifference(account, budgetedAmount, actualAmount);

      return {
        budgeted: totals.budgeted + budgetedAmount,
        actual: totals.actual + actualAmount,
        difference: totals.difference + difference
      };
    }, { budgeted: 0, actual: 0, difference: 0 });
  };

  // Calculate grand totals (Income - Expense)
  const calculateGrandTotals = () => {
    const incomeTotals = calculateTotals('Income');
    const expenseTotals = calculateTotals('Expense');

    return {
      budgeted: incomeTotals.budgeted - expenseTotals.budgeted,
      actual: incomeTotals.actual - expenseTotals.actual,
      difference: incomeTotals.difference - expenseTotals.difference
    };
  };

  // Calculate subtotals for a group of accounts
  const calculateSubtotals = (accounts) => {
    return accounts.reduce((totals, account) => {
      const budget = getBudgetForAccount(account.id);
      const budgetedAmount = budget ? parseFloat(budget.budgeted_amount) : 0;
      const actualAmount = budget ? parseFloat(budget.actual_amount) : 0;
      const difference = calculateDifference(account, budgetedAmount, actualAmount);

      return {
        budgeted: totals.budgeted + budgetedAmount,
        actual: totals.actual + actualAmount,
        difference: totals.difference + difference
      };
    }, { budgeted: 0, actual: 0, difference: 0 });
  };

  // Calculate difference based on account type
  const calculateDifference = (account, budgetedAmount, actualAmount) => {
    if (account.type === 'Income') {
      // For income: Actual - Budget
      return actualAmount - budgetedAmount;
    } else {
      // For expense: Budget - Actual
      return budgetedAmount - actualAmount;
    }
  };

  // Render a single account row
  const renderAccountRow = (account) => {
    const budget = getBudgetForAccount(account.id);
    const budgetedAmount = budget ? parseFloat(budget.budgeted_amount) : 0;
    const actualAmount = budget ? parseFloat(budget.actual_amount) : 0;
    const difference = calculateDifference(account, budgetedAmount, actualAmount);

    return (
      <tr key={account.id}>
        <td className={styles.accountNameCell}>
          <span className={styles.accountIcon}>{account.icon || '💰'}</span>
          {account.name}
        </td>
        <td className={styles.budgetInputCell}>
          <input
            type="number"
            value={budgetValues[account.id] || '0'}
            onChange={(e) => handleBudgetChange(account.id, e.target.value)}
            onBlur={() => handleBudgetBlur(account.id)}
            onKeyDown={(e) => handleKeyDown(e, account.id)}
            step="0.01"
            className={styles.editInput}
          />
        </td>
        <td className={styles.currencyCell}>{formatActualAmount(account, actualAmount)}</td>
        <td className={`${styles.currencyCell} ${difference >= 0 ? styles.positive : styles.negative}`}>
          {formatCurrency(difference)}
        </td>
        <td></td>
      </tr>
    );
  };

  return (
    <div className={styles.tableContainer}>
      <table className={styles.budgetTable}>
        <thead>
          <tr>
            <th>Account</th>
            <th>Budgeted</th>
            <th>Actual</th>
            <th>Difference</th>
            <th></th> {/* Empty header for consistency */}
          </tr>
        </thead>
        <tbody>
          {/* Income Accounts */}
          {groupedAccounts['Income'] && groupedAccounts['Income'].length > 0 && (
            <Fragment>
              {/* Income Header */}
              <tr className={styles.accountTypeRow}>
                <td colSpan={5}>Income Accounts</td>
              </tr>

              {/* Income Accounts */}
              {groupedAccounts['Income'].map(account => renderAccountRow(account))}

              {/* Income Total */}
              <tr className={styles.totalRow}>
                <td><strong>Income Total</strong></td>
                <td className={styles.currencyCell}>
                  <strong>{formatCurrency(calculateTotals('Income').budgeted)}</strong>
                </td>
                <td className={styles.currencyCell}>
                  <strong>{formatActualForType('Income', calculateTotals('Income').actual)}</strong>
                </td>
                <td className={`${styles.currencyCell} ${calculateTotals('Income').difference >= 0 ? styles.positive : styles.negative}`}>
                  <strong>{formatCurrency(calculateTotals('Income').difference)}</strong>
                </td>
                <td></td>
              </tr>
            </Fragment>
          )}

          {/* Expense Accounts */}
          {groupedAccounts['Expense'] && groupedAccounts['Expense'].length > 0 && (
            <Fragment>
              {/* Expense Header */}
              <tr className={styles.accountTypeRow}>
                <td colSpan={5}>Expense Accounts</td>
              </tr>

              {/* Expense Accounts by Subtype */}
              {Object.entries(groupExpenseAccountsBySubType()).map(([subType, accounts]) => (
                <Fragment key={subType}>
                  {/* Subtype Header */}
                  <tr className={styles.subAccountTypeRow}>
                    <td colSpan={5}>{subType}</td>
                  </tr>

                  {/* Accounts of this subtype */}
                  {accounts.map(account => renderAccountRow(account))}

                  {/* Subtype Total */}
                  <tr className={styles.subTotalRow}>
                    <td><strong>{subType} Total</strong></td>
                    <td className={styles.currencyCell}>
                      <strong>{formatCurrency(calculateSubtotals(accounts).budgeted)}</strong>
                    </td>
                    <td className={styles.currencyCell}>
                      <strong>{formatActualForType('Expense', calculateSubtotals(accounts).actual)}</strong>
                    </td>
                    <td className={`${styles.currencyCell} ${calculateSubtotals(accounts).difference >= 0 ? styles.positive : styles.negative}`}>
                      <strong>{formatCurrency(calculateSubtotals(accounts).difference)}</strong>
                    </td>
                    <td></td>
                  </tr>
                </Fragment>
              ))}

              {/* Expense Total */}
              <tr className={styles.totalRow}>
                <td><strong>Expense Total</strong></td>
                <td className={styles.currencyCell}>
                  <strong>{formatCurrency(calculateTotals('Expense').budgeted)}</strong>
                </td>
                <td className={styles.currencyCell}>
                  <strong>{formatActualForType('Expense', calculateTotals('Expense').actual)}</strong>
                </td>
                <td className={`${styles.currencyCell} ${calculateTotals('Expense').difference >= 0 ? styles.positive : styles.negative}`}>
                  <strong>{formatCurrency(calculateTotals('Expense').difference)}</strong>
                </td>
                <td></td>
              </tr>
            </Fragment>
          )}

          {/* Grand Totals */}
          {filteredAccounts.length > 0 && (
            <tr className={styles.grandTotalRow}>
              <td><strong>Grand Total</strong></td>
              <td className={styles.currencyCell}>
                <strong>{formatCurrency(calculateGrandTotals().budgeted)}</strong>
              </td>
              <td className={styles.currencyCell}>
                <strong>{formatCurrency(calculateGrandTotals().actual)}</strong>
              </td>
              <td className={`${styles.currencyCell} ${calculateGrandTotals().difference >= 0 ? styles.positive : styles.negative}`}>
                <strong>{formatCurrency(calculateGrandTotals().difference)}</strong>
              </td>
              <td></td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default BudgetTable;
