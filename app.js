// Import necessary libraries
import L from 'leaflet';
import Chart from 'chart.js';

// Initialize the map
export const initializeMap = () => {
  const map = L.map('map').setView([34.1463, -118.1004], 10); // Default to Pasadena, CA
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);
  return map;
};

// Trend Diagram: Fetch data based on selected aggregation level
export const fetchTrendData = async (map) => {
  const keyword = document.getElementById("trendKeyword").value.trim();
  if (!keyword) {
    alert("Please enter a keyword for trend data!");
    return;
  }
  const aggregation = document.getElementById("aggregation").value;
  try {
    const response = await fetch(`/api/tweets/trend?aggregation=${aggregation}&keyword=${keyword}`);
    const data = await response.json();

    if (data.trends && data.trends.length > 0) {
      const labels = data.trends.map(trend => {
        const date = new Date(trend._id.year, trend._id.month - 1, trend._id.day, trend._id.hour || 0);
        return aggregation === "hourly"
          ? date.toISOString().slice(0, 13).replace("T", " ") // Format: YYYY-MM-DD HH
          : date.toISOString().slice(0, 10); // Format: YYYY-MM-DD
      });
      const counts = data.trends.map(trend => trend.count);
      updateChart(labels, counts, aggregation);
    } else {
      alert("No trends found.");
    }
  } catch (err) {
    console.error("Error fetching trend data:", err);
    alert("Failed to fetch trend data.");
  }
};

// Update chart with trend data
let trendChart;
const updateChart = (labels, counts, aggregation) => {
  if (trendChart) {
    trendChart.destroy();
  }
  const ctx = document.getElementById('trendChart').getContext('2d');
  trendChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: `Tweet Trends (${aggregation})`,
        data: counts,
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: true,
      }]
    },
    options: {
      responsive: true,
      scales: {
        x: {
          title: { display: true, text: aggregation === "hourly" ? "Time (Hour)" : "Date" }
        },
        y: {
          title: { display: true, text: "Tweet Count" },
          beginAtZero: true
        }
      }
    }
  });
};

// Fetch tweets based on the keyword
export const fetchAndRenderTweets = async (map) => {
  const keyword = document.getElementById('keyword').value.trim();
  if (!keyword) {
    alert("Please enter a keyword!");
    return;
  }
  try {
    const response = await fetch(`/api/tweets?keyword=${keyword}`);
    const data = await response.json();

    if (data.tweets && data.tweets.length > 0) {
      renderTweetsOnMap(map, data.tweets);
    } else {
      alert("No tweets found for the given keyword.");
    }
  } catch (error) {
    console.error("Error fetching tweets:", error);
    alert("Failed to fetch tweets.");
  }
};

// Render tweets on the map
const renderTweetsOnMap = (map, tweets) => {
  map.eachLayer(layer => {
    if (layer instanceof L.Marker) map.removeLayer(layer);
  });
  tweets.forEach(tweet => {
    if (tweet.coordinates) {
      const { lat, lon } = tweet.coordinates;
      const marker = L.marker([lat, lon]).addTo(map);
      marker.bindPopup(`<b>@${tweet.user}</b><br>${tweet.text}<br><small>${new Date(tweet.created_at).toLocaleString()}</small>`);
    }
  });
  const bounds = tweets.map(tweet => [tweet.coordinates.lat, tweet.coordinates.lon]);
  if (bounds.length) {
    map.fitBounds(bounds);
  }
};

// Fetch sentiment data (mock data for now)
export const fetchSentimentData = async () => {
  const sentimentKeyword = document.getElementById('sentimentKeyword').value.trim();
  if (!sentimentKeyword) {
    alert("Please enter a keyword for sentiment analysis!");
    return;
  }
  try {
    // Mock sentiment data
    const sentimentData = {
      positive: 50,
      negative: 30,
      normal: 20
    };
    renderSentimentChart(sentimentData);
  } catch (error) {
    console.error("Error fetching sentiment data:", error);
    alert("Failed to fetch sentiment data.");
  }
};

// Render sentiment analysis chart
const renderSentimentChart = (data) => {
  const ctx = document.getElementById('sentimentChart').getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Positive', 'Negative', 'Normal'],
      datasets: [{
        label: 'Sentiment Analysis',
        data: [data.positive, data.negative, data.normal],
        backgroundColor: ['green', 'red', 'gray']
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: 'Count' }
        }
      }
    }
  }); // Corrected closing parenthesis and brace
};



// Switch between tabs (Trend Diagram, Map, Sentiment Analysis)
export const showTab = (tab) => {
  if (tab === 'trend') {
    document.getElementById('trendContainer').style.display = 'block';
    document.getElementById('mapContainer').style.display = 'none';
    document.getElementById('sentimentContainer').style.display = 'none';
    document.getElementById('trendTab').classList.add('active');
    document.getElementById('mapTab').classList.remove('active');
    document.getElementById('sentimentTab').classList.remove('active');
  } else if (tab === 'map') {
    document.getElementById('trendContainer').style.display = 'none';
    document.getElementById('mapContainer').style.display = 'block';
    document.getElementById('sentimentContainer').style.display = 'none';
    document.getElementById('mapTab').classList.add('active');
    document.getElementById('trendTab').classList.remove('active');
    document.getElementById('sentimentTab').classList.remove('active');
  } else {
    document.getElementById('trendContainer').style.display = 'none';
    document.getElementById('mapContainer').style.display = 'none';
    document.getElementById('sentimentContainer').style.display = 'block';
    document.getElementById('sentimentTab').classList.add('active');
    document.getElementById('trendTab').classList.remove('active');
    document.getElementById('mapTab').classList.remove('active');
  }
};
