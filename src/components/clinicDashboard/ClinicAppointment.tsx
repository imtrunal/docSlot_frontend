import { useEffect, useState } from 'react';
import Input from '../form/input/InputField';
import { Modal } from '../ui/modal';
import { useModal } from '../../hooks/useModal';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import Button from '../ui/button/Button';
import { url } from '../../baseUrl';
import DatePicker from 'react-datepicker';
import { ConvertTime } from '../../utils/timeUtils';
import { dateFormat } from '../../utils/dateUtils';
import { requiredPermissions } from '../../utils/permissions';

import 'react-datepicker/dist/react-datepicker.css';
import { toast } from 'react-toastify';

import {
  FaCalendarAlt,
  FaPhoneAlt,
  FaClock,
  FaEye,
  FaTrash,
  FaCheck,
  FaTimes,
} from "react-icons/fa";

import {
  MdFirstPage,
  MdLastPage,
  MdChevronLeft,
  MdChevronRight,
  MdKeyboardArrowDown,
} from "react-icons/md";

import {
  HiUser,
  HiClipboardList,
  HiCheckCircle,
} from "react-icons/hi";

// --------------------
// Types
// --------------------
type Appointment = {
  appointmentId: string;
  clinicId: string;
  patientName: string;
  patientMobile: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  createdAt: string;
  status?: 'Scheduled' | 'Completed' | 'Cancelled';
};

type FilterType = 'all' | 'today' | 'upcoming' | 'completed';

export default function ClinicAppointment() {
  const { isOpen, openModal, closeModal } = useModal();

  // pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // filter
  const [filter, setFilter] = useState<FilterType>('all');

  // mode
  const [mode, setMode] = useState<'add' | 'view' | 'edit' | 'delete'>('add');

  // data
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const clinicId = localStorage.getItem('clinicId');

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);

  // form
  const [formData, setFormData] = useState({
    appointmentId: '',
    clinicId: clinicId || '',
    patientName: '',
    patientMobile: '',
    appointmentDate: '',
    startTime: '',
    endTime: '',
    status: 'Scheduled',
  });

  const appointMentDate = new Date();

  // --------------------
  // DATE HELPERS (TIMEZONE SAFE)
  // --------------------
  const getLocalToday = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // normal date
  const normalizeDate = (date: string) => {
    return date.split('T')[0];
  };

  const toLocalDate = (dateString: string) => {
    const d = new Date(dateString); // backend UTC
    const y = d.getFullYear(); // LOCAL YEAR
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`; // ✅ LOCAL YYYY-MM-DD
  };

  const getDateOnly = (date: string) => date.split('T')[0];

  // --------------------
  // FETCH APPOINTMENTS
  // --------------------
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);

        const token = localStorage.getItem('token');
        const clinicId = localStorage.getItem('clinicId');
        if (!token || !clinicId) return;

        const res = await fetch(`${url}/clinic/appointments`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const response = await res.json();

        if (!res.ok) {
          toast.error(response.errorMessage || 'Failed to fetch appointment');
          return;
        }

        const data = Array.isArray(response.data)
          ? response.data
          : Array.isArray(response)
            ? response
            : [];

        const mapped: Appointment[] = data.map((a: any) => ({
          appointmentId: a._id,
          clinicId: a.clinicId,
          patientName: a.patientName,
          patientMobile: a.patientMobile,
          appointmentDate: toLocalDate(a.appointmentDate),
          startTime: a.startTime,
          endTime: a.endTime,
          createdAt: a.createdAt,
          status: a.status ?? 'Scheduled',
        }));

        setAppointments(mapped);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  // --------------------
  // VALIDATIONS
  // --------------------
  const isValidMobile = (mobile: string) => /^[6-9]\d{9}$/.test(mobile);

  // --------------------
  // FILTER + SORT
  // --------------------
  const getFilteredAppointments = () => {
    const today = getLocalToday();

    let filtered = appointments.filter((a) => a.status !== 'Cancelled');

    if (filter === 'today') {
      filtered = filtered.filter(
        (a) =>
          getDateOnly(a.appointmentDate) === today && a.status === 'Scheduled',
      );
    }

    if (filter === 'upcoming') {
      filtered = filtered.filter(
        (a) =>
          getDateOnly(a.appointmentDate) > today && a.status === 'Scheduled',
      );
    }

    if (filter === 'completed') {
      filtered = filtered.filter((a) => a.status === 'Completed');
    }

    return filtered;
  };

  // --------------------
  // HANDLERS
  // --------------------
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleChangeDate = (date: Date | null) => {
    if (!date) return;

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    const localDate = `${year}-${month}-${day}`;

    setFormData({
      ...formData,
      appointmentDate: localDate,
    });

    setSelectedDate(date);
  };


  const handleSave = async () => {
    if (!isValidMobile(formData.patientMobile)) {
      toast.error('Enter valid mobile number');
      return;
    }

    if (formData.startTime >= formData.endTime) {
      toast.error('End time must be after start time');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token || !clinicId) return;

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { appointmentId, status, ...payload } = formData;

      const res = await fetch(`${url}/appointments`, {
        method: mode === 'edit' ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...payload, clinicId }),
      });

      const response = await res.json();

      if (!res.ok) {
        toast.error(response.errorMessage || 'Failed to save appointment');
        return;
      }

      const raw = response.data ?? response;

      const saved: Appointment = {
        appointmentId: raw._id,
        clinicId: raw.clinicId,
        patientName: raw.patientName,
        patientMobile: raw.patientMobile,
        appointmentDate: normalizeDate(raw.appointmentDate),
        startTime: raw.startTime,
        endTime: raw.endTime,
        createdAt: raw.createdAt,
        status: raw.status ?? 'Scheduled',
      };

      setAppointments((prev) =>
        mode === 'edit'
          ? prev.map((a) =>
            a.appointmentId === saved.appointmentId ? saved : a,
          )
          : [saved, ...prev],
      );

      closeModal();
      setMode('add');
      setFormData({
        appointmentId: '',
        clinicId: clinicId || '',
        patientName: '',
        patientMobile: '',
        appointmentDate: '',
        startTime: '',
        endTime: '',
        status: 'Scheduled',
      });

      toast.success('Appointment saved successfully');
    } catch (err) {
      console.error(err);
      toast.error('Server error');
    }
  };

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingItem, setPendingItem] = useState<Appointment | null>(null);

  const openCompleteConfirm = (item: Appointment) => {
    setPendingItem(item);
    setConfirmOpen(true);
  };

  // mark completed
  const handleComplete = async (item: Appointment) => {

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch(`${url}/appointments/${item.appointmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 'Completed' }),
      });

      const response = await res.json();

      if (!res.ok) {
        toast.error(response.errorMessage || 'Failed to update appointment status');
        return;
      }

      // ✅ Update UI
      setAppointments((prev) =>
        prev.map((a) =>
          a.appointmentId === item.appointmentId
            ? { ...a, status: 'Completed' }
            : a,
        ),
      );
    } catch (error) {
      console.error(error);
      toast.error('Server error');
    }
  };

  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [cancelItem, setCancelItem] = useState<Appointment | null>(null);

  const openCancelConfirm = (item: Appointment) => {
    setCancelItem(item);
    setCancelConfirmOpen(true);
  };

  // cancel appointment
  const handleCancel = async (item: Appointment) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch(`${url}/appointments/${item.appointmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 'Cancelled' }),
      });

      const response = await res.json();

      if (!res.ok) {
        toast.error(response.errorMessage || 'Failed to update appointment status');
        return;
      }

      // ✅ Remove from UI
      setAppointments((prev) =>
        prev.filter((a) =>
          a.appointmentId !== item.appointmentId
            ? { ...a, status: 'Cancelled' }
            : a,
        ),
      );
    } catch (error) {
      console.error(error);
      toast.error('Server error');
    }
  };

  const handleView = (item: Appointment) => {

    setFormData({
      ...item,
      status: item.status ?? 'Scheduled',
    });
    setMode('view');
    openModal();
  };

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState<Appointment | null>(null);

  const handleDelete = (item: Appointment) => {
    setDeleteItem(item);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteItem) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch(
        `${url}/appointments/${deleteItem.appointmentId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const response = await res.json();

      if (!res.ok) {
        toast.error(response.errorMessage || 'Failed to delete appointment');
        return;
      }

      setAppointments((prev) =>
        prev.filter((a) => a.appointmentId !== deleteItem.appointmentId)
      );

      toast.success('Appointment deleted successfully');
    } catch (error) {
      console.error(error);
      toast.error('Server error');
    } finally {
      setDeleteConfirmOpen(false);
      setDeleteItem(null);
    }
  };

  const filtered = getFilteredAppointments();

  //status
  const [statusAnchorEl, setStatusAnchorEl] = useState<null | HTMLElement>(
    null,
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const openStatusMenu = Boolean(statusAnchorEl);

  const handleStatusMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    item: any,
  ) => {
    setStatusAnchorEl(event.currentTarget);
    setSelectedItem(item);
  };

  const handleStatusMenuClose = () => {
    setStatusAnchorEl(null);
    setSelectedItem(null);
  };

  // --------------------
  // UI
  // --------------------
  return (
    <div >
      <div className="appointments flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold dark:text-gray-100">Appointments</h2>

        <div className="filter flex gap-3 dark:bg-transparent">
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value as FilterType);
              setPage(0);
            }}
            className="px-3 py-2 border rounded-md text-sm w-28 dark:bg-gray-800 dark:text-gray-400"
          >
            <option value="all">All</option>
            <option value="today">Today</option>
            <option value="upcoming">Upcoming</option>
            <option value="completed">Completed</option>
          </select>

          {requiredPermissions('appointment:create') && (
            <Button
              className='dark:bg-gray-700'
              // color="primary"
              // sx={{ backgroundColor: "#4F46E5", color: "white" }}
              onClick={() => {
                openModal();
                setMode('add');
                setFormData({
                  appointmentId: '',
                  clinicId: '',
                  patientName: '',
                  patientMobile: '',
                  appointmentDate: '',
                  startTime: '',
                  endTime: '',
                  status: 'Scheduled',
                });
              }}
            >
              + New Appointment
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr style={{ background: "#465FFF" }}>
                <th className="text-left px-4 py-4 text-xs font-semibold uppercase tracking-widest text-white/80 w-[18%]">Patient Name</th>
                <th className="text-left px-4 py-4 text-xs font-semibold uppercase tracking-widest text-white/80 w-[13%]">Mobile</th>
                <th className="text-left px-4 py-4 text-xs font-semibold uppercase tracking-widest text-white/80 w-[13%]">Date</th>
                <th className="text-left px-4 py-4 text-xs font-semibold uppercase tracking-widest text-white/80 w-[11%]">Start</th>
                <th className="text-left px-4 py-4 text-xs font-semibold uppercase tracking-widest text-white/80 w-[11%]">End</th>
                {requiredPermissions('appointment:status_change') && (
                  <th className="text-left px-4 py-4 text-xs font-semibold uppercase tracking-widest text-white/80 w-[13%]">Status</th>
                )}
                <th className="text-center px-4 py-4 text-xs font-semibold uppercase tracking-widest text-white/80 w-[8%]">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                [...Array(5)].map((_, index) => (
                  <tr key={index}>
                    {/* Patient */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3 animate-pulse">
                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700" />
                        <div className="h-4 w-28 rounded bg-gray-200 dark:bg-gray-700" />
                      </div>
                    </td>

                    {/* Mobile */}
                    <td className="px-4 py-4">
                      <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
                    </td>

                    {/* Date */}
                    <td className="px-4 py-4">
                      <div className="h-4 w-20 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
                    </td>

                    {/* Start Time */}
                    <td className="px-4 py-4">
                      <div className="h-6 w-16 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
                    </td>

                    {/* End Time */}
                    <td className="px-4 py-4">
                      <div className="h-6 w-16 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
                    </td>

                    {/* Status */}
                    {requiredPermissions('appointment:status_change') && (
                      <td className="px-4 py-4">
                        <div className="h-6 w-20 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
                      </td>
                    )}

                    {/* Actions */}
                    <td className="px-4 py-4">
                      <div className="flex justify-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" />
                        <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center mb-1" style={{ background: "#eef0ff" }}>
                        <HiClipboardList
                          className="w-6 h-6"
                          style={{ color: "#465FFF" }}
                        />
                      </div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No appointments found</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((item) => {
                    const getStatusStyle = (status: string) => {
                      switch (status?.toLowerCase()) {
                        case 'completed': return { bg: '#dcfce7', color: '#16a34a' };
                        case 'cancelled': return { bg: '#fff0f0', color: '#e05252' };
                        default: return { bg: '#fef9ec', color: '#d97706' };
                      }
                    };
                    const statusStyle = getStatusStyle(item.status);

                    return (
                      <tr key={item.appointmentId} className="group hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-150">

                        {/* Patient Name */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                              style={{ background: "#eef0ff", color: "#465FFF" }}
                            >
                              {item.patientName?.charAt(0)?.toUpperCase() || "?"}
                            </div>
                            <span className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[110px]">
                              {item.patientName}
                            </span>
                          </div>
                        </td>

                        {/* Mobile */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <FaPhoneAlt className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">{item.patientMobile}</span>
                          </div>
                        </td>

                        {/* Date */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <FaCalendarAlt className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">{dateFormat(item.appointmentDate)}</span>
                          </div>
                        </td>

                        {/* Start Time */}
                        <td className="px-4 py-3.5">
                          <span
                            className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
                            style={{ background: "#eef0ff", color: "#465FFF" }}
                          >
                            {ConvertTime(item.startTime)}
                          </span>
                        </td>

                        {/* End Time */}
                        <td className="px-4 py-3.5">
                          <span
                            className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
                            style={{ background: "#fff0f0", color: "#e05252" }}
                          >
                            {ConvertTime(item.endTime)}
                          </span>
                        </td>

                        {/* Status */}
                        {requiredPermissions('appointment:status_change') && (
                          <td className="px-4 py-3.5">
                            <button
                              onClick={(e) => handleStatusMenuOpen(e, item)}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full transition-all hover:opacity-80 whitespace-nowrap"
                              style={{ background: statusStyle.bg, color: statusStyle.color }}
                            >
                              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: statusStyle.color }} />
                              {item.status}
                              <MdKeyboardArrowDown className="w-3 h-3 ml-0.5 flex-shrink-0" />
                            </button>
                          </td>
                        )}

                        {/* Actions */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center justify-center gap-1">
                            {requiredPermissions('appointment:list') && (
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
                            {requiredPermissions('appointment:delete') && (
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
                    );
                  })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-3.5 border-t border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/30">

          {/* Rows per page */}
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

          {/* Page info + arrows */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
              <span className="font-semibold text-gray-700 dark:text-gray-200">
                {page * rowsPerPage + 1}–{Math.min((page + 1) * rowsPerPage, filtered.length)}
              </span>
              {" "}of{" "}
              <span className="font-semibold text-gray-700 dark:text-gray-200">{filtered.length}</span>
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
                const totalPages = Math.ceil(filtered.length / rowsPerPage);
                const pages: (number | "...")[] = [];
                for (let i = 0; i < totalPages; i++) {
                  if (i === 0 || i === totalPages - 1 || (i >= page - 1 && i <= page + 1)) {
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
                onClick={() => setPage((p) => Math.min(Math.ceil(filtered.length / rowsPerPage) - 1, p + 1))}
                disabled={page >= Math.ceil(filtered.length / rowsPerPage) - 1}
                title="Next page"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 dark:text-gray-500
            hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200
            disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150"
              >
                <MdChevronRight className="w-4 h-4" />
              </button>

              {/* Last */}
              <button
                onClick={() => setPage(Math.ceil(filtered.length / rowsPerPage) - 1)}
                disabled={page >= Math.ceil(filtered.length / rowsPerPage) - 1}
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

      {/* Status dropdown */}
      {openStatusMenu && (
        <div
          className="fixed z-50 min-w-[150px] rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg overflow-hidden"
          style={{
            top: statusAnchorEl?.getBoundingClientRect().bottom + 6,
            left: statusAnchorEl?.getBoundingClientRect().left,
          }}
        >
          <button
            onClick={() => { openCompleteConfirm(selectedItem); handleStatusMenuClose(); }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
          >
            <span className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#dcfce7" }}>
              <FaCheck
                className="w-3.5 h-3.5"
                style={{ color: "#16a34a" }}
              />
            </span>
            <span className="font-medium text-gray-700 dark:text-gray-300">Completed</span>
          </button>

          <div className="h-px bg-gray-100 dark:bg-gray-800" />

          <button
            onClick={() => { openCancelConfirm(selectedItem); handleStatusMenuClose(); }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
          >
            <span className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#fff0f0" }}>
              <FaTimes
                className="w-3.5 h-3.5"
                style={{ color: "#e05252" }}
              />
            </span>
            <span className="font-medium text-gray-700 dark:text-gray-300">Cancelled</span>
          </button>
        </div>
      )}

      {/* confirmation dialog  */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <div className="dark:bg-gray-800 dark:text-white">
          <DialogTitle>Confirm Completion</DialogTitle>

          <DialogContent>
            Are you sure you want to mark this appointment as <b>Completed</b>?
          </DialogContent>

          <DialogActions>
            <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>

            <Button
              variant="primary"
              onClick={() => {
                if (pendingItem) handleComplete(pendingItem);
                setConfirmOpen(false);
              }}
            >
              Yes, Complete
            </Button>
          </DialogActions>
        </div>
      </Dialog>

      {/* cancel dialog  */}
      <Dialog
        open={cancelConfirmOpen}
        onClose={() => setCancelConfirmOpen(false)}
      >
        <div className="dark:bg-gray-800 dark:text-white">
          <DialogTitle>Confirm Cancellation</DialogTitle>

          <DialogContent>
            Are you sure you want to <b>cancel</b> this appointment?
          </DialogContent>

          <DialogActions>
            <Button onClick={() => setCancelConfirmOpen(false)}>No</Button>

            <Button
              variant="primary"
              onClick={() => {
                if (cancelItem) handleCancel(cancelItem);
                setCancelConfirmOpen(false);
              }}
            >
              Yes, Cancel
            </Button>
          </DialogActions>
        </div>
      </Dialog>

      {/* delete dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <div className="dark:bg-gray-800 dark:text-white">
          <DialogTitle>Confirm Delete</DialogTitle>

          <DialogContent>
            Are you sure you want to <b>delete</b> this appointment?
          </DialogContent>

          <DialogActions>
            <Button onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>

            <Button
              variant="primary"
              onClick={confirmDelete}
            >
              Yes, Delete
            </Button>
          </DialogActions>
        </div>
      </Dialog>


      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[520px]">
        <div className="dark:bg-gray-900">

          {/* Header */}
          <div className="flex items-center gap-4 px-6 py-5" style={{ background: "#465FFF" }}>
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(255,255,255,0.2)" }}
            >
              <FaCalendarAlt className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-base m-0">
                {mode === 'add' && 'New Appointment'}
                {mode === 'edit' && 'Edit Appointment'}
                {mode === 'view' && 'Appointment Details'}
              </p>
              <p className="text-white/60 text-xs mt-0.5 m-0">
                {mode === 'view' ? 'Full appointment info' : mode === 'edit' ? 'Update appointment details' : 'Fill in the details below'}
              </p>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">

            {/* VIEW MODE */}
            {mode === 'view' && (() => {
              const getStatusStyle = (status: string) => {
                switch (status?.toLowerCase()) {
                  case 'completed': return { bg: '#dcfce7', color: '#16a34a' };
                  case 'cancelled': return { bg: '#fff0f0', color: '#e05252' };
                  default: return { bg: '#fef9ec', color: '#d97706' };
                }
              };
              const statusStyle = getStatusStyle(formData.status);
              return (
                <div className="grid grid-cols-2 gap-px bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800">
                  {[
                    {
                      label: "Patient Name", icon: <HiUser />
                      , value: formData.patientName
                    },
                    { label: "Mobile", icon: <FaPhoneAlt />, value: formData.patientMobile },
                    { label: "Date", icon: <FaCalendarAlt />, value: dateFormat(formData.appointmentDate) },
                    { label: "Status", icon: <HiCheckCircle />, value: formData.status, isStatus: true },
                    { label: "Start Time", icon: <FaClock />, value: ConvertTime(formData.startTime), pill: "blue" },
                    { label: "End Time", icon: <FaClock />, value: ConvertTime(formData.endTime), pill: "red" },
                  ].map((field) => (
                    <div key={field.label} className="bg-white dark:bg-gray-900 px-5 py-4">
                      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2 m-0">
                        {field.icon}
                        {field.label}
                      </p>
                      {field.pill === "blue" ? (
                        <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: "#eef0ff", color: "#465FFF" }}>
                          {field.value}
                        </span>
                      ) : field.pill === "red" ? (
                        <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: "#fff0f0", color: "#e05252" }}>
                          {field.value}
                        </span>
                      ) : field.isStatus ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: statusStyle.bg, color: statusStyle.color }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusStyle.color }} />
                          {field.value}
                        </span>
                      ) : (
                        <p className="text-sm font-medium text-gray-900 dark:text-white m-0">{field.value || "—"}</p>
                      )}
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* ADD / EDIT MODE */}
            {mode !== 'view' && (
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Patient Name <span className="text-red-500">*</span></label>
                  <Input type="text" onChange={handleChange} name="patientName" value={formData.patientName} placeholder='Enter Patient Name' />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Mobile Number <span className="text-red-500">*</span></label>
                  <Input onChange={handleChange} name="patientMobile" value={formData.patientMobile} maxLength={10} placeholder='Enter Mobile Number' />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Appointment Date <span className="text-red-500">*</span></label>
                  <DatePicker
                    selected={formData.appointmentDate ? new Date(formData.appointmentDate) : null}
                    onChange={handleChangeDate}
                    dateFormat="dd-MM-yyyy"
                    minDate={appointMentDate}
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2.5 text-sm bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#465FFF]/30 focus:border-[#465FFF] transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Start Time <span className="text-red-500">*</span></label>
                    <Input type="time" onChange={handleChange} name="startTime" value={formData.startTime} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">End Time <span className="text-red-500">*</span></label>
                    <Input type="time" onChange={handleChange} name="endTime" value={formData.endTime} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800">
            <button
              onClick={closeModal}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              Close
            </button>
            {mode !== 'view' && (
              <button
                onClick={handleSave}
                className="px-5 py-2 text-sm font-semibold rounded-lg text-white transition hover:opacity-90"
                style={{ background: "#465FFF" }}
              >
                {mode === 'edit' ? 'Save Changes' : 'Save Appointment'}
              </button>
            )}
          </div>

        </div>
      </Modal>
    </div>
  );
}
