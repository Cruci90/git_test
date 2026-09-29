FROM node:22-alpine
WORKDIR /app
COPY package.json relay.mjs ./
ENV PORT=8787 DATA_DIR=/data
RUN mkdir -p /data && chown node:node /data
VOLUME /data
EXPOSE 8787
USER node
CMD ["node", "relay.mjs"]
