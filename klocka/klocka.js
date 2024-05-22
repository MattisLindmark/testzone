//let test = 1;
let fullHour = false;
let isTimeVisible = true;
let TimeWeatherCounter = 0;

window.onload = function () { // Använder onLoad istället för eventlistener PGA fick problem med VScodes live servers autouppdatering.
    console.log("Klocka on load");

    // ============ This part is not needed in OBS version ============
    const blocks = document.querySelectorAll('.block');

    // Add the event listener to each block
    blocks.forEach(block => {
        block.addEventListener('click', function () {
            //console.log("Click");
            TimeWeatherCounter = -1;
            isTimeVisible = !isTimeVisible;
            toggleBlocks(!isTimeVisible);
        });
    });
    // ============ End of notNeededpart ============

    setInterval(() => {
        // Get the current date and time
        const currentDate = new Date();
        //currentDate.setHours(currentDate.getHours() + 1);
        // if (test === 5 || test === 10) {
        // currentDate.setHours(12, 0, 0, 0);
        // }

        if (fullHour) {
            document.getElementById("time").style.animation = "bounce 1s";
            document.getElementById("date").style.animation = "bounce 2s";
            document.getElementById("weekday").style.animation = "bounce 1.5s";

            fullHour = false;
        }

        // Format the date and time
        //        const formattedDate = currentDate.toLocaleDateString('en-GB', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
        const formattedDate = currentDate.toLocaleDateString('sv-SV', { year: 'numeric', month: 'numeric', day: 'numeric' });
        const formattedTime = currentDate.toLocaleTimeString('sv-SV', { hour: '2-digit', minute: '2-digit' });
        const formattedDay = currentDate.toLocaleDateString('sv-SV', { weekday: 'long' });

        // Display the date and time on the webpage
        document.getElementById("date").textContent = formattedDate;
        document.getElementById("time").textContent = formattedTime;
        document.getElementById("weekday").textContent = formattedDay;

        if (currentDate.getMinutes() === 0 && currentDate.getSeconds() === 0) {
            document.getElementById("time").style.animation = "";
            document.getElementById("date").style.animation = "";
            document.getElementById("weekday").style.animation = "";
            fullHour = true;
        }
        //test++;
    }, 1000);

    toggleBlocks(!isTimeVisible);
    // Intervallet är nu satt att kolla var 20e sekund. Visa klocka 1 minut och sedan 20 sek väder.
    setInterval(() => {
        TimeWeatherCounter++;
        //console.log("twc"+TimeWeatherCounter);
        if (TimeWeatherCounter >= 3) {
            toggleBlocks(isTimeVisible);        
            isTimeVisible = !isTimeVisible;
            TimeWeatherCounter = 0;
        }
        if (!isTimeVisible) {
            TimeWeatherCounter = 5;
        }
    }, 20000); // 20 sek = 20000 ms
}

function updateClock() {
    var now = new Date();
    var hours = now.getHours();
    var minutes = now.getMinutes();
    var seconds = now.getSeconds();
    var timeString = pad(hours) + ':' + pad(minutes) + ':' + pad(seconds);
    document.getElementById('clock').textContent = timeString;
}
function pad(number) {
    return number < 10 ? '0' + number : number;
}

function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function toggleBlocks(isTime) {
    const timeBlock = document.getElementById('timeBlock');
    const weatherBlock = document.getElementById('wheaterBlock');

    if (isTime) {
        timeBlock.style.animationName = 'slideOut';
        weatherBlock.style.animationName = 'slideIn';
    } else {
        timeBlock.style.animationName = 'slideIn';
        weatherBlock.style.animationName = 'slideOut';
    }

    //isTime = !isTimeVisible;
}