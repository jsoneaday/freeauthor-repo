FROM node:22
ENV NODE_ENV=production
WORKDIR /usr/src/freeauth
COPY ["package.json", "./"]
RUN npm i --production
COPY . .
RUN chown -R node /usr/src/freeauth
USER node
CMD ["node", "./dist/server.js"]