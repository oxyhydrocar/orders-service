const CATALOG: Record<string, number> = {
  "sku-widget": 12.5,
  "sku-gadget": 29.99,
  "sku-gizmo": 8.0,
};

export function getUnitPrice(sku: string): number | null {
  return Object.prototype.hasOwnProperty.call(CATALOG, sku) ? CATALOG[sku] : null;
}
