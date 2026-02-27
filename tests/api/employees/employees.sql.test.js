const request = require('supertest');

jest.mock('../../../src/db/connection');
jest.mock('../../../src/api/middleware/auth', () => (req, res, next) => next());

const connection = require('../../../src/db/connection');
const app = require('../../setup');

describe('Employees: SQL использует ожидаемые таблицы (БД не меняется)', () => {
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

  test('GET /api/employees — запрос идёт к employees и position', async () => {
    mockQuery.mockResolvedValueOnce([[], []]);
    const res = await request(app).get('/api/employees');
    expect(res.status).toBe(200);
    expect(mockQuery).toHaveBeenCalledTimes(1);
    const sql = mockQuery.mock.calls[0][0];
    expect(sql).toMatch(/FROM\s+employees/i);
    expect(sql).toMatch(/position/i);
  });

  test('GET /api/employees/all — запрос к employees', async () => {
    mockQuery.mockResolvedValueOnce([[], []]);
    const res = await request(app).get('/api/employees/all');
    expect(res.status).toBe(200);
    const sql = mockQuery.mock.calls[0][0];
    expect(sql).toMatch(/FROM\s+employees/i);
  });

  test('GET /api/employees/kpi/:id — запрос к employees по id', async () => {
    mockQuery.mockResolvedValueOnce([[{ KPI: null }], []]);
    const res = await request(app).get('/api/employees/kpi/1');
    expect(res.status).toBe(200);
    expect(mockQuery).toHaveBeenCalledWith(expect.stringMatching(/SELECT\s+.*KPI.*FROM\s+employees/i), [1]);
  });

  test('POST /api/employees (назначение) — INSERT в responsible_for_part_events, БД не меняется', async () => {
    mockQuery.mockResolvedValueOnce([{ insertId: 1 }, []]);
    const res = await request(app)
      .post('/api/employees')
      .send({ event_id: 10, employee_id: 20 });
    expect(res.status).toBe(201);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('responsible_for_part_events'),
      [10, 20]
    );
    // Реальный запрос не выполнялся — мок просто вернул успех
  });

  test('POST /api/employees/add — INSERT в employees и profile', async () => {
    mockQuery
      .mockResolvedValueOnce([{ insertId: 99 }, []])
      .mockResolvedValueOnce([{ affectedRows: 1 }, []]);
    const res = await request(app)
      .post('/api/employees/add')
      .send({
        first_name: 'А',
        second_name: 'Б',
        patronymic: 'В',
        date_of_birth: '2000-01-01',
        position: 1,
        login: 'test',
        password: 'pass',
        access_level_id: 1,
      });
    expect(res.status).toBe(201);
    const calls = mockQuery.mock.calls;
    expect(calls.some((c) => String(c[0]).includes('employees'))).toBe(true);
    expect(calls.some((c) => String(c[0]).includes('profile'))).toBe(true);
  });
});
