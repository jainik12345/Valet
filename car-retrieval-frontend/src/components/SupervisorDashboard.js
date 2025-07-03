import React, { useEffect, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import BE_URL from "../config";

const socket = io(`${BE_URL}`);

const SupervisorDashboard = () => {
  const [activeTab, setActiveTab] = useState("requests");
  const [requests, setRequests] = useState([]);
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [showValetForm, setShowValetForm] = useState(false);
  const [valetList, setValetList] = useState([]);
  const [valetData, setValetData] = useState({
    name: "",
    dob: "",
    aadhaar: "",
    dlNumber: "",
    phone: "",
    dlFront: null,
    dlBack: null,
    isTemporary: false,
  });
  const [valetFormError, setValetFormError] = useState("");
  const [popup, setPopup] = useState({ show: false, message: "", type: "" });

  const [parkedCarData, setParkedCarData] = useState({
    serialNumber: "",
    vehicleNumber: "",
    basementNumber: "",
    lotNumber: "",
    timeTaken: "",
    valet: "",
  });

  const [valets, setValets] = useState([]);
  const [selectedValet, setSelectedValet] = useState(null);

  useEffect(() => {
    fetchRequests();
    socket.on("new_request", (newRequest) => {
      setRequests((prev) => [newRequest, ...prev]);
      playNotificationSound();
    });
    return () => {
      socket.off("new_request");
    };
  }, []);

  useEffect(() => {
    const fetchValetsForTab = async () => {
      try {
        const res = await fetch(`${BE_URL}/api/valets`);
        const data = await res.json();
        setValets(data);
      } catch (err) {
        console.error("❌ Error loading valets:", err);
      }
    };
    if (activeTab === "valets") {
      fetchValetsForTab();
    }
  }, [activeTab, showValetForm]);

  // Fetch valets for selector when "parked" tab is activated
  const fetchValetList = async () => {
    try {
      const response = await axios.get(`${BE_URL}/api/valets`);
      const valetNames = response.data.map((valet) => valet.name);
      setValetList(valetNames);
    } catch (error) {
      console.error("Failed to fetch valets:", error);
    }
  };

  useEffect(() => {
    if (activeTab === "parked") {
      fetchValetList();
    }
  }, [activeTab]);

  const fetchRequests = async () => {
    try {
      const res = await axios.get(`${BE_URL}/api/retrieve`);
      setRequests(res.data);
    } catch (error) {
      console.error("Error fetching requests:", error);
    }
  };

  const playNotificationSound = () => {
    const audio = new Audio("/notification.mp3");
    audio.play().catch((err) => console.error("Failed to play sound:", err));
  };

  const updateStatus = async (id, newStatus) => {
    try {
      await axios.put(`${BE_URL}/api/retrieve/${id}/status`, {
        status: newStatus,
      });
      fetchRequests();
    } catch (error) {
      console.error("Failed to update status", error);
    }
  };

  const formatDateTime = (isoString) => {
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const time = date.toLocaleTimeString();
    return `${day}-${month}-${year} ${time}`;
  };

  // const filteredRequests = requests.filter(
  //   (req) =>
  //     req.name.toLowerCase().includes(search.toLowerCase()) ||
  //     req.car_number.toLowerCase().includes(search.toLowerCase()) ||
  //     req.serial_number.toLowerCase().includes(search.toLowerCase())
  // );

  const filteredRequests = requests.filter(
    (req) =>
      (req.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (req.car_number || "").toLowerCase().includes(search.toLowerCase()) ||
      (req.serial_number || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleDownload = () => {
    const { start, end } = dateRange;
    if (!start || !end) return alert("Please select both start and end dates.");

    const startDate = new Date(start);
    const endDate = new Date(end);
    endDate.setHours(23, 59, 59, 999);

    const filteredData = requests.filter(
      (req) =>
        req.status === "completed" &&
        new Date(req.request_time) >= startDate &&
        new Date(req.request_time) <= endDate
    );

    const worksheet = XLSX.utils.json_to_sheet(
      filteredData.map((req) => ({
        Name: req.name,
        Phone: req.phone_number,
        Car_Number: req.car_number,
        Serial_Number: req.serial_number,
        Basement_Number: req.basement_number,
        Lot_Number: req.lot_number,
        Valet: req.valet,
        Time_Taken: req.time_taken,
        Request_Time: formatDateTime(req.request_time),
        Status: req.status,
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "CompletedBookings");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    saveAs(
      new Blob([excelBuffer], { type: "application/octet-stream" }),
      `CompletedBookings_${start}_to_${end}.xlsx`
    );
  };

  const handleValetChange = (e) => {
    setValetFormError("");
    const { name, value, files } = e.target;

    if (name === "isTemporary") {
      setValetData((prev) => ({ ...prev, isTemporary: e.target.checked }));
    }

    if (name === "aadhaar") {
      let cleaned = value.replace(/\s+/g, "").slice(0, 12);
      cleaned = cleaned.replace(/(\d{4})(?=\d)/g, "$1 ");
      setValetData((prev) => ({ ...prev, aadhaar: cleaned }));
    } else if (name === "dlNumber") {
      let input = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
      input = input.slice(0, 15);
      const formatted = input
        .replace(/^([A-Z]{2})/, "$1-")
        .replace(/^([A-Z]{2}-\d{2})/, "$1 ")
        .replace(/^([A-Z]{2}-\d{2} \d{4})/, "$1 ")
        .replace(/^([A-Z]{2}-\d{2} \d{4} \d{0,7})/, "$1");
      setValetData((prev) => ({ ...prev, dlNumber: formatted }));
    } else if (name === "dlFront" || name === "dlBack") {
      setValetData((prev) => ({ ...prev, [name]: files[0] }));
    } else {
      setValetData((prev) => ({ ...prev, [name]: value.toUpperCase() }));
    }
  };

  const showPopup = (message, type = "success") => {
    setPopup({ show: true, message, type });
    setTimeout(() => setPopup({ show: false, message: "", type: "" }), 3000);
  };

  const handleValetSubmit = async (e) => {
    e.preventDefault();

    if (valetData.aadhaar.replace(/\s/g, "").length !== 12) {
      setValetFormError("Invalid Aadhaar number. Must be 12 digits.");
      return;
    }

    try {
      const formData = new FormData();
      Object.entries(valetData).forEach(([key, val]) =>
        formData.append(key, val)
      );

      await axios.post(`${BE_URL}/api/valets`, formData);
      setValetData({
        name: "",
        dob: "",
        aadhaar: "",
        dlNumber: "",
        phone: "",
        dlFront: null,
        dlBack: null,
        isTemporary: false,
      });
      setShowValetForm(false);

      if (activeTab === "parked") fetchValetList();
      if (activeTab === "valets") {
        const res = await fetch(`${BE_URL}/api/valets`);
        const data = await res.json();
        setValets(data);
      }
      showPopup("Valet registered successfully!", "success");
    } catch (err) {
      if (
        err.response &&
        err.response.data &&
        err.response.data.error &&
        err.response.data.error === "Valet already exists"
      ) {
        setValetFormError(
          "Valet with this Aadhaar or Vehicle No already exists."
        );
      } else {
        setValetFormError("Vehicle No. or Aadhaar already exists.");
      }
    }
  };

  const handleParkedCarChange = (e) => {
    const { name, value } = e.target;
    let updatedData = {
      ...parkedCarData,
      [name]: value,
    };

    if (name === "basementNumber") {
      switch (value) {
        case "BASEMENT 1":
          updatedData.timeTaken = "10";
          break;
        case "BASEMENT 2":
          updatedData.timeTaken = "15";
          break;
        case "BASEMENT 3":
          updatedData.timeTaken = "20";
          break;
        case "BASEMENT 4":
          updatedData.timeTaken = "25";
          break;
        default:
          updatedData.timeTaken = "";
      }
    }

    setParkedCarData(updatedData);
  };

  const handleParkedCarSubmit = async (e) => {
    e.preventDefault();
    const {
      serialNumber,
      vehicleNumber,
      basementNumber,
      lotNumber,
      timeTaken,
      valet,
    } = parkedCarData;
    if (
      !serialNumber ||
      !vehicleNumber ||
      !basementNumber ||
      !lotNumber ||
      !timeTaken ||
      !valet
    ) {
      showPopup("Please fill all fields.", "error");
      return;
    }
    try {
      await axios.post(`${BE_URL}/api/parked-cars`, {
        ...parkedCarData,
        timeTaken: parseInt(parkedCarData.timeTaken, 10),
      });
      setParkedCarData({
        serialNumber: "",
        vehicleNumber: "",
        basementNumber: "",
        lotNumber: "",
        timeTaken: "",
        valet: "",
      });
      showPopup("Parked car recorded successfully!", "success");
    } catch (err) {
      showPopup("Error saving parked car data.", "error");
    }
  };

  const getValetImgUrl = (filename) =>
    filename
      ? `${BE_URL}/uploads/${filename}`
      : "https://via.placeholder.com/150x80?text=No+Image";

  return (
    <div className="min-h-screen bg-gray-100">
      {popup.show && (
        <div
          style={{
            position: "fixed",
            top: "30px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 9999,
            minWidth: "260px",
            maxWidth: "90vw",
            background: popup.type === "success" ? "#A7F3D0" : "#FECACA",
            color: "#111827",
            padding: "16px 32px",
            borderRadius: "12px",
            textAlign: "center",
            boxShadow: "0 5px 18px 0 rgba(60,60,60,0.12)",
            fontWeight: "bold",
            fontSize: "1.1rem",
          }}
        >
          {popup.message}
        </div>
      )}
      <div className="bg-white shadow px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-purple-600">
          Supervisor Dashboard
        </h1>
        <img src="/logo.png" alt="Company Logo" className="h-10" />
      </div>

      <div className="flex justify-center px-4 py-6">
        <div className="w-full max-w-6xl bg-white p-4 md:p-6 rounded-lg shadow-lg">
          <input
            type="text"
            placeholder="Search by name, car number, or serial number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded mb-4 text-sm"
          />

          <div className="flex flex-wrap gap-2 mb-6 justify-center">
            {["requests", "bookings", "valets", "parked"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded text-sm transition ${
                  activeTab === tab
                    ? "bg-purple-600 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Requests */}
          {activeTab === "requests" && (
            <div>
              <h3 className="text-lg font-semibold mb-4 text-purple-600">
                Live Car Retrieval Requests
              </h3>
              {filteredRequests.filter((req) => req.status === "pending")
                .length === 0 ? (
                <p className="text-gray-500 text-sm">No pending requests.</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {filteredRequests
                    .filter((req) => req.status === "pending")
                    .map((req) => (
                      <div
                        key={req.id}
                        className="bg-white rounded-lg shadow-md border border-gray-200 p-4 flex flex-col justify-between"
                      >
                        <div>
                          <h4 className="text-lg font-bold text-black mb-1">
                            🚗 {req.car_number}
                          </h4>
                          <hr className="mb-2" />
                          <p>
                            <strong>Name:</strong> {req.name}
                          </p>
                          <p>
                            <strong>Phone:</strong> {req.phone_number}
                          </p>
                          <p>
                            <strong>Serial No:</strong> {req.serial_number}
                          </p>
                          <p>
                            <strong>Time:</strong>{" "}
                            {formatDateTime(req.request_time)}
                          </p>
                          <p>
                            <strong>Status:</strong>{" "}
                            <span className="text-yellow-600">
                              {req.status}
                            </span>
                          </p>
                          <div className="mt-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Assign Valet
                            </label>
                            <select
                              name="valet"
                              value={parkedCarData.valet}
                              onChange={handleParkedCarChange}
                              required
                              className="w-full p-2 border rounded uppercase"
                            >
                              <option value="">Select Valet</option>
                              {valetList.map((name) => (
                                <option key={name} value={name}>
                                  {name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <button
                          onClick={() => updateStatus(req.id, "completed")}
                          className="mt-4 bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 transition"
                        >
                          Mark Completed
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* Bookings */}
          {activeTab === "bookings" && (
            <div>
              <div className="bg-gray-50 p-4 rounded border border-gray-300 mb-4">
                <h3 className="text-md font-semibold text-purple-600 mb-2">
                  Download Completed Bookings
                </h3>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="text-sm">Start:</label>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) =>
                      setDateRange({ ...dateRange, start: e.target.value })
                    }
                    className="p-2 border rounded"
                  />
                  <label className="text-sm">End:</label>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) =>
                      setDateRange({ ...dateRange, end: e.target.value })
                    }
                    className="p-2 border rounded"
                  />
                  <button
                    onClick={handleDownload}
                    className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition"
                  >
                    Download Excel
                  </button>
                </div>
              </div>

              <h3 className="text-lg font-semibold mb-4 text-purple-600">
                Completed Bookings
              </h3>
              {filteredRequests.filter((req) => req.status === "completed")
                .length === 0 ? (
                <p className="text-gray-500 text-sm">
                  No completed bookings yet.
                </p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {filteredRequests
                    .filter((req) => req.status === "completed")
                    .map((req) => (
                      <div
                        key={req.id}
                        className="bg-white rounded-lg shadow-md border border-gray-200 p-4"
                      >
                        <h4 className="text-lg font-bold text-black mb-1">
                          🚗 {req.car_number}
                        </h4>
                        <hr className="mb-2" />
                        <p>
                          <strong>Name:</strong> {req.name}
                        </p>
                        <p>
                          <strong>Phone:</strong> {req.phone_number}
                        </p>
                        <p>
                          <strong>Serial No:</strong> {req.serial_number}
                        </p>
                        <p>
                          <strong>Basement No:</strong> {req.basement_number}
                        </p>
                        <p>
                          <strong>Lot No:</strong> {req.lot_number}
                        </p>
                        <p>
                          <strong>Valet:</strong> {req.valet}
                        </p>
                        <p>
                          <strong>Time Taken:</strong> {req.time_taken}
                        </p>
                        <p>
                          <strong>Time:</strong>{" "}
                          {formatDateTime(req.request_time)}
                        </p>
                        <p>
                          <strong>Status:</strong>{" "}
                          <span className="text-green-600">{req.status}</span>
                        </p>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* Valets */}
          {activeTab === "valets" && (
            <div>
              <div
                className="bg-purple-100 p-4 rounded border border-purple-300 mb-4 cursor-pointer hover:bg-purple-200 transition"
                onClick={() => setShowValetForm(!showValetForm)}
              >
                <h3 className="text-lg font-bold text-purple-700">
                  + Register New Valet
                </h3>
              </div>

              {showValetForm && (
                <form
                  onSubmit={handleValetSubmit}
                  className="bg-white p-6 rounded shadow border space-y-4"
                >
                  <input
                    name="name"
                    value={valetData.name}
                    onChange={handleValetChange}
                    placeholder="Name"
                    required
                    className="w-full p-2 border rounded uppercase"
                  />
                  <input
                    name="dob"
                    type="date"
                    value={valetData.dob}
                    onChange={handleValetChange}
                    required
                    className="w-full p-2 border rounded"
                  />
                  <input
                    name="aadhaar"
                    value={valetData.aadhaar}
                    onChange={handleValetChange}
                    placeholder="Aadhaar Number"
                    required
                    className="w-full p-2 border rounded"
                  />
                  <input
                    name="dlNumber"
                    value={valetData.dlNumber}
                    onChange={handleValetChange}
                    placeholder="DL Number (e.g., GJ-01 2023 1234567)"
                    required
                    className="w-full p-2 border rounded uppercase"
                  />
                  <input
                    name="phone"
                    value={valetData.phone}
                    onChange={handleValetChange}
                    placeholder="Phone Number"
                    required
                    className="w-full p-2 border rounded"
                  />
                  <label className="block font-semibold">Upload DL Front</label>
                  <input
                    name="dlFront"
                    type="file"
                    accept="image/*"
                    onChange={handleValetChange}
                    required
                  />
                  <label className="block font-semibold">Upload DL Back</label>
                  <input
                    name="dlBack"
                    type="file"
                    accept="image/*"
                    onChange={handleValetChange}
                    required
                  />
                  <div className="mb-4">
                    <label className="flex items-center space-x-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        name="isTemporary"
                        checked={valetData.isTemporary}
                        onChange={handleValetChange}
                        className="form-checkbox text-purple-600"
                      />
                      <span>Temporary Valet (valid for 12 hours)</span>
                    </label>
                  </div>

                  {valetFormError && (
                    <div className="text-center text-red-500 font-semibold mb-2">
                      {valetFormError}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-purple-600 text-white p-2 rounded hover:bg-purple-700 transition"
                  >
                    Submit Valet
                  </button>
                </form>
              )}
            </div>
          )}

          {activeTab === "valets" && (
            <>
              {/* Registered Valets */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                {valets?.map((valet) => (
                  <div
                    key={valet.id}
                    className="bg-white shadow border p-4 rounded hover:shadow-lg cursor-pointer transition"
                    onClick={() => setSelectedValet(valet)}
                  >
                    <h4 className="text-lg font-semibold text-purple-700">
                      {valet.name}
                    </h4>
                    <p className="text-sm text-gray-600">
                      Phone: {valet.phone}
                    </p>
                  </div>
                ))}
              </div>

              {selectedValet && (
                <div className="mt-6 bg-gray-100 p-4 rounded border">
                  <h3 className="text-xl font-bold text-purple-800 mb-2">
                    Valet Details
                  </h3>
                  <p>
                    <strong>Name:</strong> {selectedValet.name}
                  </p>
                  <p>
                    <strong>DOB:</strong> {selectedValet.dob}
                  </p>
                  <p>
                    <strong>Aadhaar:</strong> {selectedValet.aadhaar}
                  </p>
                  <p>
                    <strong>DL Number:</strong> {selectedValet.dl_number}
                  </p>
                  <p>
                    <strong>Phone:</strong> {selectedValet.phone}
                  </p>
                  <div className="flex gap-4 mt-2">
                    <div>
                      <p className="font-semibold">DL Front:</p>
                      <img
                        src={getValetImgUrl(selectedValet.dl_front)}
                        alt="DL Front"
                        className="w-40 border rounded"
                      />
                    </div>
                    <div>
                      <p className="font-semibold">DL Back:</p>
                      <img
                        src={getValetImgUrl(selectedValet.dl_back)}
                        alt="DL Back"
                        className="w-40 border rounded"
                      />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Parked Cars */}
          {activeTab === "parked" && (
            <form
              onSubmit={handleParkedCarSubmit}
              className="bg-white p-6 rounded shadow border space-y-4"
            >
              <h3 className="text-lg font-semibold text-purple-600">
                Record Parked Car
              </h3>
              <input
                name="serialNumber"
                value={parkedCarData.serialNumber}
                onChange={handleParkedCarChange}
                placeholder="Serial Number"
                required
                className="w-full p-2 border rounded uppercase"
              />
              <input
                name="vehicleNumber"
                value={parkedCarData.vehicleNumber}
                onChange={handleParkedCarChange}
                placeholder="Vehicle Number"
                required
                className="w-full p-2 border rounded uppercase"
              />
              <select
                name="basementNumber"
                value={parkedCarData.basementNumber}
                onChange={handleParkedCarChange}
                required
                className="w-full p-2 border rounded uppercase"
              >
                <option value="">Select Basement</option>
                <option value="BASEMENT 1">Basement 1</option>
                <option value="BASEMENT 2">Basement 2</option>
                <option value="BASEMENT 3">Basement 3</option>
                <option value="BASEMENT 4">Basement 4</option>
              </select>
              <input
                name="lotNumber"
                value={parkedCarData.lotNumber}
                onChange={handleParkedCarChange}
                placeholder="Lot Number"
                required
                className="w-full p-2 border rounded uppercase"
              />
              <input
                name="timeTaken"
                value={parkedCarData.timeTaken}
                placeholder="Time Taken (in minutes)"
                className="w-full p-2 border rounded uppercase bg-gray-100 cursor-not-allowed"
                readOnly
                required
              />
              <select
                name="valet"
                value={parkedCarData.valet}
                onChange={handleParkedCarChange}
                required
                className="w-full p-2 border rounded uppercase"
              >
                <option value="">Select Valet</option>
                {valetList.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="w-full bg-purple-600 text-white p-2 rounded hover:bg-purple-700 transition"
              >
                Submit
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupervisorDashboard;
