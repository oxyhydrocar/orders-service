import express from "express";
import { ordersRouter } from "./orders";
import { adminRouter } from "./admin";
import { webhooksRouter } from "./webhooks";

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => res.json({ service: "orders-service", status: "ok" }));
app.use(ordersRouter);
app.use(adminRouter);
app.use(webhooksRouter);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`orders-service listening on :${PORT}`));
