FROM node:14.16.0-alpine as build
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm i
COPY . .
ARG SNOWPACK_PUBLIC_API_ID
ARG SNOWPACK_PUBLIC_API_HASH
RUN npm run build

FROM nginx
COPY --from=build /usr/src/app/build /usr/share/nginx/html
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
