const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

async function fetchAndDumpPages(baseUrl, totalPages) {
  for (let page = 1; page <= totalPages; page++) {
    const response = await fetch(`${baseUrl}?page=${page}&pagination=true`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const text = await response.text();
    // Append each page's content to the file
    fs.appendFileSync(path.join(__dirname, 'responseDump.txt'), text + "\n\n--- Page Separator ---\n\n");
  }
}

const baseUrl = 'http://api.sr.se/api/v2/programs';
const totalPages = 79; // Total number of pages to fetch

fetchAndDumpPages(baseUrl, totalPages)
  .then(() => console.log('All pages have been fetched and written to responseDump.txt'))
  .catch(error => console.error('Error fetching pages:', error));