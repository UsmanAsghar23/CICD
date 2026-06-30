FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json* ./
COPY apps/dashboard/package.json ./apps/dashboard/
RUN npm install --workspace=@deploy-preview/dashboard

COPY tsconfig.base.json ./
COPY apps/dashboard ./apps/dashboard

ARG VITE_API_URL=http://localhost:3001
ARG VITE_AWS_REGION=
ARG VITE_CLOUDWATCH_LOG_GROUP=
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_AWS_REGION=$VITE_AWS_REGION
ENV VITE_CLOUDWATCH_LOG_GROUP=$VITE_CLOUDWATCH_LOG_GROUP
RUN npm run build --workspace=@deploy-preview/dashboard

FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache wget

COPY package.json package-lock.json* ./
COPY apps/dashboard/package.json ./apps/dashboard/
RUN npm install --workspace=@deploy-preview/dashboard --omit=dev

COPY --from=builder /app/apps/dashboard/dist ./apps/dashboard/dist
COPY apps/dashboard/vite.config.ts ./apps/dashboard/
COPY apps/dashboard/index.html ./apps/dashboard/

USER node
EXPOSE 5173
CMD ["npm", "run", "preview", "--workspace=@deploy-preview/dashboard"]
