/**
 * Тесты "SQL не ломает БД" для Events org: проверяем имена таблиц в запросах.
 * БД мокаем — POST/DELETE не изменяют реальные данные.
 */
const request = require('supertest');

jest.mock('../../../src/db/connection');
jest.mock('../../../src/api/middleware/auth', () => (req, res, next) => next());

const connection = require('../../../src/db/connection');
const app = require('../../setup');

describe('Events org: SQL использует ожидаемые таблицы (БД не меняется)', () => {
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

  test('GET /api/events/org/resp-table — запрос к responsible_for_org_events', async () => {
    mockQuery.mockResolvedValueOnce([[], []]);
    const res = await request(app).get('/api/events/org/resp-table');
    expect(res.status).toBe(200);
    expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('responsible_for_org_events'));
  });

  test('GET /api/events/org/full-inf/:id — запрос к event_plan_organization', async () => {
    mockQuery.mockResolvedValueOnce([[{ id: 1, name: 'Test' }], []]);
    const res = await request(app).get('/api/events/org/full-inf/1');
    expect(res.status).toBe(200);
    const sql = mockQuery.mock.calls[0][0];
    expect(sql).toMatch(/event_plan_organization/i);
    expect(sql).toMatch(/WHERE.*id/i);
  });

  test('POST /api/events/org/list — SELECT из event_plan_organization', async () => {
    mockQuery.mockResolvedValueOnce([[], []]);
    const res = await request(app)
      .post('/api/events/org/list')
      .send({ page: 1, limit: 10 });
    expect(res.status).toBe(200);
    const sql = mockQuery.mock.calls[0][0];
    expect(sql).toMatch(/event_plan_organization/i);
  });

  test('POST /api/events/org/count — COUNT по event_plan_organization', async () => {
    mockQuery.mockResolvedValueOnce([[{ total: 0 }], []]);
    const res = await request(app).post('/api/events/org/count').send({});
    expect(res.status).toBe(200);
    expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('event_plan_organization'), expect.anything());
  });

  test('POST /api/events/org — INSERT в event_plan_organization (БД не меняется)', async () => {
    mockQuery.mockResolvedValueOnce([{ insertId: 1 }, []]);
    const res = await request(app)
      .post('/api/events/org')
      .send({
        name: 'X',
        form_of_holding: 'Y',
        dates_of_event: '2025-01-01',
        day_of_the_week: 'Пн',
        amount_of_applications: 0,
        amount_of_planning_application: 0,
        annotation: 'a',
        result: 'r',
      });
    expect(res.status).toBe(201);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('event_plan_organization'),
      expect.any(Array)
    );
  });

  test('POST /api/events/org/responsible — INSERT в responsible_for_org_events', async () => {
    mockQuery.mockResolvedValueOnce([{ affectedRows: 1 }, []]);
    const res = await request(app)
      .post('/api/events/org/responsible')
      .send({ id_employee: 1, id_event: 2 });
    expect(res.status).toBe(201);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('responsible_for_org_events'),
      [1, 2]
    );
  });

  test('DELETE /api/events/org/responsible — DELETE из responsible_for_org_events', async () => {
    mockQuery.mockResolvedValueOnce([{ affectedRows: 1 }, []]);
    const res = await request(app)
      .delete('/api/events/org/responsible')
      .send({ id_employee: 1, id_event: 2 });
    expect(res.status).toBe(200);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('DELETE FROM responsible_for_org_events'),
      [2, 1]
    );
  });

  test('DELETE /api/events/org/:id — DELETE из event_plan_organization', async () => {
    mockQuery.mockResolvedValueOnce([{ affectedRows: 1 }, []]);
    const res = await request(app).delete('/api/events/org/999');
    expect(res.status).toBe(200);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('event_plan_organization'),
      [999]
    );
  });
});
