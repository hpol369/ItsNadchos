FROM node:20-slim

WORKDIR /app

# Install all dependencies (including dev for build)
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source and build
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Remove dev dependencies after build
RUN npm prune --production

# Run the bot
ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "start"]
