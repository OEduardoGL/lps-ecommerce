const db = require('../db');
const catalog = require('./catalog');
const userProfiles = require('./userProfiles');

async function registerPurchase() {
  // Persistência já é realizada via orderStore; nada adicional necessário.
  return undefined;
}

async function getCoPurchaseScores(productId) {
  const { rows } = await db.query(
    `SELECT oi2.product_id AS "productId", COUNT(*) AS score
       FROM order_items oi1
       JOIN order_items oi2 ON oi1.order_id = oi2.order_id
      WHERE oi1.product_id = $1 AND oi2.product_id <> $1
      GROUP BY oi2.product_id`,
    [productId]
  );
  return rows.reduce((acc, row) => {
    acc.set(row.productId, Number(row.score));
    return acc;
  }, new Map());
}

async function getRecommendations({ userId, productId, limit = 4 }) {
  const products = await catalog.listProducts();
  const scoreByProduct = new Map(products.map((product) => [product.id, 0]));

  let selectedProduct = null;
  if (productId) {
    selectedProduct = await catalog.findById(productId);
  }

  const user = userId ? await userProfiles.findById(userId) : null;

  let coPurchaseScores = new Map();
  if (selectedProduct) {
    coPurchaseScores = await getCoPurchaseScores(selectedProduct.id);

    const categories = selectedProduct.categories || [];
    const tags = selectedProduct.tags || [];

    for (const product of products) {
      if (product.id === selectedProduct.id) {
        scoreByProduct.set(product.id, -Infinity);
        continue;
      }
      let score = scoreByProduct.get(product.id) || 0;
      const sameCategoryCount = categories.filter((c) => (product.categories || []).includes(c)).length;
      const sameTagCount = tags.filter((t) => (product.tags || []).includes(t)).length;
      score += sameCategoryCount * 3;
      score += sameTagCount * 2;
      if (coPurchaseScores.has(product.id)) {
        score += coPurchaseScores.get(product.id) * 4;
      }
      scoreByProduct.set(product.id, score);
    }
  }

  if (user && Array.isArray(user.favoriteCategories)) {
    for (const product of products) {
      if (productId && product.id === productId) {
        continue;
      }
      const matches = user.favoriteCategories.filter((c) => (product.categories || []).includes(c)).length;
      const current = scoreByProduct.get(product.id) || 0;
      scoreByProduct.set(product.id, current + matches * 2);
    }
  }

  const sorted = products
    .filter((product) => !productId || product.id !== productId)
    .map((product) => ({ product, score: scoreByProduct.get(product.id) || 0 }))
    .filter((item) => item.score > -Infinity)
    .sort((a, b) => b.score - a.score || a.product.id.localeCompare(b.product.id));

  return sorted.slice(0, limit).map((item) => item.product);
}

module.exports = {
  registerPurchase,
  getRecommendations
};
