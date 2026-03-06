import React from "react";
import { useLocation, Navigate } from "react-router-dom";

function Dashboard() {
  const location = useLocation();
  const user = location.state?.user;

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="card dashboard-greeting">
      <h1>Welcome {user}</h1>
      <p>You are now signed in to the demo dashboard.</p>
    </div>
  );
}

export default Dashboard;

