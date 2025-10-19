const express = require('express');

function createService({ name, port, routes, dependencies = {} }) {
  if (!name || !port || !routes) {
    throw new Error('createService requer name, port e routes');
  }

  const app = express();
  app.use(express.json());

  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`[${name}] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
    });
    next();
  });

  app.get('/health', (req, res) => {
    res.json({ service: name, status: 'ok' });
  });

  routes(app, dependencies);

  let server;
  return {
    start() {
      return new Promise((resolve) => {
        server = app.listen(port, () => {
          console.log(`[${name}] Serviço iniciado na porta ${port}`);
          resolve(server);
        });
      });
    },
    stop() {
      if (server) {
        server.close();
      }
    }
  };
}

module.exports = { createService };
