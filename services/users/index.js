const { createService } = require('../../shared/server');
const profiles = require('../../shared/components/userProfiles');

function routes(app) {
  app.get('/users', (req, res) => {
    res.json({ data: profiles.listUsers() });
  });

  app.get('/users/:id', (req, res) => {
    const user = profiles.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    return res.json(user);
  });

  app.post('/users', (req, res) => {
    try {
      const user = profiles.upsertUser(req.body ?? {});
      res.status(201).json(user);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
}

function initUserService({ port }) {
  return createService({ name: 'users', port, routes });
}

module.exports = { initUserService };
