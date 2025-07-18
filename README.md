# 📚 Marketing REST API

A minimal RESTful API for managing marketing API using **NestJS**, **TypeORM**, and **PostgreSQL**.

---

## ✨ Features
- 

---

## 🚀 Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/your-user/klavio-rest-api.git
cd klavio-rest-api
pnpm install
```

### 2. Setup Environment

```bash
cp .env.example .env
cp .env.test.example .env.test
```

Fill in your DB credentials in both files.

---

## 📆 Scripts

| Command                   | Description                      |
|--------------------------|----------------------------------|
| `pnpm start:dev`         | Run in development mode          |
| `pnpm test:e2e`          | Run end-to-end tests             |

---

## 📂 Project Structure

```
src/
  ├── app.module.ts
  ├── database/
  └── modules/
      ├── event/

test/
  ├── app.e2e-spec.ts
  ├── event/
      └── event.e2e-spec.ts
```

---

## 🔗 API Endpoints

### Events
- `POST /events`
- `POST //events/bulk`

---

## 🔮 Testing

```bash
pnpm test:e2e
```

Make sure `.env.test` is properly configured.

