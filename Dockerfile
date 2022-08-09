FROM node:12-alpine
RUN npm install --global --quiet npm truffle ganache

FROM base as truffle

RUN mkdir -p /home/app
WORKDIR /home/app

COPY package.json /home/app
COPY package-lock.json /home/app

RUN npm install --quiet

COPY abis /home/app/abis
COPY contracts /home/app/contracts
COPY migrations /home/app/migrations/
COPY addresses /home/app/addresses
COPY .env /home/app
COPY run-abritrage-fork.js /home/app
COPY run-arbitrage-kovan /home/app
COPY truffle-config.js /home/app


CMD ["truffle", "version"]

CMD ["npm run","deploy:kovan"]
CMD ["npm run","arbitrage:kovan"]
EXPOSE 8545