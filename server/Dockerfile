FROM node:22
ENV NODE_ENV=production
WORKDIR /usr/src/freeauthapi
COPY ["package.json", "./"]
RUN npm i --production
COPY . .
# RUN chown -R node /usr/src/freeauthapi
USER node
CMD ["node", "./dist/server.js"]