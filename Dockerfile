ARG BASE_IMAGE=nginx:stable-alpine
FROM ${BASE_IMAGE}

COPY --chown=nginx:nginx dist/ /usr/share/nginx/html/
COPY --chown=nginx:nginx deploy/nginx.conf /etc/nginx/nginx.conf

USER nginx
EXPOSE 8080

ENTRYPOINT ["nginx", "-g", "daemon off;"]
