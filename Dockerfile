FROM node:22-trixie-slim@sha256:b26b04c123d9ff8ab646ceb18b9d75a1173acf64b9a401094b906d27b29338d4 AS build
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ ca-certificates \
    && apt-get clean && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci && npx remotion browser ensure
COPY . .
RUN npm run build:online \
    && node --input-type=module -e 'import {build} from "esbuild"; await build({entryPoints:["tests/online-fixtures.ts"],bundle:true,platform:"node",format:"esm",outfile:"build/test-fixtures.mjs"});'

FROM build AS runtime-deps
RUN npm prune --omit=dev --ignore-scripts && rm -rf /app/node_modules/.remotion

FROM node:22-trixie-slim@sha256:b26b04c123d9ff8ab646ceb18b9d75a1173acf64b9a401094b906d27b29338d4 AS runtime
WORKDIR /app
RUN apt-get update && apt-get upgrade -y --no-install-recommends \
    && apt-get install -y --no-install-recommends \
    ffmpeg ca-certificates \
    libnss3 libdbus-1-3 libatk1.0-0 libgbm1 libasound2 libxrandr2 \
    libxkbcommon0 libxfixes3 libxcomposite1 libxdamage1 libatk-bridge2.0-0 \
    libpango-1.0-0 libcairo2 libcups2 fonts-noto-color-emoji \
    && apt-get clean && rm -rf /var/lib/apt/lists/*
# Runtime starts Node directly; package managers are only needed in build stages.
RUN rm -rf /usr/local/lib/node_modules/npm /opt/yarn-v1.22.22 \
    && rm -f /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/yarn /usr/local/bin/yarnpkg
COPY --from=runtime-deps /app/node_modules ./node_modules
# Preserve the exact browser downloaded by the locked Remotion CLI.
COPY --from=build /app/node_modules/.remotion ./node_modules/.remotion
COPY package.json package-lock.json ./
COPY --from=build /app/build/online ./build/online
COPY scripts/dashboard-server.mjs ./scripts/dashboard-server.mjs
COPY scripts/lib ./scripts/lib
COPY scripts/online ./scripts/online
COPY dashboard ./dashboard
COPY config ./config
COPY public ./public
COPY src/data/history ./src/data/history
# The startup bootstrap owns the mounted volume, then irreversibly drops to
# node (1000:1000) before importing the application or opening any listener.
ENV NODE_ENV=production FOOT_ANALYSIS_ONLINE=1 FOOT_ANALYSIS_DATA_DIR=/data FOOT_ANALYSIS_CONTAINER=1
EXPOSE 8080
CMD ["node", "scripts/online/start.mjs"]

# Fixtures/tests are never copied to the production target.
FROM runtime AS validation
COPY tests ./tests
COPY --from=build /app/build/test-fixtures.mjs ./build/test-fixtures.mjs
ENV FOOT_ANALYSIS_TEST_FIXTURES=/app/build/test-fixtures.mjs

FROM runtime AS production
