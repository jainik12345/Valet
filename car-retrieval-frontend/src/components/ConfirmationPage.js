import React, { useEffect, useState } from "react";

const ConfirmationPage = () => {
  const [timeTaken, setTimeTaken] = useState(null);

  useEffect(() => {
    // Simulate fetching from backend
    setTimeout(() => {
      setTimeTaken("10"); // backend returns string "10"
    }, 1000);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-purple-600">
          Vehicle Information
        </h1>
        <img src="/logo.png" alt="Company Logo" className="h-10" />
      </div>

      <div className="flex justify-center px-4 mt-8">
        <div className="w-full max-w-md bg-white p-6 rounded-lg shadow text-center">
          <h2 className="text-2xl font-semibold mb-4 text-purple-600">
            Thank You!
          </h2>

          {timeTaken ? (
            <p className="text-gray-700">
              Your car will arrive in{" "}
              <span className="font-semibold">{timeTaken}</span> min.
            </p>
          ) : (
            <p className="text-gray-700">Loading estimated time...</p>
          )}

          <p className="mt-4 text-gray-700">
            Feel free to call our supervisor for any query contact no: <br />
            <span className="font-semibold">7753825066</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationPage;
