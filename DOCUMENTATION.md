# Project Architecture & Workflow

This document outlines the technical workflow and logic flow of the Weather Forecasting Application.

## 1. High-Level System Architecture

```mermaid
graph TD
    User([User]) --> UI[React Frontend]
    UI --> Logic{App Logic}
    
    subgraph External APIs
        Logic --> OWM_Weather[OpenWeatherMap Current Weather API]
        Logic --> OWM_Forecast[OpenWeatherMap 5-Day Forecast API]
        Logic --> OWM_Geocode[OpenWeatherMap Geocoding API]
    end
    
    OWM_Weather --> State[React State Management]
    OWM_Forecast --> State
    OWM_Geocode --> Suggestions[City Suggestions Dropdown]
    
    State --> Background[Dynamic Background & Visual Effects]
    State --> WeatherDisplay[Weather Details & Stats]
    State --> Advice[Health & Safety Advice Logic]
    State --> Forecast[5-Day Forecast Display]
    State --> Map[Interactive Leaflet Map]
```

## 2. Component Workflow (Search & Fetch)

The following diagram describes the sequence of events when a user searches for a city.

```mermaid
sequenceDiagram
    participant U as User
    participant A as App.jsx
    participant V as Voice/TTS Engine
    participant API as OpenWeatherMap API

    U->>A: Enter City Name / Voice Command
    A->>API: Fetch Weather & Forecast Data
    API-->>A: Return JSON Data
    A->>A: Update Weather State
    A->>A: Calculate Advice (getAdvice())
    A->>A: Determine Background Class
    A->>U: Render Weather UI & Visual Effects
    
    Note over U,V: Optional Interactions
    U->>V: Click "Read Weather"
    V-->>U: Voice Output (TTS)
```

## 3. Data Processing Logic (getAdvice)

The application includes an advice engine that processes raw weather data into human-readable tips.

```mermaid
flowchart LR
    Data[(Weather Data)] --> Temp{Temperature?}
    Data --> Cond{Condition?}

    Temp -- >30°C --> H1[Stay Hydrated]
    Temp -- <0°C --> H2[Protect Skin]
    
    Cond -- Rain --> S1[Slippery Roads]
    Cond -- Clear --> S2[Outdoor Exercise]
    
    H1 & H2 & S1 & S2 --> UI[Advice Section]
```

## 4. Project Structure

- **`src/App.jsx`**: The core controller. Handles API calls, state management, and main UI layout.
- **`src/WeatherMap.jsx`**: Manages the Leaflet interactive map and coordinate selection.
- **`src/App.css`**: Contains all glassmorphism styles, weather-based background gradients, and animations.
- **`src/main.jsx`**: Entry point for the React application.

---

> [!NOTE]
> Some sections (Advice, Map, and certain Search Buttons) are currently commented out in the codebase as per recent configuration changes but can be re-enabled in `App.jsx`.
