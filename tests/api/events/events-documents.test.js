/**
 * Эндпоинты документов мероприятий: проверка маршрутов и SQL (БД мокается).
 */
const request = require('supertest');

jest.mock('../../../src/db/connection');
jest.mock('../../../src/common/envLoader', () => ({
  getDbConfig: () => ({
    host: '127.0.0.1',
    port: 3306,
    user: 'u',
    password: '',
    database: 'kvant',
    apiPort: 3000,
    documentsRootOrg: 'C:/mock/org-docs',
    documentsRootPart: 'C:/mock/part-docs'
  })
}));

jest.mock('../../../src/api/middleware/auth', () => (req, res, next) => {
  req.user = { id: 1, accessLevel: 1 };
  next();
});

const connection = require('../../../src/db/connection');
const app = require('../../setup');

describe('Events documents (org + part)', () => {
  let mockQuery;

  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery = jest.fn();
    connection.getPool.mockResolvedValue({
      getConnection: jest.fn().mockResolvedValue({
        query: mockQuery,
        release: jest.fn()
      })
    });
  });

  describe('org', () => {
    test('GET /api/events/org/:eventId/documents — SELECT из event_organization_document', async () => {
      mockQuery
        .mockResolvedValueOnce([[{ id: 1 }], []])
        .mockResolvedValueOnce([[], []]);
      const res = await request(app).get('/api/events/org/1/documents');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const sql = mockQuery.mock.calls[1][0];
      expect(sql).toMatch(/event_organization_document/i);
    });

  });

  describe('part', () => {
    test('GET /api/events/part/:eventId/documents — SELECT из event_participation_document', async () => {
      mockQuery
        .mockResolvedValueOnce([[{ id: 1 }], []])
        .mockResolvedValueOnce([[], []]);
      const res = await request(app).get('/api/events/part/2/documents');
      expect(res.status).toBe(200);
      const sql = mockQuery.mock.calls[1][0];
      expect(sql).toMatch(/event_participation_document/i);
    });
  });
});
