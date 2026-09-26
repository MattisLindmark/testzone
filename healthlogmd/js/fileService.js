/**
 * File Service - hantera filöppning, läsning och skrivning
 * Använder File System Access API
 */

let currentFileHandle = null;

/**
 * Checka + ladda fil vid första user-interaktion
 * Anropas när användare klickar på en knapp (har user gesture då)
 * Returnerar true om fil är redo, false om användare måste välja fil
 */
async function ensureFileLoaded() {
  // Om vi redan har en handle laden, bara checka permission
  if (currentFileHandle) {
    return await ensureFilePermission();
  }
  
  // Ingen handle laden - försök ladda från IndexedDB
  try {
    const handle = await getFileHandle();
    if (!handle) {
      // Ingen sparad fil
      return false;
    }
    
    // Vi har en sparad fil! Sätt den och checka permission
    currentFileHandle = handle;
    
    // Nu kan vi anropa requestPermission() eftersom vi har user gesture (klick)
    let permission = await currentFileHandle.queryPermission({ mode: 'readwrite' });
    
    if (permission === 'granted') {
      console.log('Sparad fil återladdat och permissioner OK');
      return true;
    }
    
    // Behöver fråga om permission
    if (permission === 'denied' || permission === 'prompt') {
      permission = await currentFileHandle.requestPermission({ mode: 'readwrite' });
      if (permission === 'granted') {
        console.log('Sparad fil återladdat med ny permission');
        return true;
      }
    }
    
    // Permission nekad
    console.log('Permission nekad för sparad fil');
    currentFileHandle = null;
    return false;
    
  } catch (e) {
    console.error('Fel vid försök att ladda sparad fil:', e);
    return false;
  }
}

/**
 * Checka fil + permission innan använder vill jobba med den
 * Anropas före formulär och history-vy
 */
async function ensureFilePermission() {
  if (!currentFileHandle) {
    return false;
  }
  
  try {
    let permission = await currentFileHandle.queryPermission({ mode: 'readwrite' });
    
    if (permission === 'granted') {
      return true;
    }
    
    if (permission === 'denied' || permission === 'prompt') {
      permission = await currentFileHandle.requestPermission({ mode: 'readwrite' });
      return permission === 'granted';
    }
  } catch (e) {
    console.error('Fel vid permission-check:', e);
    return false;
  }
  
  return false;
}

/**
 * Initiera fil-hantering - försök ladda sparad handle eller fråga användare
 */
async function initFileHandling() {
  try {
    // Försök hämta tidigare sparad handle
    const handle = await getFileHandle();
    if (handle) {
      try {
        // Först checka om vi redan har behörighet (ingen dialog)
        let permission = await handle.queryPermission({ mode: 'readwrite' });
        
        // Om vi redan har behörighet, använd direkt
        if (permission === 'granted') {
          currentFileHandle = handle;
          console.log('Sparad fil återladdat automatiskt');
          return true;
        }
        
        // Om vi behöver fråga, gör det
        if (permission === 'prompt') {
          permission = await handle.requestPermission({ mode: 'readwrite' });
          if (permission === 'granted') {
            currentFileHandle = handle;
            console.log('Sparad fil återladdat med behörighet');
            return true;
          }
        }
      } catch (e) {
        // Handle är ogiltig eller behörighet nekad, rensa den
        console.log('Kan inte komma åt sparad fil:', e.message);
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
 * Förbered fil för delning (läs + visa bekräftelsedialog)
 * Anropas från share-knappens klick (har user gesture)
 */
async function prepareFileForSharing() {
  if (!currentFileHandle) {
    throw new Error('Ingen fil att dela');
  }
  
  try {
    // Läs filen asynkront
    const file = await currentFileHandle.getFile();
    const content = await file.text();
    
    // Skapa File-objekt för delning (kopplat från blob, inte från handle)
    const blob = new Blob([content], { type: 'text/markdown' });
    const preparedFile = new File([blob], currentFileHandle.name || 'health-log.md', { type: 'text/markdown' });
    
    // Visa bekräftelsedialog (ej blockerande, Chrome behåller user gesture)
    renderShareConfirmDialog(preparedFile);
  } catch (e) {
    throw new Error('Kunde inte förbereda fil för delning: ' + e.message);
  }
}

/**
 * Dela förbered fil direkt (anropas från dialog-klick, user gesture!)
 * MÅSTE anropas synkront från event handler för att Chrome ska acceptera det
 */
function doShare(preparedFile) {
  if (!navigator.share) {
    alert('Delning stöds inte på denna enhet');
    return;
  }
  
  // Direkt share, ingen await innan, user gesture är färsk från dialog-klick
  navigator.share({
    files: [preparedFile],
    title: 'Hälsologg HealthLogMD',
    text: 'Min hälsologg från HealthLogMD'
  }).then(() => {
    console.log('Fil delad framgångsrikt');
  }).catch(e => {
    if (e.name !== 'AbortError') {
      console.error('Fel vid delning:', e);
    }
  });
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


