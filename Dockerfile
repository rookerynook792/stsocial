# ST SOCIAL — production image
FROM node:20
WORKDIR /app
ENV NODE_ENV=production

# Install production dependencies (express + better-sqlite3)
COPY package*.json ./
RUN npm install --omit=dev

# App source
COPY . .

ENV PORT=3000
EXPOSE 3000

# SQLite lives here. Attach a persistent volume at /data and set DATA_DIR=/data
# (on hosts without volumes, the DB resets each restart — fine for a demo).
VOLUME ["/app/data"]

CMD ["node", "server/index.js"]
