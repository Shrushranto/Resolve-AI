FROM node:20-alpine AS builder

WORKDIR /app
ENV NODE_OPTIONS="--dns-result-order=ipv4first"
COPY package.json ./
RUN npm install --no-audit --no-fund
COPY . .

ARG VITE_API_URL=http://localhost:8000
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
