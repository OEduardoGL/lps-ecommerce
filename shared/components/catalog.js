const db = require('../db');

async function listProducts(client) {
  const { rows } = await db.query(
    `SELECT id, name, description, price, categories, tags, stock
       FROM products
       ORDER BY name`,
    [],
    client
  );
  return rows.map((row) => ({
    ...row,
    price: Number(row.price)
  }));
}

async function findById(id, client) {
  const { rows } = await db.query(
    `SELECT id, name, description, price, categories, tags, stock
       FROM products
       WHERE id = $1`,
    [id],
    client
  );
  const product = rows[0];
  if (!product) {
    return null;
  }
  return {
    ...product,
    price: Number(product.price)
  };
}

async function search({ query: q, category, tag }, client) {
  const conditions = [];
  const params = [];

  if (q) {
    params.push(`%${q.toLowerCase()}%`);
    conditions.push('(LOWER(name) LIKE $' + params.length + ' OR LOWER(description) LIKE $' + params.length + ')');
  }
  if (category) {
    params.push(category);
    conditions.push('$' + params.length + ' = ANY(categories)');
  }
  if (tag) {
    params.push(tag);
    conditions.push('$' + params.length + ' = ANY(tags)');
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const { rows } = await db.query(
    `SELECT id, name, description, price, categories, tags, stock
       FROM products
       ${whereClause}
       ORDER BY name`,
    params,
    client
  );
  return rows.map((row) => ({
    ...row,
    price: Number(row.price)
  }));
}

async function reserveStock(productId, quantity, client) {
  const { rows } = await db.query(
    `UPDATE products
        SET stock = stock - $2
      WHERE id = $1 AND stock >= $2
      RETURNING id, name, description, price, categories, tags, stock`,
    [productId, quantity],
    client
  );
  if (!rows[0]) {
    throw new Error('Estoque insuficiente ou produto inexistente');
  }
  return {
    ...rows[0],
    price: Number(rows[0].price)
  };
}

async function releaseStock(productId, quantity, client) {
  const { rows } = await db.query(
    `UPDATE products
        SET stock = stock + $2
      WHERE id = $1
      RETURNING id, name, description, price, categories, tags, stock`,
    [productId, quantity],
    client
  );
  if (!rows[0]) {
    return null;
  }
  return {
    ...rows[0],
    price: Number(rows[0].price)
  };
}

module.exports = {
  listProducts,
  findById,
  search,
  reserveStock,
  releaseStock
};
