FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY schema.sql ./
COPY src ./src
COPY scripts ./scripts
COPY assets ./assets

RUN ./scripts/install-tex.sh

ENV NODE_ENV=production
ENV TECTONIC_CACHE_DIR=/opt/tectonic-cache

EXPOSE 5000

CMD ["node", "src/server.js"]
