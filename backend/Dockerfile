FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache openssl openssl-dev libc6-compat

COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
RUN npx tsc -p tsconfig.json

FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache openssl openssl-dev libc6-compat

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./

RUN npx prisma generate

EXPOSE 3001
CMD ["node", "dist/main"]