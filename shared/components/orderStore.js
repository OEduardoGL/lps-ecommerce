const { v4: uuid } = require('uuid');

const orders = [];

function listOrders() {
  return orders;
}

function findById(id) {
  return orders.find((order) => order.id === id);
}

function createOrder({ userId, items }) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('Pedido precisa de itens');
  }

  const order = {
    id: uuid(),
    userId: userId ?? null,
    status: 'created',
    items: items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity ?? 1,
      price: item.price ?? null
    })),
    createdAt: new Date().toISOString()
  };

  orders.push(order);
  return order;
}

function updateStatus(id, status) {
  const order = findById(id);
  if (!order) {
    throw new Error('Pedido não encontrado');
  }
  order.status = status;
  return order;
}

module.exports = {
  listOrders,
  findById,
  createOrder,
  updateStatus
};
