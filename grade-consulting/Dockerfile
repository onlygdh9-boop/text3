FROM node:20-alpine
WORKDIR /app
COPY package.json ./
COPY server.js ./
COPY index.html ./
COPY main.js ./
COPY payload0.js ./
COPY payload1.js ./
COPY payload2.js ./
EXPOSE 8080
CMD ["npm","start"]
