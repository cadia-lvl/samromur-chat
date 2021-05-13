import { express } from '../express/server';
import multer from 'multer';

import Bucket from '../database/bucket';
import {
    getLocalSessions,
    downloadLocalSession,
} from '../utilities/filesystem';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const createRestRouter = (isProduction: boolean) => {
    const bucket = isProduction ? new Bucket() : undefined;
    const restRouter = express.Router();

    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, '../uploads/');
        },
        filename: (req, file, cb) => {
            const id = decodeURIComponent(req.headers.id as string);
            if (file.fieldname == 'audio') {
                cb(null, id + '.wav');
            } else if (file.fieldname == 'metadata') {
                cb(null, id + '.json');
            }
        },
    });

    const upload = multer({ storage: storage }).fields([
        { name: 'audio' },
        { name: 'metadata' },
    ]);

    restRouter.post('/:id', upload, (req, res) => {
        // If in production
        if (bucket) {
            bucket.uploadClip(req);
        }

        return res.status(200).send('Success');
    });

    restRouter.get('/sessions', async (req, res) => {
        const showPartial =
            req.query.partial && req.query.partial === 'true' ? true : false;
        if (bucket) {
            try {
                const sessions = await bucket.getSessions(showPartial);
                return res.status(200).json(sessions);
            } catch (error) {
                return res.status(500).send(error);
            }
        } else {
            try {
                const sessions = getLocalSessions(showPartial);
                return res.status(200).json(sessions);
            } catch (error) {
                return res
                    .status(500)
                    .send(
                        'Not running in production mode. ' +
                            'No local sessions found'
                    );
            }
        }
    });

    restRouter.get('/sessions/:id', async (req, res) => {
        if (bucket) {
            return bucket.downloadSession(req, res);
        } else {
            return downloadLocalSession(req, res);
        }
    });

    return restRouter;
};

export default createRestRouter;
