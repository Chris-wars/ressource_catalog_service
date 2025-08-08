
// =====================
// Imports und Initialisierung
// =====================
import express from 'express';
// Importiere zentrale Dateioperationen und Middleware
import { readData, writeData } from '../helpers/data_manager.js';
import logger from '../middleware/logger.js';
import { validateRating, validateFeedback } from '../middleware/validation.js';
import path from 'path'; // Nur für __dirname
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';

// Router-Instanz für alle /resources-Routen
const router = express.Router();

// __dirname-Ersatz für ES-Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dateinamen für zentrale Datenhaltung
const RESOURCES_FILE = 'resources.json';
const RATINGS_FILE = 'ratings.json';
const FEEDBACK_FILE = 'feedback.json';


// =====================
// Middleware: Logging für alle Requests
// =====================
router.use(logger); // Protokolliert alle Anfragen und Antworten

// =====================
// Ressourcen-Endpunkte
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
/**
 * POST /resources/:resourceId/feedback
 * Legt ein neues Feedback für eine Ressource an.
 * Erwartet: { feedbackText }
 * Antwort:
 *   - 201 Created, Feedback-Objekt mit id und timestamp
 *   - 400 bei ungültigem Text oder fehlenden Feldern
 *   - 404 wenn Ressource nicht existiert
 */
router.post('/:resourceId/feedback', validateFeedback, async (req, res, next) => {
    try {
        const { resourceId } = req.params;
        const { feedbackText } = req.body;
        // Existiert die Ressource?
        const resources = await readData(RESOURCES_FILE);
        const resource = resources.find(r => r.id === resourceId);
        if (!resource) {
            return res.status(404).json({ error: 'Ressource nicht gefunden.' });
        }
        const feedbacks = await readData(FEEDBACK_FILE);
        const newFeedback = {
            id: uuidv4(),
            resourceId,
            feedbackText: feedbackText.trim(),
            timestamp: new Date().toISOString()
        };
        feedbacks.push(newFeedback);
        await writeData(FEEDBACK_FILE, feedbacks);
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
/**
 * PUT /resources/:resourceId/feedback/:feedbackId
 * Aktualisiert ein bestehendes Feedback.
 * Erwartet: { feedbackText }
 * Antwort:
 *   - 200 OK, aktualisiertes Feedback-Objekt
 *   - 400 bei ungültigem Text oder fehlenden Feldern
 *   - 404 wenn Ressource oder Feedback nicht existiert
 */
router.put('/:resourceId/feedback/:feedbackId', validateFeedback, async (req, res, next) => {
    try {
        const { resourceId, feedbackId } = req.params;
        const { feedbackText } = req.body;
        // Existiert die Ressource?
        const resources = await readData(RESOURCES_FILE);
        const resource = resources.find(r => r.id === resourceId);
        if (!resource) {
            return res.status(404).json({ error: 'Ressource nicht gefunden.' });
        }
        const feedbacks = await readData(FEEDBACK_FILE);
        const idx = feedbacks.findIndex(f => f.id === feedbackId && f.resourceId === resourceId);
        if (idx === -1) {
            return res.status(404).json({ error: 'Feedback nicht gefunden.' });
        }
        feedbacks[idx].feedbackText = feedbackText.trim();
        feedbacks[idx].timestamp = new Date().toISOString();
        await writeData(FEEDBACK_FILE, feedbacks);
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
        // Existiert die Ressource?
        const resources = await readData(RESOURCES_FILE);
        const resource = resources.find(r => r.id === resourceId);
        if (!resource) {
            return res.status(404).json({ error: 'Ressource nicht gefunden.' });
        }
        const feedbacks = await readData(FEEDBACK_FILE);
        const idx = feedbacks.findIndex(f => f.id === feedbackId && f.resourceId === resourceId);
        if (idx === -1) {
            return res.status(404).json({ error: 'Feedback nicht gefunden.' });
        }
        feedbacks.splice(idx, 1);
        await writeData(FEEDBACK_FILE, feedbacks);
        res.status(204).send();
    } catch (err) {
        next(err);
    }
});
// ...entfernt, da bereits oben deklariert...


// =====================
// Rating-Endpunkte
// =====================

// =====================
// Rating-Endpunkte
// =====================

/**
 * POST /resources/:id/rating
 * Bewertet eine Ressource mit 1-5 Sternen (ratingValue).
 * Erwartet: { ratingValue, userId (optional) }
 * Antwort: 201 Created bei Erfolg, gibt Rating-Objekt mit id zurück
 */
/**
 * POST /resources/:id/rating
 * Bewertet eine Ressource mit 1-5 Sternen (ratingValue).
 * Erwartet: { ratingValue, userId (optional) }
 * Antwort: 201 Created bei Erfolg, gibt Rating-Objekt mit id zurück
 */
router.post('/:id/rating', validateRating, async (req, res, next) => {
    try {
        const resourceId = req.params.id;
        const { ratingValue, userId } = req.body;
        // Existiert die Ressource?
        const resources = await readData(RESOURCES_FILE);
        const resource = resources.find(r => r.id === resourceId);
        if (!resource) {
            return res.status(404).json({ error: 'Ressource nicht gefunden.' });
        }
        // Bewertung speichern
        const ratings = await readData(RATINGS_FILE);
        const newRating = { id: uuidv4(), resourceId, ratingValue: parseInt(ratingValue, 10) };
        if (userId) newRating.userId = userId;
        ratings.push(newRating);
        await writeData(RATINGS_FILE, ratings);
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
/**
 * DELETE /resources/:resourceId/rating/:ratingId
 * Löscht ein Rating anhand seiner ID für eine Ressource.
 * Antwort: 204 No Content bei Erfolg, 404 wenn nicht gefunden
 */
router.delete('/:resourceId/rating/:ratingId', async (req, res, next) => {
    try {
        const { resourceId, ratingId } = req.params;
        // Existiert die Ressource?
        const resources = await readData(RESOURCES_FILE);
        const resource = resources.find(r => r.id === resourceId);
        if (!resource) {
            return res.status(404).json({ error: 'Ressource nicht gefunden.' });
        }
        const ratings = await readData(RATINGS_FILE);
        const idx = ratings.findIndex(r => r.id === ratingId && r.resourceId === resourceId);
        if (idx === -1) {
            return res.status(404).json({ error: 'Rating nicht gefunden.' });
        }
        ratings.splice(idx, 1);
        await writeData(RATINGS_FILE, ratings);
        res.status(204).send();
    } catch (err) {
        next(err);
    }
});

// =====================
// Ressourcen Endpunkte
// =====================

/**
 * GET /resources/search
 * Filtert Ressourcen nach Typ (?type=...)
 * Gibt alle Ressourcen zurück, wenn kein Filter gesetzt ist.
 */
/**
 * GET /resources/search
 * Filtert Ressourcen nach Typ (?type=...)
 * Gibt alle Ressourcen zurück, wenn kein Filter gesetzt ist.
 */
router.get('/search', async (req, res, next) => {
    try {
        const { type } = req.query;
        const resources = await readData(RESOURCES_FILE);
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
/**
 * GET /resources
 * Gibt alle Ressourcen als Array zurück.
 */
router.get('/', async (req, res, next) => {
    try {
        const resources = await readData(RESOURCES_FILE);
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
        const resources = await readData(RESOURCES_FILE);
        const newResource = { id: uuidv4(), title, type, url };
        if (authorId) newResource.authorId = authorId;
        resources.push(newResource);
        await writeData(RESOURCES_FILE, resources);
        res.status(201).json(newResource);
    } catch (err) {
        next(err);
    }
});

/**
 * GET /resources/:id
 * Gibt eine einzelne Ressource anhand ihrer ID zurück und liefert averageRating und feedbacks.
 */
/**
 * GET /resources/:id
 * Gibt eine einzelne Ressource anhand ihrer ID zurück und liefert averageRating und feedbacks.
 */
router.get('/:id', async (req, res, next) => {
    try {
        const resourceId = req.params.id;
        const resources = await readData(RESOURCES_FILE);
        const resource = resources.find(r => r.id === resourceId);
        if (!resource) {
            return res.status(404).json({ error: 'Ressource nicht gefunden.' });
        }
        // Durchschnittliche Bewertung berechnen
        let averageRating = null;
        try {
            const ratings = await readData(RATINGS_FILE);
            const relevant = ratings.filter(r => r.resourceId === resourceId);
            if (relevant.length > 0) {
                averageRating = relevant.reduce((sum, r) => sum + r.ratingValue, 0) / relevant.length;
                averageRating = Math.round(averageRating * 10) / 10;
            }
        } catch (e) {
            averageRating = null;
        }
        // Feedbacks zur Ressource laden
        let feedbacks = [];
        try {
            const allFeedbacks = await readData(FEEDBACK_FILE);
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
        const resources = await readData(RESOURCES_FILE);
        const idx = resources.findIndex(r => r.id === resourceId);
        if (idx === -1) {
            return res.status(404).json({ error: 'Ressource nicht gefunden.' });
        }
        const updatedResource = { id: resourceId, title, type, url };
        if (authorId) updatedResource.authorId = authorId;
        resources[idx] = updatedResource;
        await writeData(RESOURCES_FILE, resources);
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
/**
 * DELETE /resources/:id
 * Löscht eine Ressource anhand ihrer ID.
 * Antwort: Status 204 (No Content) bei Erfolg
 */
router.delete('/:id', async (req, res, next) => {
    try {
        const resourceId = req.params.id;
        const resources = await readData(RESOURCES_FILE);
        // IDs sind UUIDs, direkter Vergleich
        const idx = resources.findIndex(r => r.id === resourceId);
        if (idx === -1) {
            return res.status(404).json({ error: 'Ressource nicht gefunden.' });
        }
        resources.splice(idx, 1);
        await writeData(RESOURCES_FILE, resources);
        res.status(204).send();
    } catch (err) {
        next(err);
    }
});


// Exportiert den Router für die Verwendung in server.js
export default router;

