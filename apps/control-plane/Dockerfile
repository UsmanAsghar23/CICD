FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json* ./
COPY apps/control-plane/package.json ./apps/control-plane/
RUN npm install --workspace=@deploy-preview/control-plane

COPY tsconfig.base.json ./
COPY apps/control-plane ./apps/control-plane
RUN npm run build --workspace=@deploy-preview/control-plane

FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache wget

ENV NODE_ENV=production
ENV PORT=3001

COPY package.json package-lock.json* ./
COPY apps/control-plane/package.json ./apps/control-plane/
RUN npm install --workspace=@deploy-preview/control-plane --omit=dev

COPY --from=builder /app/apps/control-plane/dist ./apps/control-plane/dist

USER node
EXPOSE 3001
CMD ["node", "apps/control-plane/dist/index.js"]
