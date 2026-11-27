# Default build stage is development; Compose production selects target: prod.
FROM node:22-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
COPY website/package.json website/package-lock.json ./website/
RUN cd /app/website && npm ci
COPY backoffice/package.json backoffice/package-lock.json ./backoffice/
RUN cd /app/backoffice && npm ci

FROM deps AS dev
ENV NODE_ENV=development APP_MODE=dev
COPY website ./website
COPY backoffice ./backoffice
COPY start.sh ./start.sh
RUN chmod +x /app/start.sh
EXPOSE 3000 3001
CMD ["/app/start.sh"]

FROM deps AS builder
ENV NODE_ENV=production
ARG BACKEND_URL=http://backend:8000
ENV BACKEND_URL=${BACKEND_URL}
COPY website ./website
COPY backoffice ./backoffice
RUN cd /app/website && npm run build
RUN cd /app/backoffice && npm run build

FROM base AS prod
ENV NODE_ENV=production APP_MODE=prod
COPY --from=builder --chown=node:node /app/website ./website
COPY --from=builder --chown=node:node /app/backoffice ./backoffice
COPY --chown=node:node start.sh ./start.sh
RUN chmod +x /app/start.sh
USER node
EXPOSE 3000 3001
CMD ["/app/start.sh"]

# A plain `docker build` remains useful for local development.
FROM dev AS default