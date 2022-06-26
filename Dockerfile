# web-frontend
FROM node:16 AS ui-build
WORKDIR /usr/src/app
ENV PATH /app/node_modules/.bin:$PATH
COPY client/ ./client
RUN cd client && yarn install && yarn build


# web-backend
FROM node:16 AS server-build
ENV NODE_ENV=production

WORKDIR /root/
COPY --from=ui-build /usr/src/app/client/build ./client/build
COPY server/ ./server
RUN cd server && yarn install

EXPOSE 80

CMD ["node", "./server/index.js"]