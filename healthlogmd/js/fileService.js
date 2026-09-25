/**
 * File Service - hantera filöppning, läsning och skrivning
 * Använder File System Access API
 */

let currentFileHandle = null;

/**
 * Initiera fil-hantering - försök ladda sparad handle eller fråga användare
 */
async function initFileHandling() {
  try {
    // Försök hämta tidigare sparad handle
    const handle = await getFileHandle();
    if (handle) {
      try {
        // Verifiera att vi fortfarande har behörighet
        const permission = await handle.queryPermission({ mode: 'readwrite' });
        if (permission === 'granted') {
          currentFileHandle = handle;
          return true;
        }
      } catch (e) {
        // Handle är ogiltig, rensa den
        await clearFileHandle();
      }
    }
  } catch (e) {
    console.log('Ingen tidigare fil sparad');
  }
  
  return false;
}

/**
 * Öppna befintlig fil
 */
async function openExistingFile() {
  try {
    const [fileHandle] = await window.showOpenFilePicker({
      types: [
        {
          description: 'Markdown filer',
          accept: { 'text/markdown': ['.md'] }
        }
      ],
      mode: 'readwrite'
    });
    
    if (fileHandle) {
      currentFileHandle = fileHandle;
      await saveFileHandle(fileHandle);
      return true;
    }
  } catch (e) {
    if (e.name !== 'AbortError') {
      console.error('Fel vid öppnande av fil:', e);
      throw new Error('Kunde inte öppna fil: ' + e.message);
    }
  }
  
  return false;
}

/**
 * Skapa ny fil på vald plats
 */
async function createNewFile() {
  try {
    const fileHandle = await window.showSaveFilePicker({
      suggestedName: 'health-log.md',
      types: [
        {
          description: 'Markdown filer',
          accept: { 'text/markdown': ['.md'] }
        }
      ]
    });
    
    if (fileHandle) {
      // Skapa initial innehål med båda tabellsektionerna redan utlagda
      const writable = await fileHandle.createWritable();
      const initialContent = `# Hälsologg HealthLogMD

# vikt
|Datum|Tid|Veckodag|Vikt|Anteckningar|
|---|---|---|---|---|

# blod
|Datum|Tid|Veckodag|SYS|DIA|Puls|Ställning|Anteckningar|
|---|---|---|---|---|---|---|---|

`;
      await writable.write(initialContent);
      await writable.close();
      
      currentFileHandle = fileHandle;
      await saveFileHandle(fileHandle);
      return true;
    }
  } catch (e) {
    if (e.name !== 'AbortError') {
      console.error('Fel vid skapande av fil:', e);
      throw new Error('Kunde inte skapa fil: ' + e.message);
    }
  }
  
  return false;
}

/**
 * Läs innehål från aktuell fil
 */
async function readFile() {
  if (!currentFileHandle) {
    throw new Error('Ingen fil vald');
  }
  
  try {
    const file = await currentFileHandle.getFile();
    const text = await file.text();
    return text;
  } catch (e) {
    console.error('Fel vid läsning av fil:', e);
    throw new Error('Kunde inte läsa fil: ' + e.message);
  }
}

/**
 * Skriv innehål till aktuell fil
 */
async function writeFile(content) {
  if (!currentFileHandle) {
    throw new Error('Ingen fil vald');
  }
  
  try {
    const writable = await currentFileHandle.createWritable();
    await writable.write(content);
    await writable.close();
    return true;
  } catch (e) {
    console.error('Fel vid skrivning till fil:', e);
    throw new Error('Kunde inte skriva till fil: ' + e.message);
  }
}

/**
 * Hämta aktuell fil-sökväg/namn
 */
async function getCurrentFileName() {
  if (!currentFileHandle) {
    return null;
  }
  
  try {
    return currentFileHandle.name;
  } catch (e) {
    return null;
  }
}

/**
 * Dela fil (via Share API)
 */
async function shareFile() {
  if (!currentFileHandle) {
    throw new Error('Ingen fil att dela');
  }
  
  try {
    const file = await currentFileHandle.getFile();
    
    if (navigator.share) {
      await navigator.share({
        files: [file],
        title: 'Min hälsodata',
        text: 'Hälsodatalogg från HealthLogMD'
      });
      return true;
    } else {
      throw new Error('Delning stöds inte på denna enhet');
    }
  } catch (e) {
    if (e.name !== 'AbortError') {
      console.error('Fel vid delning av fil:', e);
      throw new Error('Kunde inte dela fil: ' + e.message);
    }
  }
  
  return false;
}

/**
 * Glömma fil (ta bort sparad handle)
 */
async function forgetFile() {
  currentFileHandle = null;
  await clearFileHandle();
}

/**
 * Kontrollera om fil är vald
 */
function hasFileSelected() {
  return currentFileHandle !== null;
}

/**
 * Tvinga uppdatering av fil från disk (för att checka ändringar)
 */
async function verifyFilePermission() {
  if (!currentFileHandle) return false;
  
  try {
    const permission = await currentFileHandle.queryPermission({ mode: 'readwrite' });
    return permission === 'granted';
  } catch (e) {
    return false;
  }
}
