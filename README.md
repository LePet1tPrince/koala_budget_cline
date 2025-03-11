# Koala Budget

Koala Budget is a comprehensive personal finance management application that helps users track their finances, plan budgets, and visualize their financial growth. Built with a modern tech stack including Django, Next.js, and PostgreSQL, it provides a robust platform for managing your financial life.

## Features

- **User Authentication**: Secure email-based authentication system
- **Financial Account Management**: Create and manage different types of financial accounts
- **Transaction Tracking**: Record financial transactions with double-entry accounting
- **Bank Integration**: Connect to your bank accounts via Plaid to automatically import transactions
- **Budget Planning**: Create and manage budgets for different spending categories
- **Financial Visualization**: View your financial progress with charts and reports
- **Responsive Design**: Works on desktop and mobile devices

## Technology Stack

### Backend
- Django 4.1.x
- Django REST Framework
- PostgreSQL
- Celery (for background tasks)
- Redis (for caching and message broker)
- JWT Authentication
- Plaid API (for bank account integration)

### Frontend
- Next.js
- React
- Axios (for API requests)
- React Plaid Link (for bank account integration)

### Infrastructure
- Docker & Docker Compose
- Nginx (as reverse proxy)
- Gunicorn (for production deployment)

## Architecture

Koala Budget follows a microservices architecture with containerized services:

- **Frontend**: Next.js application serving the user interface
- **Backend**: Django REST API providing data and business logic
- **Database**: PostgreSQL for data persistence
- **Cache/Message Broker**: Redis for caching and Celery task queue
- **Reverse Proxy**: Nginx for routing requests and serving static files
- **Background Workers**: Celery workers for asynchronous tasks

## Installation & Setup

### Prerequisites
- Docker and Docker Compose
- Git

### Installation Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/koala-budget.git
   cd koala-budget
   ```

2. Create a `.env` file in the root directory with the following variables:
   ```
   DJANGO_SECRET_KEY=your_secret_key_here
   PLAID_CLIENT_ID=your_plaid_client_id
   PLAID_SECRET=your_plaid_secret
   ```

   You can obtain Plaid API credentials by signing up at [https://plaid.com/](https://plaid.com/)

3. Build and start the containers:
   ```bash
   docker-compose up -d
   ```

4. The application should now be running at:
   - Frontend: http://localhost
   - Backend API: http://localhost/api
   - Admin interface: http://localhost/admin

## Usage

### Creating an Account
1. Navigate to http://localhost
2. Click on "Sign Up" and fill in the registration form
3. Log in with your new credentials

### Managing Accounts
1. After logging in, navigate to the Accounts section
2. Add your financial accounts (checking, savings, credit cards, etc.)
3. Set initial balances

### Recording Transactions
1. Navigate to the Transactions section
2. Click "Add Transaction" to record income or expenses
3. Select the appropriate accounts for the transaction

### Connecting to Bank Accounts
1. Navigate to the Transactions section
2. Select a bank feed account from the list
3. Click "Connect to Bank" to link your bank account
4. Follow the prompts to authenticate with your bank
5. Your transactions will be automatically imported and updated daily

## Development

### Running in Development Mode
```bash
docker-compose up
```

### Running Tests
```bash
docker-compose exec backend python manage.py test
```

### Code Style
- Backend: PEP 8
- Frontend: ESLint with Next.js configuration

## API Documentation

The API documentation is available at http://localhost/api/docs/ when the application is running.

Key endpoints:
- `/api/token/` - Get authentication token
- `/api/users/` - User management
- `/api/accounts/` - Account management
- `/api/transactions/` - Transaction management
- `/api/plaid/create_link_token/` - Create a Plaid Link token
- `/api/plaid/exchange_public_token/` - Exchange a Plaid public token for an access token
- `/api/plaid/sync_transactions/` - Sync transactions from Plaid
- `/api/plaid/items/` - Manage Plaid connections

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
