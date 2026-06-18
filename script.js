const API_KEY = "175f2278447726672b158377591a1ca9";

const city = document.getElementById("city");
const search = document.getElementById("search");
const loc = document.getElementById("loc");
const result = document.getElementById("result");
const loading = document.getElementById("loading");
const error = document.getElementById("error");

function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

async function retry(fn, times = 3) {
    let err;

    for (let i = 0; i <= times; i++) {
        try {
            return await fn();
        } catch (e) {
            err = e;
            if (i < times) await sleep(1000);
        }
    }

    throw err;
}

function parallel(promises) {
    return Promise.all(promises);
}

async function getWeatherByCity(cityName) {
    const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${API_KEY}&units=metric`
    );

    if (!res.ok) throw new Error("City not found");

    return res.json();
}

async function getForecastByCity(cityName) {
    const res = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${cityName}&appid=${API_KEY}&units=metric`
    );

    if (!res.ok) throw new Error("Forecast failed");

    return res.json();
}

function render(data, forecast) {

    result.innerHTML = `
    <div class="weather">

      <h2>${data.name}</h2>

      <h1>${Math.round(data.main.temp)}°C</h1>

      <p>${data.weather[0].description}</p>

      <hr/>

      <h3>Next Forecast</h3>

      <p>${forecast.list[0].main.temp}°C - ${forecast.list[0].dt_txt}</p>

    </div>
  `;
}

async function searchWeather() {
    const val = city.value.trim();

    if (!val) return;

    loading.classList.remove("hide");
    error.classList.add("hide");
    result.innerHTML = "";

    try {

        const [weather, forecast] = await retry(() =>
            parallel([
                getWeatherByCity(val),
                getForecastByCity(val)
            ]),
            3
        );

        render(weather, forecast);

    } catch (e) {
        error.textContent = e.message;
        error.classList.remove("hide");
    }

    loading.classList.add("hide");
}

async function currentWeather() {

    loading.classList.remove("hide");
    error.classList.add("hide");
    result.innerHTML = "";

    navigator.geolocation.getCurrentPosition(async pos => {

        try {

            const lat = pos.coords.latitude;
            const lon = pos.coords.longitude;

            const res = await retry(async() => {
                const r = await fetch(
                    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
                );

                if (!r.ok) throw new Error("Failed");

                return r.json();
            }, 3);

            result.innerHTML = `
        <div class="weather">
          <h2>${res.name}</h2>
          <h1>${Math.round(res.main.temp)}°C</h1>
          <p>${res.weather[0].description}</p>
        </div>
      `;

        } catch (e) {
            error.textContent = e.message;
            error.classList.remove("hide");
        }

        loading.classList.add("hide");

    }, () => {
        loading.classList.add("hide");
        error.textContent = "Location denied";
        error.classList.remove("hide");
    });
}

search.addEventListener("click", searchWeather);
loc.addEventListener("click", currentWeather);
