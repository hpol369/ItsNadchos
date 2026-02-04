FROM node:20-slim

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Copy source and build
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Run the bot
ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "start"]
