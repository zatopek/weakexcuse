# ---- base ----
FROM node:22-slim AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# ---- deps ----
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/api/package.json apps/api/tsconfig.json apps/api/
COPY packages/db/package.json packages/db/tsconfig.json packages/db/
RUN pnpm install --frozen-lockfile

# ---- build ----
FROM deps AS build
COPY packages/db/src packages/db/src
COPY apps/api/src apps/api/src
RUN pnpm --filter @weakexcuse/db build && pnpm --filter @weakexcuse/api build

# ---- runner ----
FROM base AS runner
ENV NODE_ENV=production
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY packages/db/package.json packages/db/
RUN pnpm install --frozen-lockfile --prod

COPY --from=build /app/packages/db/dist packages/db/dist
COPY --from=build /app/apps/api/dist apps/api/dist

WORKDIR /app/apps/api
EXPOSE 3001
CMD ["node", "dist/server.js"]
