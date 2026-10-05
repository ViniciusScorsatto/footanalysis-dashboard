FROM node:22-bookworm-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ ffmpeg ca-certificates \
    libnss3 libdbus-1-3 libatk1.0-0 libgbm1 libasound2 libxrandr2 \
    libxkbcommon0 libxfixes3 libxcomposite1 libxdamage1 libatk-bridge2.0-0 \
    libpango-1.0-0 libcairo2 libcups2 fonts-noto-color-emoji \
    && apt-get clean
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx remotion browser ensure && npm run build:online
# The startup bootstrap owns the mounted volume, then irreversibly drops to
# node (1000:1000) before importing the application or opening any listener.
ENV NODE_ENV=production FOOT_ANALYSIS_ONLINE=1 FOOT_ANALYSIS_DATA_DIR=/data FOOT_ANALYSIS_CONTAINER=1
EXPOSE 8080
CMD ["node", "scripts/online/start.mjs"]
