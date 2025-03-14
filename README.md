# Koala Budget

Koala Budget is a comprehensive personal finance management application that helps users track their finances, plan budgets, and visualize their financial growth. Built with a modern tech stack including Django, Next.js, and PostgreSQL, it provides a robust platform for managing your financial life.

## Features

- **User Authentication**: Secure email-based authentication system
- **Financial Account Management**: Create and manage different types of financial accounts
- **Transaction Tracking**: Record financial transactions with double-entry accounting
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

### Frontend
- Next.js
- React
- Axios (for API requests)

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
   ```

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

## Development

### Running in Development Mode
```bash
docker-compose up

docker-compose run --rm backend sh -c "python manage.py makemigrations"
```

### Running Tests
```bash
# Backend tests
docker-compose run --rm backend sh -c "python manage.py test"

# Frontend tests
docker-compose run --rm frontend sh -c "npm test"
```

For more detailed information about testing, see the [TESTING.md](TESTING.md) file.

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

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
