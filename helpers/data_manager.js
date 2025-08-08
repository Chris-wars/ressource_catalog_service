/**
 * helpers/data_manager.js
 *
 * Asynchroner Datenmanager für JSON-Dateizugriffe im Resource Catalog Service.
 * Kapselt alle Lese- und Schreiboperationen für resources.json, ratings.json, feedback.json.
 *
 * @fileoverview Stellt asynchrone Funktionen zum Lesen und Schreiben von JSON-Dateien bereit.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Basisverzeichnis für Daten
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, '..', 'data');

/**
 * Liest asynchron JSON-Daten aus einer Datei im data-Ordner.
 * Gibt ein Array zurück oder ein leeres Array, wenn die Datei fehlt oder ungültig ist.
 *
 * @param {string} fileName - Dateiname (z.B. 'resources.json')
 * @returns {Promise<Array>} Geparstes Array oder leeres Array, wenn Datei fehlt/leer/ungültig
 */
export async function readData(fileName) {
    try {
        // Pfad zur Datei im data-Ordner berechnen
        const filePath = path.join(dataDir, fileName);
        // Datei asynchron lesen
        const content = await fs.readFile(filePath, 'utf8');
        // JSON parsen und zurückgeben
        return JSON.parse(content);
    } catch (err) {
        // Datei fehlt: leeres Array zurückgeben
        if (err.code === 'ENOENT') return [];
        // Fehler weiterreichen (wird von Error-Middleware gefangen)
        throw err;
    }
}

/**
 * Schreibt asynchron JSON-Daten in eine Datei im data-Ordner.
 *
 * @param {string} fileName - Dateiname (z.B. 'resources.json')
 * @param {Array|Object} data - Zu schreibende Daten
 * @returns {Promise<void>} Promise, das nach Abschluss aufgelöst wird
 */
export async function writeData(fileName, data) {
    // Pfad zur Datei im data-Ordner berechnen
    const filePath = path.join(dataDir, fileName);
    // Daten als JSON-String speichern (mit Einrückung)
    await fs.writeFile(filePath, JSON.stringify(data, null, 4), 'utf8');
}
