const request = require('supertest');

jest.mock('../../../src/db/connection');
jest.mock('../../../src/api/middleware/auth', () => (req, res, next) => next());

const connection = require('../../../src/db/connection');
const app = require('../../setup');

describe('Rent API', () => {
  let mockQuery;
  let mockRelease;

  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery = jest.fn();
    mockRelease = jest.fn();
    connection.getPool.mockResolvedValue({
      getConnection: jest.fn().mockResolvedValue({
        query: mockQuery,
        release: mockRelease,
      }),
    });
  });

  describe('GET /by-event/:id', () => {
    test('returns rent by event id', async () => {
      const rows = [{ id_rent: 1, id_event: 5, date: '2025-01-15', name: 'Room 1' }];
      mockQuery.mockResolvedValueOnce([rows, []]);
      const res = await request(app).get('/api/rent/by-event/5');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0]).toMatchObject({ id_rent: 1, id_event: 5 });
    });
    test('empty list when no rent', async () => {
      mockQuery.mockResolvedValueOnce([[], []]);
      const res = await request(app).get('/api/rent/by-event/1');
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });
    test('400 on invalid id', async () => {
      const res = await request(app).get('/api/rent/by-event/0');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Некорректный id мероприятия.');
    });
  });

  describe('GET /by-id/:id', () => {
    test('returns single rent record', async () => {
      const row = { id_rent: 2, id_event: 3, date: '2025-01-20', name: 'Hall' };
      mockQuery.mockResolvedValueOnce([[row], []]);
      const res = await request(app).get('/api/rent/by-id/2');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject({ id_rent: 2 });
    });
    test('404 when not found', async () => {
      mockQuery.mockResolvedValueOnce([[], []]);
      const res = await request(app).get('/api/rent/by-id/999');
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Аренда не найдена.');
    });
    test('400 on invalid id', async () => {
      const res = await request(app).get('/api/rent/by-id/0');
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Некорректный id.');
    });
  });

  describe('POST /by-date-room', () => {
    test('success with date and room_id', async () => {
      mockQuery.mockResolvedValueOnce([[{ id_rent: 1 }], []]);
      const res = await request(app)
        .post('/api/rent/by-date-room')
        .send({ date: '2025-02-01', room_id: 1 });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
    test('400 without date or room_id', async () => {
      const res = await request(app)
        .post('/api/rent/by-date-room')
        .send({ date: '2025-02-01' });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/date и room_id/);
    });
  });

  describe('POST /', () => {
    test('create rent 201 and id', async () => {
      mockQuery.mockResolvedValueOnce([{ insertId: 10 }, []]);
      const res = await request(app)
        .post('/api/rent/')
        .send({
          event_id: 1,
          room_id: 2,
          date: '2025-02-10',
          start_time: '09:00',
          end_time: '10:00',
        });
      expect(res.status).toBe(201);
      expect(res.body.data).toMatchObject({ id: 10 });
    });
    test('400 without required fields', async () => {
      const res = await request(app).post('/api/rent/').send({ event_id: 1 });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/event_id, room_id, date/);
    });
  });

  describe('PUT /', () => {
    test('update rent success', async () => {
      mockQuery.mockResolvedValueOnce([{ affectedRows: 1 }, []]);
      const res = await request(app)
        .put('/api/rent/')
        .send({
          id: 1,
          event_id: 1,
          room_id: 2,
          date: '2025-02-15',
          start_time: '10:00',
          end_time: '11:00',
        });
      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({ ok: true });
    });
    test('404 when not found', async () => {
      mockQuery.mockResolvedValueOnce([{ affectedRows: 0 }, []]);
      const res = await request(app)
        .put('/api/rent/')
        .send({
          id: 999,
          event_id: 1,
          room_id: 2,
          date: '2025-02-15',
          start_time: '10:00',
          end_time: '11:00',
        });
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Аренда не найдена.');
    });
    test('400 without id or fields', async () => {
      const res = await request(app).put('/api/rent/').send({ id: 1 });
      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /:id', () => {
    test('delete success', async () => {
      mockQuery.mockResolvedValueOnce([{ affectedRows: 1 }, []]);
      const res = await request(app).delete('/api/rent/5');
      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({ ok: true });
    });
    test('404 when not found', async () => {
      mockQuery.mockResolvedValueOnce([{ affectedRows: 0 }, []]);
      const res = await request(app).delete('/api/rent/999');
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Аренда не найдена.');
    });
    test('400 on invalid id', async () => {
      const res = await request(app).delete('/api/rent/0');
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Некорректный id.');
    });
  });
});
