# --- STAGE 1: Build ---
FROM node:18-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run build

# --- STAGE 2: Serve with Node (SSR) ---
FROM node:18-alpine

WORKDIR /app

# Copia la cartella dist dalla build
COPY --from=builder /app/dist ./dist
# Copia package.json per sapere come avviare (se serve)
COPY --from=builder /app/package.json ./

# Environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Espone la porta
EXPOSE 8080

# Avvia il server Node creato dalla build Angular SSR
# Verifica il percorso: di solito è dist/nome-progetto/server/server.mjs
CMD ["node", "dist/hego_front-main/server/server.mjs"]