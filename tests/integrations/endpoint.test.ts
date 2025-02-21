import server from '../../src/entrypoint.js';
import supertest from 'supertest';
import { Server } from 'http';

let request: ReturnType<typeof supertest>;
let httpServer: Server;

describe('API health status', () => {
  beforeAll(() => {
    const [expressServer, serverListener] = server;
    request = supertest(expressServer);
    httpServer = serverListener;
  });

  it('Should be online', async () => {
    const res = await request.get('/');
    expect(res.body).toHaveProperty('status');
    expect(res.body.status).toBe(true);
  });

  afterAll(() => {
    httpServer.close();
  });
});
