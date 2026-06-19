FROM node:20-alpine

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY db.json .

EXPOSE 5000
CMD ["npx", "json-server", "--watch", "db.json", "--port", "5000", "--host", "0.0.0.0"]
