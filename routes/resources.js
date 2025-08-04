import express from 'express';
import fs from 'fs';
import path from 'path';

const router = express.Router();
const dataPath = path.join(__dirname, '..', 'data', 'resources.json');

function readResources() {
    return new Promise((resolve, reject) => {
        fs.readFile(dataPath, 'utf8', (err, data) => {
            if (err) return reject(err);
            try {
                resolve(JSON.parse(data));
            } catch (e) {
                reject(e);
            }
        });
    });
}
function writeResources(resources) {
    return new Promise((resolve, reject) => {
        fs.writeFile(dataPath, JSON.stringify(resources, null, 4), 'utf8', err => {
            if (err) return reject(err);
            resolve();
        });
    });
}

// GET /resources/search?type=Video
router.get('/search', async (req, res, next) => {
    try {
        const { type } = req.query;
        const resources = await readResources();
        let filtered = resources;
        if (type) {
            filtered = resources.filter(r => r.type.toLowerCase() === type.toLowerCase());
        }
        res.json(filtered);
    } catch (err) {
        next(err);
    }
});

// GET /
router.get('/', async (req, res, next) => {
    try {
        const resources = await readResources();
        res.json(resources);
    } catch (err) {
        next(err);
    }
});

// POST /
router.post('/', async (req, res, next) => {
    try {
        const { title, type, authorId, url } = req.body;
        if (!title || !type || !authorId || !url) {
            return res.status(400).json({ error: 'Fehlende Felder.' });
        }
        const resources = await readResources();
        const newId = (resources.length > 0 ? (Math.max(...resources.map(r => parseInt(r.id, 10))) + 1) : 1).toString();
        const newResource = { id: newId, title, type, authorId, url };
        resources.push(newResource);
        await writeResources(resources);
        res.status(201).json(newResource);
    } catch (err) {
        next(err);
    }
});

// GET /:id
router.get('/:id', async (req, res, next) => {
    try {
        const resourceId = req.params.id;
        const resources = await readResources();
        const resource = resources.find(r => r.id === resourceId);
        if (!resource) {
            return res.status(404).json({ error: 'Ressource nicht gefunden.' });
        }
        res.json(resource);
    } catch (err) {
        next(err);
    }
});

// PUT /:id
router.put('/:id', async (req, res, next) => {
    try {
        const resourceId = req.params.id;
        const { title, type, authorId, url } = req.body;
        if (!title || !type || !authorId || !url) {
            return res.status(400).json({ error: 'Fehlende Felder.' });
        }
        const resources = await readResources();
        const idx = resources.findIndex(r => r.id === resourceId);
        if (idx === -1) {
            return res.status(404).json({ error: 'Ressource nicht gefunden.' });
        }
        resources[idx] = { id: resourceId, title, type, authorId, url };
        await writeResources(resources);
        res.json(resources[idx]);
    } catch (err) {
        next(err);
    }
});

// DELETE /:id
router.delete('/:id', async (req, res, next) => {
    try {
        const resourceId = req.params.id;
        const resources = await readResources();
        const idx = resources.findIndex(r => r.id === resourceId);
        if (idx === -1) {
            return res.status(404).json({ error: 'Ressource nicht gefunden.' });
        }
        resources.splice(idx, 1);
        await writeResources(resources);
        res.status(204).send();
    } catch (err) {
        next(err);
    }
});

export default router;
