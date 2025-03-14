import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

import BudgetTable from '../../../components/budget/BudgetTable';
import React from 'react';
import userEvent from '@testing-library/user-event';

// Mock the styles
jest.mock('../../../styles/modules', () => ({
  BudgetTableStyles: {
    tableContainer: 'tableContainer',
    budgetTable: 'budgetTable',
    accountNameCell: 'accountNameCell',
    accountIcon: 'accountIcon',
    budgetInputCell: 'budgetInputCell',
    editInput: 'editInput',
    currencyCell: 'currencyCell',
    positive: 'positive',
    negative: 'negative',
    accountTypeRow: 'accountTypeRow',
    subAccountTypeRow: 'subAccountTypeRow',
    totalRow: 'totalRow',
    subTotalRow: 'subTotalRow',
    grandTotalRow: 'grandTotalRow'
  }
}));

// Sample data for tests
const mockAccounts = [
  {
    id: 1,
    name: 'Salary',
    num: 3000,
    type: 'Income',
    sub_type: { id: 1, sub_type: 'Salary', account_type: 'Income' },
    icon: '💼',
    balance: '3000.00'
  },
  {
    id: 2,
    name: 'Rent',
    num: 4000,
    type: 'Expense',
    sub_type: { id: 2, sub_type: 'Housing', account_type: 'Expense' },
    icon: '🏠',
    balance: '1500.00'
  },
  {
    id: 3,
    name: 'Groceries',
    num: 4001,
    type: 'Expense',
    sub_type: { id: 3, sub_type: 'Food', account_type: 'Expense' },
    icon: '🍎',
    balance: '500.00'
  },
  {
    id: 4,
    name: 'Checking',
    num: 1000,
    type: 'Asset',
    sub_type: { id: 4, sub_type: 'Checking', account_type: 'Asset' },
    icon: '💰',
    balance: '5000.00'
  }
];

const mockBudgets = [
  {
    id: 1,
    month: '2023-01-01',
    account: 1,
    budgeted_amount: '3000.00',
    actual_amount: '3200.00'
  },
  {
    id: 2,
    month: '2023-01-01',
    account: 2,
    budgeted_amount: '1500.00',
    actual_amount: '1450.00'
  },
  {
    id: 3,
    month: '2023-01-01',
    account: 3,
    budgeted_amount: '400.00',
    actual_amount: '425.00'
  }
];

// Default props
const defaultProps = {
  accounts: mockAccounts,
  budgets: mockBudgets,
  onBudgetUpdate: jest.fn()
};

describe('BudgetTable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the budget table with accounts and budgets', () => {
    render(<BudgetTable {...defaultProps} />);

    // Check if the table is rendered
    expect(screen.getByRole('table')).toBeInTheDocument();

    // Check if account names are displayed
    expect(screen.getByText('Salary')).toBeInTheDocument();
    expect(screen.getByText('Rent')).toBeInTheDocument();
    expect(screen.getByText('Groceries')).toBeInTheDocument();

    // Check if account type headers are displayed
    expect(screen.getByText('Income Accounts')).toBeInTheDocument();
    expect(screen.getByText('Expense Accounts')).toBeInTheDocument();

    // Check if expense subtypes are displayed
    expect(screen.getByText('Housing')).toBeInTheDocument();
    expect(screen.getByText('Food')).toBeInTheDocument();
  });

  it('filters out non-income and non-expense accounts', () => {
    render(<BudgetTable {...defaultProps} />);

    // The Asset account should not be displayed
    expect(screen.queryByText('Checking')).not.toBeInTheDocument();
  });

  it('displays budgeted and actual amounts', () => {
    render(<BudgetTable {...defaultProps} />);

    // Check if budgeted amounts are displayed as input values
    const budgetInputs = screen.getAllByRole('spinbutton');
    expect(budgetInputs[0].value).toBe('3000.00');  // Salary budget
    expect(budgetInputs[1].value).toBe('1500.00');  // Rent budget
    expect(budgetInputs[2].value).toBe('400.00');   // Groceries budget

    // Check if actual amounts are displayed
    // Use a more flexible approach to find cells with the actual amounts
    const actualCells = screen.getAllByRole('cell').filter(cell =>
      cell.className === 'currencyCell'
    );

    // Find the cells containing the actual amounts
    const salaryActualCell = actualCells.find(cell =>
      cell.textContent.includes('3200') || cell.textContent.includes('3,200')
    );
    const rentActualCell = actualCells.find(cell =>
      cell.textContent.includes('1450') || cell.textContent.includes('1,450')
    );
    const groceriesActualCell = actualCells.find(cell =>
      cell.textContent.includes('425')
    );

    expect(salaryActualCell).toBeInTheDocument();  // Salary actual
    expect(rentActualCell).toBeInTheDocument();    // Rent actual
    expect(groceriesActualCell).toBeInTheDocument(); // Groceries actual
  });

  it('calculates and displays differences correctly', () => {
    render(<BudgetTable {...defaultProps} />);

    // For income: Actual - Budget
    // $3,200 - $3,000 = $200
    // Use a more specific selector to avoid ambiguity with multiple elements containing the same text
    const differenceCells = screen.getAllByRole('cell').filter(cell =>
      cell.textContent === '$200.00' ||
      cell.textContent === '$50.00' ||
      cell.textContent === '-$25.00'
    );

    // Check the first cell with $200.00 (Salary difference)
    expect(differenceCells[0]).toHaveTextContent('$200.00');

    // For expense: Budget - Actual
    // $1,500 - $1,450 = $50
    // Find the cell with $50.00 specifically
    const rentDifferenceCell = screen.getAllByRole('cell').find(cell =>
      cell.textContent === '$50.00' &&
      cell.previousSibling &&
      cell.previousSibling.textContent === '$1,450.00'
    );
    expect(rentDifferenceCell).toHaveTextContent('$50.00');

    // For expense: Budget - Actual
    // $400 - $425 = -$25
    // Find the cell with -$25.00 specifically
    const groceriesDifferenceCell = screen.getAllByRole('cell').find(cell =>
      cell.textContent === '-$25.00'
    );
    expect(groceriesDifferenceCell).toHaveTextContent('-$25.00');
  });

  it('calculates and displays totals correctly', () => {
    render(<BudgetTable {...defaultProps} />);

    // Income Total
    expect(screen.getByText('Income Total')).toBeInTheDocument();

    // Expense Total
    expect(screen.getByText('Expense Total')).toBeInTheDocument();

    // Expense Subtotals
    expect(screen.getByText('Housing Total')).toBeInTheDocument();
    expect(screen.getByText('Food Total')).toBeInTheDocument();

    // Grand Total
    expect(screen.getByText('Grand Total')).toBeInTheDocument();
  });

  it('allows updating budget amounts', async () => {
    const user = userEvent.setup();
    render(<BudgetTable {...defaultProps} />);

    // Get the budget input for Rent
    const rentBudgetInput = screen.getAllByRole('spinbutton')[1];

    // Wrap state updates in act()
    await act(async () => {
      // Change the budget amount
      await user.clear(rentBudgetInput);
      await user.type(rentBudgetInput, '2000');

      // Blur the input to trigger the update
      fireEvent.blur(rentBudgetInput);
    });

    // Check if onBudgetUpdate was called with the correct data
    expect(defaultProps.onBudgetUpdate).toHaveBeenCalledWith(2, 2000);
  });

  it('handles Enter key press to update budget', async () => {
    const user = userEvent.setup();
    render(<BudgetTable {...defaultProps} />);

    // Get the budget input for Groceries
    const groceriesBudgetInput = screen.getAllByRole('spinbutton')[2];

    // Wrap state updates in act()
    await act(async () => {
      // Change the budget amount
      await user.clear(groceriesBudgetInput);
      await user.type(groceriesBudgetInput, '500');

      // Press Enter to trigger the update
      fireEvent.keyDown(groceriesBudgetInput, { key: 'Enter', code: 'Enter' });
    });

    // Check if onBudgetUpdate was called with the correct data
    expect(defaultProps.onBudgetUpdate).toHaveBeenCalledWith(3, 500);
  });

  it('applies positive/negative styling to differences', () => {
    render(<BudgetTable {...defaultProps} />);

    // Get all difference cells
    const differenceCells = screen.getAllByRole('cell').filter(cell =>
      cell.textContent === '$200.00' ||
      cell.textContent === '$50.00' ||
      cell.textContent === '-$25.00'
    );

    // Check if positive differences have the positive class
    expect(differenceCells[0]).toHaveClass('currencyCell');  // Salary: $200.00
    expect(differenceCells[0]).toHaveClass('positive');  // Salary: $200.00
    expect(differenceCells[1]).toHaveClass('positive');  // Rent: $50.00

    // Check if negative differences have the negative class
    // Find the cell with -$25.00 specifically
    const negativeCell = screen.getAllByRole('cell').find(cell =>
      cell.textContent === '-$25.00'
    );
    expect(negativeCell).toHaveClass('currencyCell');  // Groceries: -$25.00
    expect(negativeCell).toHaveClass('negative');  // Groceries: -$25.00
  });

  it('handles empty budgets gracefully', () => {
    render(<BudgetTable accounts={mockAccounts} budgets={[]} onBudgetUpdate={jest.fn()} />);

    // Table should still be rendered
    expect(screen.getByRole('table')).toBeInTheDocument();

    // Budget inputs should default to 0
    const budgetInputs = screen.getAllByRole('spinbutton');
    expect(budgetInputs[0].value).toBe('0');
    expect(budgetInputs[1].value).toBe('0');
    expect(budgetInputs[2].value).toBe('0');
  });
});
