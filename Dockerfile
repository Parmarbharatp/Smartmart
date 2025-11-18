# Use Node.js LTS version
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy backend package files relative to the Dockerfile
COPY backend/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy backend source code
COPY backend/ ./

# NOTE: The uploads/ directory created here is ephemeral.
# Use Cloud Storage for persistent files.
RUN mkdir -p uploads/temp

# The application must listen on the port provided by the PORT env var.
# This EXPOSE line is mostly for documentation/local testing.
EXPOSE 5000

# Set environment to production
ENV NODE_ENV=production

# Start the application
CMD ["npm", "start"]