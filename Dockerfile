FROM node:18-bullseye

# Install Playwright dependencies
RUN npx -y playwright install-deps

# Create app directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy application files
COPY . .

# Build the Next.js app
RUN npm run build

# Install Playwright browsers
RUN npx playwright install chromium

# Expose the app port
EXPOSE 3000

# Start the application and the automation server
# Note: In a real GCP setup, we might use PM2 or separate containers
CMD ["npm", "run", "dev"]
