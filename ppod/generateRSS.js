const fs = require('fs');
const { create } = require('xmlbuilder2');

const episodesDir = './episodes'; // Sökväg till din mapp med avsnitt
const rssFilePath = './rss.xml'; // Sökväg där du vill spara din RSS-feed

// Grundläggande struktur för din RSS-feed
let root = create({ version: '1.0', encoding: 'UTF-8' })
  .ele('rss', { version: '2.0' })
    .ele('channel')
      .ele('title').txt('Din Podcast Titel').up()
      .ele('description').txt('En kort beskrivning av din podcast.').up()
      .ele('link').txt('http://dinpodcast.com').up();

// Läs mappen med avsnitt
fs.readdir(episodesDir, (err, files) => {
  if (err) {
    console.error('Fel vid läsning av mappen:', err);
    return;
  }

  files.forEach(file => {
    // Antag att varje filnamn är ett avsnittstitel för demonstration
    root.ele('item')
      .ele('title').txt(file.replace('.mp3', '')).up() // Ta bort filändelsen för titeln
      .ele('link').txt(`http://dinpodcast.com/episodes/${file}`).up()
      .ele('description').txt(`Beskrivning för ${file}`).up();
  });

  // Generera XML och spara till fil
  const xml = root.end({ prettyPrint: true });
  fs.writeFile(rssFilePath, xml, (err) => {
    if (err) {
      console.error('Fel vid skrivning av RSS-filen:', err);
      return;
    }
    console.log('RSS-feed genererad!');
  });
});