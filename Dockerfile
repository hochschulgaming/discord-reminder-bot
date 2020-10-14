FROM node:12
WORKDIR /opt/bot
COPY package*.json ./
RUN npm install
COPY . .
VOLUME [ "/opt/bot/config.json", "/opt/bot/data" ]
CMD [ "node", "app.js" ]
