

/**
 * Hauptserver für den Resource Catalog Service
 * Bindet zentrale Middleware und Routen ein
 * @module server
 */
import express from 'express';

// dotenv für Umgebungsvariablen laden (z.B. PORT)
import dotenv from 'dotenv';
dotenv.config();

// Ressourcen-Router und zentrale Logging-Middleware importieren
import resourcesRouter from './routes/resources.js';
import logger from './middleware/logger.js';

// Express-App initialisieren
const app = express();




// Port aus Umgebungsvariablen oder Fallback (Standard: 5002)
const port = process.env.PORT || 5002;




// Middleware für JSON-Parsing (ermöglicht das Parsen von JSON-Bodies)
app.use(express.json());

// Zentrale Logging-Middleware: Loggt Methode, Pfad, Status und Dauer jeder Anfrage
app.use(logger);





/**
 * GET /
 * Liefert eine Begrüßungsnachricht für die Startseite
 */
app.get('/', (req, res) => {
    res.send('Welcome to Resource Catalog');
});


/**
 * POST /restart
 * Beendet den Node-Prozess, damit nodemon automatisch neu startet
 */
app.post('/restart', (req, res) => {
    res.status(200).json({ message: 'Server wird neu gestartet...' });
    // Kurze Verzögerung, damit die Antwort gesendet wird
    setTimeout(() => {
        process.exit(0);
    }, 300);
});




/**
 * Zentrale Fehlerbehandlung: Fängt alle Fehler ab und gibt konsistente Fehlermeldungen zurück
 */
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
});




/**
 * Bindet den Ressourcen-Router für alle /resources-Routen ein
 */
app.use('/resources', resourcesRouter);



/**
 * Startet den Server und gibt die URL aus
 */
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
