FROM node:20-alpine AS builder
WORKDIR /app

# Instala pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copia apenas o package.json e arquivos de lock para aproveitar cache
COPY apps/api/package.json ./
COPY pnpm-lock.yaml ./
COPY apps/api/prisma ./prisma
COPY apps/api/tsconfig.json ./
COPY apps/api/nest-cli.json ./
COPY apps/api/src ./src

RUN pnpm install --frozen-lockfile
RUN pnpm build

FROM node:20-alpine
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./

ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "dist/main.js"]
