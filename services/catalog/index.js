const { createService } = require('../../shared/server');
const catalog = require('../../shared/components/catalog');

function routes(app) {
  app.get('/products', (req, res) => {
    const { q, category, tag } = req.query;
    const products = catalog.search({ query: q, category, tag });
    res.json({ data: products });
  });

  app.get('/products/:id', (req, res) => {
    const product = catalog.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    return res.json(product);
  });
}

function initCatalogService({ port }) {
  return createService({ name: 'catalog', port, routes });
}

module.exports = { initCatalogService };
