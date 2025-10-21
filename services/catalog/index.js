const { createService } = require('../../shared/server');
const catalog = require('../../shared/components/catalog');

function routes(app) {
  app.get('/products', async (req, res) => {
    try {
      const { q, category, tag } = req.query;
      const products = await catalog.search({ query: q, category, tag });
      res.json({ data: products });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/products/:id', async (req, res) => {
    try {
      const product = await catalog.findById(req.params.id);
      if (!product) {
        return res.status(404).json({ error: 'Produto não encontrado' });
      }
      return res.json(product);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  });
}

function initCatalogService({ port }) {
  return createService({ name: 'catalog', port, routes });
}

module.exports = { initCatalogService };
