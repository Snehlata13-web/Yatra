FROM node:22-bookworm-slim

ENV NODE_ENV=production \
    PORT=3000 \
    LOG_DIR=/app/logs

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev \
    && mkdir -p /app/logs \
    && chown -R node:node /app

COPY --chown=node:node src ./src

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:3000/health').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "src/app.js"]
