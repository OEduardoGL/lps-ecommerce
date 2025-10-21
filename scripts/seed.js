#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const db = require('../shared/db');

const SQL_PATH = path.join(__dirname, '..', 'db', 'init.sql');

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
