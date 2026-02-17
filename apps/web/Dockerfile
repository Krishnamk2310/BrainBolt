FROM node:20-alpine

WORKDIR /app

COPY package.json ./
COPY package-lock.json* ./
COPY .npmrc ./

COPY . .

RUN npm install
RUN npm run build --workspaces || true

WORKDIR /app/apps/web

EXPOSE 3000
CMD ["npm", "run", "dev"]


