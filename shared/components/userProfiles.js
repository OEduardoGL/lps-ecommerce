const { v4: uuid } = require('uuid');
const db = require('../db');

async function listUsers(client) {
  const { rows } = await db.query(
    `SELECT id, name, email, favorite_categories AS "favoriteCategories"
       FROM users
       ORDER BY name`,
    [],
    client
  );
  return rows;
}

async function findById(id, client) {
  const { rows } = await db.query(
    `SELECT id, name, email, favorite_categories AS "favoriteCategories"
       FROM users
       WHERE id = $1`,
    [id],
    client
  );
  return rows[0] || null;
}

async function findByEmail(email, client) {
  const { rows } = await db.query(
    `SELECT id, name, email, favorite_categories AS "favoriteCategories"
       FROM users
       WHERE email = $1`,
    [email],
    client
  );
  return rows[0] || null;
}

async function upsertUser(payload, client) {
  if (!payload?.email) {
    throw new Error('Email é obrigatório');
  }
  if (!payload?.name) {
    throw new Error('Nome é obrigatório');
  }

  const favoriteCategories = Array.isArray(payload.favoriteCategories)
    ? payload.favoriteCategories
    : [];
  const explicitId = payload.id || null;
  const newId = explicitId || `u-${uuid()}`;

  const { rows } = await db.query(
    `INSERT INTO users (id, name, email, favorite_categories)
       VALUES ($1, $2, $3, $4)
     ON CONFLICT (email) DO UPDATE
       SET name = EXCLUDED.name,
           favorite_categories = EXCLUDED.favorite_categories
     RETURNING id, name, email, favorite_categories AS "favoriteCategories"`,
    [newId, payload.name, payload.email, favoriteCategories],
    client
  );

  return rows[0];
}

module.exports = {
  listUsers,
  findById,
  findByEmail,
  upsertUser
};
