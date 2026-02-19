const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const authRouter = require('../../src/api/modules/auth/routes'); 

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn((payload) => `fake-token-${payload.userId}`),
  verify: jest.fn((token) => ({ userId: 1, accessLevel: 1 })),
}));

jest.mock('bcryptjs', () => ({
  compare: jest.fn().mockResolvedValue(true),
}));

jest.mock('../../src/db/connection', () => ({
  getPool: jest.fn().mockResolvedValue({
    query: jest.fn(),
  }),
}));

describe('Auth Router', () => {
  let app;
  let mockQuery;

  beforeEach(async () => {
    jest.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/api/auth', authRouter);
    const mockPool = await require('../../src/db/connection').getPool();
    mockQuery = mockPool.query;
    jwt.sign.mockImplementation((payload) => `fake-token-${payload.userId}`);
    jwt.verify.mockImplementation((token) => {
      if (token.startsWith('fake-token-')) {
        const userId = parseInt(token.split('-')[2]);
        return { userId, accessLevel: 1 };
      }
      throw new Error('Invalid token');
    });
    bcrypt.compare.mockResolvedValue(true);
  });

  it('returns 400 when login or password is missing', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({})
      .expect(400);

    expect(response.body.error).toBe('Введите логин и пароль');
    expect(mockQuery).toHaveBeenCalledTimes(0); // Нет вызовов DB
  });

  it('returns 401 when user not found', async () => {
    mockQuery.mockResolvedValueOnce([ [], [] ]); // Пустой SELECT для profile, [rows, fields]

    const response = await request(app)
      .post('/api/auth/login') // Исправленный путь
      .send({ login: 'unknown', password: '12345' })
      .expect(401);

    expect(response.body.error).toBe('Неверный логин или пароль');
    expect(mockQuery).toHaveBeenCalledTimes(1);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('SELECT id, password_hash, access_level_id FROM profile WHERE login = ?'),
      ['unknown']
    );
  });

  it('returns 401 when password is incorrect', async () => {
    const fakeUser = { id: 1, password_hash: 'hash', access_level_id: 1 };
    mockQuery.mockResolvedValueOnce([ [fakeUser], [] ]); // SELECT profile

    bcrypt.compare.mockResolvedValueOnce(false);

    const response = await request(app)
      .post('/api/auth/login')
      .send({ login: 'SophyaN', password: 'wrong' })
      .expect(401);

    expect(response.body.error).toBe('Неверный логин или пароль');
    expect(mockQuery).toHaveBeenCalledTimes(1);
    expect(bcrypt.compare).toHaveBeenCalledTimes(1);
    expect(bcrypt.compare).toHaveBeenCalledWith('wrong', 'hash');
  });

  it('successfully logs in and returns tokens', async () => {
    const fakeUser = { id: 1, password_hash: 'hash', access_level_id: 1 };
    mockQuery
      .mockResolvedValueOnce([ [fakeUser], [] ]) // SELECT profile
      .mockResolvedValueOnce([ { insertId: 999, affectedRows: 1 }, [] ]); // INSERT refresh_tokens

    jwt.sign
      .mockReturnValueOnce('fake-access-token')
      .mockReturnValueOnce('fake-refresh-token');

    const response = await request(app)
      .post('/api/auth/login')
      .send({ login: 'SophyaN', password: '12345' })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.accessToken).toBe('fake-access-token');
    expect(response.body.refreshToken).toBe('fake-refresh-token');
    expect(response.body.user).toEqual({
      id: 1,
      accessLevel: 1
    });
    expect(response.headers['set-cookie'][0]).toContain('access_token=fake-access-token'); // Проверка cookie
    expect(mockQuery).toHaveBeenCalledTimes(2);
    expect(jwt.sign).toHaveBeenCalledTimes(2);
    expect(bcrypt.compare).toHaveBeenCalledTimes(1);
  });

  it('returns 401 when refresh token is missing', async () => {
    const response = await request(app)
      .post('/api/auth/refresh')
      .send({})
      .expect(401);

    expect(response.body.error).toBe('Требуется refresh-токен');
    expect(mockQuery).toHaveBeenCalledTimes(0);
  });

  it('returns 401 when refresh token is invalid', async () => {
    jwt.verify.mockImplementationOnce(() => {
      throw new Error('Invalid token');
    });

    const response = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: 'invalid' })
      .expect(401);

    expect(response.body.error).toBe('Недействительный refresh-токен');
    expect(mockQuery).toHaveBeenCalledTimes(0); // Не доходит до DB
    expect(jwt.verify).toHaveBeenCalledTimes(1);
  });

  it('successfully refreshes access token', async () => {
    jwt.verify.mockReturnValueOnce({ userId: 1 });

    mockQuery
      .mockResolvedValueOnce([ [{ profile_id: 1, token: 'valid-refresh', expires_at: '2026-01-01 00:00:00', revoked_at: null }], [] ]) // SELECT refresh_tokens (полный объект для реализма)
      .mockResolvedValueOnce([ [{ id: 1, access_level_id: 1 }], [] ]); // SELECT profile

    jwt.sign.mockReturnValueOnce('new-fake-access-token');

    const response = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: 'valid-refresh' })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.accessToken).toBe('new-fake-access-token');
    expect(response.headers['set-cookie'][0]).toContain('access_token=new-fake-access-token'); // Проверка cookie
    expect(mockQuery).toHaveBeenCalledTimes(2);
    expect(jwt.verify).toHaveBeenCalledTimes(1);
    expect(jwt.sign).toHaveBeenCalledTimes(1);
  });

  it('clears cookie and revokes refresh token if provided', async () => {
    mockQuery.mockResolvedValueOnce([ { affectedRows: 1 }, [] ]); // UPDATE refresh_tokens

    const response = await request(app)
      .post('/api/auth/logout')
      .send({ refreshToken: 'valid-refresh' })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.headers['set-cookie'][0]).toContain('access_token=;'); // Clear cookie
    expect(mockQuery).toHaveBeenCalledTimes(1);
  });

  it('clears cookie even without refresh token', async () => {
    const response = await request(app)
      .post('/api/auth/logout')
      .send({})
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.headers['set-cookie'][0]).toContain('access_token=;');
    expect(mockQuery).toHaveBeenCalledTimes(0);
  });
});