/**
 * Markdown Parser - parsa och uppdatera MD-tabeller för vikt och blod
 */

const TABLES = {
  VIKT: 'vikt',
  BLOD: 'blod'
};

/**
 * Parsa MD-fil och extrahera alla rader från en tabell - arbeta rad-för-rad
 */
function parseMarkdownTable(content, tableType) {
  const tableKey = tableType.toLowerCase();
  const lines = content.split('\n');
  
  // Hitta sektionen (# vikt eller # blod)
  let sectionIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === `# ${tableKey}`) {
      sectionIdx = i;
      break;
    }
  }
  
  if (sectionIdx === -1) {
    return [];
  }
  
  // sectionIdx + 1: header
  // sectionIdx + 2: separator
  // sectionIdx + 3 och framåt: datarader tills tom rad eller nästa rubrik
  
  const rows = [];
  
  for (let i = sectionIdx + 3; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Tom rad = slut på tabell
    if (line === '') {
      break;
    }
    
    // Nästa rubrik = slut på tabell
    if (line.startsWith('#')) {
      break;
    }
    
    // Det här är en datarad
    if (line.startsWith('|') && line.endsWith('|')) {
      const cells = line
        .split('|')
        .map(cell => cell.trim())
        .filter(cell => cell);
      
      rows.push(cells);
    }
  }
  
  return rows;
}

/**
 * Skapa en ny rad för tabell
 */
function createTableRow(data, tableType) {
  const tableKey = tableType.toLowerCase();
  
  if (tableKey === TABLES.VIKT) {
    const { date, time, dayName, weight, notes } = data;
    return `|${date}|${time}|${dayName}|${weight}|${notes || ''}|`;
  }
  
  if (tableKey === TABLES.BLOD) {
    const { date, time, dayName, sys, dia, pulse, position, notes } = data;
    return `|${date}|${time}|${dayName}|${sys}|${dia}|${pulse}|${position}|${notes || ''}|`;
  }
  
  return '';
}

/**
 * Lägg till ny rad i tabell - arbeta rad-för-rad
 */
function appendRowToTable(content, tableType, rowData) {
  const tableKey = tableType.toLowerCase();
  const newRow = createTableRow(rowData, tableType);
  
  // Split på radbrytningar
  const lines = content.split('\n');
  
  // Hitta sektionen (# vikt eller # blod)
  let sectionIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === `# ${tableKey}`) {
      sectionIdx = i;
      break;
    }
  }
  
  if (sectionIdx === -1) {
    // Sektion saknas, skapa den
    return createNewTable(content, tableType, rowData);
  }
  
  // Från sektion, hitta sista datarad i tabellen
  // sectionIdx + 1: header
  // sectionIdx + 2: separator
  // sectionIdx + 3 och framåt: datarader tills vi hittar tom rad
  
  let lastDataRowIdx = -1;
  for (let i = sectionIdx + 3; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Tom rad = slut på tabell
    if (line === '') {
      break;
    }
    
    // Nästa rubrik = slut på tabell
    if (line.startsWith('#')) {
      break;
    }
    
    // Det här är en datarad
    if (line.startsWith('|') && line.endsWith('|')) {
      lastDataRowIdx = i;
    }
  }
  
  // Infoga ny rad
  if (lastDataRowIdx !== -1) {
    // Vi hittar datarader, infoga efter sista
    lines.splice(lastDataRowIdx + 1, 0, newRow);
  } else {
    // Ingen datarad ännu (tom tabell), infoga efter separatorrad
    // sectionIdx + 2 är separatorrad
    lines.splice(sectionIdx + 3, 0, newRow);
  }
  
  return lines.join('\n');
}

/**
 * Skapa ny tabell (om den inte finns)
 */
function createNewTable(content, tableType, rowData) {
  const tableKey = tableType.toLowerCase();
  let header, separator, newRow;
  
  if (tableKey === TABLES.VIKT) {
    header = '|Datum|Tid|Veckodag|Vikt|Anteckningar|';
    separator = '|---|---|---|---|---|';
  } else if (tableKey === TABLES.BLOD) {
    header = '|Datum|Tid|Veckodag|SYS|DIA|Puls|Ställning|Anteckningar|';
    separator = '|---|---|---|---|---|---|---|---|';
  } else {
    return content;
  }
  
  newRow = createTableRow(rowData, tableType);
  const tableSection = `\n# ${tableKey}\n${header}\n${separator}\n${newRow}\n`;
  
  return content + tableSection;
}

/**
 * Konvertera rad-array till objekt baserat på tabelltyp
 */
function parseTableRow(row, tableType) {
  const tableKey = tableType.toLowerCase();
  
  if (tableKey === TABLES.VIKT) {
    return {
      date: row[0],
      time: row[1],
      dayName: row[2],
      weight: row[3],
      notes: row[4] || ''
    };
  }
  
  if (tableKey === TABLES.BLOD) {
    return {
      date: row[0],
      time: row[1],
      dayName: row[2],
      sys: row[3],
      dia: row[4],
      pulse: row[5],
      position: row[6],
      notes: row[7] || ''
    };
  }
  
  return {};
}

/**
 * Formatera rad för visning
 */
function formatRowForDisplay(row, tableType) {
  const tableKey = tableType.toLowerCase();
  const parsed = parseTableRow(row, tableType);
  
  if (tableKey === TABLES.VIKT) {
    const dateDisplay = parsed.date;
    const dayDisplay = parsed.dayName;
    const timeDisplay = parsed.time;
    const weightDisplay = parsed.weight;
    const mainLine = `${dateDisplay} ${dayDisplay} ${timeDisplay} — ${weightDisplay} kg`;
    const notesLine = parsed.notes ? `Notering: ${parsed.notes}` : '';
    return { mainLine, notesLine };
  }
  
  if (tableKey === TABLES.BLOD) {
    const dateDisplay = parsed.date;
    const dayDisplay = parsed.dayName;
    const timeDisplay = parsed.time;
    const mainLine = `${dateDisplay} ${dayDisplay} ${timeDisplay} — ${parsed.sys}/${parsed.dia} (${parsed.pulse} bpm) ${parsed.position}`;
    const notesLine = parsed.notes ? `Notering: ${parsed.notes}` : '';
    return { mainLine, notesLine };
  }
  
  return { mainLine: '', notesLine: '' };
}
