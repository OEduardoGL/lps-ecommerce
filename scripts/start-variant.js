#!/usr/bin/env node
/* eslint-disable no-console */
const path = require('path');
const fs = require('fs');

const { initCatalogService } = require('../services/catalog');
const { initUserService } = require('../services/users');
const { initOrderService } = require('../services/orders');
const { initRecommendationService } = require('../services/recommendation');
const catalogComponent = require('../shared/components/catalog');
const recommendationComponent = require('../shared/components/recommendationEngine');

const CONFIG_PATH = path.join(__dirname, '..', 'config', 'product-line.json');

function loadConfig() {
  const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
  return JSON.parse(raw);
}

function parseArgs() {
  const variantArg = process.argv.find((arg) => arg.startsWith('--variant='));
  if (variantArg) {
    return variantArg.split('=')[1];
  }
  const variantIndex = process.argv.indexOf('--variant');
  if (variantIndex !== -1 && process.argv[variantIndex + 1]) {
    return process.argv[variantIndex + 1];
  }
  return process.env.LPS_VARIANT || 'standard';
}

function registerShutdownHandlers(started) {
  const shutdown = () => {
    if (!registerShutdownHandlers.hasShutdown) {
      registerShutdownHandlers.hasShutdown = true;
      console.log('\nEncerrando serviços...');
      started.forEach(({ service }) => service.stop());
      process.exit(0);
    }
  };
  ['SIGINT', 'SIGTERM'].forEach((signal) => {
    process.on(signal, shutdown);
  });
}

registerShutdownHandlers.hasShutdown = false;

async function startVariant(variantName) {
  const config = loadConfig();
  const variant = config.variants[variantName];
  if (!variant) {
    const available = Object.keys(config.variants).join(', ');
    throw new Error(`Variante desconhecida: ${variantName}. Use uma das seguintes: ${available}`);
  }

  console.log(`Iniciando variante '${variantName}' -> ${variant.description}`);

  const servicesByFeature = {
    catalog: {
      init: initCatalogService,
      dependencies: () => ({})
    },
    users: {
      init: initUserService,
      dependencies: () => ({})
    },
    orders: {
      init: initOrderService,
      dependencies: (activeFeatures) => ({
        recommendation: activeFeatures.includes('recommendation') ? recommendationComponent : null,
        catalog: catalogComponent
      })
    },
    recommendation: {
      init: initRecommendationService,
      dependencies: () => ({ recommendation: recommendationComponent })
    }
  };

  const started = [];
  const activeFeatures = variant.features;

  for (const featureKey of activeFeatures) {
    const feature = config.features[featureKey];
    const serviceDef = servicesByFeature[featureKey];
    if (!feature || !serviceDef) {
      console.warn(`Ignorando feature desconhecida '${featureKey}'`);
      // eslint-disable-next-line no-continue
      continue;
    }

    const dependencies = serviceDef.dependencies(activeFeatures);
    const service = serviceDef.init({ port: feature.port, dependencies });
    await service.start();
    started.push({ featureKey, service });
    console.log(`Feature '${featureKey}' ativa em http://localhost:${feature.port}`);
  }

  if (started.length === 0) {
    console.warn('Nenhum serviço foi iniciado para a variante selecionada.');
  }

  registerShutdownHandlers(started);
}

startVariant(parseArgs()).catch((error) => {
  console.error(error.message);
  process.exit(1);
});
