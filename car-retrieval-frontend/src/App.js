// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import CarRetrievalForm from "./components/CarRetrievalForm";
import SupervisorDashboard from "./components/SupervisorDashboard";
import ConfirmationPage from './components/ConfirmationPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<CarRetrievalForm />} />
        <Route path="/supervisor" element={<SupervisorDashboard />} />
        <Route path="/confirmation" element={<ConfirmationPage />} />
      </Routes>
    </Router>
  );
}

export default App;
