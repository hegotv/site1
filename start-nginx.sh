#!/bin/sh

# Questo comando legge il file template, sostituisce la variabile ${PORT}
# con il valore reale fornito da Railway, e salva il risultato nel file di
# configurazione effettivo che Nginx userà.
envsubst '$PORT' < /etc/nginx/conf.d/nginx.conf.template > /etc/nginx/conf.d/default.conf

# Avvia Nginx in primo piano. L'opzione -g 'daemon off;' è fondamentale
# per far sì che il container Docker rimanga in esecuzione.
nginx -g 'daemon off;'