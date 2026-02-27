const request = require('supertest');

jest.mock('../../../src/db/connection');
jest.mock('../../../src/api/middleware/auth', () => (req, res, next) => next());

const connection = require('../../../src/db/connection');
const app = require('../../setup');

describe('Students API', () => {
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

  describe('GET /search', () => {
    test('returns array of students', async () => {
      const rows = [{ id: 1, surname: 'Ivanov', name: 'Ivan' }];
      mockQuery.mockResolvedValueOnce([rows, []]);
      const res = await request(app).get('/api/students/search');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0]).toMatchObject({ id: 1, surname: 'Ivanov' });
    });
    test('empty list', async () => {
      mockQuery.mockResolvedValueOnce([[], []]);
      const res = await request(app).get('/api/students/search');
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });
    test('search by letter returns success and data', async () => {
      mockQuery.mockResolvedValueOnce([[{ id: 2, surname: 'Petrov' }], []]);
      const res = await request(app).get('/api/students/search/P');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
    });
  });

  describe('GET /groups-by-student/:id', () => {
    test('returns student groups', async () => {
      mockQuery.mockResolvedValueOnce([[{ id: 1, name: 'PR-01' }], []]);
      const res = await request(app).get('/api/students/groups-by-student/1');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
    test('empty list', async () => {
      mockQuery.mockResolvedValueOnce([[], []]);
      const res = await request(app).get('/api/students/groups-by-student/1');
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });
    test('400 on invalid id', async () => {
      const res = await request(app).get('/api/students/groups-by-student/0');
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Некорректный id студента.');
    });
  });

  describe('GET /by-group/:id', () => {
    test('returns students in group', async () => {
      mockQuery.mockResolvedValueOnce([[{ id: 1, name: 'Ivanov Ivan' }], []]);
      const res = await request(app).get('/api/students/by-group/2');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
    test('400 on invalid group id', async () => {
      const res = await request(app).get('/api/students/by-group/0');
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Некорректный id группы.');
    });
  });

  describe('GET /:id', () => {
    test('returns student by id', async () => {
      const row = { id: 1, surname: 'Ivanov', name: 'Ivan', patronymic: 'Ivanovich' };
      mockQuery.mockResolvedValueOnce([[row], []]);
      const res = await request(app).get('/api/students/1');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject({ id: 1, surname: 'Ivanov' });
    });
    test('404 when student not found', async () => {
      mockQuery.mockResolvedValueOnce([[], []]);
      const res = await request(app).get('/api/students/999');
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Студент не найден.');
    });
    test('400 on invalid id', async () => {
      const res = await request(app).get('/api/students/0');
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Некорректный id.');
    });
  });

  describe('PUT /exist', () => {
    test('check exist returns amount', async () => {
      mockQuery.mockResolvedValueOnce([[{ amount: 1 }], []]);
      const res = await request(app)
        .put('/api/students/exist')
        .send({ surname: 'Ivanov', name: 'Ivan', patronymic: 'Ivanovich' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('amount', 1);
    });
    test('400 without required fields', async () => {
      const res = await request(app).put('/api/students/exist').send({ surname: 'Ivanov' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /add-to-group', () => {
    test('add to group 201', async () => {
      mockQuery.mockResolvedValueOnce([{}, []]);
      const res = await request(app)
        .post('/api/students/add-to-group')
        .send({ student_id: 1, group_id: 2 });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject({ ok: true });
    });
    test('400 without student_id or group_id', async () => {
      const res = await request(app)
        .post('/api/students/add-to-group')
        .send({ student_id: 1 });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/student_id и group_id/);
    });
    test('400 on invalid id', async () => {
      const res = await request(app)
        .post('/api/students/add-to-group')
        .send({ student_id: 0, group_id: 1 });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /', () => {
    test('create student 201 and id', async () => {
      mockQuery.mockResolvedValueOnce([{ insertId: 5 }, []]);
      const body = {
        surname: 'Ivanov',
        name: 'Ivan',
        patronymic: 'Ivanovich',
        birthDay: '2010-01-01',
        parentSurname: 'Ivanova',
        parentName: 'Maria',
        parentPatronymic: 'Petrovna',
        email: 'test@test.ru',
        phone: '+7 999 000 00 00',
      };
      const res = await request(app).post('/api/students/').send(body);
      expect(res.status).toBe(201);
      expect(res.body.data).toMatchObject({ id: 5 });
    });
    test('400 without required fields', async () => {
      const res = await request(app).post('/api/students/').send({ surname: 'Ivanov' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /', () => {
    test('update student success', async () => {
      mockQuery.mockResolvedValueOnce([{ affectedRows: 1 }, []]);
      const body = {
        id: 1,
        surname: 'Ivanov',
        name: 'Ivan',
        patronymic: 'Ivanovich',
        birthDay: '2010-01-01',
        parentSurname: 'Ivanova',
        parentName: 'Maria',
        parentPatronymic: 'Petrovna',
        email: 'test@test.ru',
        phone: '+7 999 000 00 00',
      };
      const res = await request(app).put('/api/students/').send(body);
      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({ ok: true });
    });
    test('404 when student not found', async () => {
      mockQuery.mockResolvedValueOnce([{ affectedRows: 0 }, []]);
      const body = {
        id: 999,
        surname: 'Ivanov',
        name: 'Ivan',
        patronymic: 'Ivanovich',
        birthDay: '2010-01-01',
        parentSurname: 'Ivanova',
        parentName: 'Maria',
        parentPatronymic: 'Petrovna',
        email: 'test@test.ru',
        phone: '+7 999 000 00 00',
      };
      const res = await request(app).put('/api/students/').send(body);
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Студент не найден.');
    });
    test('400 without id in body', async () => {
      const res = await request(app)
        .put('/api/students/')
        .send({
          surname: 'Ivanov',
          name: 'Ivan',
          patronymic: 'Ivanovich',
          birthDay: '2010-01-01',
          parentSurname: 'Ivanova',
          parentName: 'Maria',
          parentPatronymic: 'Petrovna',
          email: 'test@test.ru',
          phone: '+7 999 000 00 00',
        });
      expect(res.status).toBe(400);
    });
  });

  describe('PUT /update-to-group', () => {
    test('update to group success', async () => {
      mockQuery.mockResolvedValueOnce([{ affectedRows: 1 }, []]);
      const res = await request(app)
        .put('/api/students/update-to-group')
        .send({ student_id: 1, old_group_id: 2, new_group_id: 3 });
      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({ ok: true });
    });
    test('404 when link not found', async () => {
      mockQuery.mockResolvedValueOnce([{ affectedRows: 0 }, []]);
      const res = await request(app)
        .put('/api/students/update-to-group')
        .send({ student_id: 1, old_group_id: 2, new_group_id: 3 });
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Связь не найдена.');
    });
    test('400 without required fields', async () => {
      const res = await request(app)
        .put('/api/students/update-to-group')
        .send({ student_id: 1 });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/student_id, old_group_id, new_group_id/);
    });
  });

  describe('DELETE /from-group', () => {
    test('delete from group success', async () => {
      mockQuery.mockResolvedValueOnce([{ affectedRows: 1 }, []]);
      const res = await request(app)
        .delete('/api/students/from-group')
        .send({ student_id: 1, group_id: 2 });
      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({ ok: true });
    });
    test('404 when link not found', async () => {
      mockQuery.mockResolvedValueOnce([{ affectedRows: 0 }, []]);
      const res = await request(app)
        .delete('/api/students/from-group')
        .send({ student_id: 1, group_id: 2 });
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Связь не найдена.');
    });
    test('400 without student_id or group_id', async () => {
      const res = await request(app)
        .delete('/api/students/from-group')
        .send({ student_id: 1 });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/student_id и group_id/);
    });
  });
});
