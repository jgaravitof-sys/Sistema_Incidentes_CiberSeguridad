const request = require('supertest');
const app = require('../server'); // Si exportas app en server.js, modifica server.js para module.exports = app;

describe('Auth', () => {
  it('Register and login', async () => {
    const email = `test${Date.now()}@local`;
    await request(app).post('/api/auth/register').send({ nombre: 'Test', email, contraseña: '123456', rol: 'Cliente' }).expect(201);
    const login = await request(app).post('/api/auth/login').send({ email, contraseña: '123456' }).expect(200);
    expect(login.body.token).toBeDefined();
  });
});
