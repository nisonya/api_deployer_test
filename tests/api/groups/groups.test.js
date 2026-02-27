const request = require('supertest');

jest.mock('../../../src/db/connection');
jest.mock('../../../src/api/middleware/auth', () => (req, res, next) => next());

const connection = require('../../../src/db/connection');
const app = require('../../setup');

describe('Group API', () => {
  let mockQuery;
  let mockRelease;

  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery = jest.fn();
    mockRelease = jest.fn();
    connection.getPool.mockResolvedValue({
      getConnection: jest.fn().mockResolvedValue({
        query: mockQuery,
        release: mockRelease
      })
    });
  });

  test('GET /by-teacher/:id — возвращает группы преподавателя', async () => {
    const fakeRows = [
      { id: 1, name: 'ПР-01'},
      { id: 2, name: 'ПР-012'}
    ];
    mockQuery.mockResolvedValueOnce([ fakeRows, [] ]);

    const res = await request(app).get('/api/groups/by-teacher/1');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0]).toMatchObject({ id: 1, name: 'ПР-01' });
    expect(res.body.data[1]).toMatchObject({ id: 2, name: 'ПР-012' });
  });

  test('GET /by-teacher/:id — пустой список при отсутствии данных', async () => {
    mockQuery.mockResolvedValueOnce([ [], [] ]);

    const res = await request(app).get('/api/groups/by-teacher/1');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual([]);
  });
  test('GET /by-teacher/:id — ошибка при невалидном id', async () => {
    const res = await request(app).get('/api/groups/by-teacher/0');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Некорректный id преподавателя.');
  });

  describe('GET /table', () => {
    test('возвращает массив записей students_groups', async () => {
      const fakeRows = [{ idStudent: 1, idGroup: 2 }, { idStudent: 3, idGroup: 2 }];
      mockQuery.mockResolvedValueOnce([fakeRows, []]);
      const res = await request(app).get('/api/groups/table');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data).toHaveLength(2);
    });

    test('пустой список при отсутствии данных', async () => {
      mockQuery.mockResolvedValueOnce([[], []]);
      const res = await request(app).get('/api/groups/table');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual([]);
    });

    test('ответ содержит success и data', async () => {
      mockQuery.mockResolvedValueOnce([[], []]);
      const res = await request(app).get('/api/groups/table');
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
    });
  });

  describe('GET /pixels/:id', () => {
    test('возвращает пиксели по id группы', async () => {
      const fakeRows = [{ name: 'Иванов Иван', id_student: 1, part_of_comp: 1 }];
      mockQuery.mockResolvedValueOnce([fakeRows, []]);
      const res = await request(app).get('/api/groups/pixels/1');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0]).toMatchObject({ name: 'Иванов Иван', id_student: 1 });
    });

    test('пустой массив при отсутствии данных', async () => {
      mockQuery.mockResolvedValueOnce([[], []]);
      const res = await request(app).get('/api/groups/pixels/1');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual([]);
    });

    test('ошибка при невалидном id группы', async () => {
      const res = await request(app).get('/api/groups/pixels/0');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Некорректный id группы.');
    });
  });

  describe('GET /list', () => {
    test('возвращает список групп id и name', async () => {
      const fakeRows = [{ id: 1, name: 'ПР-01' }, { id: 2, name: 'ПР-02' }];
      mockQuery.mockResolvedValueOnce([fakeRows, []]);
      const res = await request(app).get('/api/groups/list');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0]).toMatchObject({ id: 1, name: 'ПР-01' });
    });

    test('пустой список при отсутствии групп', async () => {
      mockQuery.mockResolvedValueOnce([[], []]);
      const res = await request(app).get('/api/groups/list');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual([]);
    });

    test('каждый элемент содержит id и name', async () => {
      mockQuery.mockResolvedValueOnce([[{ id: 10, name: 'Группа' }], []]);
      const res = await request(app).get('/api/groups/list');
      expect(res.status).toBe(200);
      expect(res.body.data[0]).toHaveProperty('id');
      expect(res.body.data[0]).toHaveProperty('name');
    });
  });

  describe('PUT /pixels', () => {
    test('успех при id_student и поле пикселей', async () => {
      mockQuery.mockResolvedValueOnce([{ affectedRows: 1 }, []]);
      const res = await request(app)
        .put('/api/groups/pixels')
        .send({ id_student: 5, part_of_comp: 1 });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject({ ok: true, affected: 1 });
    });

    test('ошибка без id_student (или id)', async () => {
      const res = await request(app)
        .put('/api/groups/pixels')
        .send({ part_of_comp: 1 });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Нужен id_student (или id).');
    });

    test('ошибка без полей пикселей', async () => {
      const res = await request(app)
        .put('/api/groups/pixels')
        .send({ id_student: 5 });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Нужны хотя бы одно поле пикселей.');
    });
  });
});
