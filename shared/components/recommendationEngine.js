const { products } = require('../data/products');
const { findById: findUserById } = require('./userProfiles');

const coPurchaseMap = new Map();

function buildKey(a, b) {
  return [a, b].sort().join('::');
}

function registerPurchase(order) {
  if (!order || !Array.isArray(order.items)) {
    return;
  }
  const ids = order.items.map((item) => item.productId);
  for (let i = 0; i < ids.length; i += 1) {
    for (let j = i + 1; j < ids.length; j += 1) {
      const key = buildKey(ids[i], ids[j]);
      const current = coPurchaseMap.get(key) ?? 0;
      coPurchaseMap.set(key, current + 1);
    }
  }
}

function getRecommendations({ userId, productId, limit = 4 }) {
  const scoreByProduct = new Map();
  const selectedProduct = productId ? products.find((p) => p.id === productId) : null;
  const user = userId ? findUserById(userId) : null;

  products.forEach((product) => {
    scoreByProduct.set(product.id, 0);
  });

  if (selectedProduct) {
    const categories = selectedProduct.categories ?? [];
    const tags = selectedProduct.tags ?? [];

    products.forEach((product) => {
      if (product.id === selectedProduct.id) {
        scoreByProduct.set(product.id, -Infinity);
        return;
      }
      let score = scoreByProduct.get(product.id) ?? 0;
      const sameCategoryCount = categories.filter((c) => product.categories.includes(c)).length;
      const sameTagCount = tags.filter((t) => product.tags.includes(t)).length;
      score += sameCategoryCount * 3;
      score += sameTagCount * 2;
      const key = buildKey(product.id, selectedProduct.id);
      const co = coPurchaseMap.get(key) ?? 0;
      score += co * 4;
      scoreByProduct.set(product.id, score);
    });
  }

  if (user && Array.isArray(user.favoriteCategories)) {
    products.forEach((product) => {
      if (productId && product.id === productId) {
        return;
      }
      const matches = user.favoriteCategories.filter((c) => product.categories.includes(c)).length;
      const current = scoreByProduct.get(product.id) ?? 0;
      scoreByProduct.set(product.id, current + matches * 2);
    });
  }

  const sorted = products
    .filter((product) => !productId || product.id !== productId)
    .map((product) => ({ product, score: scoreByProduct.get(product.id) ?? 0 }))
    .filter((item) => item.score > -Infinity)
    .sort((a, b) => b.score - a.score || a.product.id.localeCompare(b.product.id));

  return sorted.slice(0, limit).map((item) => item.product);
}

module.exports = {
  registerPurchase,
  getRecommendations
};
