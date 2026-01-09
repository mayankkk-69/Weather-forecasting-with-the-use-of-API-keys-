# Weather Forecast App ☀️🌧️

<p align="center">
  <img src="https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react" alt="React 18" />
  <img src="https://img.shields.io/badge/Vite-Latest-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/OpenWeatherMap-API-yellow?style=for-the-badge&logo=weather&logoColor=white" alt="OpenWeatherMap API" />
  <img src="https://img.shields.io/badge/Leaflet-Maps-green?style=for-the-badge&logo=leaflet&logoColor=white" alt="Leaflet Maps" />
</p>

<p align="center">
  <img src="https://readme-typing-svg.herokuapp.com?font=Fira+Code&size=22&pause=1000&color=2D9CDB&center=true&vCenter=true&width=600&lines=Real-time+Weather+%26+Forecasts;Interactive+World+Map;Voice+Search+%26+Text-to-Speech;Smart+Health+%26+Safety+Advice;Dynamic+Weather+Animations" alt="Typing SVG" />
</p>

---

## 🌟 Features

A modern, feature-rich weather application built with React and Vite, offering a premium user experience with dynamic visuals and advanced interactivity.

### 🗺️ **Interactive World Map**

- **Explore Anywhere**: Click anywhere on the global map to instantly fetch weather data for that location.
- **Smooth Navigation**: Powered by Leaflet, featuring smooth zooming and panning animations.
- **Visual Feedback**: Pins drop on your selected locations with coordinated animations.

### 🌤️ **Comprehensive Weather Data**

- **Current Conditions**: Real-time temperature, "feels like" temp, humidity, pressure, visibility, and wind speed/direction.
- **5-Day Forecast**: Detailed daily predictions including high/low temps and weather conditions.
- **Unit Conversion**: Seamlessly toggle between Celsius (°C) and Fahrenheit (°F).

### 🎙️ **Voice Integration**

- **Voice Search**: Search for any city simply by speaking its name.
- **Text-to-Speech Assistant**: The app can read aloud weather summaries, detailed statistics, and daily advice for hands-free updates.

### 🛡️ **Smart Advice System**

- **Intelligent Recommendations**: Get personalized advice based on current weather conditions.
- **Categories**:
  - **Health**: Hydration tips, sun protection, etc.
  - **Safety**: Driving warnings, visibility alerts.
  - **Clothing**: Suggestions on what to wear (e.g., "Wear a waterproof jacket").

### 🎨 **Dynamic UI/UX**

- **Immersive Backgrounds**: The interface changes dynamically based on the weather (Sunny, Rainy, Snowy, Stormy, Foggy) and time of day (Day/Night).
- **Living Animations**: Background effects like falling rain drops, snow, thunder flashes, floating bubbles, and sparkles.
- **Glassmorphism**: Modern, translucent design elements that blend beautifully with the dynamic backgrounds.
- **Responsive Design**: Fully optimized layout for desktops, tablets, and mobile devices.

---

## 🚀 Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/weather-app.git
   cd weather-app
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   ```

3. **API Configuration**
   This app requires an OpenWeatherMap API key.

   - Sign up at [OpenWeatherMap](https://openweathermap.org/api)
   - Create a free API key.
   - Note: The app currently has a key embedded for demonstration, but for production, replace `API_KEY` in `src/App.jsx`.

4. **Run the development server**

   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

---

## 🛠️ Technologies Used

| Technology         | Purpose                                                |
| ------------------ | ------------------------------------------------------ |
| **React 18**       | Core UI library with Hooks for state management        |
| **Vite**           | Lightning-fast build tool and dev server               |
| **OpenWeatherMap** | Primary source for weather and forecast data           |
| **React-Leaflet**  | Interactive maps integration                           |
| **Web Speech API** | Native browser API for Voice Recognition and Synthesis |
| **CSS3**           | Advanced styling, animations, and responsive layout    |

---

## 🎯 Usage Guide

1. **Search**: Type a city name in the input bar or use the **Microphone** icon to speak the city name.
2. **Current Location**: Click the **GPS** icon to use your browser's geolocation to find weather for your current position.
3. **Map Mode**: Scroll down to the map section. Drag, zoom, and **click anywhere on the map** to select a new location.
4. **Listen**: Click the **Speaker** icons next to sections (Temperature, Advice, Stats) to hear the app read the information to you.
5. **Toggle Units**: Use the °C / °F switch to change temperature units.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Made with ❤️ using React & Vite
</p>
