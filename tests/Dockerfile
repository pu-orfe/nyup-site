# Container image for running the site's JavaScript regression tests.
#
# Build context is the tests/ directory; the site's JavaScript under test is
# mounted read-only at /app/core and /app/profiles (see docker-compose.yml).
FROM node:22-alpine

WORKDIR /app/tests

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

CMD ["npm", "test"]
