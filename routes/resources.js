
// Express und Node.js-Module importieren
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Router-Instanz für alle /resources-Routen
const router = express.Router();

// __dirname-Ersatz für ES-Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Absoluter Pfad zur Ressourcen-JSON-Datei
const dataPath = path.join(__dirname, '..', 'data', 'resources.json');

/**
 * Liest alle Ressourcen aus der JSON-Datei.
 * @returns {Promise<Array>} Array mit Ressourcen-Objekten
 */
function readResources() {
    return new Promise((resolve, reject) => {
        fs.readFile(dataPath, 'utf8', (err, data) => {
            if (err) return reject(err); // Fehler beim Lesen
            try {
                resolve(JSON.parse(data)); // JSON parsen und zurückgeben
            } catch (e) {
                reject(e); // Fehler beim Parsen
            }
        });
    });
}
/**
 * Schreibt das Ressourcen-Array in die JSON-Datei.
 * @param {Array} resources - Array mit Ressourcen-Objekten
 * @returns {Promise<void>}
 */
function writeResources(resources) {
    return new Promise((resolve, reject) => {
        fs.writeFile(dataPath, JSON.stringify(resources, null, 4), 'utf8', err => {
            if (err) return reject(err); // Fehler beim Schreiben
            resolve();
        });
    });
}

/**
 * GET /resources/search
 * Filtert Ressourcen nach Typ (?type=...)
 * Gibt alle Ressourcen zurück, wenn kein Filter gesetzt ist.
 */
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

/**
 * GET /resources
 * Gibt alle Ressourcen als Array zurück.
 */
router.get('/', async (req, res, next) => {
    try {
        const resources = await readResources();
        res.json(resources);
    } catch (err) {
        next(err);
    }
});

/**
 * POST /resources
 * Legt eine neue Ressource an.
 * Erwartet: { title, type, authorId, url }
 * Antwort: Neu erstellte Ressource (Status 201)
 */
router.post('/', async (req, res, next) => {
    try {
        const { title, type, authorId, url } = req.body;
        if (!title || !type || !authorId || !url) {
            return res.status(400).json({ error: 'Fehlende Felder.' });
        }
        const resources = await readResources();
        // Neue ID generieren (höchste ID + 1)
        const newId = (resources.length > 0 ? (Math.max(...resources.map(r => parseInt(r.id, 10))) + 1) : 1).toString();
        const newResource = { id: newId, title, type, authorId, url };
        resources.push(newResource);
        await writeResources(resources);
        res.status(201).json(newResource);
    } catch (err) {
        next(err);
    }
});

/**
 * GET /resources/:id
 * Gibt eine einzelne Ressource anhand ihrer ID zurück.
 */
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

/**
 * PUT /resources/:id
 * Aktualisiert eine bestehende Ressource vollständig.
 * Erwartet: { title, type, authorId, url }
 * Antwort: Aktualisierte Ressource
 */
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

/**
 * DELETE /resources/:id
 * Löscht eine Ressource anhand ihrer ID.
 * Antwort: Status 204 (No Content) bei Erfolg
 */
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


// Exportiert den Router für die Verwendung in server.js
export default router;

