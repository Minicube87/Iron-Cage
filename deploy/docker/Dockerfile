FROM nginx:alpine
COPY deploy/docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY apps/game/ /usr/share/nginx/html/
EXPOSE 80
