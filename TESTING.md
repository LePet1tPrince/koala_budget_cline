# Testing Guide for Koala Budget

This document provides an overview of the testing strategy and instructions for running tests in the Koala Budget application.

## Overview

The Koala Budget application has a comprehensive test suite covering both backend (Django) and frontend (React/Next.js) components. The tests are organized as follows:

### Backend Tests

- **Model Tests**: Test the data models and their methods
- **API Endpoint Tests**: Test the REST API endpoints
- **Business Logic Tests**: Test complex business logic like account balance calculations

### Frontend Tests

- **Component Tests**: Test React components
- **Service Tests**: Test API service functions
- **Integration Tests**: Test end-to-end workflows

## Running Backend Tests

The backend tests use Django's built-in test framework. To run the tests:

```bash
# Navigate to the backend directory
cd backend

# Run all tests
python manage.py test

# Run tests for a specific app
python manage.py test accounts
python manage.py test budget

# Run a specific test file
python manage.py test accounts.tests.test_account_model
```

### Test Coverage

To generate a test coverage report for the backend:

```bash
# Install coverage if not already installed
pip install coverage

# Run tests with coverage
coverage run --source='.' manage.py test

# Generate a report
coverage report

# Generate an HTML report
coverage html
```

The HTML report will be available in the `htmlcov` directory.

## Running Frontend Tests

The frontend tests use Jest and React Testing Library. To run the tests:

```bash
# Navigate to the frontend directory
cd frontend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage
```

### Test Structure

The frontend tests are organized in a directory structure that mirrors the source code:

```
frontend/
  ├── tests/
  │   ├── components/
  │   │   ├── transactions/
  │   │   │   └── TransactionTable.test.js
  │   │   └── budget/
  │   │       └── BudgetTable.test.js
  │   └── services/
  │       ├── accountService.test.js
  │       ├── transactionService.test.js
  │       └── budgetService.test.js
```

## Key Test Files

### Backend Tests

- `backend/accounts/tests/test_user_model.py`: Tests for the User model
- `backend/accounts/tests/test_account_model.py`: Tests for the Account model
- `backend/accounts/tests/test_transaction_model.py`: Tests for the Transaction model
- `backend/accounts/tests/test_account_api.py`: Tests for the Account API endpoints
- `backend/accounts/tests/test_transaction_api.py`: Tests for the Transaction API endpoints
- `backend/budget/tests/test_budget_model.py`: Tests for the Budget model
- `backend/budget/tests/test_budget_api.py`: Tests for the Budget API endpoints

### Frontend Tests

- `frontend/tests/components/transactions/TransactionTable.test.js`: Tests for the TransactionTable component
- `frontend/tests/components/budget/BudgetTable.test.js`: Tests for the BudgetTable component
- `frontend/tests/services/accountService.test.js`: Tests for the account service
- `frontend/tests/services/transactionService.test.js`: Tests for the transaction service
- `frontend/tests/services/budgetService.test.js`: Tests for the budget service

## Test Fixtures

The tests use fixtures to set up test data. For example:

- Backend tests create test users, accounts, and transactions in the setUp method
- Frontend tests use mock data objects to simulate API responses

## Mocking

- Backend tests use Django's test client to simulate HTTP requests
- Frontend tests use Jest's mocking capabilities to mock API calls and other dependencies

## Continuous Integration

To integrate these tests into a CI/CD pipeline, you can use the following commands:

```bash
# Backend tests
cd backend && python manage.py test

# Frontend tests
cd frontend && npm test
```

## Adding New Tests

When adding new features, follow these guidelines for adding tests:

1. **Backend**:
   - Add model tests for new models or model methods
   - Add API tests for new endpoints
   - Test both positive and negative cases

2. **Frontend**:
   - Add component tests for new components
   - Add service tests for new API service functions
   - Test user interactions and edge cases

## Test Best Practices

- Keep tests independent and isolated
- Use descriptive test names that explain what is being tested
- Test both success and failure cases
- Mock external dependencies
- Keep test setup code minimal and focused
