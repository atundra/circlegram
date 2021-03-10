FROM node:14.16.0-alpine as build
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm i --unsafe-perm
COPY . .
ARG SNOWPACK_PUBLIC_API_ID
ARG SNOWPACK_PUBLIC_API_HASH
RUN SNOWPACK_PUBLIC_API_ID=${SNOWPACK_PUBLIC_API_ID} SNOWPACK_PUBLIC_API_HASH=${SNOWPACK_PUBLIC_API_HASH} npm run build

FROM nginx
COPY --from=build /usr/src/app/build /usr/share/nginx/html
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
