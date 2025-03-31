import express from 'express';
import server from './api/server.js';
import constants from './constants.js';

const app = server(express(), constants.host, constants.port);

export default app;
