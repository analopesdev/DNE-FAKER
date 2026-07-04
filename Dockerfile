# -------- STAGE 1: BUILD --------
FROM node:24-alpine AS build

WORKDIR /app

COPY package*.json yarn.lock ./
RUN yarn install --frozen-lockfile --silent

COPY . .
RUN node src/scripts/gen-icons.js
RUN yarn build

# -------- STAGE 2: SERVE --------
FROM nginx:stable-alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]