/**
 * UI Service - DOM manipulation och rendering
 */

/**
 * Visa en sida och gömma andra
 */
function showPage(pageId) {
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });
  
  const page = document.getElementById(pageId);
  if (page) {
    page.classList.add('active');
  }
}

/**
 * Rendera startsidan
 */
function renderHomePage() {
  const container = document.getElementById('app');
  container.innerHTML = `
    <div class="page active" id="home-page">
      <div class="container">
        <div class="page-header">
          <h1 class="page-title">HealthLogMD</h1>
          <div class="header-actions">
            <button class="icon-btn" id="btn-settings" title="Inställningar">⚙️</button>
          </div>
        </div>
        
        <div class="home-content">
          <div class="main-actions">
            <button class="button btn-primary main-btn" id="btn-weight">⚖️ Anteckna Vikt</button>
            <button class="button btn-primary main-btn" id="btn-blood">❤️ Anteckna Blod</button>
          </div>
          
          <div class="secondary-actions">
            <button id="btn-history" class="link-btn" title="Se historik">Visa historik</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Rendera inmatningsformulär
 */
function renderInputForm(formType) {
  const container = document.getElementById('app');
  const isWeightForm = formType === 'vikt';
  
  let fieldsHTML = '';
  if (isWeightForm) {
    fieldsHTML = `
      <div class="input-row input-row-compact">
        <div class="form-group">
          <label class="form-label">Datum *</label>
          <input type="date" id="input-date" class="form-input" value="${getTodayISO()}" required>
          <div class="form-error" id="error-date"></div>
        </div>
        <div class="form-group">
          <label class="form-label">Tid (HH:MM) *</label>
          <input type="time" id="input-time" class="form-input" value="${getCurrentTimeHHMM()}" required>
          <div class="form-error" id="error-time"></div>
        </div>
      </div>
      
      <div class="form-group">
        <label class="form-label">Vikt (kg) *</label>
        <input type="number" id="input-weight" class="form-input" step="0.1" placeholder="75.5" required>
        <div class="form-error" id="error-weight"></div>
      </div>
      
      <div class="form-group">
        <label class="form-label">Anteckningar</label>
        <textarea id="input-notes" class="form-textarea" placeholder="Frivillig notering..."></textarea>
      </div>
    `;
  } else {
    fieldsHTML = `
      <div class="input-row input-row-compact">
        <div class="form-group">
          <label class="form-label">Datum *</label>
          <input type="date" id="input-date" class="form-input" value="${getTodayISO()}" required>
          <div class="form-error" id="error-date"></div>
        </div>
        <div class="form-group">
          <label class="form-label">Tid (HH:MM) *</label>
          <input type="time" id="input-time" class="form-input" value="${getCurrentTimeHHMM()}" required>
          <div class="form-error" id="error-time"></div>
        </div>
      </div>
      
      <div class="input-row">
        <div class="form-group">
          <label class="form-label">Systoliskt (SYS) *</label>
          <input type="number" id="input-sys" class="form-input" placeholder="130" min="0" max="300" required>
          <div class="form-error" id="error-sys"></div>
        </div>
        <div class="form-group">
          <label class="form-label">Diastoliskt (DIA) *</label>
          <input type="number" id="input-dia" class="form-input" placeholder="85" min="0" max="300" required>
          <div class="form-error" id="error-dia"></div>
        </div>
      </div>
      
      <div class="input-row">
        <div class="form-group">
          <label class="form-label">Puls (bpm) *</label>
          <input type="number" id="input-pulse" class="form-input" placeholder="72" min="0" max="250" required>
          <div class="form-error" id="error-pulse"></div>
        </div>
        <div class="form-group">
          <label class="form-label">Ställning *</label>
          <select id="input-position" class="form-select" required>
            <option value="">Välj ställning</option>
            <option value="Sittande">Sittande</option>
            <option value="Liggande">Liggande</option>
            <option value="Stående">Stående</option>
          </select>
          <div class="form-error" id="error-position"></div>
        </div>
      </div>
      
      <div class="form-group">
        <label class="form-label">Anteckningar</label>
        <textarea id="input-notes" class="form-textarea" placeholder="Frivillig notering..."></textarea>
      </div>
    `;
  }
  
  const title = isWeightForm ? 'Anteckna Vikt' : 'Anteckna Blodtryck';
  
  container.innerHTML = `
    <div class="page active" id="form-page">
      <div class="container">
        <div class="page-header">
          <h1 class="page-title">${title}</h1>
        </div>
        
        <div id="form-alerts"></div>
        
        <form id="input-form">
          ${fieldsHTML}
          
          <div class="btn-group">
            <button type="button" id="btn-cancel" class="button btn-secondary" style="flex: 1;">Avbryt</button>
            <button type="button" id="btn-reset" class="button btn-secondary" style="flex: 1;">Rensa</button>
            <button type="submit" class="button btn-success" style="flex: 1;">Spara</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

/**
 * Rendera inställningar-sida
 */
function renderSettingsPage() {
  const container = document.getElementById('app');
  
  container.innerHTML = `
    <div class="page active" id="settings-page">
      <div class="container">
        <div class="page-header">
          <h1 class="page-title">Inställningar</h1>
        </div>
        
        <div id="settings-alerts"></div>
        
        <div class="settings-list">
          <div class="settings-item">
            <div class="settings-label">Aktuell datalogg</div>
            <div class="settings-value" id="current-file-path">Ingen fil vald</div>
            <div class="settings-actions">
              <button class="button btn-primary" id="btn-new-file">Ny datalogg</button>
              <button class="button btn-secondary" id="btn-open-file">Öppna befintlig</button>
            </div>
          </div>
          
          <div class="settings-item">
            <div class="settings-label">Filövervakning</div>
            <div class="settings-actions">
              <button class="button btn-danger" id="btn-forget-file" style="flex: 1;">Glöm fil</button>
              <button class="button btn-secondary" id="btn-share-file" style="flex: 1;">Dela datalogg</button>
            </div>
            <div class="settings-note" style="margin-top: 0.5rem; font-size: 0.85rem; color: var(--text-tertiary); font-style: italic;">
              Filen lämnas orörd — ingen data raderas.
            </div>
          </div>
        </div>
        
        <div style="margin-top: 2rem;">
          <button class="button btn-secondary" id="btn-back-home" style="width: 100%;">Tillbaka till startsida</button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Rendera historik-sida
 */
function renderHistoryPage(formType, rows) {
  const container = document.getElementById('app');
  const title = formType === 'vikt' ? 'Vikt - Historia' : 'Blodtryck - Historia';
  
  let historyHTML = '';
  if (rows.length === 0) {
    historyHTML = '<div class="history-empty">Ingen data ännu</div>';
  } else {
    // Omvänd ordning (senaste överst)
    const reversed = [...rows].reverse();
    historyHTML = reversed.map(row => {
      const { mainLine, notesLine } = formatRowForDisplay(row, formType);
      return `
        <div class="history-item">
          <div class="history-date">${mainLine}</div>
          ${notesLine ? `<div class="history-notes">${notesLine}</div>` : ''}
        </div>
      `;
    }).join('');
  }
  
  container.innerHTML = `
    <div class="page active" id="history-page">
      <div class="container">
        <div class="page-header">
          <h1 class="page-title">${title}</h1>
        </div>
        
        <div class="history-list">
          ${historyHTML}
        </div>
        
        <div style="margin-top: 1rem;">
          <button class="button btn-secondary" id="btn-back-home" style="width: 100%;">Tillbaka</button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Visa varningsmeddelande
 */
function showAlert(message, type = 'error') {
  const alertContainer = document.getElementById('form-alerts') || document.getElementById('settings-alerts');
  if (!alertContainer) return;
  
  const alertClass = type === 'success' ? 'alert-success' : 'alert-error';
  const alert = document.createElement('div');
  alert.className = `alert ${alertClass}`;
  alert.textContent = message;
  
  alertContainer.innerHTML = '';
  alertContainer.appendChild(alert);
  
  if (type === 'success') {
    setTimeout(() => {
      alert.remove();
    }, 2000);
  }
}

/**
 * Visa inline-fel under fält
 */
function showFieldError(fieldId, message) {
  const errorEl = document.getElementById(`error-${fieldId}`);
  if (errorEl) {
    errorEl.textContent = message;
  }
}

/**
 * Töm alla inline-fel
 */
function clearFieldErrors() {
  document.querySelectorAll('[id^="error-"]').forEach(el => {
    el.textContent = '';
  });
}

/**
 * Uppdatera visad fil-sökväg
 */
function updateFilePathDisplay(fileName) {
  const pathEl = document.getElementById('current-file-path');
  if (pathEl) {
    pathEl.textContent = fileName || 'Ingen fil vald';
  }
}
