#version alpine = linux tres leger
FROM nginx:alpine

#dl openssl pr generer des cles de chiffrement
RUN apk update && apk add --no-cache openssl

#dossier pr ranger les certificats
RUN mkdir -p /etc/nginx/ssl

#exec openssl genere .key/.crt
RUN openssl req -x509 -nodes -out /etc/nginx/ssl/pong.crt -keyout /etc/nginx/ssl/pong.key -subj "/C=FR/ST=Normandie/L=LeHavre/O=42/OU=42/CN=localhost/UID=anis"

COPY nginx.conf /etc/nginx/nginx.conf