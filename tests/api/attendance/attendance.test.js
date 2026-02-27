const request = require('supertest');

jest.mock('../../../src/db/connection');
jest.mock('../../../src/api/middleware/auth', () => (req, res, next) => next());

const connection = require('../../../src/db/connection');
const app = require('../../setup');

describe('Attendance API', () => {
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

  describe('GET /by-group/:id', () => {
    test('возвращает посещаемость по группе', async () => {
      const rows = [
        { name: 'Иванов Иван', date_of_lesson: '2025-02-01', presence: 1 },
      ];
      mockQuery.mockResolvedValueOnce([rows, []]);
      const res = await request(app).get('/api/attendance/by-group/1');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0]).toMatchObject({ name: 'Иванов Иван', presence: 1 });
    });
    test('пустой список при отсутствии данных', async () => {
      mockQuery.mockResolvedValueOnce([[], []]);
      const res = await request(app).get('/api/attendance/by-group/1');
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });
    test('ошибка при невалидном id группы', async () => {
      const res = await request(app).get('/api/attendance/by-group/0');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Некорректный id группы.');
    });
  });

  describe('PUT /by-group-date', () => {
    test('возвращает посещаемость по группе и дате', async () => {
      const rows = [
        { name: 'Иванов Иван', date_of_lesson: '2025-02-01', presence: 1 },
      ];
      mockQuery.mockResolvedValueOnce([rows, []]);
      const res = await request(app)
        .put('/api/attendance/by-group-date')
        .send({ group_id: 1, date: '2025-02-01' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
    test('ошибка без group_id или date', async () => {
      const res = await request(app)
        .put('/api/attendance/by-group-date')
        .send({ group_id: 1 });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/group_id и date/);
    });
    test('ошибка при невалидном group_id', async () => {
      const res = await request(app)
        .put('/api/attendance/by-group-date')
        .send({ group_id: 0, date: '2025-02-01' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /by-group-date-new', () => {
    test('возвращает данные с id_student', async () => {
      const rows = [
        { id_student: 1, name: 'Иванов Иван', date_of_lesson: '2025-02-01', presence: 1 },
      ];
      mockQuery.mockResolvedValueOnce([rows, []]);
      const res = await request(app)
        .put('/api/attendance/by-group-date-new')
        .send({ group_id: 1, date: '2025-02-01' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data[0]).toHaveProperty('id_student', 1);
    });
    test('ошибка без group_id или date', async () => {
      const res = await request(app)
        .put('/api/attendance/by-group-date-new')
        .send({ date: '2025-02-01' });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/group_id и date/);
    });
  });

  describe('POST /', () => {
    test('создание/обновление посещаемости — 201', async () => {
      mockQuery
        .mockResolvedValueOnce([[], []])
        .mockResolvedValueOnce([{}, []]);
      const res = await request(app)
        .post('/api/attendance/')
        .send({
          student_id: 1,
          group_id: 2,
          date_of_lesson: '2025-02-01',
          presence: 1,
        });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject({ ok: true });
    });
    test('ошибка без обязательных полей', async () => {
      const res = await request(app)
        .post('/api/attendance/')
        .send({ student_id: 1, group_id: 2 });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/student_id, group_id, date_of_lesson, presence/);
    });
    test('ошибка при невалидном student_id', async () => {
      const res = await request(app)
        .post('/api/attendance/')
        .send({
          student_id: 0,
          group_id: 2,
          date_of_lesson: '2025-02-01',
          presence: 1,
        });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});
