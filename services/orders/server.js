const port = Number.parseInt(process.env.PORT || '3000', 10);
const recommendationComponent = require('../../shared/components/recommendationEngine');
const { initOrderService } = require('.');

async function start() {
  const service = initOrderService({
    port,
    dependencies: { recommendation: recommendationComponent }
  });
  await service.start();
}

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
