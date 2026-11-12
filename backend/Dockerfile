FROM node:20-bookworm-slim

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 python3-venv ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm ci

WORKDIR /app
COPY hardware/requirements.txt ./hardware/requirements.txt
RUN python3 -m venv /opt/hardware-venv \
    && /opt/hardware-venv/bin/pip install --no-cache-dir -r hardware/requirements.txt

COPY backend ./backend
COPY hardware ./hardware
WORKDIR /app/backend
RUN npx prisma generate && npm run build

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PATH="/opt/hardware-venv/bin:$PATH"
EXPOSE 3001
CMD ["npm", "run", "start"]
