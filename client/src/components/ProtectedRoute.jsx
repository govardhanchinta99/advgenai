import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, role }) => {
  try {
    const userJson = localStorage.getItem("user");
    if (!userJson) {
      return <Navigate to="/login" />;
    }
    
    const user = JSON.parse(userJson);

    if (role && user.role !== role) {
      return <Navigate to="/home" />;
    }

    return children;
  } catch (error) {
    console.error("Error parsing user from localStorage:", error);
    localStorage.removeItem("user");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    return <Navigate to="/login" />;
  }
};

export default ProtectedRoute;