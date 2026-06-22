FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json* ./
COPY apps/demo-app/package.json ./apps/demo-app/
RUN npm ci --workspace=@deploy-preview/demo-app

COPY tsconfig.base.json ./
COPY apps/demo-app ./apps/demo-app
RUN npm run build --workspace=@deploy-preview/demo-app

FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache wget \
  && addgroup -g 1001 -S nodejs \
  && adduser -S nodejs -u 1001 -G nodejs

ENV NODE_ENV=production
ENV PORT=3000

ARG BUILD_TIME
ENV BUILD_TIME=${BUILD_TIME}

COPY package.json package-lock.json* ./
COPY apps/demo-app/package.json ./apps/demo-app/
RUN npm ci --workspace=@deploy-preview/demo-app --omit=dev

COPY --from=builder /app/apps/demo-app/dist ./apps/demo-app/dist

USER nodejs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "apps/demo-app/dist/index.js"]
