# orders-service

Order management for the Oxyhydrocar e-commerce platform.

## Related services

- **payments-service** — processes payments; reads from the same PostgreSQL database
- **storefront** — frontend that creates and displays orders

## Running locally

```bash
cp .env.example .env
npm install
npm run dev
```
