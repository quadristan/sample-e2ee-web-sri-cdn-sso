FROM node:20

WORKDIR /app
COPY package-lock.json .
COPY package.json .
RUN npm install --frozen-lockfile

COPY tsconfig.json .
COPY src/ src/

EXPOSE 8000 


CMD ["npm", "run", "start"]
