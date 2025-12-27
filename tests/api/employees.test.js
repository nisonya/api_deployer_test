const request = require('supertest');
const app = require('./setup');

describe('Employees API', () => {
  test('GET /api/employees/ — возвращает данные', async () => {
    const res = await request(app).get('/api/employees/');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual('employees');
  });

  test('POST /api/employees/ — ошибка без данных', async () => {
    const res = await request(app)
      .post('/api/employees/')
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/employees/ — успех', async () => {
    const res = await request(app)
      .post('/api/employees/')
      .send({ event_id: 1, employee_id: 5 });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });
});