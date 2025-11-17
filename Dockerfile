# --- STAGE 1: Build ---
FROM node:18-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
# Assicurati che il percorso di build sia corretto!
RUN npm run build

# --- STAGE 2: Serve ---
FROM nginx:stable-alpine

# Installa 'envsubst' che ci serve per sostituire le variabili d'ambiente
RUN apk update && apk add gettext

# Copia il NUOVO file template e lo script di avvio
COPY nginx.conf.template /etc/nginx/conf.d/nginx.conf.template
COPY start-nginx.sh /start-nginx.sh

# Rendi lo script di avvio eseguibile
RUN chmod +x /start-nginx.sh

# Copia i file compilati dallo stage "builder"
# VERIFICA QUESTO PERCORSO! Deve corrispondere all'output della tua build
COPY --from=builder /app/dist/hego_front-main/browser /usr/share/nginx/html

# Diciamo a Docker di eseguire il nostro script personalizzato all'avvio del container
CMD ["/start-nginx.sh"]