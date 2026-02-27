/**
 * Тесты эндпоинтов Events (org и part).
 * Мок БД, проверка статусов, success, data и валидации.
 */
const request = require('supertest');

jest.mock('../../../src/db/connection');
jest.mock('../../../src/api/middleware/auth', () => (req, res, next) => next());

const connection = require('../../../src/db/connection');
const app = require('../../setup');

describe('Events API', () => {
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

  describe('Events ORG', () => {
    describe('POST /api/events/org/list', () => {
      test('возвращает данные и page, limit', async () => {
        mockQuery.mockResolvedValueOnce([[{ id: 1, name: 'Меро', dates_of_event: '2025-01-15' }], []]);
        const res = await request(app).post('/api/events/org/list').send({ page: 1, limit: 10 });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.page).toBe(1);
        expect(res.body.limit).toBe(10);
      });
      test('пустой список', async () => {
        mockQuery.mockResolvedValueOnce([[], []]);
        const res = await request(app).post('/api/events/org/list').send({ page: 1, limit: 10 });
        expect(res.status).toBe(200);
        expect(res.body.data).toEqual([]);
      });
    });

    describe('POST /api/events/org/count', () => {
      test('возвращает total', async () => {
        mockQuery.mockResolvedValueOnce([[{ total: 5 }], []]);
        const res = await request(app).post('/api/events/org/count').send({});
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.total).toBe(5);
      });
    });

    describe('GET /api/events/org/resp-table', () => {
      test('возвращает таблицу ответственных', async () => {
        mockQuery.mockResolvedValueOnce([[{ id_event: 1, id_employee: 2 }], []]);
        const res = await request(app).get('/api/events/org/resp-table');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
      });
    });

    describe('GET /api/events/org/full-inf/:id', () => {
      test('возвращает мероприятие', async () => {
        mockQuery.mockResolvedValueOnce([[{ id: 1, name: 'Конференция', annotation: 'Текст' }], []]);
        const res = await request(app).get('/api/events/org/full-inf/1');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toMatchObject({ id: 1, name: 'Конференция' });
      });
      test('404 при отсутствии', async () => {
        mockQuery.mockResolvedValueOnce([[], []]);
        const res = await request(app).get('/api/events/org/full-inf/999');
        expect(res.status).toBe(404);
        expect(res.body.error).toBe('Мероприятие не найдено.');
      });
      test('400 при невалидном id', async () => {
        const res = await request(app).get('/api/events/org/full-inf/0');
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Некорректный id.');
      });
    });

    describe('GET /api/events/org/responsible/:id', () => {
      test('возвращает ответственных', async () => {
        mockQuery.mockResolvedValueOnce([[{ id_event: 1, id_employees: 2, first_name: 'Иван' }], []]);
        const res = await request(app).get('/api/events/org/responsible/1');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveLength(1);
      });
      test('400 при невалидном id', async () => {
        const res = await request(app).get('/api/events/org/responsible/0');
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Некорректный id.');
      });
    });

    describe('GET /api/events/org/notifications-today/:id', () => {
      test('возвращает уведомления на сегодня', async () => {
        mockQuery.mockResolvedValueOnce([[{ id: 1, name: 'Меро' }], []]);
        const res = await request(app).get('/api/events/org/notifications-today/1');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      });
      test('400 при невалидном id', async () => {
        const res = await request(app).get('/api/events/org/notifications-today/0');
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Некорректный id сотрудника.');
      });
    });

    describe('PUT /api/events/org/notifications', () => {
      test('успех при id_employee и date', async () => {
        mockQuery.mockResolvedValueOnce([[{ id: 1, name: 'Меро' }], []]);
        const res = await request(app).put('/api/events/org/notifications').send({ id_employee: 1, date: '2025-02-01' });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      });
      test('400 без id_employee или date', async () => {
        const res = await request(app).put('/api/events/org/notifications').send({ date: '2025-02-01' });
        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/id_employee и date/);
      });
    });

    describe('POST /api/events/org (add)', () => {
      test('создание — 201 и id', async () => {
        mockQuery.mockResolvedValueOnce([{ insertId: 7 }, []]);
        const body = {
          name: 'Меро',
          form_of_holding: 1,
          dates_of_event: '2025-03-01',
          day_of_the_week: 1,
          amount_of_applications: 10,
          amount_of_planning_application: 5,
          annotation: 'Текст',
          result: 'Итог'
        };
        const res = await request(app).post('/api/events/org').send(body);
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.id).toBe(7);
      });
      test('400 без обязательных полей', async () => {
        const res = await request(app).post('/api/events/org').send({});
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
      });
    });

    describe('PUT /api/events/org (update)', () => {
      test('успех', async () => {
        mockQuery.mockResolvedValueOnce([{ affectedRows: 1 }, []]);
        const body = {
          id: 1,
          name: 'Меро',
          form_of_holding: 1,
          dates_of_event: '2025-03-01',
          day_of_the_week: 1,
          amount_of_applications: 10,
          amount_of_planning_application: 5,
          annotation: 'Текст',
          result: 'Итог'
        };
        const res = await request(app).put('/api/events/org').send(body);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.ok).toBe(true);
      });
      test('404 при отсутствии', async () => {
        mockQuery.mockResolvedValueOnce([{ affectedRows: 0 }, []]);
        const body = { id: 999, name: 'X', form_of_holding: 1, dates_of_event: '2025-01-01', day_of_the_week: 1, amount_of_applications: 0, amount_of_planning_application: 0, annotation: '-', result: '-' };
        const res = await request(app).put('/api/events/org').send(body);
        expect(res.status).toBe(404);
        expect(res.body.error).toBe('Мероприятие не найдено.');
      });
    });

    describe('POST /api/events/org/responsible', () => {
      test('успех — 201', async () => {
        mockQuery.mockResolvedValueOnce([{}, []]);
        const res = await request(app).post('/api/events/org/responsible').send({ id_employee: 1, id_event: 2 });
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
      });
      test('400 без id_employee или id_event', async () => {
        const res = await request(app).post('/api/events/org/responsible').send({ id_employee: 1 });
        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/id_employee и id_event/);
      });
      test('409 при дубликате', async () => {
        const err = new Error('Duplicate');
        err.code = 'ER_DUP_ENTRY';
        mockQuery.mockRejectedValueOnce(err);
        const res = await request(app).post('/api/events/org/responsible').send({ id_employee: 1, id_event: 2 });
        expect(res.status).toBe(409);
        expect(res.body.error).toMatch(/уже назначен/);
      });
    });

    describe('DELETE /api/events/org/responsible', () => {
      test('успех', async () => {
        mockQuery.mockResolvedValueOnce([{ affectedRows: 1 }, []]);
        const res = await request(app).delete('/api/events/org/responsible').send({ id_employee: 1, id_event: 2 });
        expect(res.status).toBe(200);
        expect(res.body.ok).toBe(true);
      });
      test('404 при отсутствии записи', async () => {
        mockQuery.mockResolvedValueOnce([{ affectedRows: 0 }, []]);
        const res = await request(app).delete('/api/events/org/responsible').send({ id_employee: 1, id_event: 2 });
        expect(res.status).toBe(404);
        expect(res.body.error).toBe('Запись не найдена.');
      });
    });

    describe('DELETE /api/events/org/:id', () => {
      test('успех', async () => {
        mockQuery.mockResolvedValueOnce([{ affectedRows: 1 }, []]);
        const res = await request(app).delete('/api/events/org/5');
        expect(res.status).toBe(200);
        expect(res.body.ok).toBe(true);
      });
      test('404 при отсутствии', async () => {
        mockQuery.mockResolvedValueOnce([{ affectedRows: 0 }, []]);
        const res = await request(app).delete('/api/events/org/999');
        expect(res.status).toBe(404);
        expect(res.body.error).toBe('Мероприятие не найдено.');
      });
      test('400 при невалидном id', async () => {
        const res = await request(app).delete('/api/events/org/0');
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Некорректный id.');
      });
    });
  });

  describe('Events PART', () => {
    describe('POST /api/events/part/list', () => {
      test('возвращает данные', async () => {
        mockQuery.mockResolvedValueOnce([[{ id: 1, name: 'Участие', registration_deadline: '2025-02-01' }], []]);
        const res = await request(app).post('/api/events/part/list').send({ page: 1, limit: 10 });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
      });
    });

    describe('POST /api/events/part/count', () => {
      test('возвращает total', async () => {
        mockQuery.mockResolvedValueOnce([[{ total: 3 }], []]);
        const res = await request(app).post('/api/events/part/count').send({});
        expect(res.status).toBe(200);
        expect(res.body.total).toBe(3);
      });
    });

    describe('GET /api/events/part/resp-table', () => {
      test('возвращает таблицу', async () => {
        mockQuery.mockResolvedValueOnce([[{ id_event: 1, id_employee: 2 }], []]);
        const res = await request(app).get('/api/events/part/resp-table');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      });
    });

    describe('GET /api/events/part/full-inf/:id', () => {
      test('возвращает мероприятие', async () => {
        mockQuery.mockResolvedValueOnce([[{ id: 1, name: 'Олимпиада' }], []]);
        const res = await request(app).get('/api/events/part/full-inf/1');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toMatchObject({ id: 1 });
      });
      test('404 при отсутствии', async () => {
        mockQuery.mockResolvedValueOnce([[], []]);
        const res = await request(app).get('/api/events/part/full-inf/999');
        expect(res.status).toBe(404);
      });
      test('400 при невалидном id', async () => {
        const res = await request(app).get('/api/events/part/full-inf/0');
        expect(res.status).toBe(400);
      });
    });

    describe('GET /api/events/part/responsible/:id и responsible-new/:id', () => {
      test('responsible возвращает список', async () => {
        mockQuery.mockResolvedValueOnce([[{ id_event: 1, first_name: 'Иван' }], []]);
        const res = await request(app).get('/api/events/part/responsible/1');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      });
      test('responsible-new возвращает список с result_of_responsible', async () => {
        mockQuery.mockResolvedValueOnce([[{ id_event: 1, result_of_responsible: 'OK' }], []]);
        const res = await request(app).get('/api/events/part/responsible-new/1');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      });
      test('400 при невалидном id', async () => {
        const res = await request(app).get('/api/events/part/responsible/0');
        expect(res.status).toBe(400);
      });
    });

    describe('GET /api/events/part/notifications-today/:id', () => {
      test('возвращает уведомления', async () => {
        mockQuery.mockResolvedValueOnce([[{ id: 1 }], []]);
        const res = await request(app).get('/api/events/part/notifications-today/1');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      });
      test('400 при невалидном id', async () => {
        const res = await request(app).get('/api/events/part/notifications-today/0');
        expect(res.status).toBe(400);
      });
    });

    describe('PUT /api/events/part/notifications', () => {
      test('400 без id_employee или date', async () => {
        const res = await request(app).put('/api/events/part/notifications').send({});
        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/id_employee и date/);
      });
    });

    describe('POST /api/events/part (add)', () => {
      test('создание — 201 и id', async () => {
        mockQuery.mockResolvedValueOnce([{ insertId: 4 }, []]);
        const body = {
          name: 'Олимпиада',
          form_of_holding: 1,
          id_type: 1,
          registration_deadline: '2025-03-01',
          participants_and_works: '10',
          annotation: 'Текст',
          dates_of_event: '2025-03-15',
          link: 'https://x.ru',
          participants_amount: 20,
          winner_amount: 3,
          runner_up_amount: 5
        };
        const res = await request(app).post('/api/events/part').send(body);
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.id).toBe(4);
      });
      test('400 без обязательных полей', async () => {
        const res = await request(app).post('/api/events/part').send({ name: 'X' });
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
      });
    });

    describe('PUT /api/events/part (update)', () => {
      test('успех', async () => {
        mockQuery.mockResolvedValueOnce([{ affectedRows: 1 }, []]);
        const body = {
          id: 1,
          name: 'Олимпиада',
          form_of_holding: 1,
          id_type: 1,
          registration_deadline: '2025-03-01',
          participants_and_works: '-',
          result: '-',
          annotation: '-',
          dates_of_event: '2025-03-15',
          link: '-',
          participants_amount: 0,
          winner_amount: 0,
          runner_up_amount: 0
        };
        const res = await request(app).put('/api/events/part').send(body);
        expect(res.status).toBe(200);
        expect(res.body.ok).toBe(true);
      });
      test('404 при отсутствии', async () => {
        mockQuery.mockResolvedValueOnce([{ affectedRows: 0 }, []]);
        const body = { id: 999, name: 'X', form_of_holding: 1, id_type: 1, registration_deadline: '2025-01-01', participants_and_works: '-', result: '-', annotation: '-', dates_of_event: '2025-01-01', link: '-', participants_amount: 0, winner_amount: 0, runner_up_amount: 0 };
        const res = await request(app).put('/api/events/part').send(body);
        expect(res.status).toBe(404);
        expect(res.body.error).toBe('Мероприятие не найдено.');
      });
    });

    describe('PUT /api/events/part/result', () => {
      test('успех', async () => {
        mockQuery.mockResolvedValueOnce([{ affectedRows: 1 }, []]);
        const res = await request(app).put('/api/events/part/result').send({ id_event: 1, id_employee: 2, result_of_responsible: 'Готово' });
        expect(res.status).toBe(200);
        expect(res.body.ok).toBe(true);
      });
      test('400 без id_event или id_employee', async () => {
        const res = await request(app).put('/api/events/part/result').send({ id_event: 1 });
        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/id_event и id_employee/);
      });
      test('404 при отсутствии записи', async () => {
        mockQuery.mockResolvedValueOnce([{ affectedRows: 0 }, []]);
        const res = await request(app).put('/api/events/part/result').send({ id_event: 1, id_employee: 2 });
        expect(res.status).toBe(404);
        expect(res.body.error).toBe('Запись не найдена.');
      });
    });

    describe('PUT /api/events/part/mark', () => {
      test('успех', async () => {
        mockQuery.mockResolvedValueOnce([{ affectedRows: 1 }, []]);
        const res = await request(app).put('/api/events/part/mark').send({ id_event: 1, id_employee: 2, mark_of_sending_an_application: 1 });
        expect(res.status).toBe(200);
        expect(res.body.ok).toBe(true);
      });
      test('400 без id_event или id_employee', async () => {
        const res = await request(app).put('/api/events/part/mark').send({ id_event: 1 });
        expect(res.status).toBe(400);
      });
    });

    describe('POST /api/events/part/responsible', () => {
      test('успех — 201', async () => {
        mockQuery.mockResolvedValueOnce([{}, []]);
        const res = await request(app).post('/api/events/part/responsible').send({ id_employee: 1, id_event: 2 });
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
      });
      test('409 при дубликате', async () => {
        const err = new Error('Duplicate');
        err.code = 'ER_DUP_ENTRY';
        mockQuery.mockRejectedValueOnce(err);
        const res = await request(app).post('/api/events/part/responsible').send({ id_employee: 1, id_event: 2 });
        expect(res.status).toBe(409);
        expect(res.body.error).toMatch(/уже назначен/);
      });
    });

    describe('DELETE /api/events/part/responsible', () => {
      test('успех', async () => {
        mockQuery.mockResolvedValueOnce([{ affectedRows: 1 }, []]);
        const res = await request(app).delete('/api/events/part/responsible').send({ id_employee: 1, id_event: 2 });
        expect(res.status).toBe(200);
        expect(res.body.ok).toBe(true);
      });
      test('404 при отсутствии', async () => {
        mockQuery.mockResolvedValueOnce([{ affectedRows: 0 }, []]);
        const res = await request(app).delete('/api/events/part/responsible').send({ id_employee: 1, id_event: 2 });
        expect(res.status).toBe(404);
      });
    });

    describe('DELETE /api/events/part/:id', () => {
      test('успех', async () => {
        mockQuery.mockResolvedValueOnce([{ affectedRows: 1 }, []]);
        const res = await request(app).delete('/api/events/part/5');
        expect(res.status).toBe(200);
        expect(res.body.ok).toBe(true);
      });
      test('404 при отсутствии', async () => {
        mockQuery.mockResolvedValueOnce([{ affectedRows: 0 }, []]);
        const res = await request(app).delete('/api/events/part/999');
        expect(res.status).toBe(404);
        expect(res.body.error).toBe('Мероприятие не найдено.');
      });
      test('400 при невалидном id', async () => {
        const res = await request(app).delete('/api/events/part/0');
        expect(res.status).toBe(400);
      });
    });
  });
});
