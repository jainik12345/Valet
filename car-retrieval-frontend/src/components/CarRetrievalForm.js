import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import BE_URL from "../config";

const CarRetrievalForm = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    phone_number: "",
    car_number: "",
    serial_number: "",
  });

  const [parkedCars, setParkedCars] = useState([]);
  const [matchedCarInfo, setMatchedCarInfo] = useState(null);
  const [vehicleMismatch, setVehicleMismatch] = useState(false);
  const [vehicleNotFound, setVehicleNotFound] = useState(false);

  useEffect(() => {
    const fetchParkedCars = async () => {
      try {
        const res = await axios.get(`${BE_URL}/api/parked-cars`);
        setParkedCars(res.data);
      } catch (err) {
        console.error("Failed to fetch parked cars:", err);
      }
    };
    fetchParkedCars();
  }, []);

  const handleChange = (e) => {
    const { name, value = "" } = e.target;
    const upperValue =
      typeof value === "string" ? value.toUpperCase().trim() : value;

    setFormData((prev) => ({
      ...prev,
      [name]: upperValue,
    }));

    if (name === "serial_number") {
      // Find parked car by exact serial number match
      const found = parkedCars.find(
        (car) => car.serial_number?.toUpperCase() === upperValue
      );
      setMatchedCarInfo(found || null);

      // Reset vehicle mismatch error when serial changes
      setVehicleMismatch(false);
    }

    if (name === "car_number" && matchedCarInfo) {
      // Check last 4 digits match
      const enteredLast4 = upperValue.slice(-4);
      const parkedLast4 = (matchedCarInfo.vehicle_number || "")
        .slice(-4)
        .toUpperCase();

      if (enteredLast4 !== parkedLast4) {
        setVehicleMismatch(true);
      } else {
        setVehicleMismatch(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!matchedCarInfo) {
      setVehicleNotFound(true);
      return;
    }

    if (vehicleMismatch) {
      alert("Vehicle number last 4 digits do not match the records.");
      return;
    }

    setVehicleNotFound(false);

    const payload = {
      name: formData.name,
      phone_number: formData.phone_number,
      car_number: formData.car_number,
      serial_number: formData.serial_number,
    };

    try {
      await axios.post(`${BE_URL}/api/retrieve`, payload);
      navigate("/confirmation");
    } catch (error) {
      console.error("Submission failed:", error);
      alert("Failed to send request");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-purple-600">
          Vehicle Information
        </h1>
        <img src="/logo.png" alt="Company Logo" className="h-10" />
      </div>

      <div className="flex justify-center px-4 mt-8">
        <div className="w-full max-w-md bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 text-purple-600">
            Vehicle Information Form
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              name="serial_number"
              type="text"
              value={formData.serial_number}
              onChange={handleChange}
              placeholder="Serial No."
              className="w-full p-2 border border-gray-300 rounded uppercase"
              required
              autoComplete="off"
            />

            <input
              name="car_number"
              type="text"
              value={formData.car_number}
              onChange={handleChange}
              placeholder="Vehicle No."
              className="w-full p-2 border border-gray-300 rounded uppercase"
              required
              autoComplete="off"
            />

            {vehicleMismatch && (
              <p className="text-sm text-red-600">
                Last 4 digits of Vehicle No. do not match with records.
              </p>
            )}

            <input
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder="Name (optional)"
              className="w-full p-2 border border-gray-300 rounded uppercase"
              autoComplete="off"
            />

            <input
              name="phone_number"
              type="tel"
              value={formData.phone_number}
              onChange={handleChange}
              placeholder="Phone No. (optional)"
              className="w-full p-2 border border-gray-300 rounded uppercase"
              autoComplete="off"
            />

            <button
              type="submit"
              className="w-full bg-purple-600 text-white p-2 rounded hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-default focus:outline-none"
              disabled={
                !formData.serial_number ||
                !formData.car_number ||
                vehicleMismatch
              }
            >
              Get my vehicle!
            </button>

            {vehicleNotFound && (
              <p className="text-sm text-red-600 text-center mt-2">
                Vehicle not found in records.
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default CarRetrievalForm;
