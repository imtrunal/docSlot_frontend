import { useEffect, useState } from "react";
import Card from "@mui/material/Card";
import Button from "@mui/material/Button";
// import Input from "@mui/material/Input";
import Label from "../../components/form/Label";
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
  const [stats, setStats] = useState<Stats>({
    today: 0,
    pending: 0,
    completed: 0,
  });

  const [loading, setLoading] = useState(false);

  // Quick add appointment

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

  // ---------------- FETCH DASHBOARD STATS ----------------
  const fetchStats = async () => {
    try {
      const res = await fetch(`${url}/clinic/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // if (!res.ok) {
      //   console.error("Dashboard API failed");
      //   return;
      // }

      const json = await res.json();
      if (!res.ok) {  
        toast.error(json.errorMessage || 'Failed to fetch dashboard stats');
        return;
      }

      // ✅ IMPORTANT: go one level deeper
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

  // ---------------- QUICK ADD APPOINTMENT ----------------
  const handleAddAppointment = async () => {
    // if (formData) {
    //   toast.error("All fields required");
    //   return;
    // }

    if (!clinicId) {
      toast.error("Clinic ID missing");
      return;
    }

    try {
      setLoading(true);
      // const payload = {
      //   ...formData,
      //   appointmentDate: formData.appointmentDate
      //     ? formData.appointmentDate.toISOString().split("T")[0]
      //     : "",
      // };


      const res = await fetch(`${url}/appointments/book`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...formData, clinicId }),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result?.errorMessage || "Failed to add appointment");
        return;
      }

      toast.success("Appointment added sucessfully");

      // reset
      // setPatientName("");
      // setMobile("");
      // setAppointmentDate("");
      // setStartTime("");
      // setEndTime("");
      setFormData({
        patientName: "",
        patientMobile: "",
        appointmentDate: new Date() || "",
        startTime: "",
        endTime: "",
      });

      // 🔥 refresh cards
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

  return (
    <div className="p-6 sameCSS space-y-6 ml-0 md:ml-[260px] lg:ml-0 sm:ml-[100px] xs:ml-[100px] transition-all duration-300">
      <h2 className="text-2xl font-semibold dark:text-white">Clinic Dashboard</h2>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-4 dark:bg-gray-900">
          <h4 className="text-sm text-gray-500">Today’s Appointments</h4>
          <p className="text-2xl font-bold dark:text-gray-200">{stats.today}</p>
        </Card>

        <Card className="p-4 dark:bg-gray-900">
          <h4 className="text-sm text-gray-500">Pending</h4>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
        </Card>

        <Card className="p-4 dark:bg-gray-900">
          <h4 className="text-sm text-gray-500">Completed</h4>
          <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
        </Card>
      </div>

      {/* QUICK ADD */}
      <Card className="p-6 max-w-md dark:bg-gray-900 w-1/2">
        <h4 className="text-lg font-semibold mb-4 dark:text-white">Quick Add Appointment</h4>

        <div className="space-y-4 ">
          <div>
            <Label>Patient Name</Label>
            <Input
              value={formData.patientName}
              onChange={(e) =>
                setFormData({ ...formData, patientName: e.target.value })
              }
              className="dark:bg-gray-800 dark:text-gray-400"
            />
          </div>

          <div>
            <Label>Mobile Number</Label>
            <Input
              value={formData.patientMobile}
              onChange={(e) =>
                setFormData({ ...formData, patientMobile: e.target.value })
              }
              className="dark:bg-gray-800 dark:text-gray-400"
              maxLength={10}
              
            />
          </div>

          <div>
            <Label>Appointment Date</Label>
            {/* <Input
              value={appointmentDate}
              onChange={(e) => setAppointmentDate(e.target.value)}
            /> */}
            <DatePicker
              selected={formData.appointmentDate}
              onChange={handleChangeDate}
              dateFormat="dd-MM-yyyy"
              minDate={appointMentDate}
              className="border-0 border-b w-[194px] dark:bg-gray-800 dark:text-gray-400"
            />
          </div>

          <div>
            <Label>Start Time</Label>
            <Input
              type="time"
              value={formData.startTime}
              onChange={(e) =>
                setFormData({ ...formData, startTime: e.target.value })
              }
              className="dark:bg-gray-800 dark:text-gray-400"
            />
          </div>

          <div>
            <Label>End Time</Label>
            <Input
              type="time"
              value={formData.endTime}
              onChange={(e) =>
                setFormData({ ...formData, endTime: e.target.value })
              }
              className="dark:bg-gray-800 dark:text-gray-400"
            />
          </div>

          <Button onClick={handleAddAppointment} disabled={loading} className="dark:text-gray-200">
            {loading ? "Adding..." : "Add Appointment"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
