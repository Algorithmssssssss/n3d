FROM node:22-alpine

ENV NODE_ENV=production

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev && npm cache clean --force

COPY . .

EXPOSE 5000

# Run node directly (not via npm) so it receives SIGTERM and `docker stop` is quick.
CMD ["node", "server.js"]
