# Multi-stage build for React frontend + Flask backend
FROM node:18-alpine AS frontend-build

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY src/ ./src/
COPY index.html ./
COPY vite.config.js ./

# Build the React app
RUN npm run build

# Python stage
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the Flask server
COPY server.py .

# Copy the built React app from the frontend stage
COPY --from=frontend-build /app/dist ./dist

# Create a non-root user
RUN useradd -m -u 1000 user
USER user

# Expose port 7860 (Hugging Face Spaces default)
EXPOSE 7860

# Start the Flask server
CMD ["python", "server.py"]
