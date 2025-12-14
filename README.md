# User Service - Backend Challenge

> Microsserviço de gerenciamento de usuários para sistema bancário.

Este projeto é parte do desafio técnico para a vaga de Backend Node.js na Loomi. O objetivo é desenvolver um microsserviço robusto para gerenciamento de usuários e dados bancários, focando em arquitetura limpa, boas práticas e tecnologias modernas.

## 🔗 Links Rápidos

- **Repositório:** https://github.com/igortisilva/user-service-loomi
- **Documentação API (Swagger):** http://localhost:3001/api/docs

## 🚀 Tecnologias

- **Runtime:** Node.js 18+
- **Framework:** NestJS 10.x
- **Linguagem:** TypeScript 5.x
- **ORM:** Prisma 5.x
- **Banco de Dados:** PostgreSQL 15
- **Cache:** Redis 7.x
- **Mensageria:** Kafka
- **Containerização:** Docker & Docker Compose
- **Testes:** Jest (Unit & E2E)
- **Documentação:** Swagger/OpenAPI 3.0

## 🔑 Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env`:

```bash
# Application
NODE_ENV=development
PORT=3001

# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/userservice?schema=public"

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRATION=1d

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Kafka
KAFKA_BROKERS=localhost:9092
```

---

## 📋 Progresso

### 1. Setup Inicial (Obrigatório)

- [x] Configuração do projeto NestJS
- [x] Configuração TypeScript
- [x] ESLint e Prettier
- [x] Estrutura de pastas

### 2. Banco de Dados (Obrigatório)

- [x] Configuração do Prisma
- [x] Modelo User
- [x] Modelo BankingDetails
- [x] Migrations

### 3. Autenticação (Obrigatório)

- [x] JWT Strategy
- [x] Hash de senhas (bcrypt)
- [x] Login endpoint
- [x] Guards de autenticação

### 4. CRUD de Usuários (Obrigatório)

- [x] POST /api/users
- [x] GET /api/users
- [x] GET /api/users/:id
- [x] PATCH /api/users/:id
- [x] DELETE /api/users/:id
- [x] Validação com class-validator

### 5. Dados Bancários (Obrigatório)

- [x] PATCH /api/users/:id/banking-details
- [x] Validação de campos
- [x] Operação upsert

### 6. Upload de Foto (Obrigatório)

- [x] PATCH /api/users/:id/profile-picture
- [x] Multer configurado
- [x] Validação de arquivo

### 7. Cache (Redis)

- [x] RedisModule
- [x] Cache em leituras
- [x] Invalidação automática
- [x] TTL (1 hora)

### 8. Mensageria (Kafka)

- [x] KafkaModule
- [x] Producer
- [x] Consumer
- [x] Eventos publicados

### 9. Documentação

- [x] Swagger configurado
- [x] Endpoints documentados
- [x] Schemas documentados

### 10. Testes Unitários

- [x] UsersService
- [x] AuthService
- [x] Coverage > 85%

### 11. Testes E2E

- [x] Fluxos completos
- [x] Validações
- [x] Supertest

### 12. Docker

- [x] Dockerfile
- [x] docker-compose.yml
- [x] Health checks

### 13. Documentação

- [x] README.md
- [x] ARCHITECTURE.md
- [x] CONTRIBUTING.md
- [x] QUICKSTART.md

### Extras

- [x] Makefile
- [x] Script de deploy
- [x] Conventional Commits

---

## 🚀 Como executar

### Com Docker (Recomendado)

```bash
git clone https://github.com/igortisilva/user-service-loomi.git

cd user-service-loomi

cp .env.example .env

docker-compose up -d

# Acesse: http://localhost:3001/api/docs
```

### Desenvolvimento Local

```bash
npm install

docker-compose up -d postgres redis kafka zookeeper

npm run prisma:generate

npm run prisma:migrate

npm run start:dev
```

---

## 🧪 Testes

```bash
# Testes unitários
npm test

# Testes E2E
npm run test:e2e

# Coverage
npm run test:cov
```

---

## 📚 API Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/auth/login` | Login |
| POST | `/api/users` | Criar usuário |
| GET | `/api/users` | Listar usuários |
| GET | `/api/users/:id` | Buscar usuário |
| PATCH | `/api/users/:id` | Atualizar |
| PATCH | `/api/users/:id/banking-details` | Dados bancários |
| PATCH | `/api/users/:id/profile-picture` | Upload foto |
| DELETE | `/api/users/:id` | Deletar |

**Documentação completa:** http://localhost:3001/api/docs

---

## 📁 Estrutura

```
user-service-loomi/
├── src/
│   ├── auth/              # Autenticação
│   ├── users/             # CRUD usuários
│   ├── prisma/            # ORM
│   ├── redis/             # Cache
│   ├── kafka/             # Mensageria
│   └── main.ts
├── prisma/
│   └── schema.prisma
├── test/
├── docker-compose.yml
└── README.md
```

---

## 👨‍💻 Autor

**Igor Silva**
- GitHub: [@igortisilva](https://github.com/igortisilva)

