const { products } = require('../data/products');

function listProducts() {
  return products;
}

function findById(id) {
  return products.find((p) => p.id === id);
}

function search({ query, category, tag }) {
  return products.filter((product) => {
    const matchesQuery = query
      ? product.name.toLowerCase().includes(query.toLowerCase()) ||
        product.description.toLowerCase().includes(query.toLowerCase())
      : true;
    const matchesCategory = category
      ? product.categories.includes(category)
      : true;
    const matchesTag = tag ? product.tags.includes(tag) : true;
    return matchesQuery && matchesCategory && matchesTag;
  });
}

function reserveStock(productId, quantity) {
  const product = findById(productId);
  if (!product) {
    throw new Error('Produto não encontrado');
  }
  if (product.stock < quantity) {
    throw new Error('Estoque insuficiente');
  }
  product.stock -= quantity;
  return product;
}

function releaseStock(productId, quantity) {
  const product = findById(productId);
  if (product) {
    product.stock += quantity;
  }
}

module.exports = {
  listProducts,
  findById,
  search,
  reserveStock,
  releaseStock
};
