import React from "react";
import { Navigate } from "react-router-dom";
import { getStoredUser } from "../auth/storage";

/** Корень сайта: куда вести в зависимости от роли */
function HomeRedirect() {
  const user = getStoredUser();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (user.role === "teacher") {
    return <Navigate to="/teacher" replace />;
  }
  return <Navigate to="/dashboard" replace />;
}

export default HomeRedirect;
