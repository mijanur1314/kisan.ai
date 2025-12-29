import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Chatbot from "./pages/Chatbot";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminUpload from "./pages/AdminUpload";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Chatbot />
            </ProtectedRoute>
          }
        />
        <Route path="/admin/upload" element={<AdminUpload />} />
      </Routes>
    </BrowserRouter>
  );
}
