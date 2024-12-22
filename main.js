class CustomError extends Error {
  constructor(message) {
      super(message);
      this.name = "CustomError";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const savedCity = localStorage.getItem('city'); // Проверить, сохранен ли город
  if (savedCity) getData(savedCity); // Если есть, загрузить погоду
});

document.querySelector('form').addEventListener('submit', e => {
  e.preventDefault();
  const input = document.querySelector('#search');
  const city = input.value.trim();
  if (city === '') return alert('Введите город!');
  getData(city);
});

document.querySelector('#search').addEventListener('input', async function () {
  const query = this.value.trim();
  const suggestionsList = document.querySelector('#suggestions'); 
  suggestionsList.innerHTML = '';

  if (query.length === 0) return; // Если нет текста - остановка
  const suggestions = await getSuggestions(query);
  
  // Создание подсказок
  suggestions.slice(0, 5).forEach(city => {
      const li = document.createElement('li');
      li.textContent = city;
      li.addEventListener('click', () => {
          document.querySelector('#search').value = city;
          suggestionsList.innerHTML = ''; // Очистка предложений
      });
      suggestionsList.appendChild(li);
  });
});

async function getSuggestions(query) {
  try {
      const apiKey = "223bda90c3e015f00551ec6023752102"; // Замените на ваш API-ключ
      const res = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=5&appid=${apiKey}`);
      if (!res.ok) throw new CustomError("Ошибка получения подсказок");
      
      const data = await res.json();
      if (data.length === 0) throw new CustomError("Город не найден");
      return data.map(item => item.name);
  } catch (err) {
      console.error(err.message);
      return []; // Если ошибка, возвращаем пустой список подсказок
  }
}

async function getData(city) {
  try {
      const apiKey = "223bda90c3e015f00551ec6023752102"; // Замените на ваш API-ключ
      const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}`);
      if (!res.ok) {
          const errorData = await res.json();
          throw new CustomError(errorData.message || 'Ошибка запроса');
      }
      const data = await res.json();
      createWeather(data);

      saveCity(city); // Сохранить город в LocalStorage
    } catch (err) {
        if (err instanceof CustomError) {
            alert(err.message);
        } else {
            console.error("Общая ошибка:", err);
            alert("Что-то пошло не так, повторите попытку");
        }
    }
}

function createWeather(data) {
  // Получаем направление ветра
  const windDirection = getWindDirection(data.wind.deg);

  // Проверка на наличие дождя или снега
  const rain = data.rain ? `${data.rain['1h'] || 0} мм (дождь)` : 'Нет дождя';
  const snow = data.snow ? `${data.snow['1h'] || 0} мм (снег)` : '';

  document.querySelector('.weather').innerHTML = `
      <div class="left">
          <b class="city">${data.name}</b>
          <span>Температура: <b>${Math.round(data.main.temp - 273.15)}℃</b></span>
          <span>Ощущается как: <b>${Math.round(data.main.feels_like - 273.15)}℃</b></span>
          <span>Макс: <b>${Math.round(data.main.temp_max - 273.15)}℃</b>, Мин: <b>${Math.round(data.main.temp_min - 273.15)}℃</b></span>
          <span>Влажность: <b>${data.main.humidity}%</b></span>
          <span>Давление: <b>${data.main.pressure} гПа</b></span>
          <span>Ветер: <b>${Math.round(data.wind.speed)} м/с</b>, направление: <b>${windDirection}</b></span>
          <span>Облачность: <b>${data.clouds.all}%</b></span>
          <span>Осадки: <b>${rain} ${snow}</b></span>
      </div>
      <div class="right">
          <img src="https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png">
          <span class="description">${data.weather[0].description}</span>
      </div>
  `;
}
function getWindDirection(deg) {
  if (deg > 337.5 || deg <= 22.5) return 'Северный';
  if (deg > 22.5 && deg <= 67.5) return 'Северо-восточный';
  if (deg > 67.5 && deg <= 112.5) return 'Восточный';
  if (deg > 112.5 && deg <= 157.5) return 'Юго-восточный';
  if (deg > 157.5 && deg <= 202.5) return 'Южный';
  if (deg > 202.5 && deg <= 247.5) return 'Юго-западный';
  if (deg > 247.5 && deg <= 292.5) return 'Западный';
  if (deg > 292.5 && deg <= 337.5) return 'Северо-западный';
  return 'Неизвестно';
}

function saveCity(city) {
    localStorage.setItem('city', city);
}
