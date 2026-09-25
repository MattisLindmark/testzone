/**
 * Main App Logic - HealthLogMD
 */

let currentFormType = null;

/**
 * Initiera appen
 */
async function initApp() {
  try {
    // Initiera databaser
    await initDB();
    
    // Försök ladda tidigare fil
    const hasFile = await initFileHandling();
    
    // Rendera startsida
    renderHomePage();
    attachHomePageListeners();
    
    // Uppdatera fil-visning
    if (hasFile) {
      const fileName = await getCurrentFileName();
      updateFilePathDisplay(fileName);
    }
    
    console.log('HealthLogMD initierad');
    
    // Auto-öppna senast använd fil om den finns
    const handle = await getFileHandle();
    if (handle) {
      try {
        // Verifiera att handle är giltigt
        const permission = await handle.queryPermission({ mode: 'read' });
        if (permission === 'granted') {
          console.log('Senast använd fil återladdat');
        }
      } catch (e) {
        console.log('Senast använd fil är inte längre tillgänglig');
      }
    }
    
    // Back-knapp: hantera history och navigera
    window.addEventListener('popstate', (event) => {
      if (event.state && event.state.page === 'home') {
        renderHomePage();
        attachHomePageListeners();
      }
    });
    
    // Pusha initial state för home page
    history.pushState({page: 'home'}, '', '');
  } catch (e) {
    console.error('Fel vid initiering:', e);
  }
}

/**
 * Event-lyssnare för startsida
 */
function attachHomePageListeners() {
  document.getElementById('btn-weight')?.addEventListener('click', async () => {
    if (!await ensureFilePermission()) {
      alert('Ingen datalogg är öppnad. Gå till Inställningar för att öppna eller skapa en fil.');
      return;
    }
    currentFormType = 'vikt';
    history.pushState({page: 'form'}, '', '');
    renderInputForm('vikt');
    attachFormListeners();
  });
  
  document.getElementById('btn-blood')?.addEventListener('click', async () => {
    if (!await ensureFilePermission()) {
      alert('Ingen datalogg är öppnad. Gå till Inställningar för att öppna eller skapa en fil.');
      return;
    }
    currentFormType = 'blod';
    history.pushState({page: 'form'}, '', '');
    renderInputForm('blod');
    attachFormListeners();
  });
  
  document.getElementById('btn-settings')?.addEventListener('click', () => {
    history.pushState({page: 'settings'}, '', '');
    renderSettingsPage();
    attachSettingsListeners();
  });
  
  document.getElementById('btn-history')?.addEventListener('click', async () => {
    try {
      if (!await ensureFilePermission()) {
        alert('Ingen datalogg är öppnad. Gå till Inställningar för att öppna eller skapa en fil.');
        return;
      }
      
      const content = await readFile();
      let rows;
      
      if (confirm('Visa vikt eller blodtryck?\n\nOK = Vikt\nAvbryt = Blodtryck')) {
        rows = parseMarkdownTable(content, 'vikt');
        history.pushState({page: 'history'}, '', '');
        renderHistoryPage('vikt', rows);
      } else {
        rows = parseMarkdownTable(content, 'blod');
        history.pushState({page: 'history'}, '', '');
        renderHistoryPage('blod', rows);
      }
      
      attachHistoryListeners();
    } catch (e) {
      console.error('Fel vid läsning av historik:', e);
      alert('Kunde inte läsa historik: ' + e.message);
    }
  });
}

/**
 * Event-lyssnare för formulär
 */
function attachFormListeners() {
  const form = document.getElementById('input-form');
  
  // Om det är blod-form, ladda senaste ställning från localStorage
  if (currentFormType === 'blod') {
    const savedPosition = localStorage.getItem('lastPosition');
    if (savedPosition) {
      const positionSelect = document.getElementById('input-position');
      if (positionSelect) {
        positionSelect.value = savedPosition;
      }
    }
  }
  
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleFormSubmit();
  });
  
  document.getElementById('btn-reset')?.addEventListener('click', () => {
    form.reset();
    if (currentFormType === 'vikt') {
      document.getElementById('input-date').value = getTodayISO();
      document.getElementById('input-time').value = getCurrentTimeHHMM();
    } else {
      document.getElementById('input-date').value = getTodayISO();
      document.getElementById('input-time').value = getCurrentTimeHHMM();
    }
    clearFieldErrors();
  });
  
  document.getElementById('btn-cancel')?.addEventListener('click', () => {
    history.back();
  });
}

/**
 * Hantera formulär-skickning
 */
async function handleFormSubmit() {
  clearFieldErrors();
  
  try {
    // Validera fil öppen
    if (!hasFileSelected()) {
      showAlert('Ingen datalogg öppnad. Öppna eller skapa en via Inställningar.', 'error');
      return;
    }
    
    // Samla in och validera data
    const date = document.getElementById('input-date').value;
    const time = document.getElementById('input-time').value;
    const notes = document.getElementById('input-notes').value.trim();
    
    // Validera datum och tid
    if (!isValidDate(date)) {
      showFieldError('date', 'Ogiltigt datum. Datum kan inte vara i framtiden.');
      return;
    }
    
    if (!isValidTime(time)) {
      showFieldError('time', 'Ogiltigt tidsformat (använd HH:MM)');
      return;
    }
    
    let rowData;
    
    if (currentFormType === 'vikt') {
      const weight = document.getElementById('input-weight').value.trim();
      if (!weight) {
        showFieldError('weight', 'Vikt-värde är obligatoriskt');
        return;
      }
      
      rowData = {
        date,
        time,
        dayName: getDayName(date),
        weight,
        notes
      };
    } else {
      const sys = document.getElementById('input-sys').value.trim();
      const dia = document.getElementById('input-dia').value.trim();
      const pulse = document.getElementById('input-pulse').value.trim();
      const position = document.getElementById('input-position').value;
      
      if (!sys || !dia || !pulse) {
        if (!sys) showFieldError('sys', 'Systoliskt-värde är obligatoriskt');
        if (!dia) showFieldError('dia', 'Diastoliskt-värde är obligatoriskt');
        if (!pulse) showFieldError('pulse', 'Puls-värde är obligatoriskt');
        return;
      }
      
      if (!position) {
        showFieldError('position', 'Ställning är obligatorisk');
        return;
      }
      
      rowData = {
        date,
        time,
        dayName: getDayName(date),
        sys,
        dia,
        pulse,
        position,
        notes
      };
    }
    
    // Läs fil, lägg till rad, skriv tillbaka
    const content = await readFile();
    const updatedContent = appendRowToTable(content, currentFormType, rowData);
    await writeFile(updatedContent);
    
    // Spara ställning om det är blod-form
    if (currentFormType === 'blod') {
      localStorage.setItem('lastPosition', rowData.position);
    }
    
    // Visa bekräftelse och gå tillbaka
    showAlert('Data sparad! ✓', 'success');
    
    setTimeout(() => {
      renderHomePage();
      attachHomePageListeners();
    }, 1500);
    
  } catch (e) {
    console.error('Fel vid sparning:', e);
    showAlert('Kunde inte spara data: ' + e.message, 'error');
  }
}

/**
 * Event-lyssnare för inställningar
 */
function attachSettingsListeners() {
  document.getElementById('btn-new-file')?.addEventListener('click', async () => {
    try {
      const success = await createNewFile();
      if (success) {
        const fileName = await getCurrentFileName();
        updateFilePathDisplay(fileName);
        showAlert('Ny datalogg skapad! ✓', 'success');
      }
    } catch (e) {
      console.error('Fel vid skapande av fil:', e);
      showAlert('Kunde inte skapa fil: ' + e.message, 'error');
    }
  });
  
  document.getElementById('btn-open-file')?.addEventListener('click', async () => {
    try {
      const success = await openExistingFile();
      if (success) {
        const fileName = await getCurrentFileName();
        updateFilePathDisplay(fileName);
        showAlert('Datalogg öppnad! ✓', 'success');
      }
    } catch (e) {
      console.error('Fel vid öppnande av fil:', e);
      showAlert('Kunde inte öppna fil: ' + e.message, 'error');
    }
  });
  
  document.getElementById('btn-forget-file')?.addEventListener('click', async () => {
    if (confirm('Är du säker? Du blir frågad igen nästa gång.')) {
      await forgetFile();
      updateFilePathDisplay(null);
      showAlert('Fil glömd! Du blir frågad nästa gång.', 'success');
    }
  });
  
  document.getElementById('btn-share-file')?.addEventListener('click', async () => {
    try {
      if (!hasFileSelected()) {
        showAlert('Ingen datalogg att dela', 'error');
        return;
      }
      
      await shareFile();
    } catch (e) {
      console.error('Fel vid delning:', e);
      showAlert('Kunde inte dela fil: ' + e.message, 'error');
    }
  });
  
  document.getElementById('btn-back-home')?.addEventListener('click', () => {
    renderHomePage();
    attachHomePageListeners();
  });
}

/**
 * Event-lyssnare för historik
 */
function attachHistoryListeners() {
  document.getElementById('btn-back-home')?.addEventListener('click', () => {
    renderHomePage();
    attachHomePageListeners();
  });
}

/**
 * Start app när DOM är klar
 */
document.addEventListener('DOMContentLoaded', initApp);
