import express from 'express';
import server from '@api/server.js';

const app = server(express(), process.env.HOST || '0.0.0.0', parseInt(process.env.PORT || '8080'));

export default app;
