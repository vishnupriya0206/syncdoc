# ---- Build stage ----
FROM node:20-alpine AS build

WORKDIR /app

# The API URL is baked into the static bundle at build time since this is
# client-side code running in the user's browser (it must reach the backend
# at a URL the *browser* can resolve, not a Docker-internal service name).
ARG VITE_API_URL=http://localhost:4000
ENV VITE_API_URL=$VITE_API_URL

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# ---- Serve stage ----
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
