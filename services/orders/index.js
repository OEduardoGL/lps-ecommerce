const { createService } = require('../../shared/server');
const db = require('../../shared/db');
const catalog = require('../../shared/components/catalog');
const orderStore = require('../../shared/components/orderStore');

function routes(app, dependencies) {
  const recommendation = dependencies?.recommendation ?? null;

  app.get('/orders', async (req, res) => {
    try {
      const orders = await orderStore.listOrders();
      res.json({ data: orders });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/orders/:id', async (req, res) => {
    try {
      const order = await orderStore.findById(req.params.id);
      if (!order) {
        return res.status(404).json({ error: 'Pedido não encontrado' });
      }
      return res.json(order);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  });

  app.post('/orders', async (req, res) => {
    const { userId, items } = req.body ?? {};
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Pedido precisa ter itens' });
    }

    try {
      const order = await db.withTransaction(async (client) => {
        const preparedItems = [];
        for (const item of items) {
          const product = await catalog.findById(item.productId, client);
          if (!product) {
            throw new Error(`Produto ${item.productId} não encontrado`);
          }
          const quantity = item.quantity ?? 1;
          await catalog.reserveStock(product.id, quantity, client);
          preparedItems.push({
            productId: product.id,
            quantity,
            price: product.price
          });
        }
        const createdOrder = await orderStore.createOrder({ userId, items: preparedItems }, client);
        return createdOrder;
      });

      if (recommendation) {
        await recommendation.registerPurchase(order);
      }

      res.status(201).json(order);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch('/orders/:id/status', async (req, res) => {
    try {
      const status = req.body?.status;
      if (!status) {
        return res.status(400).json({ error: 'Status é obrigatório' });
      }
      const order = await orderStore.updateStatus(req.params.id, status);
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
