import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import StudentLayout from "./components/StudentLayout";
import Home from "./pages/Home";
import Learning from "./pages/Learning";
import Statistics from "./pages/Statistics";
import ActivityPage from "./pages/ActivityPage";
import TeacherDashboard from "./pages/TeacherDashboard";
import CoursePage from "./pages/CoursePage";
import HomeRedirect from "./components/HomeRedirect";
import { ThemeProvider } from "./context/ThemeContext";

function App() {
  return (
    <ThemeProvider>
      <div className="app-shell">
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/teacher" element={<TeacherDashboard />} />
            <Route path="/course/:id" element={<CoursePage />} />
            <Route path="/dashboard" element={<StudentLayout />}>
              <Route index element={<Home />} />
              <Route path="learning" element={<Learning />} />
              <Route path="statistics" element={<Statistics />} />
              <Route path="activity" element={<ActivityPage />} />
            </Route>
            <Route path="/" element={<HomeRedirect />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </div>
    </ThemeProvider>
  );
}

export default App;
