# ✅ Use Puppeteer's preconfigured Chrome image
FROM ghcr.io/puppeteer/puppeteer:24.26.1

# ✅ Environment setup so Puppeteer uses the preinstalled Chrome
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable \
    NODE_ENV=production

# ✅ Set working directory
WORKDIR /usr/src/app

# ✅ Copy package files first (for better caching)
COPY package*.json ./

# ✅ Install only production deps
RUN npm ci --only=production

# ✅ Copy the rest of the code
COPY . .

# ✅ Start your app (change if your entry file is different)
CMD ["node", "server.js"]
