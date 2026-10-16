import express from "express";
import { getUnitPrice } from "./services/pricing";

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => res.json({ service: "orders-service", status: "ok" }));

app.get("/prices/:sku", (req, res) => {
  const sku = req.params.sku.trim().toLowerCase();
  const price = getUnitPrice(sku);
  if (price === null) {
    return res.status(404).json({ error: "unknown sku" });
  }
  return res.json({ sku, unitPrice: price });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`orders-service listening on :${PORT}`));
