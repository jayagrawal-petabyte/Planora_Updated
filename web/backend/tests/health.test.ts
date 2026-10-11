import { describe, expect, it, jest } from '@jest/globals';
import request from 'supertest';

jest.mock('../src/services/notificationService', () => ({
  startCronJobs: jest.fn()
}));

import app from '../src/index';

describe('Health Check API', () => {
  it('should return 200 and success message', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
  });
});
