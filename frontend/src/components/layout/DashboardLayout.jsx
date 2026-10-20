import React from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import "./DashboardLayout.css";

export default function DashboardLayout({
  sidebarProps,
  headerProps,
  children,
}) {
  return (
    <div className="dashboard-root">
      <Sidebar {...sidebarProps} />
      <div className="dashboard-main-area">
        <Header {...headerProps} />
        <main className="dashboard-content-split">
          {children}
        </main>
      </div>
    </div>
  );
}
