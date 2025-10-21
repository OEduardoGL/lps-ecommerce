const port = Number.parseInt(process.env.PORT || '3000', 10);
const { initUserService } = require('.');

async function start() {
  const service = initUserService({ port });
  await service.start();
}

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
