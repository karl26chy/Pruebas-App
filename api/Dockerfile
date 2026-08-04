FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY schema.sql ./
COPY db.json ./
COPY src ./src
COPY scripts ./scripts

ENV NODE_ENV=production

EXPOSE 5000

CMD ["sh", "-c", "node scripts/setup.js && node src/index.js"]
