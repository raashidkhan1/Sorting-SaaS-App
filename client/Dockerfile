FROM node:lts-alpine AS build
WORKDIR /app
ENV PATH /app/node_modules/.bin:$PATH
COPY ["package.json", "yarn-lock.json*", "./"]
RUN yarn install --silent
COPY . .
RUN yarn build

# production environment
FROM nginx:1.16.0-alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]