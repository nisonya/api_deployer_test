const request = require('supertest');

jest.mock('../../../src/db/connection');
jest.mock('../../../src/api/middleware/auth', () => (req, res, next) => {
  req.user = { id: 1, accessLevel: 1 };
  next();
});

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

  describe('CRUD /docs', () => {
    test('POST /docs — добавляет документ', async () => {
      mockQuery.mockResolvedValueOnce([{ insertId: 12 }, []]);
      const res = await request(app)
        .post('/api/reference/docs')
        .send({ name: 'Положение', link: 'https://example.com/doc' });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(12);
    });

    test('POST /docs — 400 при пустых полях', async () => {
      const res = await request(app)
        .post('/api/reference/docs')
        .send({ name: ' ', link: '' });
      expect(res.status).toBe(400);
    });

    test('PUT /docs/:id — обновляет документ', async () => {
      mockQuery.mockResolvedValueOnce([{ affectedRows: 1 }, []]);
      const res = await request(app)
        .put('/api/reference/docs/5')
        .send({ name: 'Новое имя', link: 'https://example.com/new' });
      expect(res.status).toBe(200);
      expect(res.body.data.ok).toBe(true);
    });

    test('PUT /docs/:id — 404 при отсутствии', async () => {
      mockQuery.mockResolvedValueOnce([{ affectedRows: 0 }, []]);
      const res = await request(app)
        .put('/api/reference/docs/555')
        .send({ name: 'Новое имя', link: 'https://example.com/new' });
      expect(res.status).toBe(404);
    });

    test('DELETE /docs/:id — удаляет документ', async () => {
      mockQuery.mockResolvedValueOnce([{ affectedRows: 1 }, []]);
      const res = await request(app).delete('/api/reference/docs/7');
      expect(res.status).toBe(200);
      expect(res.body.data.ok).toBe(true);
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

  describe('GET /types-of-organization', () => {
    test('возвращает массив типов организации', async () => {
      mockQuery.mockResolvedValueOnce([[{ id: 1, name: 'Комплексный план' }], []]);
      const res = await request(app).get('/api/reference/types-of-organization');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data[0]).toMatchObject({ id: 1, name: 'Комплексный план' });
    });
    test('ошибка БД — 500', async () => {
      mockQuery.mockRejectedValueOnce(new Error('DB'));
      const res = await request(app).get('/api/reference/types-of-organization');
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
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

  describe('GET /access/:employeeId', () => {
    test('возвращает уровень доступа сотрудника', async () => {
      mockQuery.mockResolvedValueOnce([[{ access_level_id: 2 }], []]);
      const res = await request(app).get('/api/reference/access/5');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject({ access_level_id: 2 });
    });
    test('404 если профиль не найден', async () => {
      mockQuery.mockResolvedValueOnce([[], []]);
      const res = await request(app).get('/api/reference/access/999');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
    test('400 при невалидном id', async () => {
      const res = await request(app).get('/api/reference/access/0');
      expect(res.status).toBe(400);
    });
  });

  describe('GET /student-statuses', () => {
    test('возвращает массив статусов учеников', async () => {
      mockQuery.mockResolvedValueOnce([[{ id: 1, name: 'Участник' }, { id: 2, name: 'Победитель' }], []]);
      const res = await request(app).get('/api/reference/student-statuses');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0]).toMatchObject({ id: 1, name: 'Участник' });
    });
    test('ошибка БД — 500', async () => {
      mockQuery.mockRejectedValueOnce(new Error('DB'));
      const res = await request(app).get('/api/reference/student-statuses');
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  /* ── CRUD должностей ── */

  describe('POST /positions', () => {
    test('создаёт должность', async () => {
      mockQuery.mockResolvedValueOnce([{ insertId: 13 }, []]);
      const res = await request(app)
        .post('/api/reference/positions')
        .send({ name: 'Методист' });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(13);
    });
    test('400 без name', async () => {
      const res = await request(app)
        .post('/api/reference/positions')
        .send({});
      expect(res.status).toBe(400);
    });
    test('400 при пустом name', async () => {
      const res = await request(app)
        .post('/api/reference/positions')
        .send({ name: '   ' });
      expect(res.status).toBe(400);
    });
  });

  describe('PUT /positions/:id', () => {
    test('обновляет должность', async () => {
      mockQuery.mockResolvedValueOnce([{ affectedRows: 1 }, []]);
      const res = await request(app)
        .put('/api/reference/positions/3')
        .send({ name: 'Старший педагог' });
      expect(res.status).toBe(200);
      expect(res.body.data.ok).toBe(true);
    });
    test('404 при отсутствии', async () => {
      mockQuery.mockResolvedValueOnce([{ affectedRows: 0 }, []]);
      const res = await request(app)
        .put('/api/reference/positions/999')
        .send({ name: 'Тест' });
      expect(res.status).toBe(404);
    });
    test('400 без name', async () => {
      const res = await request(app)
        .put('/api/reference/positions/3')
        .send({});
      expect(res.status).toBe(400);
    });
    test('400 при невалидном id', async () => {
      const res = await request(app)
        .put('/api/reference/positions/0')
        .send({ name: 'Тест' });
      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /positions/:id', () => {
    test('удаляет должность без сотрудников', async () => {
      mockQuery
        .mockResolvedValueOnce([[{ cnt: 0 }], []])   // active count
        .mockResolvedValueOnce([{ affectedRows: 0 }, []])  // nullify inactive
        .mockResolvedValueOnce([{ affectedRows: 1 }, []]); // delete
      const res = await request(app).delete('/api/reference/positions/5');
      expect(res.status).toBe(200);
      expect(res.body.data.ok).toBe(true);
    });
    test('обнуляет должность у неактивных и удаляет', async () => {
      mockQuery
        .mockResolvedValueOnce([[{ cnt: 0 }], []])   // 0 active
        .mockResolvedValueOnce([{ affectedRows: 2 }, []])  // nullified 2 inactive
        .mockResolvedValueOnce([{ affectedRows: 1 }, []]); // delete
      const res = await request(app).delete('/api/reference/positions/7');
      expect(res.status).toBe(200);
      expect(res.body.data.ok).toBe(true);
      const updateSql = mockQuery.mock.calls[1][0];
      expect(updateSql).toContain('SET `position` = NULL');
      expect(updateSql).toContain('is_active = 0');
    });
    test('409 при активных сотрудниках', async () => {
      mockQuery.mockResolvedValueOnce([[{ cnt: 3 }], []]);
      const res = await request(app).delete('/api/reference/positions/2');
      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('активные сотрудники');
    });
    test('404 при отсутствии должности', async () => {
      mockQuery
        .mockResolvedValueOnce([[{ cnt: 0 }], []])
        .mockResolvedValueOnce([{ affectedRows: 0 }, []])
        .mockResolvedValueOnce([{ affectedRows: 0 }, []]);
      const res = await request(app).delete('/api/reference/positions/999');
      expect(res.status).toBe(404);
    });
    test('400 при невалидном id', async () => {
      const res = await request(app).delete('/api/reference/positions/0');
      expect(res.status).toBe(400);
    });
  });
});
