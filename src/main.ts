import "./style.css";

type WeatherCondition = {
  main: string;
  description: string;
  icon: string;
};

type GeocodingResult = {
  name: string;
  lat: number;
  lon: number;
  country: string;
  state?: string;
};

type OneCallCurrent = {
  temp: number;
  humidity: number;
  weather: WeatherCondition[];
};

type OneCallDaily = {
  dt: number;
  temp: {
    day: number;
  };
  humidity: number;
  weather: WeatherCondition[];
};

type OneCallResponse = {
  current: OneCallCurrent;
  daily: OneCallDaily[];
};

type CurrentWeatherResponse = {
  weather: WeatherCondition[];
  main: {
    temp: number;
    humidity: number;
  };
};

type ForecastItem = {
  dt: number;
  dt_txt: string;
  weather: WeatherCondition[];
  main: {
    temp: number;
    humidity: number;
  };
};

type ForecastResponse = {
  list: ForecastItem[];
};

type ForecastCard = {
  day: string;
  condition: string;
  temperature: number;
  humidity: number;
  icon: string;
};

type ErrorResponse = {
  message?: string;
  cod?: number | string;
};

const OPENWEATHER_GEO_URL = "https://api.openweathermap.org/geo/1.0/direct";
const OPENWEATHER_ONECALL_URL = "https://api.openweathermap.org/data/3.0/onecall";
const OPENWEATHER_CURRENT_URL = "https://api.openweathermap.org/data/2.5/weather";
const OPENWEATHER_FORECAST_URL = "https://api.openweathermap.org/data/2.5/forecast";
const openWeatherApiKey = import.meta.env.VITE_OPENWEATHER_API_KEY
  ?.trim()
  .replace(/^['"]|['"]$/g, "");

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("App root element not found.");
}

function queryRequired<TElement extends Element>(selector: string): TElement {
  const element = app.querySelector<TElement>(selector);

  if (!element) {
    throw new Error(`Required element "${selector}" not found.`);
  }

  return element;
}

function setStatus(message: string, tone: "default" | "error" = "default"): void {
  statusMessage.textContent = message;
  statusMessage.classList.toggle("error", tone === "error");
}

function ensureApiKey(): string {
  if (!openWeatherApiKey || openWeatherApiKey === "your_openweather_api_key_here") {
    throw new Error(
      "Set a valid VITE_OPENWEATHER_API_KEY in .env (without quotes), lalu restart npm run dev.",
    );
  }

  return openWeatherApiKey;
}

function setLoadingState(isLoading: boolean): void {
  cityInput.disabled = isLoading;
  searchButton.disabled = isLoading;
  locationButton.disabled = isLoading;
  searchButton.textContent = isLoading ? "Loading..." : "Search";
  locationButton.textContent = isLoading ? "Please wait..." : "Use My Location";
}

function getPrimaryWeather(payload: { weather: WeatherCondition[] }): WeatherCondition {
  const primaryWeather = payload.weather[0];

  if (!primaryWeather) {
    throw new Error("Weather details are missing from API response.");
  }

  return primaryWeather;
}

function createOneCallForecastCards(daily: OneCallDaily[]): ForecastCard[] {
  return daily.slice(0, 4).map((entry, index) => {
    const weather = getPrimaryWeather(entry);

    return {
      day:
        index === 0
          ? "Today"
          : new Date(entry.dt * 1000).toLocaleDateString("en-US", {
              weekday: "long",
            }),
      condition: weather.main,
      temperature: Math.round(entry.temp.day),
      humidity: entry.humidity,
      icon: weather.icon,
    };
  });
}

function createLegacyForecastCards(list: ForecastItem[]): ForecastCard[] {
  const dailyByDate = new Map<string, ForecastItem>();

  for (const entry of list) {
    const dateKey = entry.dt_txt.slice(0, 10);
    if (!dailyByDate.has(dateKey) && entry.dt_txt.includes("12:00:00")) {
      dailyByDate.set(dateKey, entry);
    }
  }

  if (dailyByDate.size < 4) {
    for (const entry of list) {
      const dateKey = entry.dt_txt.slice(0, 10);
      if (!dailyByDate.has(dateKey)) {
        dailyByDate.set(dateKey, entry);
      }
      if (dailyByDate.size >= 4) {
        break;
      }
    }
  }

  return Array.from(dailyByDate.values())
    .slice(0, 4)
    .map((entry, index) => {
      const weather = getPrimaryWeather(entry);

      return {
        day:
          index === 0
            ? "Today"
            : new Date(entry.dt * 1000).toLocaleDateString("en-US", {
                weekday: "long",
              }),
        condition: weather.main,
        temperature: Math.round(entry.main.temp),
        humidity: entry.main.humidity,
        icon: weather.icon,
      };
    });
}

function renderForecastCards(cards: ForecastCard[]): void {
  const fragment = document.createDocumentFragment();

  for (const card of cards) {
    const article = document.createElement("article");
    article.className = "forecast-card";

    const day = document.createElement("p");
    day.className = "forecast-day";
    day.textContent = card.day;

    const icon = document.createElement("img");
    icon.className = "forecast-icon";
    icon.src = `https://openweathermap.org/img/wn/${card.icon}@2x.png`;
    icon.alt = card.condition;

    const temperature = document.createElement("strong");
    temperature.textContent = `${card.temperature}\u00B0C`;

    const condition = document.createElement("span");
    condition.textContent = `${card.condition} · ${card.humidity}% humidity`;

    article.append(day, icon, temperature, condition);
    fragment.append(article);
  }

  forecastGrid.replaceChildren(fragment);
}

function createGeocodingUrl(city: string): URL {
  const url = new URL(OPENWEATHER_GEO_URL);
  url.searchParams.set("q", city);
  url.searchParams.set("limit", "1");
  url.searchParams.set("appid", ensureApiKey());
  return url;
}

function createOneCallUrl(lat: number, lon: number): URL {
  const url = new URL(OPENWEATHER_ONECALL_URL);
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lon));
  url.searchParams.set("appid", ensureApiKey());
  url.searchParams.set("units", "metric");
  url.searchParams.set("exclude", "minutely,hourly,alerts");
  return url;
}

function createLegacyCurrentUrl(lat: number, lon: number): URL {
  const url = new URL(OPENWEATHER_CURRENT_URL);
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lon));
  url.searchParams.set("appid", ensureApiKey());
  url.searchParams.set("units", "metric");
  return url;
}

function createLegacyForecastUrl(lat: number, lon: number): URL {
  const url = new URL(OPENWEATHER_FORECAST_URL);
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lon));
  url.searchParams.set("appid", ensureApiKey());
  url.searchParams.set("units", "metric");
  return url;
}

async function fetchJson<TResponse>(url: URL): Promise<TResponse> {
  const response = await fetch(url);
  const payload = (await response.json()) as TResponse | ErrorResponse;

  if (!response.ok) {
    const errorPayload = payload as ErrorResponse;
    const message = errorPayload.message ?? `Request failed with status ${response.status}.`;
    throw new Error(message);
  }

  return payload as TResponse;
}

function isOneCallAuthOrSubscriptionError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return (
    message.includes("invalid api key") ||
    message.includes("subscription") ||
    message.includes("one call") ||
    message.includes("401") ||
    message.includes("403")
  );
}

async function getCoordinatesFromCity(city: string): Promise<GeocodingResult> {
  const results = await fetchJson<GeocodingResult[]>(createGeocodingUrl(city));
  const firstResult = results[0];

  if (!firstResult) {
    throw new Error(`City "${city}" not found. Try another city name.`);
  }

  return firstResult;
}

function formatPlaceLabel(place: GeocodingResult): string {
  const parts = [place.name, place.state, place.country].filter(Boolean);
  return parts.join(", ");
}

async function loadOneCallWeather(
  location: { lat: number; lon: number },
  placeLabel: string,
): Promise<void> {
  const oneCall = await fetchJson<OneCallResponse>(createOneCallUrl(location.lat, location.lon));
  const cards = createOneCallForecastCards(oneCall.daily);

  if (cards.length === 0) {
    throw new Error("Daily forecast data is unavailable for this location.");
  }

  const currentPrimaryWeather = getPrimaryWeather(oneCall.current);
  cityName.textContent = placeLabel;
  weatherCondition.textContent = currentPrimaryWeather.description;
  humidityValue.textContent = `${oneCall.current.humidity}%`;
  weatherTemperature.textContent = `${Math.round(oneCall.current.temp)}\u00B0C`;
  currentIcon.src = `https://openweathermap.org/img/wn/${currentPrimaryWeather.icon}@2x.png`;
  currentIcon.alt = currentPrimaryWeather.description;
  renderForecastCards(cards);
}

async function loadLegacyWeather(
  location: { lat: number; lon: number },
  placeLabel: string,
): Promise<void> {
  const [current, forecast] = await Promise.all([
    fetchJson<CurrentWeatherResponse>(createLegacyCurrentUrl(location.lat, location.lon)),
    fetchJson<ForecastResponse>(createLegacyForecastUrl(location.lat, location.lon)),
  ]);

  const cards = createLegacyForecastCards(forecast.list);

  if (cards.length === 0) {
    throw new Error("Legacy forecast data is unavailable for this location.");
  }

  const currentPrimaryWeather = getPrimaryWeather(current);
  cityName.textContent = placeLabel;
  weatherCondition.textContent = `${currentPrimaryWeather.description} (legacy mode)`;
  humidityValue.textContent = `${current.main.humidity}%`;
  weatherTemperature.textContent = `${Math.round(current.main.temp)}\u00B0C`;
  currentIcon.src = `https://openweathermap.org/img/wn/${currentPrimaryWeather.icon}@2x.png`;
  currentIcon.alt = currentPrimaryWeather.description;
  renderForecastCards(cards);
}

async function loadWeatherByCoordinates(
  location: { lat: number; lon: number },
  placeLabel: string,
): Promise<void> {
  setLoadingState(true);
  setStatus(`Loading weather for ${placeLabel}...`);

  try {
    await loadOneCallWeather(location, placeLabel);
    setStatus(`Showing One Call weather for ${placeLabel}.`);
  } catch (error) {
    if (isOneCallAuthOrSubscriptionError(error)) {
      try {
        await loadLegacyWeather(location, placeLabel);
        setStatus(
          `One Call 3.0 belum aktif untuk key ini. Menampilkan data dari endpoint standar sementara.`,
        );
      } catch (legacyError) {
        if (legacyError instanceof Error) {
          setStatus(`Error: ${legacyError.message}`, "error");
        } else {
          setStatus("Error: Failed to fetch weather data.", "error");
        }
      }
    } else if (error instanceof Error) {
      setStatus(`Error: ${error.message}`, "error");
    } else {
      setStatus("Error: Failed to fetch weather data.", "error");
    }
  } finally {
    setLoadingState(false);
  }
}

async function loadWeatherByCity(cityInputValue: string): Promise<void> {
  const city = cityInputValue.trim();

  if (!city) {
    setStatus("City name cannot be empty.", "error");
    return;
  }

  setLoadingState(true);
  setStatus(`Finding coordinates for ${city}...`);

  try {
    const place = await getCoordinatesFromCity(city);
    await loadWeatherByCoordinates({ lat: place.lat, lon: place.lon }, formatPlaceLabel(place));
  } catch (error) {
    if (error instanceof Error) {
      setStatus(`Error: ${error.message}`, "error");
    } else {
      setStatus("Error: Failed to fetch weather data.", "error");
    }
    setLoadingState(false);
  }
}

function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });
  });
}

async function loadWeatherFromCurrentLocation(): Promise<void> {
  if (!("geolocation" in navigator)) {
    setStatus("Geolocation is not supported by your browser.", "error");
    return;
  }

  setStatus("Requesting your location...");

  try {
    const position = await getCurrentPosition();
    await loadWeatherByCoordinates(
      {
        lat: position.coords.latitude,
        lon: position.coords.longitude,
      },
      "your location",
    );
  } catch {
    setStatus("Unable to detect your location. Please search by city name.", "error");
  }
}

app.innerHTML = `
  <main class="shell">
    <div class="bg-glow bg-glow-one"></div>
    <div class="bg-glow bg-glow-two"></div>

    <section class="hero">
      <div class="hero-copy">
        <p class="eyebrow">Modern Weather</p>
        <h1>Check the weather before you go anywhere.</h1>
        <p class="hero-text">
          Stylish real-time weather dashboard with geolocation, humidity, and multi-day forecast.
        </p>
        <div class="hero-pills">
          <span class="pill">Live Data</span>
          <span class="pill">Geolocation</span>
          <span class="pill">Smart Forecast</span>
        </div>
      </div>

      <form class="search-card" id="search-form">
        <label class="search-label" for="city-input">Search city</label>
        <div class="search-row">
          <input id="city-input" type="text" placeholder="Jakarta" value="Jakarta" />
          <button id="search-button" type="submit">Search</button>
        </div>
        <button class="location-button" id="location-button" type="button">Use My Location</button>
        <p class="search-hint" id="status-message">Enter a city name to load live weather.</p>
      </form>
    </section>

    <section class="weather-panel">
      <header class="panel-header">
        <p class="section-label">Weather Dashboard</p>
        <span class="panel-badge">Updated Live</span>
      </header>

      <div class="current-weather">
        <div class="current-details">
          <p class="section-label">Current weather</p>
          <h2 id="city-name">-</h2>
          <p class="condition" id="weather-condition">-</p>
          <div class="metric-row">
            <p class="humidity">Humidity: <strong id="humidity-value">--%</strong></p>
          </div>
        </div>
        <div class="current-meta">
          <img class="weather-icon" id="current-icon" src="" alt="Current weather icon" />
          <div class="temperature" id="weather-temperature">--\u00B0C</div>
        </div>
      </div>

      <div class="forecast-head">
        <p class="section-label">Next days forecast</p>
      </div>
      <div class="forecast-grid" id="forecast-grid"></div>
    </section>
  </main>
`;

const searchForm = queryRequired<HTMLFormElement>("#search-form");
const cityInput = queryRequired<HTMLInputElement>("#city-input");
const searchButton = queryRequired<HTMLButtonElement>("#search-button");
const locationButton = queryRequired<HTMLButtonElement>("#location-button");
const statusMessage = queryRequired<HTMLParagraphElement>("#status-message");
const cityName = queryRequired<HTMLHeadingElement>("#city-name");
const weatherCondition = queryRequired<HTMLParagraphElement>("#weather-condition");
const humidityValue = queryRequired<HTMLElement>("#humidity-value");
const currentIcon = queryRequired<HTMLImageElement>("#current-icon");
const weatherTemperature = queryRequired<HTMLDivElement>("#weather-temperature");
const forecastGrid = queryRequired<HTMLDivElement>("#forecast-grid");

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  void loadWeatherByCity(cityInput.value);
});

locationButton.addEventListener("click", () => {
  void loadWeatherFromCurrentLocation();
});

void loadWeatherByCity(cityInput.value);
