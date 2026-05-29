import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { url } from "../../baseUrl";
import DatePicker from "react-datepicker";
import Input from "../../components/form/input/InputField";

type Stats = {
  today: number;
  pending: number;
  completed: number;
};

export default function ClinicDashboard() {
  const [stats, setStats] = useState<Stats>({ today: 0, pending: 0, completed: 0 });
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    patientName: "",
    patientMobile: "",
    appointmentDate: new Date(),
    startTime: "",
    endTime: "",
  });

  const appointMentDate = new Date();
  const token = localStorage.getItem("token");
  const clinicId = localStorage.getItem("clinicId");

  const fetchStats = async () => {
    try {
      const res = await fetch(`${url}/clinic/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.errorMessage || "Failed to fetch dashboard stats");
        return;
      }
      const statsData = json.data;
      setStats({
        today: statsData?.todayAppointments?.length ?? 0,
        pending: statsData?.pendingAppointments?.length ?? 0,
        completed: statsData?.completedAppointments?.length ?? 0,
      });
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddAppointment = async () => {
    if (!clinicId) { toast.error("Clinic ID missing"); return; }
    try {
      setLoading(true);
      const res = await fetch(`${url}/appointments/book`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...formData, clinicId }),
      });
      const result = await res.json();
      if (!res.ok) { toast.error(result?.errorMessage || "Failed to add appointment"); return; }
      toast.success("Appointment added successfully");
      setFormData({ patientName: "", patientMobile: "", appointmentDate: new Date(), startTime: "", endTime: "" });
      fetchStats();
    } catch (error) {
      console.error(error);
      toast.error("Server error");
    } finally {
      setLoading(false);
    }
  };

  const handleChangeDate = (date: Date) => {
    setFormData({ ...formData, appointmentDate: date });
  };

  const statCards = [
    {
      label: "Today's Appointments",
      value: stats.today,
      icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
      bg: "#eef0ff",
      color: "#465FFF",
      valueCls: "text-[#465FFF]",
    },
    {
      label: "Pending",
      value: stats.pending,
      icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
      bg: "#fef9ec",
      color: "#d97706",
      valueCls: "text-amber-600",
    },
    {
      label: "Completed",
      value: stats.completed,
      icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
      bg: "#dcfce7",
      color: "#16a34a",
      valueCls: "text-green-600",
    },
  ];

  return (
    <div className="flex flex-col gap-6">

      {/* Page title */}
      <div>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white m-0">Clinic Dashboard</h2>
        <p className="text-sm text-gray-400 mt-0.5 m-0">Overview of today's activity</p>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 px-5 py-4 flex items-center gap-4"
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: card.bg }}
            >
              <svg className="w-5 h-5" style={{ color: card.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={card.icon} />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider m-0">{card.label}</p>
              <p className={`text-2xl font-semibold mt-0.5 m-0 ${card.valueCls}`}>{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Quick Add form ── */}
      <div className="rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden w-full max-w-lg">

        {/* Form header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-700" style={{ background: "#465FFF" }}>
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.2)" }}
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <div>
            <p className="text-white font-semibold text-sm m-0">Quick Add Appointment</p>
            <p className="text-white/60 text-xs m-0">Book a new slot instantly</p>
          </div>
        </div>

        {/* Form body */}
        <div className="p-5 flex flex-col gap-4">

          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
              Patient Name
            </label>
            <Input
              value={formData.patientName}
              onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
              Mobile Number
            </label>
            <Input
              value={formData.patientMobile}
              onChange={(e) => setFormData({ ...formData, patientMobile: e.target.value })}
              maxLength={10}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
              Appointment Date
            </label>
            <DatePicker
              selected={formData.appointmentDate}
              onChange={handleChangeDate}
              dateFormat="dd-MM-yyyy"
              minDate={appointMentDate}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2.5 text-sm bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#465FFF]/30 focus:border-[#465FFF] transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                Start Time
              </label>
              <Input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                End Time
              </label>
              <Input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              />
            </div>
          </div>

        </div>

        {/* Form footer */}
        <div className="flex justify-end px-5 py-4 border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={handleAddAppointment}
            disabled={loading}
            className="px-5 py-2 text-sm font-semibold rounded-lg text-white transition hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
            style={{ background: "#465FFF" }}
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Adding...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Appointment
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}