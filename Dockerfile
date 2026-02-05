FROM node:20-slim

WORKDIR /app

# Copy and install bot dependencies
COPY bot/package.json bot/package-lock.json* ./
RUN npm ci

# Copy bot source and build
COPY bot/tsconfig.json ./
COPY bot/src ./src
RUN npm run build

# Remove dev dependencies after build
RUN npm prune --production

# Run the bot
ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "start"]
