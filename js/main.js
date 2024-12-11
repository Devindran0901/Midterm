// Global variable for storing the chart instance
let weatherChart = null;

// Global variable for storing forecast data to be used in chart
let forecastDataForChart = [];

// Fetch weather data and display it in the table when "Get Forecast" button is clicked
document.getElementById('getForecastTableBtn').addEventListener('click', function () {
    const city = document.getElementById('cityInput').value.trim();
    const apiKey = "e9ac4636571fdf6247056c34532e5c2f"; // OpenWeatherMap API key
    const apiUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}`;

    // If city is empty, display an error message
    if (!city) {
        showError("Please enter a city name.");
        sendToNative('error', { message: 'City name is empty.' });
        return;
    }

    // Fetch weather data from the API
    fetch(apiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error("City not found or API error.");
            }
            return response.json();
        })
        .then(data => {
            const forecastData = data.list.slice(0, 8); // Get forecast for next 24 hours
            forecastDataForChart = forecastData; // Store data for chart rendering
            populateTable(forecastData); // Populate table with weather data
            clearError();
        })
        .catch(error => {
            showError(error.message); // Show error message if something goes wrong
            sendToNative('error', { message: error.message });
        });
});

// Fetch weather data and display the line chart when "Get Line Chart" button is clicked
document.getElementById('getForecastChartBtn').addEventListener('click', function () {
    // If no forecast data exists, show an error
    if (forecastDataForChart.length === 0) {
        showError("Please fetch the forecast table first.");
        sendToNative('error', { message: 'No forecast data available for chart.' });
        return;
    }

    // Prepare data for the chart
    const labels = forecastDataForChart.map(item => new Date(item.dt * 1000).toLocaleString()); // Time labels
    const temperatures = forecastDataForChart.map(item => (item.main.temp - 273.15).toFixed(2)); // Convert temperature from Kelvin to Celsius

    displayChart(labels, temperatures); // Display the line chart
    sendToNative('chartRendered', { labels, temperatures }); // Send data to native layer
});

// Populate the forecast table with weather data
function populateTable(forecastData) {
    const tableBody = document.getElementById('forecastTableBody');
    tableBody.innerHTML = ''; // Clear previous data

    // Loop through each forecast data entry and create a table row
    forecastData.forEach(item => {
        const dateTime = new Date(item.dt * 1000).toLocaleString();
        const temperatureCelsius = (item.main.temp - 273.15).toFixed(2); // Convert Kelvin to Celsius
        const weatherDescription = item.weather[0].description;

        // Create a table row with weather data
        const tableRow = `
            <tr>
                <td>${dateTime}</td>
                <td>${temperatureCelsius}</td>
                <td>${weatherDescription}</td>
            </tr>
        `;
        tableBody.insertAdjacentHTML('beforeend', tableRow); // Insert row into the table
    });
}

// Display the line chart using Chart.js
function displayChart(labels, temperatures) {
    const ctx = document.getElementById('weatherChart').getContext('2d');

    // Destroy existing chart instance if it exists
    if (weatherChart) {
        weatherChart.destroy();
    }

    // Create a new chart instance
    weatherChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Temperature (°C)',
                data: temperatures,
                borderColor: 'black', // Line color
                backgroundColor: 'white', // Background color for chart
                borderWidth: 2,
                pointRadius: 3,
                pointBackgroundColor: 'white',
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: 'black' // Legend text color
                    }
                },
            },
            scales: {
                x: {
                    grid: {
                        color: 'grey' // X-axis grid line color
                    },
                    title: {
                        display: true,
                        text: 'Time',
                        color: 'black'
                    },
                    ticks: {
                        color: 'black'
                    }
                },
                y: {
                    grid: {
                        color: 'grey' // Y-axis grid line color
                    },
                    title: {
                        display: true,
                        text: 'Temperature (°C)',
                        color: 'black'
                    },
                    ticks: {
                        color: 'black'
                    }
                }
            }
        }
    });
}

// Show an error message on the UI
function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.style.display = 'block'; // Make error message visible
    errorDiv.textContent = message; // Set the error message text
}

// Clear any displayed error messages
function clearError() {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.style.display = 'none'; // Hide error message
    errorDiv.textContent = ''; // Clear error message text
}

// Function to send data to the native layer (Android/iOS WebView)
function sendToNative(eventName, payload) {
    if (window.AndroidBridge && typeof window.AndroidBridge.postMessage === 'function') {
        // Send message to Android WebView
        AndroidBridge.postMessage(JSON.stringify({ event: eventName, data: payload }));
    } else if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.iOSBridge) {
        // Send message to iOS WebView
        window.webkit.messageHandlers.iOSBridge.postMessage({ event: eventName, data: payload });
    }
}
