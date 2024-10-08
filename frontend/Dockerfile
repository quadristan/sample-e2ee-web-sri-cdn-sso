FROM node:20 AS BUILD
ARG CDN_ADDRESS="http://localhost:3001/"

WORKDIR /app
COPY package-lock.json .
COPY package.json .
RUN npm install --frozen-lockfile

COPY tsconfig.json .
COPY config-overrides.js .  
COPY public/ public/
COPY src/ src/
ENV CDN_ADDRESS=$CDN_ADDRESS 
ENV NODE_ENV=production
RUN npm run build

FROM joseluisq/static-web-server:2.19.0-alpine as RUN 
ENV SERVER_ROOT=/www
COPY --from=BUILD /app/build /www

