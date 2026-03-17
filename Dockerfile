FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

COPY . .
RUN npm run build
RUN mkdir -p /app/_web && \
    if [ -d dist ]; then cp -R dist/. /app/_web/; \
    elif [ -d web-build ]; then cp -R web-build/. /app/_web/; \
    else echo "No web output folder found (expected dist or web-build)" && exit 1; fi

FROM nginx:1.27-alpine

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/_web /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
