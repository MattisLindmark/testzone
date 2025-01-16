const fetch = require('node-fetch');
//import fetch from 'node-fetch';

async function fetchAllPrograms(baseUrl) {
  let programs = [];
  let page = 1;
  let hasMorePages = true;

  while (hasMorePages) {
    const response = await fetch(`${baseUrl}?page=${page}&pagination=true`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    programs = programs.concat(data.programs); // Assuming the response has a 'programs' field

    // Check if there are more pages. This depends on the API's response structure.
    // You might need to adjust this logic based on how the API indicates more pages.
    hasMorePages = data.pagination?.nextPage; // Adjust based on actual API response
    page++;
  }

  return programs;
}

const baseUrl = 'http://api.sr.se/api/v2/programs';
fetchAllPrograms(baseUrl)
  .then(programs => console.log(programs))
  .catch(error => console.error('Error fetching programs:', error));

/*
const baseUrl = 'http://api.sr.se/api/v2/programs';
fetchAllPrograms(baseUrl)
  .then(programs => console.log(programs))
  .catch(error => console.error('Error fetching programs:', error));
  */
