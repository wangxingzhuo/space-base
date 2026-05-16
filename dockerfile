# FROM node:lts-slim

# RUN sed -i 's|http://deb.debian.org|http://mirrors.aliyun.com|g' /etc/apt/sources.list.d/debian.sources && \
#     apt-get update && apt-get -y upgrade && \
#     apt-get install -y --no-install-recommends pgp cron ffmpeg && apt-get install -y curl && \
#     curl -fsSL https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor -o /etc/apt/trusted.gpg.d/microsoft-edge.gpg && \
#     echo 'deb [arch=amd64] https://packages.microsoft.com/repos/edge stable main' > /etc/apt/sources.list.d/microsoft-edge.list && \
#     apt-get update && apt-get install -y --no-install-recommends microsoft-edge-stable && \
#     apt-get -y autoremove --purge pgp curl && apt-get -y clean && rm -rf /var/lib/apt/lists/* && \
#     npm i -g pnpm

FROM node-cron-edge
WORKDIR /home/app
EXPOSE 80
VOLUME /var/log/app
COPY ./crontab /etc/
COPY ./@watsonserve/stock-node/dist /home/app
RUN pnpm i && pnpm run setup && apt-get -y autoremove --purge && apt-get -y clean && rm -rf /var/lib/apt/lists/*
CMD ["bash", "-c", "/etc/init.d/cron start && node /home/app/srv.js 80"]
