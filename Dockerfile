FROM node:lts-alpine as build
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm i --unsafe-perm
COPY . .
ARG SNOWPACK_PUBLIC_API_ID
ARG SNOWPACK_PUBLIC_API_HASH
RUN VITE_PUBLIC_API_ID=${SNOWPACK_PUBLIC_API_ID} VITE_PUBLIC_API_HASH=${SNOWPACK_PUBLIC_API_HASH} npm run build

FROM nginx
COPY --from=build /usr/src/app/dist /usr/share/nginx/html
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
