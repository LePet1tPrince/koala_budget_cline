import { FormStyles, BudgetTableStyles as styles } from '../styles/modules';
import { getBudgetsByMonth, saveOrUpdateBudget } from '../services/budgetService';
import { useEffect, useState } from 'react';

import BudgetTable from '../components/budget/BudgetTable';
import Layout from '../components/layout/Layout';
import { getAccounts } from '../services/accountService';

export default function BudgetingPage() {
  const [accounts, setAccounts] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().substring(0, 7)
  ); // Format: YYYY-MM
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load accounts and budgets
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch accounts
        const accountsData = await getAccounts();
        setAccounts(accountsData);

        // Fetch budgets for the selected month
        // We need to add the day to make it a valid date (first day of month)
        const monthDate = `${selectedMonth}-01`;
        const budgetsData = await getBudgetsByMonth(monthDate);
        setBudgets(budgetsData);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedMonth]);

  // Handle month change
  const handleMonthChange = (e) => {
    setSelectedMonth(e.target.value);
  };

  // Navigate to previous month
  const handlePreviousMonth = () => {
    const [year, month] = selectedMonth.split('-');
    const prevMonth = new Date(parseInt(year), parseInt(month) - 2, 1);
    setSelectedMonth(prevMonth.toISOString().substring(0, 7));
  };

  // Navigate to next month
  const handleNextMonth = () => {
    const [year, month] = selectedMonth.split('-');
    const nextMonth = new Date(parseInt(year), parseInt(month), 1);
    setSelectedMonth(nextMonth.toISOString().substring(0, 7));
  };

  // Handle budget update
  const handleBudgetUpdate = async (accountId, budgetedAmount) => {
    try {
      setError(null);

      const budgetData = {
        month: `${selectedMonth}-01`, // First day of month
        account: accountId,
        budgeted_amount: budgetedAmount
      };

      const updatedBudget = await saveOrUpdateBudget(budgetData);

      // Update the local state
      setBudgets(prevBudgets => {
        const existingIndex = prevBudgets.findIndex(b => b.account === accountId);
        if (existingIndex >= 0) {
          // Replace existing budget
          const newBudgets = [...prevBudgets];
          newBudgets[existingIndex] = updatedBudget;
          return newBudgets;
        } else {
          // Add new budget
          return [...prevBudgets, updatedBudget];
        }
      });
    } catch (error) {
      console.error('Error updating budget:', error);
      setError('Failed to update budget. Please try again.');
    }
  };

  return (
    <Layout activePage="budgeting">
      <div className={FormStyles.container}>
        <h1 className={FormStyles.title}>Budgeting</h1>

        <div className={styles.monthSelectorContainer}>
          <div className={styles.monthSelector}>
            <button
              className={styles.monthNavButton}
              onClick={handlePreviousMonth}
              aria-label="Previous Month"
            >
              &lsaquo;
            </button>

            <label htmlFor="month">Select Month:</label>
            <input
              type="month"
              id="month"
              value={selectedMonth}
              onChange={handleMonthChange}
            />

            <button
              className={styles.monthNavButton}
              onClick={handleNextMonth}
              aria-label="Next Month"
            >
              &rsaquo;
            </button>
          </div>
        </div>

        {loading ? (
          <p>Loading budget data...</p>
        ) : error ? (
          <p className={FormStyles.error}>{error}</p>
        ) : (
          <BudgetTable
            accounts={accounts}
            budgets={budgets}
            onBudgetUpdate={handleBudgetUpdate}
          />
        )}
      </div>
    </Layout>
  );
}
