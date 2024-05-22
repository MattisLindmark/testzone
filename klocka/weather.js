window.addEventListener('load', function () {  // istället för window.onload används addEventListener, för att inte overrida andra JS med onload.
  console.log("Väder on load");
  GetWeather();
  GetWeatherSymbolV2();
  setInterval(() => {
    console.log("Väder uppdateras");
    GetWeather();
    GetWeatherSymbolV2();
  }, 300000); // var 5e minut
});

function GetWeather() {
  //console.log("GetWeatherHEJ");
  //159880
  // umeå? 97270 
  // 172840
  // 140480 - umeå flyg
  // 151380 skeå flyg 
  //fetch('https://opendata-download-metobs.smhi.se/api/version/latest/parameter/1/station/140480/period/latest-hour/data.json')

  //	   https://opendata-download-metobs.smhi.se/api/version/latest/parameter/1/station/140480/period/latest-day/data.json

  const stationId = '140480'; //'151380';//  151380 ske
  const apiUrl = `https://opendata-download-metobs.smhi.se/api/version/latest/parameter/1/station/${stationId}/period/latest-day/data.json`;
  const apiUrlORG = 'https://opendata-download-metobs.smhi.se/api/version/latest/parameter/1/station/151380/period/latest-hour/data.json';


  fetch(apiUrl)
    .then(response => response.json())
    .then(data => {
      var lastIndex = data.value.length - 1;
      var temperature = data.value[lastIndex].value;
      const date = new Date(data.value[lastIndex].date);
      const formattedDate = date.toLocaleDateString('sv-SE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric' });
      const stationName = data.station.name;
      
      const updated = data.updated;
      const timestamp = new Date(updated);
      const formattedTime = timestamp.toLocaleString();
      //temperature = 20;
      console.log(formattedDate);
      console.log(stationName);
      
      const temperatureElement = document.getElementById('temperature');
      temperatureElement.textContent = temperature + '\u00B0C'; //'°C' 

      /* Används ej nu för tiden.
      var l = normalizeValue(temperature, 60, 90);
      var s = normalizeValue(temperature, 70, 100);
      var h = 240;
      if (temperature >= 0)
        h = 0;

      var newcolor = "hsl(" + h + "," + s + "%," + l + "%)";
      document.documentElement.style.setProperty('--temp-color', newcolor);
      */

      //document.getElementById('updated-time').textContent = formattedTime;

      //const dateElement = document.getElementById('date');
      //dateElement.textContent = formattedDate;

      const stationElement = document.getElementById('station');
      stationElement.textContent = `${stationName}`;
    })
    .catch(error => console.error(error));
}

function normalizeValue(value, min2 = 50, max2 = 100) {
  const min1 = -30;
  const max1 = 30;

  // Normalize the value from the first range to a value between 0 and 1
  const normalized = (value - min1) / (max1 - min1);

  // Convert the normalized value to the second range
  const normalized2 = normalized * (max2 - min2) + min2;

  return normalized2;
}


function GetWeatherSymbol() {
  const stationId = '140480';
  const apiUrl = `https://opendata-download-metobs.smhi.se/api/version/latest/parameter/1/station/${stationId}/period/latest-day/data.json`;

  fetch(apiUrl)
    .then(response => response.json())
    .then(data => {
      const weatherSymbol = data.value[0].value;
      const weatherSymbolElement = document.getElementById('weather-symbol');
      weatherSymbolElement.textContent = weatherSymbol;
    })
    .catch(error => console.error(error));
}

function GetWeatherSymbolV2() {
  // ske: 64.623076, 21.069654
// Umeå: 63.825848, 20.263035


//  const longitude = 21.069654;
//  const latitude = 64.623076;
  const longitude = 20.263035;
  const latitude = 63.825848;
  const forecastUrl = `https://opendata-download-metfcst.smhi.se/api/category/pmp3g/version/2/geotype/point/lon/${longitude}/lat/${latitude}/data.json`;
  
  //console.log(forecastUrl);

  fetch(forecastUrl)
  .then(response => response.json())
  .then(data => {
    // The forecast data is an array of time series
    const timeSeries = data.timeSeries;

    // Get the first forecast from the time series
    const firstForecast = timeSeries[0];

    // The forecast parameters are in an array
    const parameters = firstForecast.parameters;

    // Find the Wsymb2 parameter
    const wsymb2Parameter = parameters.find(parameter => parameter.name === 'Wsymb2');

    // The Wsymb2 value is the first value in the values array
    const wsymb2 = wsymb2Parameter.values[0];
    
    let symbol = wsymbToIcon[wsymb2];
    const weatherSymbolElement = document.getElementById('weather-symbol');
    weatherSymbolElement.textContent = symbol;

    //console.log("hej"+wsymb2);
  })
  .catch(error => console.error(error));

}



const wsymbToLabel = {
  1: "Clear sky",
  2: "Nearly clear sky",
  3: "Variable cloudiness",
  4: "Halfclear sky",
  5: "Cloudy sky",
  6: "Overcast",
  7: "Fog",
  8: "Light rain showers",
  9: "Moderate rain showers",
  10: "Heavy rain showers",
  11: "Thunderstorm",
  12: "Light sleet showers",
  13: "Moderate sleet showers",
  14: "Heavy sleet showers",
  15: "Light snow showers",
  16: "Moderate snow showers",
  17: "Heavy snow showers",
  18: "Light rain",
  19: "Moderate rain",
  20: "Heavy rain",
  21: "Thunder",
  22: "Light sleet",
  23: "Moderate sleet",
  24: "Heavy sleet",
  25: "Light snowfall",
  26: "Moderate snowfall",
  27: "Heavy snowfall"
};

const wsymbToLableSwedish = {
  1: "Klart",
  2: "Nästan klart",
  3: "Växlande molnighet",
  4: "Halvklart",
  5: "Molnigt",
  6: "Mulet",
  7: "Dimma",
  8: "Lätta regnskurar",
  9: "Måttliga regnskurar",
  10: "Kraftiga regnskurar",
  11: "Åska",
  12: "Lätta snöbyar",
  13: "Måttliga snöbyar",
  14: "Kraftiga snöbyar",
  15: "Lätta snöbyar",
  16: "Måttliga snöbyar",
  17: "Kraftiga snöbyar",
  18: "Lätt regn",
  19: "Måttligt regn",
  20: "Kraftigt regn",
  21: "Åska",
  22: "Lätt snöfall",
  23: "Måttligt snöfall",
  24: "Kraftigt snöfall",
  25: "Lätt snöfall",
  26: "Måttligt snöfall",
  27: "Kraftigt snöfall"
};

const wsymbToIcon = {
  1: "🌞",
  2: "🌤️",
  3: "⛅",
  4: "⛅",
  5: "☁️",
  6: "☁️",
  7: "🌫️",
  8: "🌦️",
  9: "🌧️",
  10: "🌧️☔",
  11: "⛈️",
  12: "🌨️",
  13: "🌨️",
  14: "🌨️❄️",
  15: "🌨️",
  16: "🌨️",
  17: "🌨️❄️",
  18: "🌧️",
  19: "🌧️",
  20: "🌧️☔",
  21: "⚡",
  22: "🌨️",
  23: "🌨️",
  24: "🌨️❄️",
  25: "🌨️",
  26: "🌨️",
  27: "🌨️❄️"
};





























/*


// mark Ej fungerande försök.
function getWeather() {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "https://api.openweathermap.org/data/2.5/weather?q=Stockholm,se&appid=7d8d6d2d4f3d0d4c9a5d4e0f1c7d2f3d", true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4 && xhr.status == 200) {
            var json = JSON.parse(xhr.responseText);
            var temp = json.main.temp - 273.15;
            var weather = json.weather[0].main;
            var weatherDesc = json.weather[0].description;
            var weatherIcon = json.weather[0].icon;
            var windSpeed = json.wind.speed;
            var windDeg = json.wind.deg;
            var sunrise = json.sys.sunrise;
            var sunset = json.sys.sunset;
            var sunriseDate = new Date(sunrise * 1000);
            var sunsetDate = new Date(sunset * 1000);

            document.getElementById("weather").textContent = "Temperature: " + temp.toFixed(1) + "°C, Weather: " + weather + ", Wind: " + windSpeed + " m/s, Sunrise: " + sunriseDate.toLocaleTimeString() + ", Sunset: " + sunsetDate.toLocaleTimeString();
            document.getElementById("weatherIcon").src = "http://openweathermap.org/img/w/" + weatherIcon + ".png";
        }
    }
    xhr.send();
}

function getWeatherB(){
    // Hämta väderdata från en API
const apiURL = 'https://api.openweathermap.org/data/2.5/weather?q=Umea,se&units=metric&appid=YOUR_API_KEY';

fetch(apiURL)
  .then(response => response.json())
  .then(data => {
    const temperature = data.main.temp;
    const weatherDescription = data.weather[0].description;

    console.log(`Aktuell temperatur i Umeå: ${temperature}°C`);
    console.log(`Väderbeskrivning: ${weatherDescription}`);
  })
  .catch(error => {
    console.error('Ett fel uppstod vid hämtning av väderdata:', error);
  });
}


function getWeatherSMHI(){
    // Hämta väderdata från SMHI:s API
const apiURL = 'https://opendata-download-metobs.smhi.se/api/version/latest/parameter/1/station/97210/period/latest-hour/data.json';

fetch(apiURL)
  .then(response => response.json())
  .then(data => {
    const temperature = data.value[0].value;
    const weatherDescription = data.parameter.name;

    console.log(`Aktuell temperatur i Umeå: ${temperature}°C`);
    console.log(`Väderbeskrivning: ${weatherDescription}`);
  })
  .catch(error => {
    console.error('Ett fel uppstod vid hämtning av väderdata:', error);
  });
}
*/