FROM node:20-bookworm

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

# Generate Prisma client first
RUN npx prisma generate

RUN npm run build

EXPOSE 3002

CMD ["node", "dist/index.js"]
