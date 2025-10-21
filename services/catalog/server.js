const port = Number.parseInt(process.env.PORT || '3000', 10);
const { initCatalogService } = require('.');

async function start() {
  const service = initCatalogService({ port });
  await service.start();
}

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
