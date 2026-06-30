const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const loadingIndicator = document.getElementById('loading');
const chatContainer = document.getElementById('chat-container');
const selfSelectorContainer = document.getElementById('self-selector-container');
const selfSelector = document.getElementById('self-selector');

// --- Get Lightbox Elements (add near other getElementById calls) ---
const lightboxOverlay = document.getElementById('lightbox-overlay');
const lightboxImage = document.getElementById('lightbox-image');
const lightboxClose = document.getElementById('lightbox-close');
const lightboxOpenOriginal = document.getElementById('lightbox-open-original');
const lightboxFilename = document.getElementById('lightbox-filename');
const lightboxSave = document.getElementById('lightbox-save');



let chatMessages = []; // För att kunna rendera om när "jag" väljs
let mediaBlobUrls = {}; // För att lagra Blob URLs för media
let participants = new Set(); // För att lagra alla deltagare


// --- Hjälpfunktion för att få MIME-typ från filnamn ---
function getMimeType(filename) {
    const extension = filename.split('.').pop().toLowerCase();
    const mimeTypes = {
        'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png', 'gif': 'image/gif',
        'webp': 'image/webp', 'bmp': 'image/bmp', 'svg': 'image/svg+xml',
        'mp4': 'video/mp4', 'mov': 'video/quicktime', 'avi': 'video/x-msvideo',
        'mkv': 'video/x-matroska', 'webm': 'video/webm',
        'mp3': 'audio/mpeg', 'ogg': 'audio/ogg', 'wav': 'audio/wav', 'aac': 'audio/aac',
        'opus': 'audio/opus',
        'pdf': 'application/pdf',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'xls': 'application/vnd.ms-excel',
        'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'zip': 'application/zip', 'rar': 'application/vnd.rar',
        'txt': 'text/plain',
        // 3d filer
        'obj': 'model/obj',                      // Vanlig MIME för OBJ
        'glb': 'model/gltf-binary',              // Standard MIME för GLB (binär glTF)
        'gltf': 'model/gltf+json',               // Om du även vill ha stöd för text-baserad glTF
        'fbx': 'application/octet-stream',       // Ingen officiell standard, använd generell binärdata
    };
    return mimeTypes[extension] || 'application/octet-stream'; // Fallback för okända typer
}

// --- Lightbox Event Listeners ---

// Use Event Delegation on the chat container
chatContainer.addEventListener('click', (event) => {
    // Check if the clicked element is an image intended for the lightbox
    const clickedImage = event.target; // Tydligare variabelnamn
    if (clickedImage.tagName === 'IMG' && clickedImage.classList.contains('lightbox-trigger')) {
         // Om bilden är i en länk, förhindra standardåtgärd
        if (clickedImage.closest('a')) {
            event.preventDefault();
        }
        // Hämta BÅDE src OCH filename från data-attributet
        const imageUrl = clickedImage.src;
        const filename = clickedImage.dataset.filename || 'Unknown'; // Hämta från dataset, med fallback
        showLightbox(imageUrl, filename);
    }
});

// Listener for the close button
lightboxClose.addEventListener('click', hideLightbox);

// Listener for clicking the overlay background (but not the image itself)
lightboxOverlay.addEventListener('click', (event) => {
    if (event.target === lightboxOverlay) { // Only hide if the click is directly on the overlay
        hideLightbox();
    }
});

// Listener for Escape key to close lightbox
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !lightboxOverlay.classList.contains('hidden')) {
        hideLightbox();
    }
});


// --- Drag and Drop Event Listeners ---
dropZone.addEventListener('dragover', (event) => {
    event.preventDefault(); // Nödvändigt för att 'drop' ska fungera
    dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (event) => {
    event.preventDefault();
    dropZone.classList.remove('dragover');
    const files = event.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
});

// --- File Input Listener ---
fileInput.addEventListener('change', (event) => {
    const files = event.target.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
});

// --- Self Selector Listener ---
selfSelector.addEventListener('change', () => {
    renderChat(chatMessages, mediaBlobUrls, selfSelector.value); // Rendera om chatten
});


// --- Function to Show Lightbox ---
function showLightbox(imageUrl, filename) {
    lightboxImage.src = imageUrl;
    lightboxOpenOriginal.href = imageUrl;
    lightboxFilename.textContent = filename;
    lightboxSave.href = imageUrl;
    lightboxSave.download = filename;
    lightboxOverlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

// --- Function to Hide Lightbox ---
function hideLightbox() {
    lightboxOverlay.classList.add('hidden'); // Hide the overlay
    lightboxImage.src = ''; // Clear src
    lightboxOpenOriginal.href = '#'; // Reset href NY RAD (eller '')
    lightboxFilename.textContent = '';
    lightboxSave.href = '#';
    lightboxSave.download = '';
    // Optional: Re-enable body scroll
    document.body.style.overflow = '';
}



// --- Huvudfunktion för filhantering ---
async function handleFile(file) {
    if (!file || !file.name.endsWith('.zip')) {
        alert('Välj en giltig .zip-fil exporterad från WhatsApp.');
        return;
    }

    // ... (rensa state som tidigare) ...
    loadingIndicator.style.display = 'block';
    chatContainer.innerHTML = '';
    selfSelectorContainer.style.display = 'none';
    mediaBlobUrls = {};
    participants = new Set();
    chatMessages = [];

    try {
        const zip = await JSZip.loadAsync(file);

        // 1. Hitta ALLA .txt-filer i roten (inte i undermappar)
        const txtFiles = Object.keys(zip.files).filter(name =>
            name.endsWith('.txt') &&
            !zip.files[name].dir && // Se till att det är en fil, inte en mapp
            !name.includes('/') // Se till att den ligger i roten
        );

        // 2. Hantera olika scenarier
        if (txtFiles.length === 0) {
            throw new Error('Ingen .txt-fil hittades i roten av ZIP-arkivet.');
        } else if (txtFiles.length === 1) {
            // Om exakt en fil finns, anta att det är rätt och fortsätt
            await processChatFile(zip, txtFiles[0]);
        } else {
            // Om flera filer finns, låt användaren välja
            promptUserToSelectFile(zip, txtFiles);
            // Notera: processChatFile anropas från promptUserToSelectFile efter val
        }

    } catch (error) {
        console.error('Fel vid bearbetning av ZIP-fil:', error);
        chatContainer.innerHTML = `<p class="placeholder error">Kunde inte läsa filen. Kontrollera att det är en giltig WhatsApp-export och försök igen. Fel: ${error.message}</p>`;
        loadingIndicator.style.display = 'none';
    } finally {
        // Rensa file input så samma fil kan väljas igen direkt
        // (Flytta INTE loadingIndicator.style.display = 'none' hit,
        //  den ska bara döljas när bearbetningen är KLAR eller misslyckas)
        fileInput.value = null;
    }
}

// --- Funktion för att visa val för användaren ---
function promptUserToSelectFile(zip, txtFiles) {
    loadingIndicator.style.display = 'none'; // Dölj generell laddning, visa val istället

    // Skapa en enkel modal dialog (kan göras snyggare med CSS)
    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'selection-modal-overlay';
    modalOverlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background-color: rgba(0,0,0,0.5); display: flex;
        justify-content: center; align-items: center; z-index: 1000;
    `;

    const modalContent = document.createElement('div');
    modalContent.id = 'selection-modal-content';
    modalContent.style.cssText = `
        background-color: white; padding: 30px; border-radius: 5px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2); text-align: center;
    `;

    modalContent.innerHTML = `
        <h3>Flera .txt-filer hittades</h3>
        <p>Välj vilken fil som innehåller chatten:</p>
    `;

    const form = document.createElement('form');
    form.style.marginBottom = '15px';

    txtFiles.forEach((fileName, index) => {
        const label = document.createElement('label');
        label.style.display = 'block';
        label.style.marginBottom = '8px';
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'chatfile';
        radio.value = fileName;
        radio.id = `filechoice-${index}`;
        if (index === 0) radio.checked = true; // Förvälj den första

        label.appendChild(radio);
        label.appendChild(document.createTextNode(` ${fileName}`)); // Lägg till filnamnet
        form.appendChild(label);
    });

    modalContent.appendChild(form);

    const confirmButton = document.createElement('button');
    confirmButton.textContent = 'Bekräfta';
    confirmButton.style.padding = '10px 15px';
    confirmButton.style.marginRight = '10px';
    confirmButton.onclick = async () => {
        const selectedFile = form.querySelector('input[name="chatfile"]:checked').value;
        document.body.removeChild(modalOverlay); // Ta bort modalen
        loadingIndicator.style.display = 'block'; // Visa laddning igen medan filen bearbetas
        try {
            await processChatFile(zip, selectedFile);
        } catch (error) {
            console.error('Fel efter val av fil:', error);
            chatContainer.innerHTML = `<p class="placeholder error">Kunde inte bearbeta den valda filen. Fel: ${error.message}</p>`;
            loadingIndicator.style.display = 'none';
        }
    };

    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Avbryt';
    cancelButton.style.padding = '10px 15px';
    cancelButton.onclick = () => {
        document.body.removeChild(modalOverlay); // Ta bort modalen
        chatContainer.innerHTML = '<p class="placeholder">Processen avbruten. Välj en fil igen.</p>';
        loadingIndicator.style.display = 'none'; // Dölj om den hann visas kort
    };

    modalContent.appendChild(confirmButton);
    modalContent.appendChild(cancelButton);
    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay); // Lägg till modalen på sidan
}


// --- Funktion för att bearbeta den VALDA chatfilen ---
// --- Funktion för att bearbeta den VALDA chatfilen ---
async function processChatFile(zip, chatFileName) {
    const chatText = await zip.file(chatFileName).async('string');

    // Rensa gamla Blob URLs innan nya skapas (viktigt!)
    Object.values(mediaBlobUrls).forEach(URL.revokeObjectURL);
    mediaBlobUrls = {};

    // Skapa Blob URLs för alla mediafiler FÖRE rendering
    const mediaPromises = [];
    zip.forEach((relativePath, zipEntry) => {
        // Ignorera mappar och textfilen
        if (!zipEntry.dir && !zipEntry.name.endsWith('.txt')) {
             // Bara filer i roten (eller anpassa vid behov)
            if (!relativePath.includes('/')) {
                const simpleName = relativePath.split('/').pop();
                const mimeType = getMimeType(simpleName); // Hämta MIME-typ

                // Läs som ArrayBuffer, skapa ny Blob med typ, skapa URL
                const promise = zipEntry.async('arraybuffer') // Läs som rådata
                    .then(arrayBuffer => {
                        const typedBlob = new Blob([arrayBuffer], { type: mimeType }); // Skapa Blob MED typ
                        mediaBlobUrls[simpleName] = URL.createObjectURL(typedBlob); // Skapa URL från typad Blob
                    }).catch(err => {
                        // Logga fel om en specifik fil inte kunde läsas
                        console.error(`Kunde inte bearbeta mediafil: ${simpleName}`, err);
                    });
                mediaPromises.push(promise);
            } else {
                 console.log(`Ignorerar media i undermapp: ${relativePath}`);
            }
        }
    });

    // Vänta tills ALLA blobs är klara (inklusive de som ev. misslyckades)
    // Använd Promise.allSettled om du vill fortsätta även om en fil misslyckas,
    // eller Promise.all om det är ok att hela processen avbryts vid ett fel.
    // Promise.all är oftast ok här.
    await Promise.all(mediaPromises);

    // Parsea chatten (som tidigare)
    const parseResult = parseChatText(chatText);
    chatMessages = parseResult.messages;
    participants = parseResult.senders;

    // Populera self-selector (som tidigare)
    populateSelfSelector(participants);

    // Rendera chatten initialt (som tidigare)
    renderChat(chatMessages, mediaBlobUrls, 'none');

    loadingIndicator.style.display = 'none';
    selfSelectorContainer.style.display = 'block';
}





// --- Funktion för att parsea textfilen ---
function parseChatText(text) {
    const lines = text.split('\n');
    const messages = [];
    const senders = new Set();
    // Uppdaterad Regex för att matcha ditt format exakt (datum tid - avsändare: meddelande)
    // Även anpassad för att hantera datum/tid utan sekunder om det skulle förekomma
    // Och att fånga meddelandetext även om den innehåller kolon
    const messageRegex = /^(\d{4}-\d{2}-\d{2})\s(\d{2}:\d{2}(?::\d{2})?)\s-\s([^:]+):\s(.*)/;
    // Regex för att identifiera mediafiler inom meddelandetexten
    // Gör den lite mer generell för filnamn och inkluderar \u200E (LRM)
    const mediaRegex = /^(?:\u200E)?([\w\s\-\.'()\[\]]+\.(?:jpg|jpeg|png|gif|webp|mp4|mov|avi|mkv|mp3|ogg|aac|pdf|doc|docx|xls|xlsx|zip|rar|txt|glb|obj|fbx|gltf|opus))\s\(bifogad fil\)/i;
    const systemRegex = /^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}(?::\d{2})?\s-\s(.*)/; // Fångar systemmeddelanden som inte har kolon efter namn

    let currentMessage = null;
    let lastDateString = null;

    for (const line of lines) {
        const match = line.match(messageRegex);

        if (match) {
            // Om vi har ett pågående meddelande, spara det
            if (currentMessage) messages.push(currentMessage);

            const dateString = match[1];
            const timeString = match[2];
            const sender = match[3].trim();
            let content = match[4].trim();

            senders.add(sender);

            // Lägg till datumseparator om dagen har bytts
            if (dateString !== lastDateString) {
                 if (lastDateString !== null) { // Lägg inte till före första meddelandet
                     messages.push({ type: 'date', dateString: dateString });
                 }
                 lastDateString = dateString;
            }

            const timestamp = new Date(`${dateString} ${timeString}`);

            // Kolla om innehållet är en mediafil-referens
            const mediaMatch = content.match(mediaRegex);
            let mediaFile = null;
            let textContent = content; // Standard är att hela raden är text

            if (mediaMatch) {
                mediaFile = mediaMatch[1].trim(); // Fånga filnamnet
                 // Om det bara är mediafilen på raden, sätt textContent till null
                if (content === mediaMatch[0]) {
                     textContent = null;
                } else {
                    // Om det finns text *efter* media-taggen (ovanligt i export?)
                    // Detta behöver nog justeras om formatet är annorlunda,
                    // t.ex. om texten kommer på en *ny* rad under bilden.
                    // För nu antar vi att text efter (bifogad fil) är del av meddelandet.
                    // Detta händer t.ex. när man skickar bild + bildtext samtidigt.
                    // Vi tar bort media-taggen från texten.
                    textContent = content.replace(mediaMatch[0], '').trim() || null;
                }
            }

            currentMessage = {
                type: 'message',
                timestamp: timestamp,
                sender: sender,
                text: textContent,
                mediaFile: mediaFile,
                raw: line // Behåll råraden för felsökning ev.
            };

        } else if (currentMessage && line.trim() !== '') {
            // Detta är en fortsättning på föregående meddelande (multi-line)
            // Eller text som hör till en mediafil som skickades på raden innan
            if (currentMessage.text === null) {
                // Om föregående rad *bara* var en mediafil, är detta texten till den.
                currentMessage.text = line.trim();
            } else {
                // Annars, lägg till på befintlig text.
                currentMessage.text += '\n' + line.trim();
            }

        } else if (line.trim() !== '') {
             // Försök fånga systemmeddelanden eller andra rader som inte matchar standardformatet
             const systemMatch = line.match(systemRegex);
             if (systemMatch) {
                 // Om vi har ett pågående meddelande, spara det
                 if (currentMessage) messages.push(currentMessage);
                 currentMessage = null; // Nollställ så vi inte lägger till på detta sen

                 const systemText = systemMatch[1].trim();
                  // Kontrollera om det är en datum/tid-rad som missats av datumlogiken
                 const simpleDateRegex = /^\d{4}-\d{2}-\d{2}$/;
                 if (!simpleDateRegex.test(systemText)) { // Ignorera om det bara är ett datum
                     messages.push({ type: 'system', text: systemText, raw: line });
                 }

             } else {
                 // Okänd radtyp, logga för felsökning men visa kanske inte
                 console.warn("Okänd rad:", line);
             }
        }
    }

    // Lägg till det sista meddelandet
    if (currentMessage) messages.push(currentMessage);

    return { messages, senders: Array.from(senders).sort() }; // Returnera sorterad lista med avsändare
}


// --- Funktion för att rendera chatten i HTML ---
// --- Funktion för att rendera chatten i HTML ---
function renderChat(messagesToRender, blobs, selectedSelf) {
    chatContainer.innerHTML = ''; // Rensa befintligt innehåll

    if (messagesToRender.length === 0 && !chatContainer.querySelector('.placeholder.error')) {
        chatContainer.innerHTML = '<p class="placeholder">Chatten verkar vara tom eller kunde inte läsas korrekt.</p>';
        return;
    }

    // Lägg till första datumet om det behövs och inte redan är först
    let lastRenderedDate = null;
    if (messagesToRender.length > 0 && messagesToRender[0].type !== 'date') {
        const firstMessage = messagesToRender.find(msg => msg.type === 'message');
        if (firstMessage) {
            const firstDate = new Date(firstMessage.timestamp);
             firstDate.setHours(0, 0, 0, 0); // Nollställ tid för jämförelse
            const firstDateString = firstDate.toISOString().split('T')[0];

            const dateDiv = document.createElement('div');
            dateDiv.className = 'date-separator';
            dateDiv.textContent = formatDateSeparator(firstDate); // Formatera datumet
            chatContainer.appendChild(dateDiv);
            lastRenderedDate = firstDateString; // Håll koll på senast renderade datum
        }
    }


    messagesToRender.forEach(msg => {
        // --- Hantera Meddelandebubblor ---
        if (msg.type === 'message') {
            const bubble = document.createElement('div');
            bubble.className = 'message-bubble';
            bubble.classList.add(msg.sender === selectedSelf ? 'self' : 'other');

            // Lägg till avsändare (bara för 'other' om 'self' är vald, och om det inte är en grupperad chatt)
            // Du kan lägga till logik här för att dölja avsändarnamn om samma person skriver flera meddelanden i rad.
             if (msg.sender !== selectedSelf) { // Alltid visa avsändare för 'other' i detta enkla exempel
                const senderDiv = document.createElement('div');
                senderDiv.className = 'sender';
                senderDiv.textContent = msg.sender;
                bubble.appendChild(senderDiv);
             }


            // --- Hantera Media ---
            if (msg.mediaFile && blobs[msg.mediaFile]) {
                const blobUrl = blobs[msg.mediaFile];
                const lowerCaseFile = msg.mediaFile.toLowerCase();

                // BILDER (med lightbox)
                if (lowerCaseFile.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
                    // Skapa en länk (kan användas för nedladdning eller högerklick/ny flik)
                    const imgLink = document.createElement('a');
                    imgLink.href = blobUrl; // Länk till blob
                    imgLink.target = '_blank'; // För säkerhets skull om JS/lightbox misslyckas
                    imgLink.dataset.filename = msg.mediaFile; // Spara filnamn om det behövs
                    // Vi sätter ingen text i länken, bilden blir innehållet

                    // Skapa bilden
                    const img = document.createElement('img');
                    img.className = 'media-thumbnail lightbox-trigger'; // Klass för styling OCH lightbox-trigger
                    img.src = blobUrl;
                    img.alt = msg.mediaFile;
                    img.loading = 'lazy'; // Ladda bilder när de scrollas fram
                    img.dataset.filename = msg.mediaFile;

                    imgLink.appendChild(img); // Lägg bilden inuti länken
                    bubble.appendChild(imgLink); // Lägg länken (med bilden) i bubblan

                // VIDEO
                } else if (lowerCaseFile.match(/\.(mp4|mov|avi|mkv|webm)$/)) {
                    const video = document.createElement('video');

                    const filenameP = document.createElement('p'); // Använd <p> eller <span>
                    filenameP.className = 'media-original-filename'; // Ge klass för styling
                    filenameP.textContent = `File: ${msg.mediaFile}`; // Visa filnamnet
                    bubble.appendChild(filenameP); // Lägg till i bubblan

                    // Ge video en klass för ev. styling, men inte lightbox-trigger
                    video.className = 'media-thumbnail';
                    video.src = blobUrl;
                    video.controls = true; // Visa kontroller
                    video.preload = "metadata"; // Ladda bara metadata initialt
                    // Lägg till en max-width för att inte spräcka bubblan
                    video.style.maxWidth = '100%';
                    video.style.borderRadius = '5px'; // Matcha bildernas rundning ev.
                    bubble.appendChild(video);

                // LJUD
                } else if (lowerCaseFile.match(/\.(mp3|ogg|aac|wav|opus)$/)) {


                    const filenameP = document.createElement('p');
                    filenameP.className = 'media-original-filename';
                    filenameP.textContent = `File: ${msg.mediaFile}`; // Visa filnamnet
                    bubble.appendChild(filenameP); // Lägg till i bubblan

                    const audio = document.createElement('video');
                    audio.src = blobUrl;
                    audio.controls = true;
                    audio.preload = "metadata";
                    audio.style.width = '100%';
                    bubble.appendChild(audio);

                // ANDRA FILTYPER (PDF, DOC, etc.)
                } else {
                    const link = document.createElement('a');
                    link.className = 'media-link'; // Separat klass för styling
                    link.href = blobUrl;
                    // Försök ge en ikon baserat på filtyp? Enkelt nu:
                    let icon = '📄'; // Standard filikon
                    if (lowerCaseFile.endsWith('.pdf')) icon = '📕';
                    else if (lowerCaseFile.match(/\.(doc|docx)$/)) icon = '📃';
                    else if (lowerCaseFile.match(/\.(xls|xlsx)$/)) icon = '📊';
                    else if (lowerCaseFile.match(/\.(zip|rar)$/)) icon = '📦';
                    else if (lowerCaseFile.match(/\.(obj|glb|gltf|fbx)$/)) {
                        icon = '🧊'; // T.ex. en iskub-emoji för 3D-modell? Eller 🧱?
                    }

                    link.textContent = `${icon} ${msg.mediaFile}`; // Ikon + Filnamn
                    link.download = msg.mediaFile; // Föreslå filnamn vid nedladdning
                    link.target = '_blank'; // Öppna i ny flik (webbläsare kan förhandsvisa PDF etc)
                    bubble.appendChild(link);
                }
            } // Slut på if (msg.mediaFile)

            // --- Hantera Textinnehåll ---
            // if (msg.text) {
            //     const contentDiv = document.createElement('div');
            //     contentDiv.className = 'message-content';
            //      // Escapa HTML, hantera nya rader, gör länkar klickbara
            //      contentDiv.innerHTML = msg.text
            //         .replace(/&/g, "&")
            //         .replace(/</g, "<")
            //         .replace(/>/g, ">")
            //         .replace(/"/g, "&quot;") // Ersätter " med dess HTML-entitet
            //         .replace(/'/g, "'")
            //         .replace(/\n/g, '<br>')
            //         .replace(/(https?:\/\/[^\s!"'()*,\-.:;<=>?@[\\\]^_`{|}~]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'); // Förbättrad URL regex + säkerhet
            //     bubble.appendChild(contentDiv);
            // }

            // if (msg.text) {
            //     const contentDiv = document.createElement('div');
            //     contentDiv.className = 'message-content';
            //      // Escapa HTML, hantera nya rader, gör länkar klickbara
            //      contentDiv.innerHTML = msg.text
            //         .replace(/&/g, "&amp;")
            //         .replace(/</g, "&lt;")
            //         .replace(/>/g, "&gt;")
            //         .replace(/"/g, "&quot;")
            //         .replace(/'/g, "&#039;")
            //         .replace(/\n/g, '<br>')
            //         // --- KORREKT REGEX FÖR LÄNKAR ---
            //         .replace(/(https?:\/\/[a-zA-Z0-9\-_%+./~?&=#]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
            //     bubble.appendChild(contentDiv);
            // }

            if (msg.text) {
                const contentDiv = document.createElement('div');
                contentDiv.className = 'message-content';
            
                // STEG 1: Gör grundläggande HTML escaping FÖRST
                const escapedText = msg.text
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;")
                    .replace(/"/g, "&quot;")
                    .replace(/'/g, "&#039;");
            
                // STEG 2: ANROPA den nya enhanceLinks-funktionen på den escapade texten.
                // Denna funktion tar hand om att skapa <a>-taggar och lägga till preview-placeholders.
                const enhancedHtml = enhanceLinks(escapedText);
            
                // STEG 3: Ersätt nya rader (\n) med <br> i resultatet från enhanceLinks.
                contentDiv.innerHTML = enhancedHtml.replace(/\n/g, '<br>');
            
                // (Denna rad är oförändrad)
                bubble.appendChild(contentDiv);
            }

            // --- Lägg till Tidsstämpel ---
            const timestampDiv = document.createElement('div');
            timestampDiv.className = 'timestamp';
            // Visa bara tid om datumet är detsamma som föregående, annars visa datum+tid? (Mer avancerat)
            // Enkel version: visa alltid bara tiden
            timestampDiv.textContent = msg.timestamp.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
            // Lägg till title-attribut för exakt tid vid hover
            timestampDiv.title = msg.timestamp.toLocaleString('sv-SE');
            bubble.appendChild(timestampDiv);

            // Lägg till den färdiga bubblan i chat-containern
            chatContainer.appendChild(bubble);

        // --- Hantera Systemmeddelanden ---
        } else if (msg.type === 'system') {
            const systemDiv = document.createElement('div');
            systemDiv.className = 'system-message';
            // Escapa eventuell HTML i systemmeddelanden också
            systemDiv.textContent = msg.text;
            chatContainer.appendChild(systemDiv);

        // --- Hantera Datumseparatorer ---
        } else if (msg.type === 'date') {
            // Säkerställ att vi inte renderar samma datumseparator två gånger i rad
            const currentDateString = msg.dateString; // YYYY-MM-DD
            if (currentDateString !== lastRenderedDate) {
                const dateDiv = document.createElement('div');
                dateDiv.className = 'date-separator';
                dateDiv.textContent = `${formatDateSeparator(new Date(currentDateString))} (${currentDateString})`;
//                dateDiv.textContent = formatDateSeparator(new Date(currentDateString)); // Formatera datumet
                chatContainer.appendChild(dateDiv);
                lastRenderedDate = currentDateString; // Uppdatera senast renderade datum
            }
        }
    }); // Slut på forEach loop

    // Scrolla längst ner i chatten efter att allt är renderat?
    // Kan vara irriterande om användaren scrollat upp för att titta.
    // Bättre att bara göra det första gången kanske.
    // chatContainer.scrollTop = chatContainer.scrollHeight;
} // Slut på renderChat funktionen


// --- Funktion för att populera "self" dropdown ---
function populateSelfSelector(senders) {
    // Rensa gamla options (förutom den första "None")
    while (selfSelector.options.length > 1) {
        selfSelector.remove(1);
    }

    senders.forEach(sender => {
        const option = document.createElement('option');
        option.value = sender;
        option.textContent = sender;
        selfSelector.appendChild(option);
    });

     // Återställ till "None"
    selfSelector.value = 'none';
}

// --- Hjälpfunktion för att formatera datumavdelare ---
function formatDateSeparator(date) {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    // Nollställ tid för jämförelse
    today.setHours(0, 0, 0, 0);
    yesterday.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);

    if (date.getTime() === today.getTime()) {
        return 'IDAG';
    } else if (date.getTime() === yesterday.getTime()) {
        return 'IGÅR';
    } else {
        // Annars, visa datumet (t.ex. "TISDAG 25 JUNI 2024")
        return date.toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();
    }
}


function escapeHtml(unsafe) {
    if (!unsafe) return ''; // Hantera null/undefined
    return unsafe
         .replace(/&/g, "&amp;") 
         .replace(/</g, "&lt;") 
         .replace(/>/g, "&gt;") 
         .replace(/\"/g, "&quot;")
         .replace(/'/g, "&#39;"); 
}

// NY HUVUDFUNKTION: För att hantera länkar och lägga till previews
function enhanceLinks(text) {
    const urlRegex = /(https?:\/\/[a-zA-Z0-9\-_%+./~?&=#]+)/g; // Hitta alla länkar

    // --- NY Regex för att identifiera YouTube-länkar som KAN ha previews ---
    // Denna matchar /watch, /shorts, /playlist och youtu.be/
    // Den matchar INTE /channel, /user, /post etc.
    const isYouTubeLinkRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch|shorts|playlist)|youtu\.be\/)/i;

    return text.replace(urlRegex, (url) => {
        const linkHtml = `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
        const previewId = `preview-${Math.random().toString(36).substring(2, 9)}`;

        // --- ANVÄND DEN NYA REGEXEN FÖR ATT TESTA ---
        if (isYouTubeLinkRegex.test(url)) {
            // Det ÄR en YouTube-länk av en typ vi vill försöka få preview för.
            // Skicka HELA den ursprungliga url:en till noembed.com
            const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;

            // Starta fetch asynkront (resten av fetch-logiken är densamma)
            fetch(oembedUrl)
                .then(response => {
                    if (!response.ok) throw new Error(`oEmbed fetch failed: ${response.status}`);
                    return response.json();
                })
                .then(data => {
                    const previewContainer = document.getElementById(previewId);
                    if (previewContainer && data.title) { // Kolla fortfarande efter titel
                        let previewContent = `<strong class="link-preview-title">${escapeHtml(data.title)}</strong>`;
                        // Försök använda thumbnail om den finns (kan vara video eller spellista)
                        if (data.thumbnail_url) {
                            previewContent = `<img src="${data.thumbnail_url}" alt="Thumbnail" class="link-preview-image"> ${previewContent}`;
                        }
                        previewContainer.innerHTML = previewContent;
                        previewContainer.classList.add('loaded');
                        previewContainer.classList.remove('loading');
                    } else if (previewContainer) {
                        // Ta bort om ingen data (t.ex. för en ogiltig länk noembed inte hittar)
                        previewContainer.remove();
                    }
                })
                .catch(error => {
                    console.error(`Failed to get oEmbed data for ${url}:`, error);
                    const previewContainer = document.getElementById(previewId);
                    if (previewContainer) previewContainer.remove(); // Ta bort vid fel
                });

            // Returnera grundlänken + placeholder
            return `${linkHtml}<div class="link-preview-container loading" id="${previewId}"><span class="link-preview-loading">Laddar preview...</span></div>`;

        } else {
            // Om det INTE matchar isYouTubeLinkRegex, returnera bara den vanliga länken
            return linkHtml;
        }
    });
}





// --- Initialt tillstånd ---
chatContainer.innerHTML = '<p class="placeholder">Välj en .zip-fil för att visa chatten.</p>';