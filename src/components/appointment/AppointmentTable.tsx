import { useEffect, useState } from "react";
import Input from "../form/input/InputField";
import { Modal } from "../ui/modal";
import { useModal } from "../../hooks/useModal";
import Button from "../ui/button/Button";
import { url } from "../../baseUrl";
import { DatePicker } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import { ConvertTime } from "../../utils/timeUtils";
import { dateFormat } from "../../utils/dateUtils";
import { requiredPermissions } from "../../utils/permissions";
import { Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";
import { toast } from "react-toastify";
import {
  FaCalendarAlt,
  FaPhoneAlt,
  FaClock,
  FaEye,
  FaTrash,
} from "react-icons/fa";

import {
  MdFirstPage,
  MdLastPage,
  MdChevronLeft,
  MdChevronRight,
} from "react-icons/md";

import { HiUser, HiOfficeBuilding } from "react-icons/hi";

// --------------------
// Types
// --------------------
type Appointment = {
  _id: string;
  clinicId: string;
  patientName: string;
  patientMobile: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
};

type Clinic = {
  _id: string;
  name: string;
};

export default function AppointmentCard() {
  const { isOpen, openModal, closeModal } = useModal();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [mode, setMode] = useState<"add" | "view" | "edit">("add");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  // const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    clinicId: "",
    patientName: "",
    patientMobile: "",
    appointmentDate: new Date(),
    startTime: "",
    endTime: "",
  });
  const appointMentDate = new Date();

  const token = localStorage.getItem("token");

  // --------------------
  // FETCH CLINICS
  // --------------------
  useEffect(() => {
    const fetchClinics = async () => {
      const res = await fetch(`${url}/admin/clinics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.errorMessage || 'Failed to fetch clinic');
        return;
      }
      setClinics(data.data || []);
    };
    fetchClinics();
  }, []);

  // --------------------
  // FETCH APPOINTMENTS
  // --------------------
  const fetchAppointments = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${url}/appointments`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.errorMessage || "Failed to fetch appointment");
        return;
      }

      setAppointments(data.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchAppointments();
  }, []);

  // --------------------
  // INPUT CHANGE
  // --------------------
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleChangeDate = (date: Date | null) => {
    if (!date) return; // guard against null

    setFormData({
      ...formData,
      appointmentDate: date,
    });
    setSelectedDate(date);
  };

  // --------------------
  // SAVE (ADD / EDIT)
  // --------------------
  const handleSave = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const response = await fetch(`${url}/appointments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(formData),
    });


    const res = await response.json();

    if (!response.ok) {
      toast.error(res.errorMessage || 'Failed to save appointment');
      return;
    }

    toast.success("Appointment added successfully");
    fetchAppointments();
    setFormData({
      clinicId: "",
      patientName: "",
      patientMobile: "",
      appointmentDate: new Date(),
      startTime: "",
      endTime: "",
    });
    closeModal();

    closeModal();
  };

  // --------------------
  // VIEW (DETAILS)
  // --------------------
  const handleView = (item: Appointment) => {
    // setFormData(item);
    setFormData({
      clinicId:
        typeof item.clinicId === "object" ? item.clinicId?._id : item.clinicId,
      patientName: item.patientName,
      patientMobile: item.patientMobile,
      appointmentDate: new Date(item.appointmentDate),
      startTime: item.startTime,
      endTime: item.endTime,
    });

    setMode("view");
    openModal();
  };

  const clinicName =
    clinics.find((c) => c._id === formData.clinicId)?.name || "N/A";

  // --------------------
  // DELETE (CONFIRMATION ONLY)
  // --------------------

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState<Appointment | null>(null);

  const handleDelete = (item: Appointment) => {
    setDeleteItem(item);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteItem) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    const response = await fetch(
      `${url}/appointments/${deleteItem._id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const res = await response.json();
    if (!response.ok) {
      toast.error(res.errorMessage || 'Failed to delete clinic');
      return;
    }

    fetchAppointments();
    setConfirmOpen(false);
    setDeleteItem(null);
  };


  return (
    <div>
      {/* HEADER */}
      <div className="flex admin-appointment justify-between mb-6">
        <h2 className="text-2xl font-semibold dark:text-white">Appointments</h2>
        {requiredPermissions("user:create") && (
          <Button
            size="sm"
            className="dark:bg-gray-700"
            onClick={() => {
              setMode("add");
              setFormData({
                clinicId: "",
                patientName: "",
                patientMobile: "",
                appointmentDate: new Date() || "",
                startTime: "",
                endTime: "",
              });
              openModal();
            }}
          >
            + New Appointment
          </Button>
        )}
      </div>

      {/* TABLE */}
      <div className="rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: "#465FFF" }}>
                <th className="text-left px-5 py-4 text-xs font-semibold uppercase tracking-widest text-white/80 w-[22%]">
                  Patient Name
                </th>
                <th className="text-left px-5 py-4 text-xs font-semibold uppercase tracking-widest text-white/80 w-[16%]">
                  Phone
                </th>
                <th className="text-left px-5 py-4 text-xs font-semibold uppercase tracking-widest text-white/80 w-[16%]">
                  Date
                </th>
                <th className="text-left px-5 py-4 text-xs font-semibold uppercase tracking-widest text-white/80 w-[14%]">
                  Start Time
                </th>
                <th className="text-left px-5 py-4 text-xs font-semibold uppercase tracking-widest text-white/80 w-[14%]">
                  End Time
                </th>
                <th className="text-center px-5 py-4 text-xs font-semibold uppercase tracking-widest text-white/80 w-[18%]">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                [...Array(5)].map((_, index) => (
                  <tr key={index}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3 animate-pulse">
                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700" />
                        <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-700" />
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
                    </td>

                    <td className="px-5 py-4">
                      <div className="h-4 w-20 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
                    </td>

                    <td className="px-5 py-4">
                      <div className="h-6 w-16 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
                    </td>

                    <td className="px-5 py-4">
                      <div className="h-6 w-16 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" />
                        <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : appointments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center mb-1"
                        style={{ background: "#eef0ff" }}
                      >
                        <FaCalendarAlt className="w-6 h-6" style={{ color: "#465FFF" }} />
                      </div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No appointments found</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">No records match your current filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                appointments
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((item) => (
                    <tr
                      key={item._id}
                      className="group hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-150"
                    >
                      {/* Patient Name */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                            style={{ background: "#eef0ff", color: "#465FFF" }}
                          >
                            {item.patientName?.charAt(0)?.toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {item.patientName}
                          </span>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <FaPhoneAlt className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">{item.patientMobile}</span>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <FaCalendarAlt className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">{dateFormat(item.appointmentDate)}</span>
                        </div>
                      </td>

                      {/* Start Time */}
                      <td className="px-5 py-3.5">
                        <span
                          className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
                          style={{ background: "#eef0ff", color: "#465FFF" }}
                        >
                          <FaClock className="w-3 h-3" />
                          {ConvertTime(item.startTime)}
                        </span>
                      </td>

                      {/* End Time */}
                      <td className="px-5 py-3.5">
                        <span
                          className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
                          style={{ background: "#fff0f0", color: "#e05252" }}
                        >
                          <FaClock className="w-3 h-3" />
                          {ConvertTime(item.endTime)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-center gap-1">
                          {requiredPermissions("appointment:list") && (
                            <button
                              onClick={() => handleView(item)}
                              title="View"
                              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150
                          text-gray-400 hover:text-[#465FFF] hover:bg-[#eef0ff]
                          dark:text-gray-500 dark:hover:text-[#7B91FF] dark:hover:bg-[#465FFF]/10"
                            >
                              <FaEye className="w-[15px] h-[15px]" />
                            </button>
                          )}

                          {requiredPermissions("appointment:delete") && (
                            <button
                              onClick={() => handleDelete(item)}
                              title="Delete"
                              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150
                          text-gray-400 hover:text-red-500 hover:bg-red-50
                          dark:text-gray-500 dark:hover:text-red-400 dark:hover:bg-red-500/10"
                            >
                              <FaTrash className="w-[15px] h-[15px]" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-3.5 border-t border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/30">

          {/* Left: rows per page */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">Rows per page</span>
            <div className="flex items-center rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800">
              {[10, 20, 30, 50].map((n) => (
                <button
                  key={n}
                  onClick={() => { setRowsPerPage(n); setPage(0); }}
                  className={`px-3 py-1.5 text-xs font-medium transition-all duration-150 border-r border-gray-200 dark:border-gray-700 last:border-r-0
              ${rowsPerPage === n
                      ? "text-white"
                      : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                  style={rowsPerPage === n ? { background: "#465FFF" } : {}}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Right: page info + arrows */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
              <span className="font-semibold text-gray-700 dark:text-gray-200">
                {page * rowsPerPage + 1}–{Math.min((page + 1) * rowsPerPage, appointments.length)}
              </span>
              {" "}of{" "}
              <span className="font-semibold text-gray-700 dark:text-gray-200">{appointments.length}</span>
            </span>

            <div className="flex items-center gap-1">
              {/* First */}
              <button
                onClick={() => setPage(0)}
                disabled={page === 0}
                title="First page"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 dark:text-gray-500
            hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200
            disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150"
              >
                <MdFirstPage className="w-4 h-4" />
              </button>

              {/* Prev */}
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                title="Previous page"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 dark:text-gray-500
            hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200
            disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150"
              >
                <MdChevronLeft className="w-4 h-4" />
              </button>

              {/* Page pills */}
              {(() => {
                const totalPages = Math.ceil(appointments.length / rowsPerPage);
                const delta = 1;
                const pages: (number | "...")[] = [];
                for (let i = 0; i < totalPages; i++) {
                  if (i === 0 || i === totalPages - 1 || (i >= page - delta && i <= page + delta)) {
                    pages.push(i);
                  } else if (pages[pages.length - 1] !== "...") {
                    pages.push("...");
                  }
                }
                return pages.map((p, i) =>
                  p === "..." ? (
                    <span key={`dot-${i}`} className="w-7 h-7 flex items-center justify-center text-xs text-gray-400">···</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p as number)}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-medium transition-all duration-150
                  ${page === p
                          ? "text-white shadow-sm"
                          : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200"
                        }`}
                      style={page === p ? { background: "#465FFF" } : {}}
                    >
                      {(p as number) + 1}
                    </button>
                  )
                );
              })()}

              {/* Next */}
              <button
                onClick={() => setPage((p) => Math.min(Math.ceil(appointments.length / rowsPerPage) - 1, p + 1))}
                disabled={page >= Math.ceil(appointments.length / rowsPerPage) - 1}
                title="Next page"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 dark:text-gray-500
            hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200
            disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150"
              >
                <MdChevronRight className="w-4 h-4" />
              </button>

              {/* Last */}
              <button
                onClick={() => setPage(Math.ceil(appointments.length / rowsPerPage) - 1)}
                disabled={page >= Math.ceil(appointments.length / rowsPerPage) - 1}
                title="Last page"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 dark:text-gray-500
            hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200
            disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150"
              >
               <MdLastPage className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL */}
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[520px]">
        <div className="dark:bg-gray-900">

          {/* ── Header ── */}
          <div className="flex items-center gap-4 px-6 py-5" style={{ background: "#465FFF" }}>
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(255,255,255,0.2)" }}
            >
              <FaCalendarAlt className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-base m-0">
                {mode === "view" ? "Appointment Details" : mode === "edit" ? "Edit Appointment" : "New Appointment"}
              </p>
              <p className="text-white/60 text-xs mt-0.5 m-0">
                {mode === "view" ? "Full appointment info" : mode === "edit" ? "Update appointment details" : "Fill in the details below"}
              </p>
            </div>
          </div>

          {/* ── Body ── */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">

            {/* VIEW MODE */}
            {mode === "view" && (
              <div className="grid grid-cols-2 gap-px bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800">
                {[
                  { label: "Patient Name", icon: <HiUser/>, value: formData.patientName },
                  { label: "Mobile", icon: <FaPhoneAlt />, value: formData.patientMobile },
                  { label: "Date", icon: <FaCalendarAlt/>, value: dateFormat(formData.appointmentDate) },
                  { label: "Clinic", icon: <HiOfficeBuilding/>, value: clinicName },
                  { label: "Start Time", icon: <FaClock/>, value: ConvertTime(formData.startTime), pill: "blue" },
                  { label: "End Time", icon: <FaClock/>, value: ConvertTime(formData.endTime), pill: "red" },
                ].map((field) => (
                  <div key={field.label} className="bg-white dark:bg-gray-900 px-5 py-4">
                    <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2 m-0">
                      {field.icon}
                      {field.label}
                    </p>
                    {field.pill === "blue" ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: "#eef0ff", color: "#465FFF" }}>
                        {field.value}
                      </span>
                    ) : field.pill === "red" ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: "#fff0f0", color: "#e05252" }}>
                        {field.value}
                      </span>
                    ) : (
                      <p className="text-sm font-medium text-gray-900 dark:text-white m-0">{field.value || "—"}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* ADD / EDIT MODE */}
            {mode !== "view" && (
              <div className="flex flex-col gap-4">

                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                    Clinic <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="clinicId"
                    value={formData.clinicId}
                    onChange={(e) => setFormData({ ...formData, clinicId: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2.5 text-sm bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#465FFF]/30"
                  >
                    <option value="">Select Clinic</option>
                    {clinics.map((c) => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                    Patient Name <span className="text-red-500">*</span>
                  </label>
                  <Input name="patientName" value={formData.patientName} onChange={handleChange} placeholder="Enetr Patient Name" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <Input name="patientMobile" value={formData.patientMobile} onChange={handleChange} maxLength={10} placeholder="Enter Phone" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <DatePicker
                    selected={formData.appointmentDate}
                    onChange={handleChangeDate}
                    dateFormat="dd-MM-yyyy"
                    minDate={appointMentDate}
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2.5 text-sm bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#465FFF]/30"
                  />
                </div>

                {/* Start + End time side by side */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                      Start Time <span className="text-red-500">*</span>
                    </label>
                    <Input type="time" name="startTime" value={formData.startTime} onChange={handleChange} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                      End Time <span className="text-red-500">*</span>
                    </label>
                    <Input type="time" name="endTime" value={formData.endTime} onChange={handleChange} />
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* ── Footer ── */}
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800">
            <button
              onClick={closeModal}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              Close
            </button>
            {mode !== "view" && (
              <button
                onClick={handleSave}
                className="px-5 py-2 text-sm font-semibold rounded-lg text-white transition hover:opacity-90"
                style={{ background: "#465FFF" }}
              >
                {mode === "edit" ? "Save Changes" : "Save Appointment"}
              </button>
            )}
          </div>

        </div>
      </Modal>

      {/* Delete dialog  */}
      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
      >
        <div className="dark:bg-gray-800 dark:text-white">
          <DialogTitle>Delete Appointment</DialogTitle>

          <DialogContent>
            Are you sure you want to delete this appointment?
          </DialogContent>

          <DialogActions>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>

            <Button onClick={confirmDelete}>
              Yes, Delete
            </Button>
          </DialogActions>
        </div>
      </Dialog>


    </div>
  );
}
