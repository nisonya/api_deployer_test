const request = require('supertest');

jest.mock('../../src/db/connection');
const connection = require('../../src/db/connection');

const app = require('../setup');

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

  test('GET /api/employees/ — возвращает массив сотрудников', async () => {
    const fakeRows = [
      { id_employees: 1, first_name: 'Иван', second_name: 'Иванов', position: 1, position_name: 'Педагог' }
    ];
    mockQuery.mockResolvedValueOnce([ fakeRows, [] ]);

    const res = await request(app).get('/api/employees/');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toMatchObject({ id_employees: 1, first_name: 'Иван', second_name: 'Иванов' });
  });

  test('GET /api/employees/ — пустой список при отсутствии данных', async () => {
    mockQuery.mockResolvedValueOnce([ [], [] ]);

    const res = await request(app).get('/api/employees/');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual([]);
  });

  test('POST /api/employees/ — ошибка без данных', async () => {
    const res = await request(app)
      .post('/api/employees/')
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  test('POST /api/employees/ — успех при event_id и employee_id', async () => {
    mockQuery.mockResolvedValueOnce([ { insertId: 1 }, [] ]);

    const res = await request(app)
      .post('/api/employees/')
      .send({ event_id: 1, employee_id: 5 });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO responsible_for_part_events'),
      [ 1, 5 ]
    );
  });
});
