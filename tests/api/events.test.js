const request = require('supertest');
const app = require('../setup');

describe('Events API', () => {
  test('GET /api/events/organization — возвращает данные', async () => {
    const res = await request(app).get('/api/events/organization');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toEqual('events organization')
  });

  test('POST /api/events/participation — ошибка без данных', async () => {
    const res = await request(app)
      .post('/api/events/participation')
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/events/participation — успех', async () => {
    const res = await request(app)
      .post('/api/events/participation')
      .send({ event_id: 1, name: 5 });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });
});