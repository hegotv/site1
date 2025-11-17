# Dockerfile

# --- STAGE 1: Build (Il "Costruttore") ---
# Usiamo un'immagine Node.js per installare le dipendenze e costruire l'app
FROM node:18-alpine AS builder

# Imposta la cartella di lavoro all'interno del container
WORKDIR /app

# Copia i file di progetto per installare le dipendenze
# Copiamo questi prima per sfruttare la cache di Docker
COPY package.json package-lock.json ./
RUN npm install

# Copia tutto il resto del codice sorgente
COPY . .

# Esegui il comando di build per la produzione
RUN npm run build


# --- STAGE 2: Serve (Il "Server") ---
# Ora usiamo un'immagine Nginx super leggera per servire i file
FROM nginx:stable-alpine

# Copia la nostra configurazione personalizzata di Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia i file compilati dallo stage "builder" nella cartella servita da Nginx
# ATTENZIONE: Assicurati che questo percorso sia corretto per il tuo progetto!
# Di solito è /app/dist/nome-progetto/browser
COPY --from=builder /app/dist/hego_front-main/browser /usr/share/nginx/html

# Nginx ascolta sulla porta 80 per default, quindi non dobbiamo fare altro