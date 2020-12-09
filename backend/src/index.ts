import { Response } from 'express';
import { join } from 'path';

import { express, server } from './express/server';
import wsRouter from './routers/ws';
import createRestRouter from './routers/rest';
import { verifyConfig } from './utilities/config-helper';

const isProduction = process.env.NODE_ENV === 'production';
const restRouter = createRestRouter(isProduction);

// Add routers
server.use('/ws', wsRouter);
server.use('/api', restRouter);

// If in production, backend is used to serve pre-built frontend
if (isProduction) {
    if (!verifyConfig()) {
        console.error('> S3 configuration missing');
        process.exit(1);
    }
    // Use express.static
    server.use(express.static('public'));

    // Also serve /:id for dynamic chat room slugs
    server.get('/:id', (_, res: Response) =>
        res.sendFile(join(__dirname, '../public/index.html'))
    );
}

// Define port
const port = 3030;

// Start
server.listen(port, () => {
    console.log(
        `Started @ localhost:${port} in ${
            isProduction ? 'production' : 'development'
        } mode`
    );
});
