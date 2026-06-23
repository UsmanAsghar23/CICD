FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json* ./
COPY apps/control-plane/package.json ./apps/control-plane/
RUN npm ci --workspace=@deploy-preview/control-plane

COPY tsconfig.base.json ./
COPY apps/control-plane ./apps/control-plane
RUN npm run build --workspace=@deploy-preview/control-plane

FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache wget \
  && addgroup -g 1001 -S nodejs \
  && adduser -S nodejs -u 1001 -G nodejs

ENV NODE_ENV=production
ENV PORT=3001

COPY package.json package-lock.json* ./
COPY apps/control-plane/package.json ./apps/control-plane/
RUN npm ci --workspace=@deploy-preview/control-plane --omit=dev

COPY --from=builder /app/apps/control-plane/dist ./apps/control-plane/dist

USER nodejs
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3001/health || exit 1

CMD ["node", "apps/control-plane/dist/index.js"]
