/**
 * middleware/logger.js
 *
 * Logging-Middleware für alle API-Anfragen und Antworten im Resource Catalog Service.
 * Loggt HTTP-Methode, Pfad, Statuscode und Dauer jeder Anfrage im Terminal.
 *
 * @fileoverview Middleware für zentrales Logging von Requests und Responses.
 */

/**
 * Logging-Middleware für Express.
 * Loggt zu Beginn der Anfrage Methode und Pfad, nach Antwort Status und Dauer.
 *
 * @param {import('express').Request} req - Express Request Objekt
 * @param {import('express').Response} res - Express Response Objekt
 * @param {Function} next - Nächste Middleware
 */
function logger(req, res, next) {
    // Startzeit merken
    const start = Date.now();
    // Request loggen
    console.log(`[Request] ${req.method} ${req.url}`);
    // Nach Antwort: Status und Dauer loggen
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[Response] ${req.method} ${req.url} - Status: ${res.statusCode} - Dauer: ${duration}ms`);
    });
    // Weiter zur nächsten Middleware
    next();
}

export default logger;
