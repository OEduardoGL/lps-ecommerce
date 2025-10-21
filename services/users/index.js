const { createService } = require('../../shared/server');
const profiles = require('../../shared/components/userProfiles');

function routes(app) {
  app.get('/users', async (req, res) => {
    try {
      const users = await profiles.listUsers();
      res.json({ data: users });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/users/:id', async (req, res) => {
    try {
      const user = await profiles.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }
      return res.json(user);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  });

  app.post('/users', async (req, res) => {
    try {
      const user = await profiles.upsertUser(req.body ?? {});
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
