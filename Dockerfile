FROM node:lts-alpine

RUN mkdir -p /usr/src/app/node_modules && chown -R node:node /usr/src/app

RUN apk update && apk upgrade && \
    apk add --no-cache bash git openssh

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./

USER node
RUN npm install
RUN npm install --save express

# Bundle app source
COPY --chown=node:node . .

EXPOSE 3000

CMD [ "npm", "start" ]
