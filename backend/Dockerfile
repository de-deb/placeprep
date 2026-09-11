FROM node:22-alpine AS base
# Prisma engines need OpenSSL on Alpine
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN npx prisma generate
RUN npm run build
EXPOSE 5000
CMD ["sh", "-c", "npx prisma migrate deploy && npm run seed && node dist/src/index.js"]
