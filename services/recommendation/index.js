const { createService } = require('../../shared/server');
const catalog = require('../../shared/components/catalog');

function routes(app, dependencies) {
  const engine = dependencies?.recommendation;
  if (!engine) {
    throw new Error('Serviço de recomendação requer o componente recommendation');
  }

  app.get('/recommendations', (req, res) => {
    const { userId, productId, limit } = req.query;
    const parsedLimit = limit ? Number.parseInt(limit, 10) : undefined;
    const recommendations = engine.getRecommendations({
      userId: userId ?? null,
      productId: productId ?? null,
      limit: Number.isNaN(parsedLimit) ? undefined : parsedLimit
    });

    res.json({
      data: recommendations,
      context: {
        userId: userId ?? null,
        productId: productId ?? null
      }
    });
  });

  app.get('/recommendations/related/:productId', (req, res) => {
    const product = catalog.findById(req.params.productId);
    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    const recommendations = engine.getRecommendations({ productId: product.id });
    return res.json({ data: recommendations, base: product });
  });
}

function initRecommendationService({ port, dependencies }) {
  return createService({
    name: 'recommendation',
    port,
    routes,
    dependencies
  });
}

module.exports = { initRecommendationService };
