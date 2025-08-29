import { useState, useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export default function CrowdCheckUI() {
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [suggestions, setSuggestions] = useState([]);

  const mapRef = useRef(null);
  const markerRef = useRef(null);

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapRef.current) return;

    const map = L.map(mapRef.current).setView([28.6139, 77.2090], 5);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
    }).addTo(map);

    markerRef.current = L.marker([28.6139, 77.2090]).addTo(map);

    map.on("click", (e) => {
      const { lat, lng } = e.latlng;
      markerRef.current.setLatLng([lat, lng]);
      setDestination(`Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`);
      setSelectedPlace(`Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`);
      setSuggestions([]);
    });

    return () => map.remove();
  }, []);

  // Autocomplete search using Nominatim
  useEffect(() => {
    if (!destination) {
      setSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const fetchSuggestions = async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          destination
        )}&addressdetails=1&limit=5`;
        const res = await fetch(url, { signal: controller.signal });
        const data = await res.json();
        setSuggestions(data);
      } catch (err) {
        if (err.name !== "AbortError") console.error(err);
      }
    };

    fetchSuggestions();
    return () => controller.abort();
  }, [destination]);

  const handleSelectSuggestion = (place) => {
    const lat = parseFloat(place.lat);
    const lon = parseFloat(place.lon);
    markerRef.current.setLatLng([lat, lon]);
    mapRef.current._leaflet_map?.setView([lat, lon], 14); // zoom in
    setDestination(place.display_name);
    setSelectedPlace(place.display_name);
    setSuggestions([]);
  };

  return (
    <div className="min-h-screen p-6">
      <h1 className="text-2xl font-bold mb-4">CrowdCheck UI</h1>

      <input
        className="w-full border rounded px-3 py-2 mb-2"
        placeholder="Search place..."
        value={destination}
        onChange={(e) => setDestination(e.target.value)}
      />

      {suggestions.length > 0 && (
        <ul className="border rounded bg-white max-h-40 overflow-auto mb-2">
          {suggestions.map((s, i) => (
            <li
              key={i}
              className="px-2 py-1 hover:bg-gray-200 cursor-pointer"
              onClick={() => handleSelectSuggestion(s)}
            >
              {s.display_name}
            </li>
          ))}
        </ul>
      )}

      <div className="w-full h-[400px] border rounded overflow-hidden">
        <div ref={mapRef} className="w-full h-full" />
      </div>

      {selectedPlace && (
        <p className="mt-2">📍 Selected: {selectedPlace}</p>
      )}
    </div>
  );
}
