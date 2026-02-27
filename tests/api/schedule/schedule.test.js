/**
 * Тесты эндпоинтов Schedule.
 * Мок БД и auth, проверка статусов, success, data и валидации.
 */
const request = require('supertest');

jest.mock('../../../src/db/connection');
jest.mock('../../../src/api/middleware/auth', () => (req, res, next) => next());

const connection = require('../../../src/db/connection');
const app = require('../../setup');

describe('Schedule API', () => {
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

  describe('GET /', () => {
    test('возвращает массив расписания', async () => {
      mockQuery.mockResolvedValueOnce([[{ id: 1, room: 'Каб. 1', group: 'ПР-01', startTime: '08:00', endTime: '09:00' }], []]);
      const res = await request(app).get('/api/schedule/');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0]).toMatchObject({ id: 1 });
    });
    test('пустой список', async () => {
      mockQuery.mockResolvedValueOnce([[], []]);
      const res = await request(app).get('/api/schedule/');
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });
  });

  describe('GET /teachers', () => {
    test('возвращает список преподавателей', async () => {
      mockQuery.mockResolvedValueOnce([[{ id: 1, name: 'Иванов И.И.' }], []]);
      const res = await request(app).get('/api/schedule/teachers');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0]).toMatchObject({ id: 1, name: 'Иванов И.И.' });
    });
    test('пустой список', async () => {
      mockQuery.mockResolvedValueOnce([[], []]);
      const res = await request(app).get('/api/schedule/teachers');
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });
  });

  describe('GET /groups', () => {
    test('возвращает список групп', async () => {
      mockQuery.mockResolvedValueOnce([[{ id: 1, name: 'ПР-01' }, { id: 2, name: 'ПР-02' }], []]);
      const res = await request(app).get('/api/schedule/groups');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0]).toMatchObject({ id: 1, name: 'ПР-01' });
    });
  });

  describe('POST /by-date', () => {
    test('успех при date и room_id', async () => {
      mockQuery.mockResolvedValueOnce([[{ name: 'ПР-01', startTime: '08:00', endTime: '09:00' }], []]);
      const res = await request(app).post('/api/schedule/by-date').send({ date: '2025-02-01', room_id: 1 });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
    test('400 без date или room_id', async () => {
      const res = await request(app).post('/api/schedule/by-date').send({ date: '2025-02-01' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/date и room_id/);
    });
    test('400 при невалидном room_id', async () => {
      const res = await request(app).post('/api/schedule/by-date').send({ date: '2025-02-01', room_id: 0 });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /by-teacher/:id', () => {
    test('возвращает расписание преподавателя', async () => {
      mockQuery.mockResolvedValueOnce([[{ room: 'Каб. 1', group: 'ПР-01', startTime: '08:00', day: 'Пн' }], []]);
      const res = await request(app).get('/api/schedule/by-teacher/1');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
    });
    test('пустой список', async () => {
      mockQuery.mockResolvedValueOnce([[], []]);
      const res = await request(app).get('/api/schedule/by-teacher/1');
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });
    test('400 при невалидном id', async () => {
      const res = await request(app).get('/api/schedule/by-teacher/0');
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Некорректный id преподавателя.');
    });
  });

  describe('GET /by-group/:id', () => {
    test('возвращает расписание группы', async () => {
      mockQuery.mockResolvedValueOnce([[{ room: 'Каб. 2', group: 'ПР-01', startTime: '09:00' }], []]);
      const res = await request(app).get('/api/schedule/by-group/2');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
    test('400 при невалидном id', async () => {
      const res = await request(app).get('/api/schedule/by-group/0');
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Некорректный id группы.');
    });
  });

  describe('GET /by-room/:id', () => {
    test('возвращает расписание по комнате', async () => {
      mockQuery.mockResolvedValueOnce([[{ room: 'Каб. 1', group: 'ПР-01' }], []]);
      const res = await request(app).get('/api/schedule/by-room/1');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
    test('400 при невалидном id', async () => {
      const res = await request(app).get('/api/schedule/by-room/0');
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Некорректный id комнаты.');
    });
  });

  describe('POST / (addSchedule)', () => {
    test('успех — 201 и id', async () => {
      mockQuery
        .mockResolvedValueOnce([{ insertId: 5 }, []])
        .mockResolvedValueOnce([{}, []]);
      const res = await request(app)
        .post('/api/schedule/')
        .send({
          room_id: 1,
          group_id: 1,
          start_time: '08:00',
          end_time: '09:00',
          day: 1,
          employee_id: 1,
        });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject({ id: 5 });
    });
    test('400 без обязательных полей', async () => {
      const res = await request(app).post('/api/schedule/').send({});
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/room_id, group_id/);
    });
    test('400 при невалидном room_id', async () => {
      const res = await request(app)
        .post('/api/schedule/')
        .send({
          room_id: 0,
          group_id: 1,
          start_time: '08:00',
          end_time: '09:00',
          day: 1,
          employee_id: 1,
        });
      expect(res.status).toBe(400);
    });
  });

  describe('PUT / (updateSchedule)', () => {
    test('успех', async () => {
      mockQuery.mockResolvedValueOnce([{}, []]).mockResolvedValueOnce([{}, []]);
      const res = await request(app)
        .put('/api/schedule/')
        .send({
          id: 1,
          room_id: 2,
          group_id: 1,
          start_time: '09:00',
          end_time: '10:00',
        });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject({ ok: true });
    });
    test('400 без id или полей', async () => {
      const res = await request(app).put('/api/schedule/').send({ id: 1 });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/id, room_id, group_id, start_time, end_time/);
    });
    test('400 при невалидном id', async () => {
      const res = await request(app)
        .put('/api/schedule/')
        .send({
          id: 0,
          room_id: 1,
          group_id: 1,
          start_time: '08:00',
          end_time: '09:00',
        });
      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /:id', () => {
    test('успех', async () => {
      mockQuery.mockResolvedValueOnce([{}, []]).mockResolvedValueOnce([{ affectedRows: 1 }, []]);
      const res = await request(app).delete('/api/schedule/3');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject({ ok: true });
    });
    test('404 при отсутствии', async () => {
      mockQuery.mockResolvedValueOnce([{}, []]).mockResolvedValueOnce([{ affectedRows: 0 }, []]);
      const res = await request(app).delete('/api/schedule/999');
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Занятие не найдено.');
    });
    test('400 при невалидном id', async () => {
      const res = await request(app).delete('/api/schedule/0');
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Некорректный id.');
    });
  });
});
