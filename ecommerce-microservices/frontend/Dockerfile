# Build stage
FROM node:18-alpine as build

WORKDIR /app

COPY package.json yarn.lock* ./
RUN yarn install --frozen-lockfile

COPY . .
RUN yarn build

# Production stage
FROM nginx:alpine

# Copy custom nginx config
COPY --from=build /app/build /usr/share/nginx/html

# Nginx configuration for SPA and API proxying
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    index index.html; \
    \
    # Handle React Router (SPA) \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    \
    # Proxy API requests to backend services \
    location /api/users { \
        proxy_pass http://user-service:8000; \
        proxy_http_version 1.1; \
        proxy_set_header Upgrade $http_upgrade; \
        proxy_set_header Connection "upgrade"; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
        rewrite ^/api/users(.*)$ $1 break; \
    } \
    \
    location /api/products { \
        proxy_pass http://product-service:8000; \
        proxy_http_version 1.1; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
        rewrite ^/api/products(.*)$ $1 break; \
    } \
    \
    location /api/cart { \
        proxy_pass http://cart-service:8000; \
        proxy_http_version 1.1; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
        rewrite ^/api/cart(.*)$ $1 break; \
    } \
    \
    location /api/orders { \
        proxy_pass http://order-service:8000; \
        proxy_http_version 1.1; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
        rewrite ^/api/orders(.*)$ $1 break; \
    } \
    \
    location /api/payments { \
        proxy_pass http://payment-service:8000; \
        proxy_http_version 1.1; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
        rewrite ^/api/payments(.*)$ $1 break; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
