# ✅ Puppeteer base image (Chromium included)
FROM ghcr.io/puppeteer/puppeteer:24.26.1

# Switch to root for install
USER root

# Environment setup
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false \
    NODE_ENV=production

WORKDIR /usr/src/app

# Copy dependency files
COPY package*.json ./

# Install dependencies (use ci if lockfile exists)
RUN npm install --omit=dev

# Copy app files
COPY . .

# Set ownership back to non-root
RUN chown -R pptruser:pptruser /usr/src/app

# Switch to safe user
USER pptruser

# Expose your backend port
EXPOSE 8000

# Start the server
CMD ["node", "server.js"]
