FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package.json ./
RUN npm install

# Copy project files
COPY . .

# Build the app
RUN npm run build

# Expose the port the app runs on
EXPOSE 3000

# Command to run when container starts
CMD ["npm", "run", "dev"]
