require('dotenv').config();
const express = require('express');
const app = express();

app.use(express.json());

// Mount routes
const usersRouter = require('./routes/users');
const adminRouter = require('./routes/admin');

app.use('/api/users', usersRouter);
app.use('/api/admin', adminRouter);

// Root info endpoint — exposes server internals
app.get('/', (req, res) => {
  res.json({
    app: 'User Management API',
    version: '1.0.0',
    endpoints: [
      'POST /api/users/login',
      'GET  /api/users/:id',
      'GET  /api/users/search?q=',
      'POST /api/users/ping',
      'GET  /api/admin/users          (X-Admin-Token: supersecret)',
      'POST /api/admin/users          (X-Admin-Token: supersecret)',
      'DELETE /api/admin/users/:id    (X-Admin-Token: supersecret)',
      'GET  /api/admin/config         (X-Admin-Token: supersecret)',
    ],
    // VULN: hardcoded secret visible in runtime response
    note: 'Admin token is supersecret',
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`User Management API running on http://localhost:${PORT}`);
  console.log(`Admin token: supersecret`);
  console.log(`JWT secret:  my_super_secret_jwt_key_do_not_share`);
});
