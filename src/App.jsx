import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import WeatherMap from './WeatherMap'
import './App.css'

function App() {
  const [city, setCity] = useState('')
  const [weather, setWeather] = useState(null)
  const [forecast, setForecast] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isCelsius, setIsCelsius] = useState(true)
  const searchWrapperRef = useRef(null)
  const appRef = useRef(null)
  const [isListening, setIsListening] = useState(false)
  const [speakingSection, setSpeakingSection] = useState(null)
  const voiceTimeoutRef = useRef(null)

  // Replace with your OpenWeatherMap API key
  const API_KEY = '48089303d00d7d3f4cb2f2bda6aaed5e'
  const API_URL = 'https://api.openweathermap.org/data/2.5'
  const GEOCODE_URL = 'https://api.openweathermap.org/geo/1.0'

  const fetchWeather = async (cityName) => {
    if (!cityName.trim()) return

    setLoading(true)
    setError('')

    try {
      // Fetch current weather and forecast in parallel for better performance
      // Always fetch in metric (Celsius) and convert to Fahrenheit on client-side
      const units = 'metric'
      
      const [weatherResponse, forecastResponse] = await Promise.all([
        fetch(`${API_URL}/weather?q=${cityName}&appid=${API_KEY}&units=${units}`),
        fetch(`${API_URL}/forecast?q=${cityName}&appid=${API_KEY}&units=${units}`)
      ])
      
      if (!weatherResponse.ok) {
        throw new Error('City not found')
      }

      const weatherData = await weatherResponse.json()
      const forecastData = forecastResponse.ok ? await forecastResponse.json() : null

      setWeather(weatherData)
      setForecast(forecastData)
    } catch (err) {
      setError(err.message || 'Failed to fetch weather data')
      setWeather(null)
      setForecast(null)
    } finally {
      setLoading(false)
    }
  }

  const fetchWeatherByCoords = async (lat, lon) => {
    setLoading(true)
    setError('')

    try {
      const units = 'metric'
      
      const [weatherResponse, forecastResponse] = await Promise.all([
        fetch(`${API_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=${units}`),
        fetch(`${API_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=${units}`)
      ])
      
      if (!weatherResponse.ok) {
        throw new Error('Location not found')
      }

      const weatherData = await weatherResponse.json()
      const forecastData = forecastResponse.ok ? await forecastResponse.json() : null

      setWeather(weatherData)
      setForecast(forecastData)
      setCity(weatherData.name)
    } catch (err) {
      setError(err.message || 'Failed to fetch weather data')
      setWeather(null)
      setForecast(null)
    } finally {
      setLoading(false)
    }
  }

  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      setLoading(true)
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchWeatherByCoords(position.coords.latitude, position.coords.longitude)
        },
        (error) => {
          console.error("Geolocation error:", error)
          setError("Unable to retrieve your location. Please check browser permissions.")
          setLoading(false)
        }
      )
    } else {
      alert("Geolocation is not supported by your browser.")
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (city.trim()) {
      fetchWeather(city)
      setShowSuggestions(false)
    }
  }

  const fetchCitySuggestions = useCallback(async (query) => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    try {
      const response = await fetch(
        `${GEOCODE_URL}/direct?q=${encodeURIComponent(query)}&limit=5&appid=${API_KEY}`
      )
      
      if (response.ok) {
        const data = await response.json()
        setSuggestions(data)
        setShowSuggestions(data.length > 0)
      }
    } catch (err) {
      // Silently fail for suggestions
      setSuggestions([])
      setShowSuggestions(false)
    }
  }, [])

  useEffect(() => {
    // Don't fetch suggestions while voice search is active to prevent lag
    if (isListening) return

    const timeoutId = setTimeout(() => {
      if (city.trim()) {
        fetchCitySuggestions(city)
      } else {
        setSuggestions([])
        setShowSuggestions(false)
      }
    }, 300) // Debounce for 300ms

    return () => clearTimeout(timeoutId)
  }, [city, fetchCitySuggestions, isListening])

  const handleLocationSelect = (lat, lon) => {
    fetchWeatherByCoords(lat, lon);
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleSuggestionClick = (suggestion) => {
    const cityName = `${suggestion.name}${suggestion.state ? `, ${suggestion.state}` : ''}, ${suggestion.country}`
    setCity(suggestion.name)
    setShowSuggestions(false)
    fetchWeather(suggestion.name)
  }

  const handleVoiceSearch = () => {
    if (isListening) return

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert("Voice search is not supported in this browser.")
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    recognition.onstart = () => setIsListening(true)
    
    recognition.onresult = (event) => {
      const result = event.results[event.results.length - 1]
      const transcript = result[0].transcript
      
      setCity(transcript)
      
      if (result.isFinal) {
        fetchWeather(transcript)
        setShowSuggestions(false)
        setIsListening(false)
        recognition.stop()
      }
    }

    recognition.onerror = (event) => {
      console.error("Voice search error:", event.error)
      setIsListening(false)
    }

    recognition.onend = () => setIsListening(false)

    recognition.start()
  }

  const getWeatherIcon = (iconCode) => {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`
  }

  const toggleTemperatureUnit = () => {
    setIsCelsius(!isCelsius)
  }

  const formatTemperature = (temp) => {
    // Convert Celsius to Fahrenheit if needed
    // Formula: (C * 9/5) + 32
    const temperature = isCelsius ? temp : (temp * 9/5) + 32
    return Math.round(temperature)
  }

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTime = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTimeOfDay = () => {
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 12) return 'morning'
    if (hour >= 12 && hour < 17) return 'afternoon'
    if (hour >= 17 && hour < 21) return 'evening'
    return 'night'
  }

  const getBackgroundClass = () => {
    if (!weather) return 'bg-default'
    
    const timeOfDay = getTimeOfDay()
    const weatherMain = weather.weather[0].main.toLowerCase()
    const weatherIcon = weather.weather[0].icon
    
    // Determine if it's day or night from icon (d = day, n = night)
    const isDay = weatherIcon.includes('d')
    const actualTimeOfDay = isDay ? (timeOfDay === 'night' ? 'evening' : timeOfDay) : 'night'
    
    // Weather conditions
    if (weatherMain.includes('clear')) {
      if (actualTimeOfDay === 'morning') return 'bg-clear-morning'
      if (actualTimeOfDay === 'afternoon') return 'bg-clear-afternoon'
      if (actualTimeOfDay === 'evening') return 'bg-clear-evening'
      return 'bg-clear-night'
    }
    if (weatherMain.includes('cloud')) {
      if (actualTimeOfDay === 'morning') return 'bg-cloudy-morning'
      if (actualTimeOfDay === 'afternoon') return 'bg-cloudy-afternoon'
      if (actualTimeOfDay === 'evening') return 'bg-cloudy-evening'
      return 'bg-cloudy-night'
    }
    if (weatherMain.includes('rain') || weatherMain.includes('drizzle')) {
      return 'bg-rainy'
    }
    if (weatherMain.includes('snow')) {
      return 'bg-snowy'
    }
    if (weatherMain.includes('thunderstorm')) {
      return 'bg-stormy'
    }
    if (weatherMain.includes('mist') || weatherMain.includes('fog') || weatherMain.includes('haze')) {
      return 'bg-foggy'
    }
    
    // Default based on time
    if (actualTimeOfDay === 'morning') return 'bg-default-morning'
    if (actualTimeOfDay === 'afternoon') return 'bg-default-afternoon'
    if (actualTimeOfDay === 'evening') return 'bg-default-evening'
    return 'bg-default-night'
  }

  const shouldUseLightText = () => {
    if (!weather) return false;
    
    const timeOfDay = getTimeOfDay();
    const weatherMain = weather.weather[0].main.toLowerCase();
    const weatherIcon = weather.weather[0].icon;
    
    // Determine if it's day or night from icon (d = day, n = night)
    const isDay = weatherIcon.includes('d');
    const actualTimeOfDay = isDay ? (timeOfDay === 'night' ? 'evening' : timeOfDay) : 'night';
    
    // Use light text for bright backgrounds
    if (actualTimeOfDay === 'morning' && 
        (weatherMain.includes('clear') || 
         weatherMain.includes('cloud') || 
         actualTimeOfDay === 'morning')) {
      return true;
    }
    
    return false;
  }

  const getWeatherEffectClass = () => {
    if (!weather) return ''
    
    const weatherMain = weather.weather[0].main.toLowerCase()
    const weatherIcon = weather.weather[0].icon
    
    if (weatherMain.includes('thunderstorm')) return 'weather-storm'
    if (weatherMain.includes('rain') || weatherMain.includes('drizzle')) return 'weather-rain'
    if (weatherMain.includes('snow')) return 'weather-snow'
    if (weatherMain.includes('cloud')) return 'weather-clouds'
    if (weatherMain.includes('mist') || weatherMain.includes('fog') || weatherMain.includes('haze')) return 'weather-fog'
    
    return ''
  }

  // Create water drops for the default page
  // Create water drops for the default page
  const waterDrops = useMemo(() => {
    const drops = [];
    for (let i = 0; i < 20; i++) {
      const size = Math.random() * 40 + 25;
      const left = Math.random() * 100;
      const delay = Math.random() * 5;
      const duration = Math.random() * 5 + 5;
      
      drops.push(
        <div
          key={i}
          className="water-drop"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            left: `${left}%`,
            top: `-${size}px`,
            animationDuration: `${duration}s`,
            animationDelay: `${delay}s`,
            opacity: Math.random() * 0.5 + 0.5
          }}
        />
      );
    }
    return drops;
  }, []);

  // Create sparkles for visual enhancement
  // Create sparkles for visual enhancement
  const sparkles = useMemo(() => {
    const items = [];
    for (let i = 0; i < 12; i++) {
      const size = Math.random() * 6 + 3;
      const left = Math.random() * 100;
      const top = Math.random() * 100;
      const delay = Math.random() * 3;
      const duration = Math.random() * 3 + 2;
      
      items.push(
        <div
          key={`sparkle-${i}`}
          className="sparkle"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            left: `${left}%`,
            top: `${top}%`,
            animationDelay: `${delay}s`,
            animationDuration: `${duration}s`
          }}
        />
      );
    }
    return items;
  }, []);

  // Create bubbles for visual enhancement
  // Create bubbles for visual enhancement
  const bubbles = useMemo(() => {
    const items = [];
    for (let i = 0; i < 8; i++) {
      const size = Math.random() * 80 + 30;
      const left = Math.random() * 100;
      const delay = Math.random() * 10;
      const duration = Math.random() * 20 + 10;
      
      items.push(
        <div
          key={`bubble-${i}`}
          className="bubble"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            left: `${left}%`,
            bottom: `-${size}px`,
            animationDuration: `${duration}s`,
            animationDelay: `${delay}s`
          }}
        />
      );
    }
    return items;
  }, []);

  const getAdvice = () => {
    if (!weather) return null;

    const main = weather.weather[0].main.toLowerCase();
    // Weather data is always in metric (Celsius) now
    const tempC = weather.main.temp;
    
    let advice = {
      health: [],
      safety: [],
      clothing: []
    };

    // Temperature based advice
    if (tempC > 30) {
      advice.health.push("Stay hydrated! Drink plenty of water.");
      advice.health.push("Avoid strenuous outdoor activities midday.");
      advice.safety.push("Watch for signs of heat exhaustion.");
      advice.clothing.push("Wear light, breathable fabrics like cotton.");
      advice.clothing.push("A wide-brimmed hat and sunglasses are essential.");
    } else if (tempC > 20) {
       advice.health.push("Apply sunscreen if spending time outdoors.");
       advice.clothing.push("Comfortable t-shirts and shorts are perfect.");
    } else if (tempC < 0) {
      advice.health.push("Protect exposed skin from frostbite.");
      advice.safety.push("Watch for slick patches of ice.");
      advice.clothing.push("Wear thermal layers and a heavy insulated coat.");
      advice.clothing.push("Gloves, scarf, and a warm hat are mandatory.");
    } else if (tempC < 10) {
      advice.health.push("Keep moving to generate body heat.");
      advice.clothing.push("Wear a warm coat and layer up.");
      advice.clothing.push("Don't forget a beanie or earmuffs.");
    } else if (tempC < 18) {
       advice.clothing.push("A light jacket, hoodie, or sweater is recommended.");
    }

    // Condition based advice
    if (main.includes('rain') || main.includes('drizzle') || main.includes('thunderstorm')) {
      advice.safety.push("Roads may be slippery; drive with extra caution.");
      advice.health.push("Avoid getting wet to prevent catching a cold.");
      advice.clothing.push("Waterproof jacket and boots are a must.");
      advice.clothing.push("Carry a sturdy umbrella.");
    }
    
    if (main.includes('snow')) {
       advice.safety.push("Visibility may be low; clear your car windows.");
       advice.safety.push("Walk carefully on snowy paths.");
       advice.clothing.push("Waterproof and insulated boots with good grip.");
    }

    if (main.includes('clear') && tempC > 15 && tempC < 30) {
       advice.health.push("Great weather for a walk or outdoor exercise!");
       advice.health.push("Soak up some Vitamin D (but don't burn!).");
    }
    
    if (main.includes('mist') || main.includes('fog')) {
        advice.safety.push("Use low-beam headlights while driving.");
        advice.safety.push("Wear reflective gear if walking near roads.");
    }

    // Defaults if empty to ensure UI looks good
    if (advice.health.length === 0) advice.health.push("Maintain a balanced diet and stay active.");
    if (advice.safety.length === 0) advice.safety.push("Stay aware of your surroundings.");
    if (advice.clothing.length === 0) advice.clothing.push("Wear comfortable clothing suitable for the day.");

    return advice;
  }

  const advice = getAdvice();

  const [voices, setVoices] = useState([]);

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
    };

    loadVoices();
    
    // Chrome loads voices asynchronously
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const selectVoice = (utterance) => {
    let availableVoices = voices;
    
    // Fallback: try to get voices directly if state is empty (common in some browsers)
    if (availableVoices.length === 0) {
      availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length > 0) {
        setVoices(availableVoices);
      }
    }

    if (availableVoices.length === 0) return;

    // Expanded preference list for female/high-quality voices
    const preferredVoice = availableVoices.find(voice => 
      voice.name.includes("Zira") ||       // Windows
      voice.name.includes("Google US English") || // Chrome
      voice.name.includes("Samantha") ||   // macOS
      voice.name.includes("Victoria") ||   // macOS
      voice.name.includes("Ava") ||        // macOS
      (voice.name.includes("English") && voice.name.includes("Female")) || 
      voice.name.toLowerCase().includes("female")
    );

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
  };

  const speak = (text, section) => {
    if (!window.speechSynthesis) {
      alert("Text-to-speech is not supported in this browser.");
      return;
    }

    // Always stop current speech first
    window.speechSynthesis.cancel();

    // If clicking the same section that is currently speaking, stop it.
    if (speakingSection === section) {
      setSpeakingSection(null);
      return;
    }

    // Small delay to ensure the 'cancel' operation clears the audio buffer
    setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(text);
        selectVoice(utterance);
        utterance.lang = 'en-US'; 
        utterance.rate = 1.0; // Normal speed is usually best for natural voices
        utterance.pitch = 1.0;
        utterance.volume = 1;

        utterance.onend = () => setSpeakingSection(null);
        utterance.onerror = (e) => {
            console.error("Speech error", e);
            setSpeakingSection(null);
        };
        
        // Resume if paused (Chrome fix)
        if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
        }
        
        window.speechSynthesis.speak(utterance);
        setSpeakingSection(section);
    }, 50);
  };

  const handleSpeakWeather = () => {
    const temp = formatTemperature(weather.main.temp);
    const unit = isCelsius ? "Celsius" : "Fahrenheit";
    const description = weather.weather[0].description;
    const feelsLike = formatTemperature(weather.main.feels_like);
    
    let text = `The weather in ${weather.name} is ${description}. `;
    text += `The temperature is ${temp} degrees ${unit}. `;
    text += `Feels like ${feelsLike} degrees. `;
    
    speak(text, 'weather');
  };

  const handleSpeakAdvice = () => {
    if (!advice) return;
    let text = "Here is some advice for today. ";
    
    if (advice.health.length > 0) {
        text += "Health: " + advice.health.join(". ") + ". ";
    }
    if (advice.safety.length > 0) {
        text += "Safety: " + advice.safety.join(". ") + ". ";
    }
    if (advice.clothing.length > 0) {
       text += "Clothing: " + advice.clothing.join(". ") + ". ";
    }

    speak(text, 'advice');
  };

  const handleSpeakStats = () => {
    const humidity = weather.main.humidity;
    const pressure = weather.main.pressure;
    const visibility = (weather.visibility / 1000).toFixed(1);
    const windSpeed = isCelsius ? weather.wind.speed : (weather.wind.speed * 2.237).toFixed(1);
    const windUnit = isCelsius ? 'meters per second' : 'miles per hour';

    let text = `Here are the current details. `;
    text += `Humidity is ${humidity} percent. `;
    text += `Wind speed is ${windSpeed} ${windUnit}. `;
    text += `Pressure is ${pressure} hectopascals. `;
    text += `Visibility is ${visibility} kilometers. `;

    speak(text, 'stats');
  };

  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    }
  }, []);

  return (
    <div ref={appRef} className={`app ${getBackgroundClass()} ${getWeatherEffectClass()}`}>
      {!weather && (
        <>
          <div className="thunder-layer thunder-1"></div>
          <div className="thunder-layer thunder-2"></div>
          <div className="thunder-layer thunder-3"></div>
          <div className="rain-layer-default"></div>
          <div className="water-drops">
            {waterDrops}
          </div>
          {sparkles}
          {bubbles}
        </>
      )}
      {weather && (
        <div className="weather-visuals"></div>
      )}
      <div className="container">
        <header className="header">
          <h1 className={`title ${shouldUseLightText() ? 'light-text' : ''}`}>Weather Forecast</h1>
          <p className={`subtitle ${shouldUseLightText() ? 'light-text' : ''}`}>Stay informed about the weather</p>
        </header>

        <form onSubmit={handleSubmit} className="search-form">
          <div className="search-wrapper" ref={searchWrapperRef}>
            <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <input
              type="text"
              value={city}
              onChange={(e) => {
                setCity(e.target.value)
                setShowSuggestions(true)
              }}
              onFocus={() => {
                if (suggestions.length > 0) {
                  setShowSuggestions(true)
                }
              }}
              placeholder="Search for a city..."
              className={`search-input ${shouldUseLightText() ? 'light-text' : ''}`}
            />
            <button
              type="button"
              className={`location-button ${shouldUseLightText() ? 'light-text' : ''}`}
              onClick={handleCurrentLocation}
              title="Use Current Location"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7z" />
                <circle cx="12" cy="9" r="2.5" />
              </svg>
            </button>
            <button 
              type="button" 
              className={`voice-search-button ${isListening ? 'listening' : ''} ${shouldUseLightText() ? 'light-text' : ''}`}
              onClick={handleVoiceSearch}
              title="Voice Search"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            </button>
            {showSuggestions && suggestions.length > 0 && (
              <div className="suggestions-dropdown">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={`${suggestion.lat}-${suggestion.lon}-${index}`}
                    className="suggestion-item"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <svg className="suggestion-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    <div className="suggestion-content">
                      <div className="suggestion-name">{suggestion.name}</div>
                      <div className="suggestion-location">
                        {suggestion.state && `${suggestion.state}, `}{suggestion.country}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button type="submit" className={`search-button ${shouldUseLightText() ? 'light-text' : ''}`} disabled={loading}>
            {loading ? (
              <>
                <div className="cloud-loader"></div>
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
                Search
              </>
            )}
          </button>
        </form>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {loading && !weather && (
          <div className="loader-container">
            <div className="cloud-loader"></div>
            <div className="loader-text">Loading weather data...</div>
          </div>
        )}

        {weather && (
          <div className="weather-content">
            <div className="current-weather">
              <div className="weather-main">
                <div className="weather-icon">
                  <img
                    src={getWeatherIcon(weather.weather[0].icon)}
                    alt={weather.weather[0].description}
                  />
                </div>
                <div className="weather-info">
                  <div className="city-header" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <h2 className={`city-name ${shouldUseLightText() ? 'light-text' : ''}`}>{weather.name}</h2>
                    <button 
                      className={`speak-button ${speakingSection === 'weather' ? 'speaking' : ''} ${shouldUseLightText() ? 'light-text' : ''}`}
                      onClick={handleSpeakWeather}
                      title={speakingSection === 'weather' ? "Stop Speaking" : "Read Temperature"}
                      style={{ 
                        background: 'transparent', 
                        border: 'none', 
                        cursor: 'pointer',
                        color: shouldUseLightText() ? '#333' : 'white',
                        padding: '8px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'transform 0.2s',
                        transform: speakingSection === 'weather' ? 'scale(1.1)' : 'scale(1)',
                        zIndex: 10,
                        position: 'relative'
                      }}
                    >
                      {speakingSection === 'weather' ? (
                         <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                           <rect x="6" y="4" width="4" height="16"></rect>
                           <rect x="14" y="4" width="4" height="16"></rect>
                         </svg>
                      ) : (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                        </svg>
                      )}
                    </button>
                  </div>
                  <p className={`weather-description ${shouldUseLightText() ? 'light-text' : ''}`}>
                    {weather.weather[0].description}
                  </p>
                  <div className="temperature">
                    {formatTemperature(weather.main.temp)}
                    <span className="temp-unit">°{isCelsius ? 'C' : 'F'}</span>
                  </div>
                  <div className="weather-details">
                    <span className={shouldUseLightText() ? 'light-text' : ''}>Feels like {formatTemperature(weather.main.feels_like)}°{isCelsius ? 'C' : 'F'}</span>
                  </div>
                  <div className="unit-toggle">
                    <button 
                      className={`toggle-button ${isCelsius ? 'active' : ''} ${shouldUseLightText() ? 'light-text' : ''}`}
                      onClick={() => setIsCelsius(true)}
                    >
                      °C
                    </button>
                    <span className={`toggle-label ${shouldUseLightText() ? 'light-text' : ''}`}>→</span>
                    <button 
                      className={`toggle-button ${!isCelsius ? 'active' : ''} ${shouldUseLightText() ? 'light-text' : ''}`}
                      onClick={() => setIsCelsius(false)}
                    >
                      °F
                    </button>
                  </div>
                </div>
              </div>

              <div className="stats-header" style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', gap: '10px' }}>
                <h3 className={shouldUseLightText() ? 'light-text' : ''} style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: 'rgba(255,255,255,0.95)' }}>Weather Details</h3>
                <button 
                  className={`speak-button ${speakingSection === 'stats' ? 'speaking' : ''} ${shouldUseLightText() ? 'light-text' : ''}`}
                  onClick={handleSpeakStats}
                  title={speakingSection === 'stats' ? "Stop Speaking" : "Read Details"}
                  style={{ 
                    background: 'transparent', 
                    border: 'none', 
                    cursor: 'pointer',
                    color: shouldUseLightText() ? '#333' : 'white',
                    padding: '8px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'transform 0.2s',
                    transform: speakingSection === 'stats' ? 'scale(1.1)' : 'scale(1)',
                    zIndex: 10
                  }}
                >
                  {speakingSection === 'stats' ? (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="6" y="4" width="4" height="16"></rect>
                        <rect x="14" y="4" width="4" height="16"></rect>
                      </svg>
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                    </svg>
                  )}
                </button>
              </div>

              <div className="weather-stats">
                <div className="stat-item">
                  <div className="stat-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
                      <path d="M12 2v20"></path>
                    </svg>
                  </div>
                  <span className={`stat-label ${shouldUseLightText() ? 'light-text' : ''}`}>Humidity</span>
                  <span className={`stat-value ${shouldUseLightText() ? 'light-text' : ''}`}>{weather.main.humidity}%</span>
                </div>
                <div className="stat-item">
                  <div className="stat-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"></path>
                    </svg>
                  </div>
                  <span className={`stat-label ${shouldUseLightText() ? 'light-text' : ''}`}>Wind Speed</span>
                  <span className="stat-value">
                    {isCelsius ? weather.wind.speed : (weather.wind.speed * 2.237).toFixed(1)} 
                    <span>{isCelsius ? 'm/s' : 'mph'}</span>
                  </span>
                </div>
                <div className="stat-item">
                  <div className="stat-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="M12 6v6l4 2"></path>
                    </svg>
                  </div>
                  <span className={`stat-label ${shouldUseLightText() ? 'light-text' : ''}`}>Pressure</span>
                  <span className="stat-value">{weather.main.pressure} hPa</span>
                </div>
                <div className="stat-item">
                  <div className="stat-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  </div>
                  <span className={`stat-label ${shouldUseLightText() ? 'light-text' : ''}`}>Visibility</span>
                  <span className="stat-value">
                    {(weather.visibility / 1000).toFixed(1)} 
                    <span>km</span>
                  </span>
                </div>
              </div>
            </div>

            {advice && (
              <div className="advice-section">
                <div className="advice-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '24px' }}>
                    <h3 className={`forecast-title ${shouldUseLightText() ? 'light-text' : ''}`} style={{ margin: 0 }}>Health & Safety Advice</h3>
                    <button 
                      className={`speak-button ${speakingSection === 'advice' ? 'speaking' : ''} ${shouldUseLightText() ? 'light-text' : ''}`}
                      onClick={handleSpeakAdvice}
                      title={speakingSection === 'advice' ? "Stop Speaking" : "Read Advice"}
                      style={{ 
                        background: 'transparent', 
                        border: 'none', 
                        cursor: 'pointer',
                        color: shouldUseLightText() ? '#333' : 'white',
                        padding: '8px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'transform 0.2s',
                        transform: speakingSection === 'advice' ? 'scale(1.1)' : 'scale(1)',
                        zIndex: 10
                      }}
                    >
                      {speakingSection === 'advice' ? (
                         <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                           <rect x="6" y="4" width="4" height="16"></rect>
                           <rect x="14" y="4" width="4" height="16"></rect>
                         </svg>
                      ) : (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                        </svg>
                      )}
                    </button>
                </div>
                <div className="advice-grid">
                  <div className={`advice-card ${shouldUseLightText() ? 'light-text' : ''}`}>
                    <h4>🧘 Health</h4>
                    <ul>
                      {advice.health.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className={`advice-card ${shouldUseLightText() ? 'light-text' : ''}`}>
                    <h4>🛡️ Safety</h4>
                    <ul>
                      {advice.safety.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className={`advice-card ${shouldUseLightText() ? 'light-text' : ''}`}>
                    <h4>👕 Clothing</h4>
                    <ul>
                      {advice.clothing.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {forecast && (
              <div className="forecast-section">
                <h3 className={`forecast-title ${shouldUseLightText() ? 'light-text' : ''}`}>5-Day Forecast</h3>
                <div className="forecast-list">
                  {forecast.list
                    .filter((item, index) => index % 8 === 0)
                    .slice(0, 5)
                    .map((item, index) => (
                      <div key={index} className={`forecast-item ${shouldUseLightText() ? 'light-text' : ''}`}>
                        <div className={`forecast-date ${shouldUseLightText() ? 'light-text' : ''}`}>
                          {formatDate(item.dt)}
                        </div>
                        <div className="forecast-icon">
                          <img
                            src={getWeatherIcon(item.weather[0].icon)}
                            alt={item.weather[0].description}
                          />
                        </div>
                        <div className="forecast-temp">
                          <span className="temp-high">
                            {formatTemperature(item.main.temp_max)}°
                            <span className="temp-unit">{isCelsius ? 'C' : 'F'}</span>
                          </span>
                          <span className="temp-low">
                            {formatTemperature(item.main.temp_min)}°
                            <span className="temp-unit">{isCelsius ? 'C' : 'F'}</span>
                          </span>
                        </div>
                        <div className={`forecast-desc ${shouldUseLightText() ? 'light-text' : ''}`}>
                          {item.weather[0].description}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {(!weather && !loading && !error) && (
          <div className="welcome-message">
            <p>Enter a city name to get started</p>
            <div className="unit-toggle">
              <button 
                className={`toggle-button ${isCelsius ? 'active' : ''}`}
                onClick={() => setIsCelsius(true)}
              >
                °C
              </button>
              <span className="toggle-label">→</span>
              <button 
                className={`toggle-button ${!isCelsius ? 'active' : ''}`}
                onClick={() => setIsCelsius(false)}
              >
                °F
              </button>
            </div>
          </div>
        )}

        <div className="map-section">
          <h3 className={`map-title ${shouldUseLightText() ? 'light-text' : ''}`}>
            Explore the World
          </h3>
          <WeatherMap onLocationSelect={handleLocationSelect} />
        </div>
      </div>
    </div>
  )
}

export default App

