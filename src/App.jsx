import React, { useState, useEffect } from "react";

function App() {
  const [city, setCity] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [results, setResults] = useState([]);
  const [rawResults, setRawResults] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sortOption, setSortOption] = useState("capRate");
  const [trending, setTrending] = useState(false);

  const [nightlyRate, setNightlyRate] = useState(150);
  const [occupancy, setOccupancy] = useState(65);
  const [expenses, setExpenses] = useState(30);
  const [showCapRateSettings, setShowCapRateSettings] = useState(false);

  const [minCapRate, setMinCapRate] = useState(0);
  const [minCocReturn, setMinCocReturn] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  
  useEffect(() => {
    if (rawResults.length === 0) return;

    if (!Array.isArray(rawResults)) return;
    const enriched = rawResults.map((home) => {
      const estimatedNightRate = nightlyRate;
      const occupancyRate = occupancy / 100;
      const grossIncome = estimatedNightRate * 365 * occupancyRate;
      const annualExpenses = grossIncome * (expenses / 100);
      const noi = grossIncome - annualExpenses;

      const downPayment = 0.2 * home.price;
      const loanAmount = 0.8 * home.price;
      const annualDebt = loanAmount * 0.07;
      const annualCashFlow = noi - annualDebt;

      const capRate = (noi / home.price) * 100;
      const cocReturn = (annualCashFlow / downPayment) * 100;

      
const capWeight = 0.4;
const cocWeight = 0.4;
const priceWeight = 0.1;
const daysWeight = 0.1;

const capScore = Math.max(0, Math.min(100, capRate * 10));
const cocScore = Math.max(0, Math.min(100, cocReturn * 10));
const zestimate = home.zestimate || home.price;
    const days = home.daysOnZillow || 999;
    const priceScore = zestimate && home.price
  ? Math.min(100, ((zestimate - home.price) / zestimate) * 100)
  : 0;
const daysScore = days <= 3 ? 100 : days <= 7 ? 60 : 20;

const heatScore = Math.round(
  capScore * capWeight +
  cocScore * cocWeight +
  priceScore * priceWeight +
  daysScore * daysWeight
);

const heatEmoji = heatScore >= 85 ? "🔥🔥" : heatScore >= 70 ? "🔥" : "";


      return {
        ...home,
        capRate,
        cocReturn,
        estimatedNightRate,
        occupancyRate,
        heatScore,
        heatEmoji,
      };
    });

    console.log("Final enriched results:", enriched);
    setResults(enriched);
  }, [nightlyRate, occupancy, expenses, rawResults]);



  
  
  const handleSearch = async () => {
    console.log("Search clicked");
    setLoading(true);

    try {
      const res = await fetch(`http://localhost:8000/scan?city=${city}&state=${stateCode}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      console.log('Live API full response:', data);
      console.log("Live API response:", data);

      setRawResults(data.results);  // ✅ Extract 'results' array from API response
    } catch (error) {
      console.error("Error fetching from API:", error);
      setRawResults([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = (home) => {
    setFavorites((prev) => {
      const exists = prev.find((f) => f.zpid === home.zpid);
      if (exists) {
        return prev.filter((f) => f.zpid !== home.zpid);
      } else {
        return [home, ...prev];
      }
    });
  };

  const filteredResults = results;

  const sortedResults = [...filteredResults].sort((a, b) => {
    if (sortOption === "heatScore") return b.heatScore - a.heatScore;
    if (sortOption === "capRate") return b.capRate - a.capRate;
    if (sortOption === "cocReturn") return b.cocReturn - a.cocReturn;
    if (sortOption === "priceLow") return a.price - b.price;
    if (sortOption === "priceHigh") return b.price - a.price;
    return 0;
  });
return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">Zillow Market Scanner</h1>

        {trending && (
          <div className="bg-yellow-600 text-white text-center py-2 mb-4 rounded shadow">
            📈 This market is trending: high investor demand & strong returns!
          </div>
        )}

        {/* Top Controls */}
        <div className="flex flex-col md:flex-row items-center gap-4 mb-2 flex-wrap">
          <input
            type="text"
            placeholder="City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="px-4 py-2 rounded-md bg-gray-800 text-white w-full md:w-1/3"
          />
          <input
            type="text"
            placeholder="State (e.g. MT)"
            value={stateCode}
            onChange={(e) => setStateCode(e.target.value)}
            className="px-4 py-2 rounded-md bg-gray-800 text-white w-full md:w-1/6"
          />
          <button
            onClick={handleSearch}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-md font-semibold"
          >
            {loading ? "Searching..." : "Search"}
          </button>
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="px-4 py-2 rounded-md bg-gray-700 text-white"
          >
            <option value="capRate">Sort by Cap Rate</option>
            <option value="cocReturn">Sort by Cash-on-Cash</option>
            <option value="priceLow">Price: Low to High</option>
            <option value="priceHigh">Price: High to Low</option>
            <option value="heatScore">Sort by Heat Score</option>
          </select>

          {/* Dropdowns */}
          <div className="flex gap-2 relative">
            <div className="relative">
              <button
                onClick={() => {
                  setShowFilters(!showFilters);
                  setShowCapRateSettings(false);
                }}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md font-semibold"
              >
                More Filters {showFilters ? "▲" : "▼"}
              </button>
              {showFilters && (
                <div className="absolute z-10 bg-gray-800 p-3 rounded-md mt-2 space-y-2 text-sm shadow border border-gray-700 w-72">
                  <div>
                    <div className="flex justify-between text-gray-300 mb-1">
                      <span>Min Cap Rate</span>
                      <span>{minCapRate}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      step="0.5"
                      value={minCapRate}
                      onChange={(e) => setMinCapRate(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-gray-300 mb-1">
                      <span>Min CoC Return</span>
                      <span>{minCocReturn}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      step="0.5"
                      value={minCocReturn}
                      onChange={(e) => setMinCocReturn(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => {
                  setShowCapRateSettings(!showCapRateSettings);
                  setShowFilters(false);
                }}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md font-semibold"
              >
                Cap Rate Assumptions {showCapRateSettings ? "▲" : "▼"}
              </button>
              {showCapRateSettings && (
                <div className="absolute z-10 bg-gray-800 p-3 rounded-md mt-2 space-y-2 text-sm shadow border border-gray-700 w-72">
                  <div>
                    <div className="flex justify-between text-gray-300 mb-1">
                      <span>Nightly Rate</span>
                      <span>${nightlyRate}</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="1500"
                      step="5"
                      value={nightlyRate}
                      onChange={(e) => setNightlyRate(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-gray-300 mb-1">
                      <span>Occupancy Rate</span>
                      <span>{occupancy}%</span>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="100"
                      step="1"
                      value={occupancy}
                      onChange={(e) => setOccupancy(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-gray-300 mb-1">
                      <span>Annual Expenses (% of Income)</span>
                      <span>{expenses}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="50"
                      step="1"
                      value={expenses}
                      onChange={(e) => setExpenses(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Results */}
        {sortedResults.length === 0 && !loading && (
          <p className="text-center text-gray-400 mt-6">No results yet. Try a search.</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {sortedResults.map((home) => (
            <div
              key={home.zpid}
              className="bg-gray-800 p-4 rounded-xl shadow hover:shadow-lg transition"
            >
              <img
                src={home.imgSrc}
                alt={home.address}
                className="w-full h-48 object-cover rounded-md mb-4"
              />
              <div className="flex justify-between items-center mb-1">
                <h2 className="text-xl font-semibold">{home.address}</h2>
                <button onClick={() => toggleFavorite(home)} className="text-yellow-400 text-xl">
                  {favorites.find((f) => f.zpid === home.zpid) ? "★" : "☆"}
                </button>
              </div>
              {home.undervalued && (
                <span className="inline-block bg-red-600 text-white text-xs font-bold px-2 py-1 rounded mb-2">
                  Undervalued
                </span>
              )}
              <p className="text-gray-400">
                ${home.price.toLocaleString()} • {home.bedrooms} bd • {home.bathrooms} ba
              </p>
              <p className="text-sm text-green-400 mt-1">
                Cap Rate: {home.capRate.toFixed(2)}% | CoC Return: {home.cocReturn.toFixed(2)}%
              </p>
              <p className="text-sm text-gray-400">
                Est. Night Rate: ${home.estimatedNightRate.toFixed(0)} | Occ:{" "}
                {Math.round(home.occupancyRate * 100)}%
              </p>
              <p className="text-sm text-yellow-400 mt-1">
                Heat Score: {home.heatScore} {home.heatEmoji}
              </p>
              <a
                href={home.detailUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-3 text-blue-400 hover:underline"
              >
                View Listing →
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;