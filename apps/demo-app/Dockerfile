FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json* ./
COPY apps/demo-app/package.json ./apps/demo-app/
RUN npm install --workspace=@deploy-preview/demo-app

COPY tsconfig.base.json ./
COPY apps/demo-app ./apps/demo-app
RUN npm run build --workspace=@deploy-preview/demo-app

FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache wget

ENV NODE_ENV=production
ENV PORT=3000

COPY package.json package-lock.json* ./
COPY apps/demo-app/package.json ./apps/demo-app/
RUN npm install --workspace=@deploy-preview/demo-app --omit=dev

COPY --from=builder /app/apps/demo-app/dist ./apps/demo-app/dist

USER node
EXPOSE 3000
CMD ["node", "apps/demo-app/dist/index.js"]
