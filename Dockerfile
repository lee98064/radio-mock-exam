# syntax=docker/dockerfile:1.6

## Build stage: install dependencies and compile the Vite app
FROM node:20-alpine AS build
WORKDIR /app

# Install dependencies with layer caching
COPY package*.json ./
RUN npm install

# Copy source and build
COPY . .
RUN npm run build

## Runtime stage: serve static assets with nginx
FROM nginx:alpine AS runtime
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
