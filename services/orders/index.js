const { createService } = require('../../shared/server');
const fallbackCatalog = require('../../shared/components/catalog');
const orderStore = require('../../shared/components/orderStore');

function routes(app, dependencies) {
  const catalog = dependencies?.catalog ?? fallbackCatalog;
  const recommendation = dependencies?.recommendation ?? null;

  app.get('/orders', (req, res) => {
    res.json({ data: orderStore.listOrders() });
  });

  app.get('/orders/:id', (req, res) => {
    const order = orderStore.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }
    return res.json(order);
  });

  app.post('/orders', (req, res) => {
    const { userId, items } = req.body ?? {};
    const reserved = [];
    try {
      if (!Array.isArray(items) || items.length === 0) {
        throw new Error('Pedido precisa ter itens');
      }

      const preparedItems = items.map((item) => {
        const product = catalog.findById(item.productId);
        if (!product) {
          throw new Error(`Produto ${item.productId} não encontrado`);
        }
        const quantity = item.quantity ?? 1;
        catalog.reserveStock(product.id, quantity);
        reserved.push({ productId: product.id, quantity });
        return {
          productId: product.id,
          quantity,
          price: product.price
        };
      });

      const order = orderStore.createOrder({ userId, items: preparedItems });

      if (recommendation) {
        recommendation.registerPurchase(order);
      }

      res.status(201).json(order);
    } catch (error) {
      reserved.forEach((item) => catalog.releaseStock(item.productId, item.quantity));
      res.status(400).json({ error: error.message });
    }
  });

  app.patch('/orders/:id/status', (req, res) => {
    try {
      const order = orderStore.updateStatus(req.params.id, req.body?.status);
      res.json(order);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
}

function initOrderService({ port, dependencies = {} }) {
  return createService({ name: 'orders', port, routes, dependencies });
}

module.exports = { initOrderService };
