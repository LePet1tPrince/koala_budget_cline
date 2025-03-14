import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import React from 'react';
import TransactionTable from '../../../components/transactions/TransactionTable';
import { bulkUpdateTransactions } from '../../../services/transactionService';
import { getAccountById } from '../../../services/accountService';
import userEvent from '@testing-library/user-event';

// Mock the services
jest.mock('../../../services/transactionService', () => ({
  bulkUpdateTransactions: jest.fn(),
}));

jest.mock('../../../services/accountService', () => ({
  getAccountById: jest.fn(),
}));

// Mock the styles
jest.mock('../../../styles/modules', () => ({
  ButtonStyles: {
    button: 'button',
    primaryButton: 'primaryButton',
    secondaryButton: 'secondaryButton'
  },
  FormStyles: {},
  TransactionTableStyles: {
    tableContainer: 'tableContainer',
    noTransactions: 'noTransactions',
    transactionsTable: 'transactionsTable',
    accountNameCell: 'accountNameCell',
    accountIcon: 'accountIcon',
    budgetInputCell: 'budgetInputCell',
    editInput: 'editInput',
    currencyCell: 'currencyCell',
    positive: 'positive',
    negative: 'negative',
  },
  ModalStyles: {
    modalBody: 'modalBody',
    modalActions: 'modalActions',
    reconcileDetails: 'reconcileDetails',
    reconcileRow: 'reconcileRow',
    newBalance: 'newBalance',
    amount: 'amount',
    cancelButton: 'cancelButton',
    confirmButton: 'confirmButton'
  }
}));

// Sample data for tests
const mockTransactions = [
  {
    id: 1,
    date: '2023-01-01',
    amount: '1000.00',
    debit: 1,
    credit: 2,
    notes: 'Salary deposit',
    status: 'review',
    is_reconciled: false,
    updated: '2023-01-01T12:00:00Z'
  },
  {
    id: 2,
    date: '2023-01-05',
    amount: '500.00',
    debit: 3,
    credit: 1,
    notes: 'Rent payment',
    status: 'categorized',
    is_reconciled: false,
    updated: '2023-01-05T12:00:00Z'
  }
];

const mockAccounts = [
  {
    id: 1,
    name: 'Checking Account',
    num: 1000,
    type: 'Asset',
    icon: '💰',
    balance: '2000.00',
    reconciled_balance: '1500.00'
  },
  {
    id: 2,
    name: 'Salary',
    num: 2000,
    type: 'Income',
    icon: '💼',
    balance: '3000.00',
    reconciled_balance: '3000.00'
  },
  {
    id: 3,
    name: 'Rent',
    num: 3000,
    type: 'Expense',
    icon: '🏠',
    balance: '1500.00',
    reconciled_balance: '1000.00'
  }
];

// Default props
const defaultProps = {
  transactions: mockTransactions,
  accounts: mockAccounts,
  selectedAccountId: 1,
  sortField: 'date',
  sortDirection: 'desc',
  onSort: jest.fn(),
  onUpdate: jest.fn(),
  onDelete: jest.fn(),
  onUpdateStatus: jest.fn(),
  onRefresh: jest.fn()
};

describe('TransactionTable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the transaction table with transactions', () => {
    render(<TransactionTable {...defaultProps} />);

    // Check if the table is rendered
    expect(screen.getByRole('table')).toBeInTheDocument();

    // Check if transactions are displayed
    expect(screen.getByText('Salary deposit')).toBeInTheDocument();
    expect(screen.getByText('Rent payment')).toBeInTheDocument();
  });

  it('displays a message when no transactions are available', () => {
    render(<TransactionTable {...defaultProps} transactions={[]} />);

    expect(screen.getByText('No transactions found for this account.')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('allows selecting transactions', async () => {
    const user = userEvent.setup();
    render(<TransactionTable {...defaultProps} />);

    // Find the checkboxes
    const checkboxes = screen.getAllByRole('checkbox');

    // Select the first transaction
    await user.click(checkboxes[1]); // First checkbox is the "select all" checkbox

    // Check if the bulk actions bar is displayed
    expect(screen.getByText('1 transaction selected')).toBeInTheDocument();
  });

  it('allows selecting all transactions', async () => {
    const user = userEvent.setup();
    render(<TransactionTable {...defaultProps} />);

    // Find the "select all" checkbox
    const selectAllCheckbox = screen.getAllByRole('checkbox')[0];

    // Select all transactions
    await user.click(selectAllCheckbox);

    // Check if the bulk actions bar is displayed
    expect(screen.getByText('2 transactions selected')).toBeInTheDocument();
  });

  it('allows editing a transaction', async () => {
    const user = userEvent.setup();
    render(<TransactionTable {...defaultProps} />);

    // Click on a transaction row to edit it
    const transactionRow = screen.getByText('Salary deposit').closest('tr');
    await user.click(transactionRow);

    // Check if the edit form is displayed
    const notesInput = screen.getByDisplayValue('Salary deposit');
    expect(notesInput).toBeInTheDocument();

    // Edit the notes field
    await user.clear(notesInput);
    await user.type(notesInput, 'Updated salary deposit');

    // Save the changes
    const saveButton = screen.getByText('Save');
    await user.click(saveButton);

    // Check if onUpdate was called with the correct data
    expect(defaultProps.onUpdate).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        notes: 'Updated salary deposit'
      })
    );
  });

  it('allows canceling transaction editing', async () => {
    const user = userEvent.setup();
    render(<TransactionTable {...defaultProps} />);

    // Click on a transaction row to edit it
    const transactionRow = screen.getByText('Salary deposit').closest('tr');
    await user.click(transactionRow);

    // Check if the edit form is displayed
    const notesInput = screen.getByDisplayValue('Salary deposit');
    expect(notesInput).toBeInTheDocument();

    // Cancel the editing
    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    // Check if the edit form is no longer displayed
    expect(screen.queryByDisplayValue('Salary deposit')).not.toBeInTheDocument();
  });

  it('allows bulk editing transactions', async () => {
    const user = userEvent.setup();
    bulkUpdateTransactions.mockResolvedValue({ detail: 'Successfully updated 2 transactions' });

    render(<TransactionTable {...defaultProps} />);

    // Select all transactions
    const selectAllCheckbox = screen.getAllByRole('checkbox')[0];
    await user.click(selectAllCheckbox);

    // Click the bulk edit button
    const bulkEditButton = screen.getByText('Edit');
    await user.click(bulkEditButton);

    // Check if the bulk edit modal is displayed
    expect(screen.getByText('Bulk Edit Transactions')).toBeInTheDocument();

    // Enter notes for bulk update
    const notesInput = screen.getByLabelText('Notes:');
    await user.type(notesInput, 'Bulk updated notes');

    // Submit the form
    const submitButton = screen.getByText('Update Transactions');
    await user.click(submitButton);

    // Check if bulkUpdateTransactions was called with the correct data
    expect(bulkUpdateTransactions).toHaveBeenCalledWith(
      [1, 2],
      { notes: 'Bulk updated notes' },
      1
    );

    // Check if onRefresh was called
    await waitFor(() => {
      expect(defaultProps.onRefresh).toHaveBeenCalled();
    });
  });

  it('allows bulk updating transaction status', async () => {
    const user = userEvent.setup();
    render(<TransactionTable {...defaultProps} />);

    // Select all transactions
    const selectAllCheckbox = screen.getAllByRole('checkbox')[0];
    await user.click(selectAllCheckbox);

    // Open the status dropdown
    const statusButton = screen.getByText('Status');
    await user.click(statusButton);

    // Select "Categorized" status
    const categorizedOption = screen.getByText('Categorized');
    await user.click(categorizedOption);

    // Check if onUpdateStatus was called for each transaction
    expect(defaultProps.onUpdateStatus).toHaveBeenCalledWith(1, 'categorized');
    expect(defaultProps.onUpdateStatus).toHaveBeenCalledWith(2, 'categorized');
  });

  it('shows reconciliation confirmation when reconciling transactions', async () => {
    const user = userEvent.setup();
    getAccountById.mockResolvedValue({
      id: 1,
      name: 'Checking Account',
      reconciled_balance: '1500.00'
    });

    render(<TransactionTable {...defaultProps} />);

    // Select all transactions
    const selectAllCheckbox = screen.getAllByRole('checkbox')[0];
    await user.click(selectAllCheckbox);

    // Open the status dropdown
    const statusButton = screen.getByText('Status');
    await user.click(statusButton);

    // Select "Reconciled" status
    const reconciledOption = screen.getByText('Reconciled');
    await user.click(reconciledOption);

    // Check if the reconciliation confirmation modal is displayed
    await waitFor(() => {
      expect(screen.getByText('Confirm Reconciliation')).toBeInTheDocument();
    });

    // Confirm reconciliation
    const confirmButton = screen.getByText('Confirm');
    await user.click(confirmButton);

    // Check if onUpdateStatus was called for each transaction
    expect(defaultProps.onUpdateStatus).toHaveBeenCalledWith(1, 'reconciled');
    expect(defaultProps.onUpdateStatus).toHaveBeenCalledWith(2, 'reconciled');
  });

  it('allows sorting transactions', async () => {
    const user = userEvent.setup();
    render(<TransactionTable {...defaultProps} />);

    // Click on the date header to sort
    const dateHeader = screen.getByText('Date');
    await user.click(dateHeader);

    // Check if onSort was called with the correct parameters
    expect(defaultProps.onSort).toHaveBeenCalledWith('date', 'asc');
  });
});
