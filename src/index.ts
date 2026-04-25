import express from "express";
import { ordersRouter } from "./routes/orders";

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => res.json({ service: "orders-service", status: "ok" }));
app.use("/orders", ordersRouter);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`orders-service listening on :${PORT}`));
