import { express } from '../express/server';
import multer from 'multer';

import Bucket from '../database/bucket';
import {
    getLocalSessions,
    downloadLocalSession,
    checkForMissingChunks,
    combineChunks,
    deleteRecording,
    getChunkFileName,
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
            const chunkId = decodeURIComponent(req.headers.chunk_id as string);
            const chunkFileName = getChunkFileName(id, chunkId);
            if (file.fieldname == 'audio') {
                cb(null, `${chunkFileName}.wav`);
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

    restRouter.post('/chunk/:id', upload, (req, res) => {
        return res.status(200).send('Success');
    });

    restRouter.get('/verifyChunks/:id', async (req, res) => {
        const id = decodeURIComponent(req.headers.id as string);
        const nbrOfChunks = parseInt(req.headers.nbr_of_chunks as string);
        console.log(`id: ${id} requested verification for ${nbrOfChunks}`);

        try {
            const missingChunks = await checkForMissingChunks(id, nbrOfChunks);
            if (missingChunks.length !== 0) {
                // Chunks missing, return an array with the missing chunks numbers
                return res.status(200).json(missingChunks);
            }

            // No chunks missing, combine and upload?
            return res.status(200).send(missingChunks);
        } catch (error) {
            console.log(error);
            return res.status(500).send(error.code);
        }
    });

    restRouter.post('/recordingFinished/:id', upload, async (req, res) => {
        const id = decodeURIComponent(req.headers.id as string);
        const combineSuccess = await combineChunks(id);
        if (!combineSuccess) {
            return res
                .status(500)
                .send('Server was unable to combine audio chunks.');
        }
        if (bucket) {
            try {
                bucket.uploadRecording(id);
                return res.status(200).send('Success');
            } catch (error) {
                return res.status(500).send(error.code);
            }
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

    restRouter.delete('/delete/:id', async (req, res) => {
        const id = decodeURIComponent(req.headers.id as string);
        const deleted = deleteRecording(id);

        res.status(200).send(deleted);
    });

    return restRouter;
};

export default createRestRouter;
