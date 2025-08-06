import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FiMapPin,
  FiCamera,
  FiBell,
  FiTrash2,
  FiX,
  FiAlertCircle,
} from "react-icons/fi";
import Header from "../components/common/Header";
import { useNavigate } from "react-router-dom";
import { Player } from "@lottiefiles/react-lottie-player";
import { LucideCctv } from "lucide-react";
import Emergency from "../../assets/lottie/Emergency.json";
import { FiAlertTriangle, FiPlay } from "react-icons/fi";

const AlertsPage = () => {
  const [alerts, setAlerts] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [showFootage, setShowFootage] = useState(false);
  const [videoSrc, setVideoSrc] = useState(null);

  const navigate = useNavigate();

  const fetchAlerts = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/alerts/fetch-alerts"
      );
      const data = await response.json();
      setAlerts(data);
    } catch (error) {
      console.error("Error fetching alerts:", error);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleLocateAnomaly = (alert) => {
    if (!alert.coordinates) {
      alert("Coordinates not available for this alert");
      return;
    }
    const [lat, lng] = alert.coordinates.split(",").map(Number);
    if (isNaN(lat) || isNaN(lng)) {
      alert("Invalid coordinates format");
      return;
    }
    const googleMapsUrl = `https://www.google.com/maps?q=${lat},${lng}&z=15&output=embed`;
    setSelectedAlert({ ...alert, googleMapsUrl });
    setShowMap(true);
    setShowFootage(false); // Hide footage when showing map
  };

  const handleViewNearestCCTV = (coordinates, locality) => {
    navigate("/nearest-cctvs", {
      state: { coordinates, locality },
    });
  };

  const handleNotify = () => {
    navigate("/notify");
  };

  const handleDeleteAlert = async (id) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/alerts/delete-alerts/${id}`,
        {
          method: "DELETE",
        }
      );
      if (response.ok) {
        setAlerts((prevAlerts) =>
          prevAlerts.filter((alert) => alert._id !== id)
        );
        alert("Alert deleted successfully");
        setShowPopup(false);
      } else {
        alert("Failed to delete alert");
      }
    } catch (error) {
      console.error("Error deleting alert:", error);
    }
  };

  const handlePopupOpen = (alert) => {
    setSelectedAlert(alert);
    setShowPopup(true);
    setShowFootage(true); // Show footage initially
    setVideoSrc(alert.footageUrl); // Set the footage URL
  };

  const handlePopupClose = () => {
    setShowPopup(false);
    setSelectedAlert(null);
    setShowMap(false);
    setShowFootage(false);
    setVideoSrc(null);
  };

  const handleFootageView = (footageUrl) => {
    if (footageUrl) {
      setVideoSrc(footageUrl);
      setShowFootage(true);
      setShowMap(false); // Hide map when showing footage
    } else {
      alert("Footage URL is not available");
    }
  };

  return (
    <div className="flex-1 overflow-auto relative bg-gradient-to-br from-gray-800 via-gray-900 to-black text-gray-100 min-h-screen">
      <Header title="Alerts" />
      <div className="flex flex-col items-center justify-center py-10">
        <Player autoplay loop src={Emergency} className="w-48 h-48" />
        <p className="text-center text-gray-300 text-lg max-w-xl mt-4">
          The vulnerability detected through our AI Model is displayed here.
          Click on an alert to view more details.
        </p>
      </div>

      <main className="max-w-7xl mx-auto py-6 px-4 lg:px-8">
        {alerts.length === 0 ? (
          <p className="text-center text-gray-300">No alerts available.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {alerts.map((alert) => (
              <div
                key={alert._id}
                className="relative bg-red-600 p-5 rounded-lg shadow-lg hover:shadow-2xl hover:bg-red-500 transition-all transform hover:scale-105 cursor-pointer"
                onClick={() => handlePopupOpen(alert)}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-transparent opacity-40 rounded-lg blur-md"></div>
                <div className="relative z-10 flex items-center">
                  <FiAlertCircle size={28} className="text-white mr-4" />
                  <h3 className="text-white font-bold">
                    Alert Received at {alert.anomalyTime}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        )}

        {showPopup && selectedAlert && (
          <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50">
            <motion.div
              className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl border border-gray-700 shadow-2xl overflow-hidden w-full max-w-5xl"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {/* Glass-effect header */}
              <div className="bg-gray-800 bg-opacity-50 backdrop-blur-md border-b border-gray-700 p-4 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white flex items-center">
                  <motion.div
                    animate={{ rotate: [0, 15, 0] }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      repeatDelay: 3,
                    }}
                    className="mr-3 text-red-400"
                  >
                    <FiAlertTriangle size={24} />
                  </motion.div>
                  Alert Details
                  <span className="ml-2 px-2 py-1 bg-red-500 bg-opacity-20 text-red-400 text-xs rounded-md">
                    {selectedAlert.severity || "High"}
                  </span>
                </h2>

                <button
                  className="bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-full p-2 transition-all duration-200 transform hover:rotate-90"
                  onClick={handlePopupClose}
                >
                  <FiX size={20} />
                </button>
              </div>

              {/* Content area */}
              <div className="p-6">
                {/* Alert info grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gray-800 bg-opacity-50 rounded-lg p-3 border border-gray-700">
                    <p className="text-xs text-gray-400">Location</p>
                    <p className="text-sm font-medium text-gray-200">
                      {selectedAlert.location || "Unknown"}
                    </p>
                  </div>
                  <div className="bg-gray-800 bg-opacity-50 rounded-lg p-3 border border-gray-700">
                    <p className="text-xs text-gray-400">Type</p>
                    <p className="text-sm font-medium text-gray-200">
                      {selectedAlert.type || "Suspicious Activity"}
                    </p>
                  </div>
                  <div className="bg-gray-800 bg-opacity-50 rounded-lg p-3 border border-gray-700">
                    <p className="text-xs text-gray-400">Time</p>
                    <p className="text-sm font-medium text-gray-200">
                      {selectedAlert.time || new Date().toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="bg-gray-800 bg-opacity-50 rounded-lg p-3 border border-gray-700">
                    <p className="text-xs text-gray-400">Status</p>
                    <p className="text-sm font-medium text-yellow-400">
                      Active
                    </p>
                  </div>
                </div>

                {/* Interactive content area */}
                {showMap ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="relative w-full rounded-lg overflow-hidden border border-gray-700 shadow-lg mb-6"
                    style={{ paddingBottom: "56.25%" }}
                  >
                    <iframe
                      src={selectedAlert.googleMapsUrl}
                      className="absolute top-0 left-0 w-full h-full"
                      frameBorder="0"
                      allowFullScreen
                    ></iframe>
                  </motion.div>
                ) : showFootage ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="relative w-full rounded-lg overflow-hidden border border-gray-700 shadow-lg mb-6"
                    style={{ paddingBottom: "56.25%" }}
                  >
                    <video
                      className="absolute top-0 left-0 w-full h-full"
                      controls
                      src={videoSrc}
                    >
                      Your browser does not support the video tag.
                    </video>
                  </motion.div>
                ) : (
                  <div className="w-full h-[400px] bg-gray-800 bg-opacity-40 rounded-lg border border-gray-700 flex items-center justify-center mb-6">
                    <div className="text-center text-gray-400">
                      <FiCamera size={48} className="mx-auto mb-2 opacity-40" />
                      <p>Select an option below to view content</p>
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <motion.button
                    whileHover={{
                      y: -2,
                      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)",
                    }}
                    className="flex flex-col items-center bg-gradient-to-b from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-gray-200 py-4 px-4 rounded-lg shadow-lg transition border border-gray-700"
                    onClick={() => handleLocateAnomaly(selectedAlert)}
                  >
                    <div className="bg-red-500 bg-opacity-20 p-3 rounded-full mb-2">
                      <FiMapPin className="w-5 h-5 text-red-400" />
                    </div>
                    <span className="text-sm">Locate Crime</span>
                  </motion.button>

                  <motion.button
                    whileHover={{
                      y: -2,
                      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)",
                    }}
                    className="flex flex-col items-center bg-gradient-to-b from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-gray-200 py-4 px-4 rounded-lg shadow-lg transition border border-gray-700"
                    onClick={() =>
                      handleViewNearestCCTV(
                        selectedAlert.coordinates,
                        selectedAlert.location
                      )
                    }
                  >
                    <div className="bg-blue-500 bg-opacity-20 p-3 rounded-full mb-2">
                      <FiCamera className="w-5 h-5 text-blue-400" />
                    </div>
                    <span className="text-sm">Nearest CCTV</span>
                  </motion.button>

                  <motion.button
                    whileHover={{
                      y: -2,
                      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)",
                    }}
                    className="flex flex-col items-center bg-gradient-to-b from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-gray-200 py-4 px-4 rounded-lg shadow-lg transition border border-gray-700"
                    onClick={handleNotify}
                  >
                    <div className="bg-amber-500 bg-opacity-20 p-3 rounded-full mb-2">
                      <FiBell className="w-5 h-5 text-amber-400" />
                    </div>
                    <span className="text-sm">Notify</span>
                  </motion.button>

                  <motion.button
                    whileHover={{
                      y: -2,
                      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)",
                    }}
                    className="flex flex-col items-center bg-gradient-to-b from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-gray-200 py-4 px-4 rounded-lg shadow-lg transition border border-gray-700"
                    onClick={() => handleFootageView(selectedAlert.footageUrl)}
                  >
                    <div className="bg-purple-500 bg-opacity-20 p-3 rounded-full mb-2">
                      <LucideCctv className="w-5 h-5 text-purple-400" />
                    </div>
                    <span className="text-sm">View Incident Footage</span>
                  </motion.button>
                </div>

                {/* Footer button */}
              </div>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AlertsPage;
