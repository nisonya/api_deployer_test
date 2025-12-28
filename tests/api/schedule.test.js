const request = require('supertest');
const app = require('../setup');

describe('Shedule API', () => {
  test('GET /api/schedule/ — возвращает данные', async () => {
    const res = await request(app).get('/api/schedule/');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toEqual('schedule ')
  });

  test('POST /api/schedule/ — ошибка без данных', async () => {
    const res = await request(app)
      .post('/api/schedule/')
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/schedule/ — успех', async () => {
    const res = await request(app)
      .post('/api/schedule/')
      .send({ schedule_id: 1, time: 5 });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });
});