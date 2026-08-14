FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY apps/web/package.json ./
COPY pnpm-lock.yaml ./
COPY apps/web/tsconfig.json ./
COPY apps/web/vite.config.ts ./
COPY apps/web/src ./src
COPY apps/web/public ./public

RUN pnpm install --frozen-lockfile
RUN pnpm build

FROM nginx:stable-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
