FROM node:20-bookworm

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Generate Prisma client first
RUN npx prisma generate

RUN npm run build

EXPOSE 3006

CMD ["node", "dist/index.js"]
