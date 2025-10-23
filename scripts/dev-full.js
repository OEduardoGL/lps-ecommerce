#!/usr/bin/env node
/* eslint-disable no-console */
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

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
    // Quando um processo termina, encerramos o outro e propagamos o código de saída
    shutdown(code ?? 0);
  });
  child.on('error', (error) => {
    console.error(`[${label}] falhou ao iniciar:`, error.message);
    shutdown(1);
  });
  return child;
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
  // Aguarda um pouco para processos se encerrarem
  setTimeout(() => {
    process.exit(code);
  }, 300);
}

loadEnvFile();

console.log('[dev-full] LPS_VARIANT =', process.env.LPS_VARIANT || 'standard');

backend = run('npm', ['run', 'start:variant'], 'backend');
frontend = run('npm', ['run', 'dev', '--prefix', 'front'], 'frontend');

process.on('SIGINT', () => {
  console.log('\nEncerrando processos...');
  shutdown(0);
});

process.on('SIGTERM', () => {
  shutdown(0);
});
