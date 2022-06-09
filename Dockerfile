FROM node:lts-alpine
ENV NODE_ENV=production
WORKDIR /app/client
COPY ["client/package.json", "client/yarn-lock.json*", "./"]
COPY ["client/public", "./public"]

WORKDIR /app/server
COPY ["server/package.json", "server/yarn-lock.json*", "./"]

WORKDIR /app
COPY . .
RUN yarn install --production --silent
RUN yarn build-frontend
EXPOSE 8081
RUN chown -R node /app
USER node
CMD ["yarn", "start"]
