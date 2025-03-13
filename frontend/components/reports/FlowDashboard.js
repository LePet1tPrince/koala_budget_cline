import { useEffect, useState } from 'react';

import dynamic from 'next/dynamic';
import { getAccounts } from '../../services/accountService';
import { getTransactionsByDateRange } from '../../services/reportService';
import { ReportsStyles as styles } from '../../styles/modules';

// Dynamically import Plotly to avoid SSR issues
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

const FlowDashboard = ({ startDate, endDate }) => {
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sankeyData, setSankeyData] = useState(null);

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

  // Process data for Sankey diagram whenever accounts or transactions change
  useEffect(() => {
    if (accounts.length > 0 && transactions.length > 0) {
      processSankeyData();
    }
  }, [accounts, transactions]);

  // Filter accounts to only include Income and Expense types
  const getFilteredAccounts = (type) => {
    return accounts.filter(account => account.type === type);
  };

  // Group accounts by sub-type
  const groupAccountsBySubType = (accountsOfType) => {
    return accountsOfType.reduce((acc, account) => {
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

  // Process data for Sankey diagram
  const processSankeyData = () => {
    // Get income and expense accounts
    const incomeAccounts = getFilteredAccounts('Income');
    const expenseAccounts = getFilteredAccounts('Expense');

    // Group accounts by sub-type
    const incomeAccountsBySubType = groupAccountsBySubType(incomeAccounts);
    const expenseAccountsBySubType = groupAccountsBySubType(expenseAccounts);

    // Prepare nodes and links arrays for Sankey diagram
    const nodes = [];
    const links = [];
    const nodeMap = new Map(); // Map to track node indices

    // Helper function to add a node and get its index
    const addNode = (name, color) => {
      if (!nodeMap.has(name)) {
        const index = nodes.length;
        nodes.push({ name, color });
        nodeMap.set(name, index);
      }
      return nodeMap.get(name);
    };

    // Add "Income" and "Savings" nodes
    const incomeNodeIndex = addNode('Income', 'rgba(0, 123, 255, 0.8)');
    const savingsNodeIndex = addNode('Savings', 'rgba(40, 167, 69, 0.8)');

    // Add income account nodes and links to Income
    let totalIncome = 0;

    // First, add all income accounts as nodes
    Object.entries(incomeAccountsBySubType).forEach(([subType, accounts]) => {
      // Add subtype node
      const subTypeNodeIndex = addNode(`Income: ${subType}`, 'rgba(0, 123, 255, 0.6)');

      // Add link from subtype to Income
      let subTypeTotal = 0;

      accounts.forEach(account => {
        // Add account node
        const accountNodeIndex = addNode(`${account.icon || '💰'} ${account.name}`, 'rgba(0, 123, 255, 0.4)');

        // Calculate account total (for income, we want credits to be positive)
        const accountTotal = -calculateAccountTotal(account.id);
        if (accountTotal > 0) {
          // Add link from account to subtype
          links.push({
            source: accountNodeIndex,
            target: subTypeNodeIndex,
            value: accountTotal,
            label: `$${accountTotal.toFixed(2)}`,
          });

          subTypeTotal += accountTotal;
        }
      });

      if (subTypeTotal > 0) {
        links.push({
          source: subTypeNodeIndex,
          target: incomeNodeIndex,
          value: subTypeTotal,
          label: `$${subTypeTotal.toFixed(2)}`,
        });

        totalIncome += subTypeTotal;
      }
    });

    // Add expense account nodes and links
    let totalExpenses = 0;

    Object.entries(expenseAccountsBySubType).forEach(([subType, accounts]) => {
      // Add subtype node
      const subTypeNodeIndex = addNode(`Expense: ${subType}`, 'rgba(220, 53, 69, 0.6)');

      // Add link from Income to subtype
      let subTypeTotal = 0;

      accounts.forEach(account => {
        // Add account node
        const accountNodeIndex = addNode(`${account.icon || '💰'} ${account.name}`, 'rgba(220, 53, 69, 0.4)');

        // Calculate account total (for expense, we want debits to be positive)
        const accountTotal = calculateAccountTotal(account.id);
        if (accountTotal > 0) {
          // Add link from subtype to account
          links.push({
            source: subTypeNodeIndex,
            target: accountNodeIndex,
            value: accountTotal,
            label: `$${accountTotal.toFixed(2)}`,
          });

          subTypeTotal += accountTotal;
        }
      });

      if (subTypeTotal > 0) {
        links.push({
          source: incomeNodeIndex,
          target: subTypeNodeIndex,
          value: subTypeTotal,
          label: `$${subTypeTotal.toFixed(2)}`,
        });

        totalExpenses += subTypeTotal;
      }
    });

    // Calculate savings (income - expenses)
    const savings = Math.max(0, totalIncome - totalExpenses);
    if (savings > 0) {
      links.push({
        source: incomeNodeIndex,
        target: savingsNodeIndex,
        value: savings,
        label: `$${savings.toFixed(2)}`,
      });
    }

    // Set Sankey data
    setSankeyData({
      nodes,
      links,
      totalIncome,
      totalExpenses,
      savings,
    });
  };

  return (
    <div>
      <h2>Cash Flow Dashboard</h2>
      <p>
        This dashboard visualizes the flow of money through your accounts for the selected period.
      </p>

      {loading ? (
        <p>Loading dashboard data...</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : sankeyData ? (
        <div className={styles.sankeyContainer}>
          <Plot
            data={[
              {
                type: 'sankey',
                orientation: 'h',
                node: {
                  pad: 15,
                  thickness: 20,
                  line: {
                    color: 'black',
                    width: 0.5
                  },
                  label: sankeyData.nodes.map(node => node.name),
                  color: sankeyData.nodes.map(node => node.color)
                },
                link: {
                  source: sankeyData.links.map(link => link.source),
                  target: sankeyData.links.map(link => link.target),
                  value: sankeyData.links.map(link => link.value),
                  label: sankeyData.links.map(link => link.label),
                }
              }
            ]}
            layout={{
              title: `Cash Flow: ${startDate} - ${endDate}`,
              font: {
                size: 12,
                color: '#333'
              },
              autosize: true,
              height: 600,
              margin: {
                l: 25,
                r: 25,
                b: 25,
                t: 50,
                pad: 4
              },
              paper_bgcolor: '#fff',
              plot_bgcolor: '#fff'
            }}
            config={{
              responsive: true,
              displayModeBar: false
            }}
            style={{
              width: '100%',
              height: '100%'
            }}
          />

          <div className={styles.dashboardSummary}>
            <div className={styles.summaryItem}>
              <h3>Total Income</h3>
              <p className={styles.positive}>${sankeyData.totalIncome.toFixed(2)}</p>
            </div>
            <div className={styles.summaryItem}>
              <h3>Total Expenses</h3>
              <p className={styles.negative}>${sankeyData.totalExpenses.toFixed(2)}</p>
            </div>
            <div className={styles.summaryItem}>
              <h3>Savings</h3>
              <p className={sankeyData.savings > 0 ? styles.positive : ''}>
                ${sankeyData.savings.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <p>No data available for the selected period.</p>
      )}
    </div>
  );
};

export default FlowDashboard;
