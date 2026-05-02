FROM node:20-bookworm

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Generate Prisma client first
RUN npm cache clean --force && npm rebuild
RUN node node_modules/.bin/prisma generate

RUN node node_modules/.bin/tsc

COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x entrypoint.sh

EXPOSE 3006

CMD ["sh", "entrypoint.sh"]
