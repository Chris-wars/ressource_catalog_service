
// =====================
// Imports und Initialisierung
// =====================
import express from 'express';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';

// Router-Instanz für alle /resources-Routen
const router = express.Router();

// __dirname-Ersatz für ES-Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dateipfade
const dataPath = path.join(__dirname, '..', 'data', 'resources.json');
const ratingsPath = path.join(__dirname, '..', 'data', 'ratings.json');
const feedbackPath = path.join(__dirname, '..', 'data', 'feedback.json');

// =====================
// Hilfsfunktionen: Ressourcen
// =====================

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

// =====================
// Hilfsfunktionen: Bewertungen (Ratings)
// =====================


// =====================
// Hilfsfunktionen: Feedback
// =====================

/**
 * Liest alle Feedbacks aus der JSON-Datei.
 * @returns {Promise<Array>} Array mit Feedback-Objekten
 */
function readFeedbacks() {
    return new Promise((resolve, reject) => {
        fs.readFile(feedbackPath, 'utf8', (err, data) => {
            if (err) {
                if (err.code === 'ENOENT') return resolve([]); // Datei existiert nicht
                return reject(err);
            }
            try {
                resolve(JSON.parse(data));
            } catch (e) {
                reject(e);
            }
        });
    });
}

/**
 * Schreibt das Feedback-Array in die JSON-Datei.
 * @param {Array} feedbacks - Array mit Feedback-Objekten
 * @returns {Promise<void>}
 */
function writeFeedbacks(feedbacks) {
    return new Promise((resolve, reject) => {
        fs.writeFile(feedbackPath, JSON.stringify(feedbacks, null, 4), 'utf8', err => {
            if (err) return reject(err);
            resolve();
        });
    });
}

/**
 * Validiert den Feedback-Text (nicht leer, Mindest-/Maximallänge)
 * @param {string} text
 * @returns {string|null} Fehlertext oder null, wenn gültig
 */
function validateFeedbackText(text) {
    if (typeof text !== 'string' || !text.trim()) {
        return 'feedbackText darf nicht leer sein.';
    }
    if (text.length < 3) {
        return 'feedbackText ist zu kurz (mindestens 3 Zeichen).';
    }
    if (text.length > 1000) {
        return 'feedbackText ist zu lang (maximal 1000 Zeichen).';
    }
    return null;
}


// =====================
// Feedback-Endpunkte
// =====================

/**
 * POST /resources/:resourceId/feedback
 * Legt ein neues Feedback für eine Ressource an.
 * Erwartet: { feedbackText }
 * Antwort:
 *   - 201 Created, Feedback-Objekt mit id und timestamp
 *   - 400 bei ungültigem Text oder fehlenden Feldern
 *   - 404 wenn Ressource nicht existiert
 */
router.post('/:resourceId/feedback', async (req, res, next) => {
    try {
        const { resourceId } = req.params;
        const { feedbackText } = req.body;
        if (!resourceId || feedbackText === undefined) {
            return res.status(400).json({ error: 'resourceId und feedbackText sind erforderlich.' });
        }
        const error = validateFeedbackText(feedbackText);
        if (error) {
            return res.status(400).json({ error });
        }
        // Existiert die Ressource?
        const resources = await readResources();
        const resource = resources.find(r => r.id === resourceId);
        if (!resource) {
            return res.status(404).json({ error: 'Ressource nicht gefunden.' });
        }
        const feedbacks = await readFeedbacks();
        const newFeedback = {
            id: uuidv4(),
            resourceId,
            feedbackText: feedbackText.trim(),
            timestamp: new Date().toISOString()
        };
        feedbacks.push(newFeedback);
        await writeFeedbacks(feedbacks);
        res.status(201).json(newFeedback);
    } catch (err) {
        next(err);
    }
});

/**
 * PUT /resources/:resourceId/feedback/:feedbackId
 * Aktualisiert ein bestehendes Feedback.
 * Erwartet: { feedbackText }
 * Antwort:
 *   - 200 OK, aktualisiertes Feedback-Objekt
 *   - 400 bei ungültigem Text oder fehlenden Feldern
 *   - 404 wenn Ressource oder Feedback nicht existiert
 */
router.put('/:resourceId/feedback/:feedbackId', async (req, res, next) => {
    try {
        const { resourceId, feedbackId } = req.params;
        const { feedbackText } = req.body;
        if (!resourceId || !feedbackId || feedbackText === undefined) {
            return res.status(400).json({ error: 'resourceId, feedbackId und feedbackText sind erforderlich.' });
        }
        const error = validateFeedbackText(feedbackText);
        if (error) {
            return res.status(400).json({ error });
        }
        // Existiert die Ressource?
        const resources = await readResources();
        const resource = resources.find(r => r.id === resourceId);
        if (!resource) {
            return res.status(404).json({ error: 'Ressource nicht gefunden.' });
        }
        const feedbacks = await readFeedbacks();
        const idx = feedbacks.findIndex(f => f.id === feedbackId && f.resourceId === resourceId);
        if (idx === -1) {
            return res.status(404).json({ error: 'Feedback nicht gefunden.' });
        }
        feedbacks[idx].feedbackText = feedbackText.trim();
        feedbacks[idx].timestamp = new Date().toISOString();
        await writeFeedbacks(feedbacks);
        res.status(200).json(feedbacks[idx]);
    } catch (err) {
        next(err);
    }
});

/**
 * DELETE /resources/:resourceId/feedback/:feedbackId
 * Löscht ein bestehendes Feedback.
 * Antwort:
 *   - 204 No Content bei Erfolg
 *   - 404 wenn Ressource oder Feedback nicht existiert
 */
router.delete('/:resourceId/feedback/:feedbackId', async (req, res, next) => {
    try {
        const { resourceId, feedbackId } = req.params;
        if (!resourceId || !feedbackId) {
            return res.status(400).json({ error: 'resourceId und feedbackId sind erforderlich.' });
        }
        // Existiert die Ressource?
        const resources = await readResources();
        const resource = resources.find(r => r.id === resourceId);
        if (!resource) {
            return res.status(404).json({ error: 'Ressource nicht gefunden.' });
        }
        const feedbacks = await readFeedbacks();
        const idx = feedbacks.findIndex(f => f.id === feedbackId && f.resourceId === resourceId);
        if (idx === -1) {
            return res.status(404).json({ error: 'Feedback nicht gefunden.' });
        }
        feedbacks.splice(idx, 1);
        await writeFeedbacks(feedbacks);
        res.status(204).send();
    } catch (err) {
        next(err);
    }
});
// ...entfernt, da bereits oben deklariert...

/**
 * Liest alle Bewertungen aus der JSON-Datei.
 * @returns {Promise<Array>} Array mit Bewertungs-Objekten
 */
function readRatings() {
    return new Promise((resolve, reject) => {
        fs.readFile(ratingsPath, 'utf8', (err, data) => {
            if (err) return reject(err);
            try {
                resolve(JSON.parse(data));
            } catch (e) {
                reject(e);
            }
        });
    });
}

/**
 * Schreibt das Bewertungs-Array in die JSON-Datei.
 * @param {Array} ratings - Array mit Bewertungs-Objekten
 * @returns {Promise<void>}
 */
function writeRatings(ratings) {
    return new Promise((resolve, reject) => {
        fs.writeFile(ratingsPath, JSON.stringify(ratings, null, 4), 'utf8', err => {
            if (err) return reject(err);
            resolve();
        });
    });
}

/**
 * POST /resources/:id/rating
 * Bewertet eine Ressource mit 1-5 Sternen (ratingValue).
 * Erwartet: { ratingValue, userId (optional) }
 * Antwort: 201 Created bei Erfolg, gibt Rating-Objekt mit id zurück
 */
router.post('/:id/rating', async (req, res, next) => {
    try {
        const resourceId = req.params.id;
        const { ratingValue, userId } = req.body;
        if (!resourceId || ratingValue === undefined) {
            return res.status(400).json({ error: 'resourceId und ratingValue sind erforderlich.' });
        }
        const ratingInt = parseInt(ratingValue, 10);
        if (!Number.isInteger(ratingInt) || ratingInt < 1 || ratingInt > 5) {
            return res.status(400).json({ error: 'ratingValue muss eine Ganzzahl zwischen 1 und 5 sein.' });
        }
        // Existiert die Ressource?
        const resources = await readResources();
        const resource = resources.find(r => r.id === resourceId);
        if (!resource) {
            return res.status(404).json({ error: 'Ressource nicht gefunden.' });
        }
        // Bewertung speichern
        const ratings = await readRatings();
        const newRating = { id: uuidv4(), resourceId, ratingValue: ratingInt };
        if (userId) newRating.userId = userId;
        ratings.push(newRating);
        await writeRatings(ratings);
        res.status(201).json(newRating);
    } catch (err) {
        next(err);
    }
});

/**
 * DELETE /resources/:resourceId/rating/:ratingId
 * Löscht ein Rating anhand seiner ID für eine Ressource.
 * Antwort: 204 No Content bei Erfolg, 404 wenn nicht gefunden
 */
router.delete('/:resourceId/rating/:ratingId', async (req, res, next) => {
    try {
        const { resourceId, ratingId } = req.params;
        if (!resourceId || !ratingId) {
            return res.status(400).json({ error: 'resourceId und ratingId sind erforderlich.' });
        }
        // Existiert die Ressource?
        const resources = await readResources();
        const resource = resources.find(r => r.id === resourceId);
        if (!resource) {
            return res.status(404).json({ error: 'Ressource nicht gefunden.' });
        }
        const ratings = await readRatings();
        const idx = ratings.findIndex(r => r.id === ratingId && r.resourceId === resourceId);
        if (idx === -1) {
            return res.status(404).json({ error: 'Rating nicht gefunden.' });
        }
        ratings.splice(idx, 1);
        await writeRatings(ratings);
        res.status(204).send();
    } catch (err) {
        next(err);
    }
});



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
        const { title, type, url, authorId } = req.body;
        // authorId ist optional
        if (!title || !type || !url) {
            return res.status(400).json({ error: 'Fehlende Felder.' });
        }
        const resources = await readResources();
        const newResource = { id: uuidv4(), title, type, url };
        if (authorId) newResource.authorId = authorId;
        resources.push(newResource);
        await writeResources(resources);
        res.status(201).json(newResource);
    } catch (err) {
        next(err);
    }
});

/**
 * GET /resources/:id
 * Gibt eine einzelne Ressource anhand ihrer ID zurück und liefert averageRating und feedbacks.
 */
router.get('/:id', async (req, res, next) => {
    try {
        const resourceId = req.params.id;
        const resources = await readResources();
        const resource = resources.find(r => r.id === resourceId);
        if (!resource) {
            return res.status(404).json({ error: 'Ressource nicht gefunden.' });
        }
        // Durchschnittliche Bewertung berechnen
        let averageRating = 0;
        try {
            const ratings = await readRatings();
            const relevant = ratings.filter(r => r.resourceId === resourceId);
            if (relevant.length > 0) {
                averageRating = relevant.reduce((sum, r) => sum + r.ratingValue, 0) / relevant.length;
                averageRating = Math.round(averageRating * 10) / 10;
            } else {
                averageRating = null;
            }
        } catch (e) {
            averageRating = null;
        }
        // Feedbacks zur Ressource laden
        let feedbacks = [];
        try {
            const allFeedbacks = await readFeedbacks();
            feedbacks = allFeedbacks.filter(f => f.resourceId === resourceId);
        } catch (e) {
            feedbacks = [];
        }
        res.json({ ...resource, averageRating, feedbacks });
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
        const { title, type, url, authorId } = req.body;
        // authorId ist optional
        if (!title || !type || !url) {
            return res.status(400).json({ error: 'Fehlende Felder.' });
        }
        const resources = await readResources();
        const idx = resources.findIndex(r => r.id === resourceId);
        if (idx === -1) {
            return res.status(404).json({ error: 'Ressource nicht gefunden.' });
        }
        const updatedResource = { id: resourceId, title, type, url };
        if (authorId) updatedResource.authorId = authorId;
        resources[idx] = updatedResource;
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
        // IDs sind UUIDs, direkter Vergleich
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

