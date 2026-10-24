const countrySelect = document.querySelector("#country");
const cityInput = document.querySelector("#city");
const searchForm = document.querySelector("#search-form");
const statusMessage = document.querySelector("#status");
const weatherCard = document.querySelector("#weather-card");

const weatherDescriptions = {
  0: ["Clear sky", "☀️"],
  1: ["Mainly clear", "🌤️"],
  2: ["Partly cloudy", "⛅"],
  3: ["Overcast", "☁️"],
  45: ["Fog", "🌫️"],
  48: ["Rime fog", "🌫️"],
  51: ["Light drizzle", "🌦️"],
  53: ["Drizzle", "🌦️"],
  55: ["Heavy drizzle", "🌧️"],
  56: ["Freezing drizzle", "🌧️"],
  57: ["Heavy freezing drizzle", "🌧️"],
  61: ["Light rain", "🌧️"],
  63: ["Rain", "🌧️"],
  65: ["Heavy rain", "🌧️"],
  66: ["Freezing rain", "🌧️"],
  67: ["Heavy freezing rain", "🌧️"],
  71: ["Light snow", "🌨️"],
  73: ["Snow", "🌨️"],
  75: ["Heavy snow", "❄️"],
  77: ["Snow grains", "🌨️"],
  80: ["Rain showers", "🌦️"],
  81: ["Rain showers", "🌧️"],
  82: ["Heavy rain showers", "🌧️"],
  85: ["Snow showers", "🌨️"],
  86: ["Heavy snow showers", "❄️"],
  95: ["Thunderstorm", "⛈️"],
  96: ["Thunderstorm with hail", "⛈️"],
  99: ["Thunderstorm with heavy hail", "⛈️"],
};

function getWeatherDescription(code) {
  if (code >= 95) return weatherDescriptions[code] ?? weatherDescriptions[96];
  return weatherDescriptions[code] ?? ["Unknown conditions", "🌡️"];
}

function setStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.classList.toggle("error", isError);
}

function showWeather(location, weather) {
  const current = weather.current;
  const today = weather.daily;
  const [description, icon] = getWeatherDescription(current.weather_code);

  document.querySelector("#location").textContent =
    `${location.name}, ${location.country}`;
  document.querySelector("#local-time").textContent =
    `Local time: ${current.time.replace("T", " ")}`;
  document.querySelector("#weather-icon").textContent = icon;
  document.querySelector("#temperature").textContent = Math.round(current.temperature_2m);
  document.querySelector("#condition").textContent = description;
  document.querySelector("#feels-like").textContent = Math.round(current.apparent_temperature);
  document.querySelector("#humidity").textContent = current.relative_humidity_2m;
  document.querySelector("#wind").textContent = Math.round(current.wind_speed_10m);
  document.querySelector("#high").textContent = Math.round(today.temperature_2m_max[0]);
  document.querySelector("#low").textContent = Math.round(today.temperature_2m_min[0]);
  document.querySelector("#sunrise").textContent = today.sunrise[0].split("T")[1].slice(0, 5);
  weatherCard.hidden = false;
}

async function fetchWeather(city, countryCode) {
  setStatus("Finding your city…");
  weatherCard.hidden = true;

  const geocodingUrl = new URL("https://geocoding-api.open-meteo.com/v1/search");
  geocodingUrl.search = new URLSearchParams({
    name: city,
    countryCode,
    count: "10",
    language: "en",
    format: "json",
  });

  const geocodingResponse = await fetch(geocodingUrl);
  if (!geocodingResponse.ok) {
    throw new Error("Could not connect to the city search service. Please try again.");
  }
  const geocodingData = await geocodingResponse.json();
  const location = geocodingData.results?.find((result) => result.country_code === countryCode);

  if (!location) {
    throw new Error("City not found in that country. Check the spelling and try again.");
  }

  setStatus(`Getting weather for ${location.name}…`);
  const forecastUrl = new URL("https://api.open-meteo.com/v1/forecast");
  forecastUrl.search = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    current: "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m",
    daily: "temperature_2m_max,temperature_2m_min,sunrise",
    timezone: "auto",
    forecast_days: "1",
  });

  const weatherResponse = await fetch(forecastUrl);
  if (!weatherResponse.ok) {
    throw new Error("Could not get weather data. Please try again.");
  }
  const weather = await weatherResponse.json();

  if (!weather.current || !weather.daily) {
    throw new Error("Weather data is unavailable for this city right now.");
  }

  showWeather(location, weather);
  setStatus(`Updated just now · ${location.timezone}`);
}

searchForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const city = cityInput.value.trim();
  if (!city) {
    setStatus("Please enter a city name.", true);
    return;
  }

  try {
    await fetchWeather(city, countrySelect.value);
  } catch (error) {
    setStatus(error.message || "Something went wrong. Please try again.", true);
  }
});

countrySelect.addEventListener("change", () => {
  cityInput.value = "";
  cityInput.placeholder = countrySelect.value === "PK"
    ? "e.g. Karachi"
    : countrySelect.value === "IN"
      ? "e.g. Mumbai"
      : "e.g. Dhaka";
  cityInput.focus();
});

fetchWeather("Karachi", "PK").catch((error) => {
  setStatus(error.message || "Could not load weather. Please try again.", true);
});
