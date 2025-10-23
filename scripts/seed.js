#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const db = require('../shared/db');

const SQL_PATH = path.join(__dirname, '..', 'db', 'init.sql');
const ENV_PATH = path.join(__dirname, '..', '.env');

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

loadEnvFile();

async function seed() {
  const sql = fs.readFileSync(SQL_PATH, 'utf-8');
  await db.withTransaction(async (client) => {
    await client.query(sql);
  });
}

seed()
  .then(() => {
    console.log('Base de dados preparada com sucesso.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Falha ao preparar a base de dados:', error.message);
    process.exit(1);
  });
