window.onload = function() {
	const chatbox = document.querySelector('.chatbox');
	const userInput = document.querySelector('#user-input');
	const sendBtn = document.querySelector('#send-btn');

	function scrollToBottom() {
		chatbox.scrollTop = chatbox.scrollHeight;
	}

	function getRandomCatWord() {
		const catWords = [
			"meow",
			"mjau",
			"purr",
			"mieeaauu",
			"miaou",
			"scratch",
			"maju",
			"...",
			"furball",
			"prrrr prrrr",
			"growl 😼",
			"        ..meeh.",
			"purr purrr",
			"mew",
			"😻",
			"miaow",
			"mjao?",
			"iiiiih mieeeee meee mi?",
            "😹",
            "🐱‍🐉"
		];
		return catWords[Math.floor(Math.random() * catWords.length)];
	}

    function sendMessage() {
        const userText = userInput.value.trim();
        if (userText === '') {
        return;
        }
        const userMessage = document.createElement('div');
        userMessage.classList.add('message');
        userMessage.innerHTML = `<span class="user">You:</span><span class="text">${userText}</span>`;
        chatbox.appendChild(userMessage);
        scrollToBottom();
        userInput.value = '';
        let randomTime = Math.floor(Math.random() * 600) + 600;
        setTimeout(() => {
            const botMessage = document.createElement('div');
            botMessage.classList.add('message');
            const botText = getRandomCatWord();//getBotResponse(userText);
            botMessage.innerHTML = `
                <span class="bot">CatGPT:</span>
                <span class="text">${botText}</span>
            `;
            chatbox.appendChild(botMessage);
            scrollToBottom();
        }, randomTime);
    }
 
    sendBtn.addEventListener('click', sendMessage);
    userInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            sendMessage();
        }
    });
    
    scrollToBottom();
};
