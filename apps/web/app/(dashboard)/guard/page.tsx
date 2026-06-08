"use client";

import { useState, useEffect } from "react";
import { PlusCircle, ShieldAlert, LogIn, LogOut, Clock, Search, X } from "lucide-react";
import { guardService } from "@/features/guard/services/guard.service";

export default function GuardDashboard() {
  const [shiftActive, setShiftActive] = useState<{ id: string } | null>(null);
  
  // Data State
  const [visitors, setVisitors] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isVisitorModalOpen, setVisitorModalOpen] = useState(false);
  const [isIncidentModalOpen, setIncidentModalOpen] = useState(false);

  // Form State
  const [visitorForm, setVisitorForm] = useState({ name: "", idNumber: "", vehicleReg: "", purpose: "" });
  const [incidentForm, setIncidentForm] = useState({ title: "", description: "", severity: "LOW" });

  const loadData = async () => {
    try {
      const [visRes, incRes] = await Promise.all([
        guardService.getVisitors(),
        guardService.getIncidents(),
      ]);
      setVisitors(visRes.data?.data?.visitors || []);
      setIncidents(incRes.data?.data?.incidents || []);
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStartShift = async () => {
    try {
      const res = await guardService.startShift();
      setShiftActive({ id: res.data.data.shift.id });
    } catch (err) {
      console.error("Start shift failed", err);
    }
  };

  const handleEndShift = async () => {
    if (!shiftActive) return;
    try {
      await guardService.endShift(shiftActive.id);
      setShiftActive(null);
    } catch (err) {
      console.error("End shift failed", err);
    }
  };

  const submitVisitor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await guardService.logVisitor(visitorForm);
      setVisitorModalOpen(false);
      setVisitorForm({ name: "", idNumber: "", vehicleReg: "", purpose: "" });
      loadData();
    } catch (err) {
      console.error("Failed to log visitor", err);
    }
  };

  const submitIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await guardService.reportIncident(incidentForm);
      setIncidentModalOpen(false);
      setIncidentForm({ title: "", description: "", severity: "LOW" });
      loadData();
    } catch (err) {
      console.error("Failed to report incident", err);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-8 w-full">
      {/* Header */}
      <header className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Guard Duty Operations</h1>
          <p className="text-slate-500 mt-1 flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${shiftActive ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
            {shiftActive ? "Active: Main Gate" : "Currently Off Duty"}
          </p>
        </div>
        <div>
          {shiftActive ? (
            <button 
              onClick={handleEndShift}
              className="flex items-center gap-2 bg-red-50 text-red-600 px-6 py-3 rounded-lg font-semibold hover:bg-red-100 transition border border-red-100"
            >
              <LogOut size={20} /> End Shift
            </button>
          ) : (
            <button 
              onClick={handleStartShift}
              className="flex items-center gap-2 bg-green-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-600 transition"
            >
              <LogIn size={20} /> Start Shift
            </button>
          )}
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Actions (Left Column) */}
        <div className="xl:col-span-2 flex flex-col gap-6">
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button 
              disabled={!shiftActive}
              onClick={() => setVisitorModalOpen(true)}
              className={`flex items-start gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-200 transition group text-left ${shiftActive ? "hover:border-[#F57C00] hover:shadow-md cursor-pointer" : "opacity-60 cursor-not-allowed"}`}
            >
              <div className={`p-4 rounded-xl transition ${shiftActive ? "bg-orange-50 text-[#F57C00] group-hover:bg-[#F57C00] group-hover:text-white" : "bg-slate-100 text-slate-400"}`}>
                <PlusCircle size={28} />
              </div>
              <div>
                <h3 className={`font-bold text-lg ${shiftActive ? "text-slate-800" : "text-slate-500"}`}>Log Visitor</h3>
                <p className="text-sm text-slate-500 mt-1">Register a new visitor check-in or check-out.</p>
              </div>
            </button>
            
            <button 
              disabled={!shiftActive}
              onClick={() => setIncidentModalOpen(true)}
              className={`flex items-start gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-200 transition group text-left ${shiftActive ? "hover:border-red-500 hover:shadow-md cursor-pointer" : "opacity-60 cursor-not-allowed"}`}
            >
              <div className={`p-4 rounded-xl transition ${shiftActive ? "bg-red-50 text-red-500 group-hover:bg-red-500 group-hover:text-white" : "bg-slate-100 text-slate-400"}`}>
                <ShieldAlert size={28} />
              </div>
              <div>
                <h3 className={`font-bold text-lg ${shiftActive ? "text-slate-800" : "text-slate-500"}`}>Report Incident</h3>
                <p className="text-sm text-slate-500 mt-1">Log a security incident in the occurrence book.</p>
              </div>
            </button>
          </section>

          {/* Active Visitors Table */}
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">Active Visitors On-Site</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Vehicle Reg</th>
                    <th className="px-6 py-4">Time In</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {visitors.length === 0 ? (
                    <tr><td colSpan={3} className="px-6 py-8 text-center text-slate-500">No active visitors.</td></tr>
                  ) : (
                    visitors.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-50 transition">
                        <td className="px-6 py-4 font-medium">{v.name}</td>
                        <td className="px-6 py-4">{v.vehicleReg || "-"}</td>
                        <td className="px-6 py-4">{new Date(v.checkInTime).toLocaleTimeString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Recent Activity (Right Column) */}
        <div className="flex flex-col gap-6">
          <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-full">
            <div className="flex items-center gap-2 mb-6 text-slate-800">
              <Clock size={20} className="text-[#F57C00]" />
              <h2 className="text-lg font-bold">Recent Incidents</h2>
            </div>
            <div className="space-y-6">
              {incidents.length === 0 ? (
                <p className="text-sm text-slate-500">No recent incidents reported.</p>
              ) : (
                incidents.slice(0, 5).map((inc) => (
                  <div key={inc.id} className="relative flex items-start gap-4">
                    <div className={`bg-white border-2 w-4 h-4 rounded-full mt-1 shrink-0 ${inc.severity === "CRITICAL" ? "border-red-600" : "border-orange-500"}`}></div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">{inc.title}</h4>
                      <p className="text-sm text-slate-500 mt-1 line-clamp-2">{inc.description}</p>
                      <span className="text-xs font-semibold text-slate-400 mt-1 block">
                        {new Date(inc.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Visitor Modal */}
      {isVisitorModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">Log Visitor</h2>
              <button onClick={() => setVisitorModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={submitVisitor} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
                <input required value={visitorForm.name} onChange={(e) => setVisitorForm({...visitorForm, name: e.target.value})} className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:outline-[#F57C00]" placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">ID Number</label>
                <input value={visitorForm.idNumber} onChange={(e) => setVisitorForm({...visitorForm, idNumber: e.target.value})} className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:outline-[#F57C00]" placeholder="Optional" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Vehicle Registration</label>
                <input value={visitorForm.vehicleReg} onChange={(e) => setVisitorForm({...visitorForm, vehicleReg: e.target.value})} className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:outline-[#F57C00]" placeholder="ABC 123 GP" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Purpose of Visit</label>
                <input value={visitorForm.purpose} onChange={(e) => setVisitorForm({...visitorForm, purpose: e.target.value})} className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:outline-[#F57C00]" placeholder="Meeting with Management" />
              </div>
              <button type="submit" className="w-full bg-[#F57C00] text-white font-bold py-3 rounded-lg hover:bg-[#E65100] transition mt-4">Log Visitor IN</button>
            </form>
          </div>
        </div>
      )}

      {/* Incident Modal */}
      {isIncidentModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">Report Incident</h2>
              <button onClick={() => setIncidentModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={submitIncident} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Title</label>
                <input required value={incidentForm.title} onChange={(e) => setIncidentForm({...incidentForm, title: e.target.value})} className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:outline-[#F57C00]" placeholder="Suspicious vehicle at gate" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Severity</label>
                <select value={incidentForm.severity} onChange={(e) => setIncidentForm({...incidentForm, severity: e.target.value})} className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:outline-[#F57C00]">
                  <option value="LOW">Low - Routine</option>
                  <option value="MEDIUM">Medium - Monitor</option>
                  <option value="HIGH">High - Immediate Action</option>
                  <option value="CRITICAL">Critical - Emergency</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
                <textarea required value={incidentForm.description} onChange={(e) => setIncidentForm({...incidentForm, description: e.target.value})} className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:outline-[#F57C00] h-24" placeholder="Detailed description of the incident..." />
              </div>
              <button type="submit" className="w-full bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700 transition mt-4">Submit Report</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
