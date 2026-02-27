const request = require('supertest');

jest.mock('../../../src/db/connection');
jest.mock('../../../src/api/middleware/auth', () => (req, res, next) => next());

const connection = require('../../../src/db/connection');
const app = require('../../setup');

describe('Employees API', () => {
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

  describe('GET /', () => {
    test('возвращает массив сотрудников', async () => {
      const fakeRows = [
        { id_employees: 1, first_name: 'Иван', second_name: 'Иванов', position: 1, position_name: 'Педагог' }
      ];
      mockQuery.mockResolvedValueOnce([ fakeRows, [] ]);
      const res = await request(app).get('/api/employees/');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0]).toMatchObject({ id_employees: 1, first_name: 'Иван', second_name: 'Иванов' });
    });
    test('пустой список при отсутствии данных', async () => {
      mockQuery.mockResolvedValueOnce([ [], [] ]);
      const res = await request(app).get('/api/employees/');
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });
  });

  describe('GET /all', () => {
    test('возвращает legacy-список', async () => {
      mockQuery.mockResolvedValueOnce([[{ id_employees: 1, first_name: 'Иван', position: 'Педагог' }], []]);
      const res = await request(app).get('/api/employees/all');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /schedule', () => {
    test('возвращает расписание', async () => {
      mockQuery.mockResolvedValueOnce([[{ id_employees: 1, employee_name: 'Иванов Иван' }], []]);
      const res = await request(app).get('/api/employees/schedule');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /short-list', () => {
    test('возвращает краткий список id, name', async () => {
      mockQuery.mockResolvedValueOnce([[{ id: 1, name: 'Иванов Иван' }], []]);
      const res = await request(app).get('/api/employees/short-list');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data[0]).toMatchObject({ id: 1, name: 'Иванов Иван' });
    });
  });

  describe('GET /sizes', () => {
    test('возвращает размеры', async () => {
      mockQuery.mockResolvedValueOnce([[{ id: 1, name: 'Иванов Иван', size: 'M' }], []]);
      const res = await request(app).get('/api/employees/sizes');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /search и /search/:letter', () => {
    test('GET /search — все при пустой букве', async () => {
      mockQuery.mockResolvedValueOnce([[{ id_employees: 1, name: 'Иванов Иван' }], []]);
      const res = await request(app).get('/api/employees/search');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
    });
    test('GET /search/И — поиск по букве', async () => {
      mockQuery.mockResolvedValueOnce([[{ id_employees: 1, name: 'Иванов Иван' }], []]);
      const res = await request(app).get('/api/employees/search/И');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /kpi/:id', () => {
    test('возвращает KPI', async () => {
      mockQuery.mockResolvedValueOnce([[{ KPI: '100' }], []]);
      const res = await request(app).get('/api/employees/kpi/1');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject({ KPI: '100' });
    });
    test('400 при невалидном id', async () => {
      const res = await request(app).get('/api/employees/kpi/0');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Некорректный id.');
    });
  });

  describe('GET /:id', () => {
    test('возвращает сотрудника по id', async () => {
      const row = { id_employees: 1, first_name: 'Иван', second_name: 'Иванов', position_name: 'Педагог' };
      mockQuery.mockResolvedValueOnce([[row], []]);
      const res = await request(app).get('/api/employees/1');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject({ id_employees: 1, first_name: 'Иван' });
    });
    test('404 при отсутствии', async () => {
      mockQuery.mockResolvedValueOnce([[], []]);
      const res = await request(app).get('/api/employees/999');
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Сотрудник не найден.');
    });
    test('400 при невалидном id', async () => {
      const res = await request(app).get('/api/employees/0');
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Некорректный id сотрудника.');
    });
  });

  describe('POST / (assignToEvent)', () => {
    test('успех при event_id и employee_id', async () => {
      mockQuery.mockResolvedValueOnce([{ insertId: 1 }, []]);
      const res = await request(app).post('/api/employees/').send({ event_id: 1, employee_id: 5 });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO responsible_for_part_events'),
        expect.any(Array)
      );
    });
    test('ошибка без данных', async () => {
      const res = await request(app).post('/api/employees/').send({});
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(mockQuery).not.toHaveBeenCalled();
    });
    test('400 при невалидных id', async () => {
      const res = await request(app).post('/api/employees/').send({ event_id: 0, employee_id: 1 });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/положительными/);
    });
    test('409 при дубликате назначения', async () => {
      const err = new Error('Duplicate');
      err.code = 'ER_DUP_ENTRY';
      mockQuery.mockRejectedValueOnce(err);
      const res = await request(app).post('/api/employees/').send({ event_id: 1, employee_id: 5 });
      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/уже назначен/);
    });
  });

  describe('POST /add', () => {
    test('успех — 201 и id', async () => {
      mockQuery.mockResolvedValueOnce([{ insertId: 10 }, []]).mockResolvedValueOnce([{}, []]);
      const body = {
        first_name: 'Иван',
        second_name: 'Иванов',
        patronymic: 'Иванович',
        date_of_birth: '1990-01-01',
        position: 1,
        login: 'ivanov',
        password: 'hash',
        access_level_id: 1
      };
      const res = await request(app).post('/api/employees/add').send(body);
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject({ id: 10 });
    });
    test('400 без обязательных полей', async () => {
      const res = await request(app).post('/api/employees/add').send({ first_name: 'Иван' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /kpi', () => {
    test('успех', async () => {
      mockQuery.mockResolvedValueOnce([{ affectedRows: 1 }, []]);
      const res = await request(app).put('/api/employees/kpi').send({ id: 1, KPI: '90' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject({ ok: true });
    });
    test('404 при отсутствии', async () => {
      mockQuery.mockResolvedValueOnce([{ affectedRows: 0 }, []]);
      const res = await request(app).put('/api/employees/kpi').send({ id: 999, KPI: '90' });
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Сотрудник не найден.');
    });
    test('400 без id', async () => {
      const res = await request(app).put('/api/employees/kpi').send({ KPI: '90' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Нужен id.');
    });
  });

  describe('PUT /contact', () => {
    test('успех', async () => {
      mockQuery.mockResolvedValueOnce([{ affectedRows: 1 }, []]);
      const res = await request(app).put('/api/employees/contact').send({ id: 1, contact: '+7 999' });
      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({ ok: true });
    });
    test('400 без id', async () => {
      const res = await request(app).put('/api/employees/contact').send({ contact: 'x' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Нужен id.');
    });
  });

  describe('PUT /size', () => {
    test('успех', async () => {
      mockQuery.mockResolvedValueOnce([{ affectedRows: 1 }, []]);
      const res = await request(app).put('/api/employees/size').send({ id: 1, size: 'L' });
      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({ ok: true });
    });
    test('404 при отсутствии', async () => {
      mockQuery.mockResolvedValueOnce([{ affectedRows: 0 }, []]);
      const res = await request(app).put('/api/employees/size').send({ id: 999, size: 'L' });
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Сотрудник не найден.');
    });
  });
});
