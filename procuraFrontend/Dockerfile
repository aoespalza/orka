FROM node:20-alpine as build
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
ARG VITE_API_URL=/api
RUN echo "VITE_API_URL=$VITE_API_URL" > .env.production && chmod +x node_modules/.bin/vite && chmod +x node_modules/vite/bin/vite.js && npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
