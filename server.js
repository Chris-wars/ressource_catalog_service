
// Express-Framework importieren
import express from 'express';
// dotenv für Umgebungsvariablen laden
import dotenv from 'dotenv';
dotenv.config();


// Express-App initialisieren
const app = express();



// Port aus Umgebungsvariablen oder Fallback
const port = process.env.PORT || 5002;



// Middleware für JSON-Parsing (ermöglicht das Parsen von JSON-Bodies)
app.use(express.json());

// Logging-Middleware: Loggt Methode und Pfad jeder Anfrage
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});


// Ressourcen-Router importieren
import resourcesRouter from './routes/resources.js';


// Basisroute für die Startseite
app.get('/', (req, res) => {
    res.send('Welcome to Resource Catalog');
});



// Zentrale Fehlerbehandlung: Fängt alle Fehler ab und gibt konsistente Fehlermeldungen zurück
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
});



// Ressourcen-Router einbinden (alle /resources-Routen werden ausgelagert)
app.use('/resources', resourcesRouter);


// Server starten
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});