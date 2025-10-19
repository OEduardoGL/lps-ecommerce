const { users } = require('../data/users');

function listUsers() {
  return users;
}

function findById(id) {
  return users.find((user) => user.id === id);
}

function findByEmail(email) {
  return users.find((user) => user.email === email);
}

function upsertUser(payload) {
  const existing = payload.id ? findById(payload.id) : findByEmail(payload.email);
  if (existing) {
    existing.name = payload.name ?? existing.name;
    existing.favoriteCategories = payload.favoriteCategories ?? existing.favoriteCategories;
    return existing;
  }
  const newUser = {
    id: `u-${users.length + 1}`,
    name: payload.name,
    email: payload.email,
    favoriteCategories: payload.favoriteCategories ?? []
  };
  users.push(newUser);
  return newUser;
}

module.exports = {
  listUsers,
  findById,
  findByEmail,
  upsertUser
};
