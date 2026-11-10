const searchForm = document.getElementById("searchForm");
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const statusMessage = document.getElementById("statusMessage");
const weatherCard = document.getElementById("weatherCard");

const cityName = document.getElementById("cityName");
const temperature = document.getElementById("temperature");
const humidity = document.getElementById("humidity");
const windSpeed = document.getElementById("windSpeed");
const feelsLike = document.getElementById("feelsLike");
const apparentTemp = document.getElementById("apparentTemp");
const weatherDescription = document.getElementById("weatherDescription");
const weatherIcon = document.getElementById("weatherIcon");
const updatedAt = document.getElementById("updatedAt");

// Convert Open-Meteo weather codes into a readable condition and icon.
function getWeatherCondition(code, isDay) {
  if (code === 0) return { description: "Clear sky", icon: isDay ? "☀️" : "🌙" };
  if ([1, 2].includes(code)) return { description: "Mainly clear / partly cloudy", icon: isDay ? "🌤️" : "☁️" };
  if (code === 3) return { description: "Overcast", icon: "☁️" };
  if ([45, 48].includes(code)) return { description: "Fog", icon: "🌫️" };
  if ([51, 53, 55, 56, 57].includes(code)) return { description: "Drizzle", icon: "🌦️" };
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { description: "Rain", icon: "🌧️" };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { description: "Snow", icon: "❄️" };
  if ([95, 96, 99].includes(code)) return { description: "Thunderstorm", icon: "⛈️" };
  return { description: "Weather condition unavailable", icon: "🌍" };
}

function showError(message) {
  statusMessage.textContent = message;
  statusMessage.classList.add("error");
  weatherCard.hidden = true;
}

async function getWeather(city) {
  statusMessage.textContent = "Loading weather data...";
  statusMessage.classList.remove("error");
  searchBtn.disabled = true;

  try {
    // First API request: find the city's latitude and longitude.
    const geocodingURL =
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;

    const geoResponse = await fetch(geocodingURL);
    if (!geoResponse.ok) {
      throw new Error("Could not contact the location service. Please try again.");
    }

    const geoData = await geoResponse.json();
    if (!geoData.results || geoData.results.length === 0) {
      throw new Error("City not found. Check the spelling and try again.");
    }

    const location = geoData.results[0];

    // Second API request: get current weather for those coordinates.
    const weatherURL =
      `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m&timezone=auto`;

    const weatherResponse = await fetch(weatherURL);
    if (!weatherResponse.ok) {
      throw new Error("Could not retrieve weather data. Please try again.");
    }

    const weatherData = await weatherResponse.json();

    // Read the nested "current" object from the JSON response.
    const current = weatherData.current;
    if (!current) {
      throw new Error("Weather data is unavailable for this location.");
    }

    const condition = getWeatherCondition(current.weather_code, current.is_day);

    // Render the retrieved values in the page.
    cityName.textContent = [location.name, location.admin1, location.country]
      .filter(Boolean).join(", ");
    temperature.textContent = `${Math.round(current.temperature_2m)}°C`;
    humidity.textContent = `${current.relative_humidity_2m}%`;
    windSpeed.textContent = `${current.wind_speed_10m} km/h`;
    feelsLike.textContent = `Feels like ${current.apparent_temperature}°C`;
    apparentTemp.textContent = `${current.apparent_temperature}°C`;
    weatherDescription.textContent = condition.description;
    weatherIcon.textContent = condition.icon;

    const time = current.time ? new Date(current.time) : new Date();
    updatedAt.textContent = `Local time: ${time.toLocaleString()}`;

    weatherCard.hidden = false;
    statusMessage.textContent = "";
  } catch (error) {
    if (error instanceof TypeError) {
      showError("Network error. Check your internet connection and try again.");
    } else {
      showError(error.message || "Something went wrong. Please try again.");
    }
  } finally {
    searchBtn.disabled = false;
  }
}

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const city = cityInput.value.trim();

  if (!city) {
    showError("Please enter a city name.");
    cityInput.focus();
    return;
  }

  getWeather(city);
});

// Load a default city when the dashboard opens.
cityInput.value = "Nagpur";
getWeather("Nagpur");
