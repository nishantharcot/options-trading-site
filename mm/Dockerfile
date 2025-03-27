FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm i

RUN npm i typescript

COPY . .

RUN npx --yes --package typescript

RUN npx tsc -b

EXPOSE 3000

CMD ["node", "dist/index.js"]