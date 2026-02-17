FROM node:20-alpine

WORKDIR /app

# Copy root workspace config
COPY package.json ./
COPY package-lock.json* ./
COPY .npmrc ./

# Copy full repo
COPY . .

# Install ALL workspace deps
RUN npm install

# Build shared packages first
RUN npm run build --workspaces || true

WORKDIR /app/apps/api

EXPOSE 3001
CMD ["npm", "run", "dev"]
