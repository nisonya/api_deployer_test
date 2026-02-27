const request = require('supertest');

jest.mock('../../../src/db/connection');
jest.mock('../../../src/api/middleware/auth', () => (req, res, next) => next());

const connection = require('../../../src/db/connection');
const app = require('../../setup');

describe('Reference API', () => {
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

  describe('GET /rooms', () => {
    test('возвращает массив комнат', async () => {
      mockQuery.mockResolvedValueOnce([[{ id: 1, name: 'Кабинет 101' }], []]);
      const res = await request(app).get('/api/reference/rooms');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0]).toMatchObject({ id: 1, name: 'Кабинет 101' });
    });
    test('пустой список при отсутствии данных', async () => {
      mockQuery.mockResolvedValueOnce([[], []]);
      const res = await request(app).get('/api/reference/rooms');
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });
    test('ответ содержит success и data', async () => {
      mockQuery.mockResolvedValueOnce([[], []]);
      const res = await request(app).get('/api/reference/rooms');
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
    });
  });

  describe('GET /access', () => {
    test('возвращает массив уровней доступа', async () => {
      mockQuery.mockResolvedValueOnce([[{ id: 1, name: 'Админ' }], []]);
      const res = await request(app).get('/api/reference/access');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
    test('пустой список', async () => {
      mockQuery.mockResolvedValueOnce([[], []]);
      const res = await request(app).get('/api/reference/access');
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });
    test('структура элемента id и name', async () => {
      mockQuery.mockResolvedValueOnce([[{ id: 2, name: 'User' }], []]);
      const res = await request(app).get('/api/reference/access');
      expect(res.body.data[0]).toHaveProperty('id');
      expect(res.body.data[0]).toHaveProperty('name');
    });
  });

  describe('GET /positions', () => {
    test('возвращает массив должностей', async () => {
      mockQuery.mockResolvedValueOnce([[{ id: 1, name: 'Педагог' }], []]);
      const res = await request(app).get('/api/reference/positions');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
    test('пустой список', async () => {
      mockQuery.mockResolvedValueOnce([[], []]);
      const res = await request(app).get('/api/reference/positions');
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });
    test('ответ 200 и success', async () => {
      mockQuery.mockResolvedValueOnce([[], []]);
      const res = await request(app).get('/api/reference/positions');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /docs', () => {
    test('возвращает массив документов', async () => {
      mockQuery.mockResolvedValueOnce([[{ id: 1 }], []]);
      const res = await request(app).get('/api/reference/docs');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
    test('пустой список', async () => {
      mockQuery.mockResolvedValueOnce([[], []]);
      const res = await request(app).get('/api/reference/docs');
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });
  });

  describe('GET /types-of-holding', () => {
    test('возвращает массив форматов проведения', async () => {
      mockQuery.mockResolvedValueOnce([[{ id: 1 }], []]);
      const res = await request(app).get('/api/reference/types-of-holding');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /levels', () => {
    test('возвращает массив уровней мероприятий', async () => {
      mockQuery.mockResolvedValueOnce([[{ id: 1, name: 'Городской' }], []]);
      const res = await request(app).get('/api/reference/levels');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
    test('ошибка БД — 500 и сообщение', async () => {
      mockQuery.mockRejectedValueOnce(new Error('DB'));
      const res = await request(app).get('/api/reference/levels');
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBeDefined();
    });
  });
});
