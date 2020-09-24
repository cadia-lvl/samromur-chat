import { default as exp } from 'express';
import cors from 'cors';
const expressWs = require('express-ws');

// Create and export server
export const server = exp();

// Use cors
server.use(cors());

// Wrap server with express-ws
expressWs(server);

// Export wrapped express
export const express = exp;