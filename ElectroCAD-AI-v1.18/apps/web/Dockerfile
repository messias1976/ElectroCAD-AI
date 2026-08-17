FROM node:24-alpine AS builder

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json

RUN pnpm install --frozen-lockfile

COPY apps/web/tsconfig.json ./apps/web/tsconfig.json
COPY apps/web/tsconfig.app.json ./apps/web/tsconfig.app.json
COPY apps/web/tsconfig.node.json ./apps/web/tsconfig.node.json
COPY apps/web/vite.config.ts ./apps/web/vite.config.ts
COPY apps/web/index.html ./apps/web/index.html
COPY apps/web/src ./apps/web/src
COPY apps/web/public ./apps/web/public

RUN pnpm --filter web run build

FROM nginx:stable-alpine

COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]