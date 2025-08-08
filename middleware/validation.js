/**
 * middleware/validation.js
 *
 * Validierungs-Middleware für Bewertungen und Feedback im Resource Catalog Service.
 *
 * @fileoverview Stellt Middleware für die Validierung von ratingValue und feedbackText bereit.
 */

/**
 * Middleware zur Validierung von ratingValue für Bewertungen.
 * Prüft, ob ratingValue vorhanden, eine Ganzzahl und zwischen 1 und 5 ist.
 * Setzt ratingValue als Integer im Request-Body.
 *
 * @param {import('express').Request} req - Express Request Objekt
 * @param {import('express').Response} res - Express Response Objekt
 * @param {Function} next - Nächste Middleware
 */
export function validateRating(req, res, next) {
    const value = req.body.ratingValue;
    // In Integer umwandeln und prüfen
    const ratingInt = parseInt(value, 10);
    if (value === undefined || isNaN(ratingInt) || !Number.isInteger(ratingInt) || ratingInt < 1 || ratingInt > 5) {
        return res.status(400).json({ error: 'ratingValue muss eine Ganzzahl zwischen 1 und 5 sein.' });
    }
    req.body.ratingValue = ratingInt; // Typ sicherstellen
    next();
}

/**
 * Middleware zur Validierung von feedbackText für Feedback.
 * Prüft, ob feedbackText vorhanden, ein nicht-leerer String und zwischen 10 und 500 Zeichen lang ist.
 * Setzt feedbackText als getrimmten String im Request-Body.
 *
 * @param {import('express').Request} req - Express Request Objekt
 * @param {import('express').Response} res - Express Response Objekt
 * @param {Function} next - Nächste Middleware
 */
export function validateFeedback(req, res, next) {
    const text = req.body.feedbackText;
    // String prüfen und trimmen
    if (typeof text !== 'string' || !text.trim()) {
        return res.status(400).json({ error: 'feedbackText darf nicht leer sein.' });
    }
    if (text.trim().length < 10) {
        return res.status(400).json({ error: 'feedbackText ist zu kurz (mindestens 10 Zeichen).' });
    }
    if (text.trim().length > 500) {
        return res.status(400).json({ error: 'feedbackText ist zu lang (maximal 500 Zeichen).' });
    }
    req.body.feedbackText = text.trim(); // Typ und Länge sicherstellen
    next();
}
