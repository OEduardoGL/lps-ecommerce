#!/usr/bin/env node
/* eslint-disable no-console */
const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { Client } = require('pg');

const ROOT = path.join(__dirname, '..');
const ENV_PATH = path.join(ROOT, '.env');

function loadEnvFile() {
  try {
    const raw = fs.readFileSync(ENV_PATH, 'utf-8');
    raw
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .forEach((line) => {
        const eqIndex = line.indexOf('=');
        if (eqIndex === -1) {
          return;
        }
        const key = line.slice(0, eqIndex).trim();
        const value = line.slice(eqIndex + 1).trim();
        if (key && !(key in process.env)) {
          process.env[key] = value;
        }
      });
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.warn('Não foi possível carregar .env:', error.message);
    }
  }
}

function run(command, args, label) {
  const child = spawn(command, args, {
    stdio: 'inherit',
    cwd: ROOT,
    shell: true
  });
  child.on('exit', (code) => {
    console.log(`\n[${label}] processo finalizado com código ${code ?? 'null'}`);
    shutdown(code ?? 0);
  });
  child.on('error', (error) => {
    console.error(`[${label}] falhou ao iniciar:`, error.message);
    shutdown(1);
  });
  return child;
}

function commandExists(command) {
  try {
    execSync(command, { stdio: 'ignore', cwd: ROOT, shell: true });
    return true;
  } catch (error) {
    return false;
  }
}

function detectComposeCommand() {
  if (commandExists('docker compose version')) {
    return { command: 'docker', args: ['compose'] };
  }
  if (commandExists('docker-compose --version')) {
    return { command: 'docker-compose', args: [] };
  }
  return null;
}

function runOnce(command, args, label) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      cwd: ROOT,
      shell: false
    });
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`[${label}] processo finalizado com código ${code ?? 'null'}`));
      }
    });
    child.on('error', (error) => {
      reject(new Error(`[${label}] falhou ao iniciar: ${error.message}`));
    });
  });
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function tryConnectDatabase(config) {
  const client = new Client({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    connectionTimeoutMillis: 1000
  });
  try {
    await client.connect();
    await client.query('SELECT 1');
    return true;
  } catch (error) {
    if (error.code === '28P01' || error.code === '3D000') {
      throw error;
    }
    return false;
  } finally {
    try {
      await client.end();
    } catch (endError) {
    }
  }
}

async function waitForDatabase(config) {
  const retries = Number.parseInt(process.env.DEV_FULL_DB_RETRIES || '30', 10);
  const interval = Number.parseInt(process.env.DEV_FULL_DB_INTERVAL || '1000', 10);

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    const isReady = await tryConnectDatabase(config);
    if (isReady) {
      console.log(`[dev-full] Banco de dados disponível (tentativa ${attempt}).`);
      return;
    }
    await delay(interval);
  }
  throw new Error('Banco de dados não respondeu a tempo. Verifique se o container `db` está saudável.');
}

async function ensureDatabase() {
  const config = {
    host: process.env.PGHOST || '127.0.0.1',
    port: Number.parseInt(process.env.PGPORT || '5432', 10),
    user: process.env.PGUSER || 'lps',
    password: process.env.PGPASSWORD || 'lps_pass',
    database: process.env.PGDATABASE || 'lps_ecommerce'
  };

  const alreadyUp = await tryConnectDatabase(config);
  if (alreadyUp) {
    console.log('[dev-full] Banco de dados já está acessível.');
    return;
  }

  console.log('[dev-full] Banco de dados indisponível. Tentando iniciar container Docker...');
  const compose = detectComposeCommand();
  if (!compose) {
    throw new Error(
      'PostgreSQL não está acessível e não encontramos Docker Compose. Inicie o banco manualmente e rode o comando novamente.'
    );
  }

  await runOnce(compose.command, compose.args.concat(['up', '-d', 'db']), 'docker');
  await waitForDatabase(config);
}

let backend;
let frontend;
let hasShutDown = false;

function shutdown(code) {
  if (hasShutDown) {
    return;
  }
  hasShutDown = true;
  if (backend && !backend.killed) {
    backend.kill('SIGINT');
  }
  if (frontend && !frontend.killed) {
    frontend.kill('SIGINT');
  }
  setTimeout(() => {
    process.exit(code);
  }, 300);
}

async function main() {
  loadEnvFile();

  try {
    await ensureDatabase();
  } catch (error) {
    console.error(`[dev-full] ${error.message}`);
    process.exit(1);
  }

  console.log('[dev-full] LPS_VARIANT =', process.env.LPS_VARIANT || 'standard');

  backend = run('npm', ['run', 'start:variant'], 'backend');
  frontend = run('npm', ['run', 'dev', '--prefix', 'front'], 'frontend');
}

main();

process.on('SIGINT', () => {
  console.log('\nEncerrando processos...');
  shutdown(0);
});

process.on('SIGTERM', () => {
  shutdown(0);
});
