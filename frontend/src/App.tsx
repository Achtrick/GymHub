import { Navigate, Route, Routes } from "react-router-dom";
import UserLayout from "./core/Components/Layout/UserLayout/UserLayout";
import AdminLayout from "./core/Components/Layout/AdminLayout/AdminLayout";
import ProtectedRoute from "./core/auth/ProtectedRoute";
import Login from "./core/pages/Login/Login";
import Register from "./core/pages/Register/Register";
import ForgotPassword from "./core/pages/ForgotPassword/ForgotPassword";
import ResetPassword from "./core/pages/ResetPassword/ResetPassword";
import Activate from "./core/pages/Activate/Activate";
import Terms from "./core/pages/Terms/Terms";
import Home from "./core/pages/Home/Home";
import Settings from "./core/pages/Settings/Settings";
import Profile from "./core/pages/Profile/Profile";
import PrDetail from "./core/pages/PrDetail/PrDetail";
import Dashboard from "./core/pages/Admin/Dashboard/Dashboard";
import Submissions from "./core/pages/Admin/Submissions/Submissions";
import WeighIns from "./core/pages/Admin/WeighIns/WeighIns";
import CardPricing from "./core/pages/Admin/CardPricing/CardPricing";
import Orders from "./core/pages/Admin/Orders/Orders";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/activate" element={<Activate />} />
      <Route path="/terms" element={<Terms />} />

      <Route element={<ProtectedRoute allowedRoles={["user", "admin"]} />}>
        <Route element={<UserLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/profile/:userId" element={<Profile />} />
          <Route path="/prs/:prId" element={<PrDetail />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<Dashboard />} />
          <Route path="/admin/submissions" element={<Submissions />} />
          <Route path="/admin/weigh-ins" element={<WeighIns />} />
          <Route path="/admin/card-pricing" element={<CardPricing />} />
          <Route path="/admin/orders" element={<Orders />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
