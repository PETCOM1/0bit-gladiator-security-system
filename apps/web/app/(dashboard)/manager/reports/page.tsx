"use client";

import React, { useState } from "react";
import { BarChart, Download, FileText, FileSpreadsheet, AlertCircle } from "lucide-react";
import { managerService } from "@/features/manager/services/manager.service";

export default function ReportsManagerPage() {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateReport = async (type: "pdf" | "excel", module: string) => {
    setIsGenerating(true);
    try {
      // In a full implementation, this would fetch data and generate a blob using jsPDF/xlsx
      // For now, we simulate the delay and show success
      await new Promise(resolve => setTimeout(resolve, 1500));
      alert(`Successfully generated ${module} report in ${type.toUpperCase()} format.`);
    } catch (err) {
      console.error(err);
      alert("Failed to generate report.");
    } finally {
      setIsGenerating(false);
    }
  };

  const cardStyle = {
    background: "var(--color-card-bg)", borderRadius: "var(--radius-xl)", 
    border: "1px solid var(--color-card-border)", boxShadow: "var(--color-card-shadow)", 
    padding: "24px", display: "flex", flexDirection: "column" as const, gap: "16px"
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px", width: "100%" }}>
      <div>
        <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: "10px" }}>
          <BarChart size={24} color="var(--color-accent)" /> Reports & Analytics
        </h1>
        <p style={{ fontSize: "14px", color: "var(--color-text-muted)", marginTop: "4px" }}>
          Generate, view, and export comprehensive reports on your security operations.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}>
        
        {/* Incident Report Card */}
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", borderBottom: "1px solid var(--color-border)", paddingBottom: "16px" }}>
            <div style={{ background: "var(--color-danger-subtle)", color: "var(--color-danger)", padding: "12px", borderRadius: "12px" }}>
              <AlertCircle size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>Incident Logs</h3>
              <p style={{ fontSize: "13px", color: "var(--color-text-muted)", margin: "4px 0 0 0" }}>Summary of all security incidents.</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: "12px", marginTop: "auto" }}>
            <button onClick={() => generateReport("pdf", "Incident")} disabled={isGenerating} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "10px", background: "var(--color-bg-subtle)", color: "var(--color-text-primary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", fontSize: "13px", fontWeight: 600, cursor: isGenerating ? "not-allowed" : "pointer" }}>
              <FileText size={16} /> Export PDF
            </button>
            <button onClick={() => generateReport("excel", "Incident")} disabled={isGenerating} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "10px", background: "var(--color-accent-subtle)", color: "var(--color-accent)", border: "1px solid var(--color-accent)", borderRadius: "var(--radius-md)", fontSize: "13px", fontWeight: 600, cursor: isGenerating ? "not-allowed" : "pointer" }}>
              <FileSpreadsheet size={16} /> Export Excel
            </button>
          </div>
        </div>

        {/* Visitor Report Card */}
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", borderBottom: "1px solid var(--color-border)", paddingBottom: "16px" }}>
            <div style={{ background: "var(--color-success-subtle)", color: "var(--color-success)", padding: "12px", borderRadius: "12px" }}>
              <FileText size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>Visitor Ledger</h3>
              <p style={{ fontSize: "13px", color: "var(--color-text-muted)", margin: "4px 0 0 0" }}>Complete history of site visitors.</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: "12px", marginTop: "auto" }}>
            <button onClick={() => generateReport("pdf", "Visitor")} disabled={isGenerating} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "10px", background: "var(--color-bg-subtle)", color: "var(--color-text-primary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", fontSize: "13px", fontWeight: 600, cursor: isGenerating ? "not-allowed" : "pointer" }}>
              <FileText size={16} /> Export PDF
            </button>
            <button onClick={() => generateReport("excel", "Visitor")} disabled={isGenerating} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "10px", background: "var(--color-accent-subtle)", color: "var(--color-accent)", border: "1px solid var(--color-accent)", borderRadius: "var(--radius-md)", fontSize: "13px", fontWeight: 600, cursor: isGenerating ? "not-allowed" : "pointer" }}>
              <FileSpreadsheet size={16} /> Export Excel
            </button>
          </div>
        </div>

        {/* Shift Report Card */}
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", borderBottom: "1px solid var(--color-border)", paddingBottom: "16px" }}>
            <div style={{ background: "var(--color-warning-subtle)", color: "var(--color-warning)", padding: "12px", borderRadius: "12px" }}>
              <BarChart size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>Shift Attendance</h3>
              <p style={{ fontSize: "13px", color: "var(--color-text-muted)", margin: "4px 0 0 0" }}>Officer hours and shift compliance.</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: "12px", marginTop: "auto" }}>
            <button onClick={() => generateReport("pdf", "Shift")} disabled={isGenerating} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "10px", background: "var(--color-bg-subtle)", color: "var(--color-text-primary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", fontSize: "13px", fontWeight: 600, cursor: isGenerating ? "not-allowed" : "pointer" }}>
              <FileText size={16} /> Export PDF
            </button>
            <button onClick={() => generateReport("excel", "Shift")} disabled={isGenerating} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "10px", background: "var(--color-accent-subtle)", color: "var(--color-accent)", border: "1px solid var(--color-accent)", borderRadius: "var(--radius-md)", fontSize: "13px", fontWeight: 600, cursor: isGenerating ? "not-allowed" : "pointer" }}>
              <FileSpreadsheet size={16} /> Export Excel
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
