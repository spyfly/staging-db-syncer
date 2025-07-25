FROM node:18-alpine

WORKDIR /app

# Install docker CLI
RUN apk add --no-cache docker-cli docker-cli-compose

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
