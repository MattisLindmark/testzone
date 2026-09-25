/**
 * Datumverktyg - veckodag-beräkning och formatering
 */

const weekDays = ['måndag', 'tisdag', 'onsdag', 'torsdag', 'fredag', 'lördag', 'söndag'];
const months = ['januari', 'februari', 'mars', 'april', 'maj', 'juni', 'juli', 'augusti', 'september', 'oktober', 'november', 'december'];

/**
 * Få veckodag från datum (ISO-sträng eller Date-objekt)
 */
function getDayName(dateInput) {
  let date;
  if (typeof dateInput === 'string') {
    date = new Date(dateInput + 'T00:00:00Z');
  } else {
    date = new Date(dateInput);
  }
  
  const dayIndex = date.getUTCDay();
  // JavaScript: 0=Sunday, vi vill: 0=Monday
  return weekDays[(dayIndex + 6) % 7];
}

/**
 * Formatera datum för visning (ex: "24 september 2026")
 */
function formatDateLong(dateString) {
  const date = new Date(dateString + 'T00:00:00Z');
  const day = date.getUTCDate();
  const month = months[date.getUTCMonth()];
  const year = date.getUTCFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * Hämta dagens datum i ISO-format (YYYY-MM-DD)
 */
function getTodayISO() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Hämta aktuell tid i HH:MM format
 */
function getCurrentTimeHHMM() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Validera datum (måste vara giltigt ISO-datum och inte framtida)
 */
function isValidDate(dateString) {
  // Kontrollera format YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return false;
  }
  
  const date = new Date(dateString + 'T00:00:00Z');
  const timestamp = date.getTime();
  
  // Kontrollera om det är ett giltigt datum
  if (typeof timestamp !== 'number' || Number.isNaN(timestamp)) {
    return false;
  }
  
  // Kontrollera att det inte är framtida
  // Använd lokal tid för att jämföra med getTodayISO() som också använder lokal tid
  const today = new Date();
  const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  
  return dateString <= todayString;
}

/**
 * Validera tid (HH:MM format)
 */
function isValidTime(timeString) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(timeString);
}
