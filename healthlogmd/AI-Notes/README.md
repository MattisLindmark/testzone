# HealthLogMD - Dokumentation

## Överblick
En minimalistisk PWA för loggning av hälsodata (vikt och blodtryck) offline. Datat sparas i **Markdown-format** lokalt på enheten via File System Access API.

## Arkitektur

### Teknik
- **Frontend:** Vanilla JavaScript + HTML + CSS (ingen build-tool, ingen framework)
- **Lagring:** File System Access API (lokal fil) + IndexedDB (behörighets-caching)
- **Format:** Markdown (två tabeller: #vikt och #blod)
- **PWA:** Service Worker för offline-support

### Filstruktur
```
HealthLogMD/
├── index.html              # HTML-shell
├── css/styles.css          # Dark mode styling
├── js/
│   ├── app.js              # Main logic & event listeners
│   ├── ui.js               # DOM rendering
│   ├── fileService.js      # File System Access API
│   ├── indexedDBService.js # Permission storage
│   ├── markdownParser.js   # MD-parsing & row formatting
│   └── dateUtils.js        # Date calculations & validation
├── sw.js                   # Service Worker
├── manifest.json           # PWA manifest
└── AI-Notes/               # Dokumentation
```

## Features

### Startsida
- Två knappar: "Anteckna Vikt" och "Anteckna Blodtryck"
- Länk: "Visa historik" (visar poster från vald tabell, senaste överst)
- Ikon: Inställningar (⚙️)

### Inmatningsformulär
- **Vikt:** Datum, Tid, Vikt (kg), Anteckningar (fri text)
- **Blod:** Datum, Tid, SYS, DIA, Puls (bpm), Ställning (dropdown), Anteckningar
- **Layout-optimering:** Datum och Tid visas bredvid varandra även i portrait-mode för att minska scrollning
- **Position-minne:** Blodtryck-formuläret sparar senast valda ställning (localStorage) mellan sessioner
- Validering:
  - Obligatoriska fält: Vikt för viktsida; SYS/DIA/Puls/Ställning för blodsida
  - Datum måste vara giltigt (inte framtida)
  - Tid måste vara HH:MM-format
  - Inline error-meddelanden under felaktiga fält
- Knappar: Avbryt (vänster), Rensa (mitten), Spara (höger)
- Efter sparning: Toast-meddelande + tillbaka till startsida

### Inställningar
- Visa aktuell datalogg (fil-namn)
- "Ny datalogg" — skapa ny fil på vald plats
- "Öppna befintlig" — File Picker
- "Glömma fil" — rensa sparad behörighet (nästa gång frågas igen)
- "Dela datalogg" — Share API
- Disclaimer under "Filövervakning": *"Filen lämnas orörd — ingen data raderas"* (förtydligar att båda operationer inte modifierar filen)

### Historik
- Lista alla poster från vald tabell (omvänd ordning, senaste överst)
- Format: En eller två rader per post (datum+tid+värden, sedan anteckningar om de finns)
- Snygg, läsbar formattering

## Datalagringsformat

Markdown-fil med två sektioner, varje med pipe-delimiterade rader:

**#vikt tabell:**
```
# vikt
| Datum | Tid | Veckodag | Vikt | Anteckningar |
| --- | --- | --- | --- | --- |
| 2026-09-24 | 14:15 | torsdag | 75.5 | Åt julbord |
```

**#blod tabell:**
```
# blod
| Datum | Tid | Veckodag | SYS | DIA | Puls | Ställning | Anteckningar |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 2026-09-24 | 14:15 | torsdag | 130 | 85 | 72 | Sittande | Lite stressad |
```

- **Datum:** ISO-format (YYYY-MM-DD)
- **Tid:** 24-timmars format (HH:MM, ingen sekunder)
- **Veckodag:** Auto-beräknad offline från JavaScript Date (lokal tid)
- Nya poster **appends** längst ned i tabellen (line-by-line parsing för högt säkerhet)

## PWA & Versioning

### Installation
- App installeras via Manifest (standalone mode)
- Offline-first via Service Worker
- Data förblir när appen uppdateras/ominstalleras

### Versioning & Uppdateringar
**Viktigt:** För att tvinga PWA att uppdatera till ny version:
1. Öppna `sw.js`
2. Ändra `CACHE_NAME` från `'healthlog-v1'` till `'healthlog-v2'` osv
3. Service Workern checkar automatiskt vid nästa sidladdning
4. Gamla caches tömms automatiskt

Ingen notifiering krävs till användare (passiv uppdatering).

## Utveckling

### Lokal utveckling (utan cache)
```bash
cd HealthLogMD
python -m http.server 8000
# Öppna http://localhost:8000
# Service Worker är AKTIVERAD (kolla Application → Service Workers i DevTools)
```

### Produktion (med Service Worker cachning)
1. Deploy filer till webbserver (t.ex. nginx, Apache, eller cloud hosting)
2. Service Worker är aktiverad automatiskt
3. Vid uppdateringar: öka `CACHE_NAME` i `sw.js` (t.ex. `'healthlog-v1'` → `'healthlog-v2'`)
4. Service Workern uppdateras automatiskt nästa gång användare besöker sidan

### Installation på mobil (iOS/Android)
1. Öppna webbserver-URL i mobil-webbläsare
2. **Android Chrome:** Meny → "Lägg till på startsidan" eller "Installera app"
3. **iOS Safari:** Dela-knappen → "Till hemskärmen"
4. Appen installeras som standalone-app
5. Fungerar offline efter första besöket (Service Worker cache)

## Viktiga Implementeringsdetaljer

### Markdown-parsing
- **Line-by-line approach:** Splitar på `\n`, bearbetar rader som array, join igen för att undvika korruption
- Parser filtrerar INTE tomma rader — de är kritiska för sektionstrukturen
- Varje sektion: header (# vikt/# blod), separator, blank rad, sedan data-rader

### Fil-initialisering
- Nya filer initialiseras med BÅDA tabeller redan skapade (header + separator + blank rad)
- Första sparningen går sedan in på rätt plats utan fel

### Datum-hantering
- Använder JavaScript Date med **lokal tid** (inte UTC)
- Validering: framtida datum tillåts inte
- Veckodagar beräknas offline från ISO-datumsträng

## Begränsningar (v1)

- **Append-only:** Redigering/borttagning av poster kommer senare
- **Två tabeller endast:** Enkel struktur, lätt att parsa
- **Ingen grafik/varningar:** Bara loggning + listning
- **Stående layout:** Portrait-mode på både mobil och desktop
- **Svenska texter:** Hela UI

## Framtida förbättringar

- Redigering/borttagning av befintliga poster
- Grafer/statistik över data
- Värde-validering (t.ex. varning för orealistiska värden)
- Exponering av historik i andra format (CSV, JSON export)
- Språkval (Svenska/Engelska)

## Debugging

- Öppna DevTools (F12)
- Service Worker: DevTools → Application → Service Workers
- IndexedDB: DevTools → Application → IndexedDB → HealthLogMD
- Konsol-loggar för fil-operationer

---

**Skapad:** 2026-09-25  
**Version:** 1.0 (MVP)  
**Språk:** Svenska  
**Stack:** Vanilla JS + PWA
