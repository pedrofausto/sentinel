# Sentinel CTI - Deployment Guide

## Overview

Sentinel CTI is a production-ready Cyber Threat Intelligence lifecycle management platform. This guide covers deployment options from local development to production Docker deployment.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Nginx (Port 80)                      │
│                    (Static files + Proxy)                   │
└─────────────────────────┬───────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
          ▼               ▼               ▼
┌─────────────────┐ ┌─────────────┐ ┌─────────────┐
│    Frontend     │ │   Backend   │ │   Redis     │
│  (React/Vite)   │ │  (Express)  │ │  (Cache)    │
│                 │ │  Port 3001  │ │  Port 6379  │
└─────────────────┘ └──────┬──────┘ └─────────────┘
                           │
                           ▼
                   ┌───────────────┐
                   │  PostgreSQL   │
                   │   Port 5432   │
                   └───────────────┘
```

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 20+ (for local development)
- Git

### 1. Clone and Configure

```bash
git clone <repository-url>
cd sentinel

# Copy environment files
cp env.example .env
cp backend/env.example backend/.env

# Generate secure secrets
openssl rand -base64 32  # Use for JWT_SECRET
openssl rand -base64 32  # Use for JWT_REFRESH_SECRET
```

### 2. Configure Environment

Edit `.env` and set:

```bash
# Required: Generate secure JWT secrets
JWT_SECRET=<your-generated-secret>
JWT_REFRESH_SECRET=<your-generated-secret>

# Required: Gemini API key for AI features
GEMINI_API_KEY=<your-gemini-api-key>

# Production: Set strong passwords
POSTGRES_PASSWORD=<strong-password>
REDIS_PASSWORD=<strong-password>
```

### 3. Deploy with Docker

```bash
# Production deployment
docker-compose up -d

# View logs
docker-compose logs -f

# Check health
curl http://localhost/health
curl http://localhost/api/health
```

## Development Setup

### Local Development with Docker (Database only)

```bash
# Start database services
docker-compose -f docker-compose.dev.yml up -d

# Install dependencies
npm install
cd backend && npm install && cd ..

# Run migrations
cd backend && npm run migrate && cd ..

# Start backend (terminal 1)
cd backend && npm run dev

# Start frontend (terminal 2)
npm run dev
```

### Full Local Development

```bash
# Install PostgreSQL and Redis locally, then:

# Backend
cd backend
cp env.example .env
# Edit .env with your local database credentials
npm install
npm run migrate
npm run seed  # Optional: add sample data
npm run dev

# Frontend (new terminal)
cd ..
npm install
npm run dev
```

## Production Checklist

### Security

- [ ] Generate unique JWT secrets (minimum 32 characters)
- [ ] Set strong database password
- [ ] Set strong Redis password
- [ ] Configure HTTPS (add SSL certificates to Nginx)
- [ ] Review CORS settings in backend
- [ ] Enable rate limiting (already configured)
- [ ] Set `NODE_ENV=production`

### Database

- [ ] Run migrations: `docker-compose exec backend npm run migrate`
- [ ] Set up automated backups
- [ ] Configure connection pooling (already set)

### Monitoring

- [ ] Set up health check monitoring
- [ ] Configure log aggregation
- [ ] Set up alerting for errors

### Performance

- [ ] Enable Gzip compression (already in Nginx config)
- [ ] Configure CDN for static assets
- [ ] Review database indexes

## Environment Variables Reference

### Frontend (Vite)

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `/api` |

### Backend

| Variable | Description | Required |
|----------|-------------|----------|
| `NODE_ENV` | Environment mode | No (default: development) |
| `PORT` | Server port | No (default: 3001) |
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `REDIS_URL` | Redis connection string | Yes |
| `JWT_SECRET` | JWT signing secret | Yes |
| `JWT_REFRESH_SECRET` | Refresh token secret | Yes |
| `GEMINI_API_KEY` | Google Gemini API key | Yes (for AI features) |
| `FRONTEND_URL` | Frontend URL for CORS | Yes |

### Docker Compose

| Variable | Description | Default |
|----------|-------------|---------|
| `POSTGRES_USER` | Database username | sentinel |
| `POSTGRES_PASSWORD` | Database password | sentinel_secret |
| `POSTGRES_DB` | Database name | sentinel_db |
| `REDIS_PASSWORD` | Redis password | redis_secret |

## Troubleshooting

### Database Connection Failed

```bash
# Check database is running
docker-compose ps db

# Check logs
docker-compose logs db

# Test connection
docker-compose exec db psql -U sentinel -d sentinel_db
```

### Redis Connection Failed

```bash
# Check Redis is running
docker-compose ps redis

# Test connection
docker-compose exec redis redis-cli -a redis_secret ping
```

### Frontend Not Loading

```bash
# Check Nginx logs
docker-compose logs frontend

# Verify static files
docker-compose exec frontend ls -la /usr/share/nginx/html
```

### API Errors

```bash
# Check backend logs
docker-compose logs backend

# Test health endpoint
curl http://localhost/api/health
```

## Scaling

### Horizontal Scaling

For high availability, deploy multiple backend instances behind a load balancer:

```yaml
# docker-compose.prod.yml
services:
  backend:
    deploy:
      replicas: 3
```

### Database Scaling

Consider using managed PostgreSQL (AWS RDS, Google Cloud SQL) for production.

## Backup & Restore

### Database Backup

```bash
# Create backup
docker-compose exec db pg_dump -U sentinel sentinel_db > backup.sql

# Restore
docker-compose exec -T db psql -U sentinel sentinel_db < backup.sql
```

### Redis Backup

```bash
# Trigger RDB snapshot
docker-compose exec redis redis-cli -a redis_secret BGSAVE
```

## Updates

```bash
# Pull latest changes
git pull

# Rebuild and restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Run migrations if needed
docker-compose exec backend npm run migrate
```
