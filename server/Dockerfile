FROM node:22
ENV NODE_ENV=production
WORKDIR /usr/src/freeauthapi
COPY package*.json ./

# build
RUN npm i --production
COPY . .
# RUN chown -R node /usr/src/freeauthapi

# execute
CMD ["npm", "start", "./src/server.ts"]