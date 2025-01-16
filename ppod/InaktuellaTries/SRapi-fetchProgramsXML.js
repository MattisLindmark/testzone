const fetch = require('node-fetch');
const xml2js = require('xml2js'); // You'll need to install xml2js via npm

async function fetchAllPrograms(baseUrl) {
  let programs = [];
  let page = 1;
  let hasMorePages = true;

  while (hasMorePages) {
    const response = await fetch(`${baseUrl}?page=${page}&pagination=true`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const text = await response.text();
    const result = await xml2js.parseStringPromise(text); // Convert XML to JS object
    // Assuming the converted object has a structure where programs can be accessed
    // You might need to adjust the path based on the actual structure of the converted XML
    programs = programs.concat(result.response.programs[0].program); 

    // Check if there are more pages. This depends on the API's response structure in XML.
    // Adjust based on actual API response structure in XML
    hasMorePages = result.response.pagination[0].nextPage[0]; 
    page++;
  }

  return programs;
}

const baseUrl = 'http://api.sr.se/api/v2/programs';
fetchAllPrograms(baseUrl)
  .then(programs => console.log(programs))
  .catch(error => console.error('Error fetching programs:', error));