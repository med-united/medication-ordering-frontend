# nginx state for serving content
FROM nginx:alpine
# Copy static assets over
COPY dist /usr/share/nginx/html
COPY dist/Component-preload.js /usr/share/nginx/html/medunited/care/
