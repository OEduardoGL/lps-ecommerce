const { v4: uuid } = require('uuid');
const db = require('../db');

function mapOrderRow(row) {
  return {
    id: row.id,
    userId: row.userId,
    status: row.status,
    createdAt: row.createdAt,
    items: row.items || []
  };
}

async function listOrders(client) {
  const { rows } = await db.query(
    `SELECT o.id,
            o.user_id AS "userId",
            o.status,
            o.created_at AS "createdAt",
            COALESCE(json_agg(json_build_object(
              'productId', oi.product_id,
              'quantity', oi.quantity,
              'price', oi.price
            ) ORDER BY oi.id) FILTER (WHERE oi.product_id IS NOT NULL), '[]') AS items
       FROM orders o
       LEFT JOIN order_items oi ON oi.order_id = o.id
       GROUP BY o.id
       ORDER BY o.created_at DESC`,
    [],
    client
  );
  return rows.map(mapOrderRow).map((row) => ({
    ...row,
    items: row.items.map((item) => ({ ...item, price: Number(item.price) }))
  }));
}

async function findById(id, client) {
  const { rows } = await db.query(
    `SELECT o.id,
            o.user_id AS "userId",
            o.status,
            o.created_at AS "createdAt",
            COALESCE(json_agg(json_build_object(
              'productId', oi.product_id,
              'quantity', oi.quantity,
              'price', oi.price
            ) ORDER BY oi.id) FILTER (WHERE oi.product_id IS NOT NULL), '[]') AS items
       FROM orders o
       LEFT JOIN order_items oi ON oi.order_id = o.id
       WHERE o.id = $1
       GROUP BY o.id`,
    [id],
    client
  );
  const order = rows[0];
  if (!order) {
    return null;
  }
  return {
    ...mapOrderRow(order),
    items: order.items.map((item) => ({ ...item, price: Number(item.price) }))
  };
}

async function createOrder({ userId, items }, client) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('Pedido precisa de itens');
  }

  const orderId = uuid();
  await db.query(
    `INSERT INTO orders (id, user_id, status)
       VALUES ($1, $2, $3)`,
    [orderId, userId, 'created'],
    client
  );

  for (const item of items) {
    await db.query(
      `INSERT INTO order_items (order_id, product_id, quantity, price)
         VALUES ($1, $2, $3, $4)`,
      [orderId, item.productId, item.quantity, item.price],
      client
    );
  }

  return findById(orderId, client);
}

async function updateStatus(id, status, client) {
  const { rows } = await db.query(
    `UPDATE orders
        SET status = $2
      WHERE id = $1
      RETURNING id, user_id AS "userId", status, created_at AS "createdAt"`,
    [id, status],
    client
  );
  const order = rows[0];
  if (!order) {
    throw new Error('Pedido não encontrado');
  }
  const fullOrder = await findById(id, client);
  return fullOrder;
}

module.exports = {
  listOrders,
  findById,
  createOrder,
  updateStatus
};
