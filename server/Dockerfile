FROM node:lts-alpine
ENV NODE_ENV=production

WORKDIR /usr/src/app
COPY . .
RUN yarn install --production --silent
EXPOSE 8081

CMD ["yarn", "start"]