import { Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import useAuth from "@/hooks/useAuth";

import ParkingPage from "@/pages/public/ParkingPage";

import LoginPage from "@/pages/auth/LoginPage";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";

import AdminLayout from "@/layouts/AdminLayout";
import AdminDashboardPage from "@/pages/admin/DashboardPage";
import StaffListPage from "@/pages/admin/staff/StaffList";
import ReportsPage from "@/pages/admin/report/ReportPage";

import StaffLayout from "@/layouts/StaffLayout";
import StaffDashboardPage from "@/pages/petugas/DashboardPage";
import MemberListPage from "@/pages/petugas/member/MemberList";
import TransactionPage from "@/pages/petugas/transactions/TransactionPage";
import StaffReportPage from "@/pages/petugas/reports/ReportPage";

export default function AppRoutes() {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const handler = () => forceUpdate((n) => n + 1);
    window.addEventListener("auth-change", handler);
    return () => window.removeEventListener("auth-change", handler);
  }, []);

  const authenticated = useAuth.isAuthenticated();
  const role = useAuth.getRole();

  if (!authenticated) {
    return (
      <Routes>
        <Route path="/parking" element={<ParkingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  if (role === "super_admin") {
    return (
      <Routes>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="staff" element={<StaffListPage />} />
          <Route path="reports" element={<ReportsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
      </Routes>
    );
  }

  if (role === "petugas") {
    return (
      <Routes>
        <Route path="/staff" element={<StaffLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<StaffDashboardPage />} />
          <Route path="members" element={<MemberListPage />} />
          <Route path="transactions" element={<TransactionPage />} />
          <Route path="reports" element={<StaffReportPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/staff/dashboard" replace />} />
      </Routes>
    );
  }

  useAuth.clearSession();
  return <Navigate to="/login" replace />;
}
