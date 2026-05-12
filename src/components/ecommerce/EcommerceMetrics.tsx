import { useEffect, useState } from "react";
import { url } from "../../baseUrl";
import VerifiedIcon from '@mui/icons-material/Verified';
import EventIcon from '@mui/icons-material/Event';
import ApartmentIcon from '@mui/icons-material/Apartment';

type Metrics = {
  totalClinics: number;
  inActiveClinics: number;
  totalAppointments: number;
};

export default function EcommerceMetrics() {
  // const navigate = useNavigate();

  // const userRole =
  //   JSON.parse(localStorage.getItem("user") || "{}")?.role ||
  //   localStorage.getItem("role");


  //  Block non-super-admin
  // useEffect(() => {
  //   if (userRole !== "SUPER_ADMIN") {
  //     navigate("/dashboard", { replace: true });
  //   }else{
  //     navigate("/clinic-dashboard", { replace: true });
  //   }
  // }, [userRole, navigate]);

  // useEffect(() => {
  //   if (userRole !== "CLINIC") {
  //     navigate("/clinic-dashboard", { replace: true });
  //   }else{
  //     navigate("/dashboard", { replace: true });
  //   }
  // }, [userRole, navigate]);

  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<Metrics>({
    totalClinics: 0,
    inActiveClinics: 0,
    totalAppointments: 0,
  });

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await fetch(`${url}/admin/dashboard`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });


        if (!res.ok) {
          throw new Error(`HTTP error ${res.status}`);
        }

        const response = await res.json();

        const data = response.data ?? response;

        setMetrics({
          totalClinics: Number(data.totalClinics) || 0,
          inActiveClinics:
            Number(data.totalClinics) - Number(data.totalInactiveClinics) || 0,
          totalAppointments: Number(data.totalAppointments) || 0,
        });
      } catch (error) {
        console.error("Dashboard API failed:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  return (
    <div className="p-6 sameCSS ml-0 md:ml-[260px] lg:ml-0 sm:ml-[100px] xs:ml-[100px] transition-all duration-300">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 md:gap-6">
        {/* Total Clinics */}
        <div
          // onClick={() => navigate("/clinics/total")}
          className="cursor-pointer rounded-2xl border border-gray-200 bg-white p-5 transition hover:shadow-md dark:border-gray-800 dark:bg-white/[0.03] md:p-6"
        >
          <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
            {/* <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />           */}
            {/* <ClinicIcon /> */}
            <ApartmentIcon className="dark:text-gray-400"/>
          </div>

          <div className="mt-5">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Total Clinics
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {loading ? "—" : metrics.totalClinics.toLocaleString()}
            </h4>
          </div>
        </div>

        {/* Active Clinics */}
        <div
          // onClick={() => navigate("/clinics/inactive")}
          className="cursor-pointer rounded-2xl border border-gray-200 bg-white p-5 transition hover:shadow-md dark:border-gray-800 dark:bg-white/[0.03] md:p-6"
        >
          <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
            {/* <BoxIconLine className="text-gray-800 size-6 dark:text-white/90" /> */}
            {/* <ClinicIcon /> */}
            <VerifiedIcon className="dark:text-gray-400"/>
          </div>

          <div className="mt-5">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Total Active Clinics
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {loading ? "—" : metrics.inActiveClinics.toLocaleString()}
            </h4>
          </div>
        </div>

        {/* Total Appointments */}
        <div
          // onClick={() => navigate("/appointments")}
          className="cursor-pointer rounded-2xl border border-gray-200 bg-white p-5 transition hover:shadow-md dark:border-gray-800 dark:bg-white/[0.03] md:p-6"
        >
          <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
            {/* <BoxIconLine className="text-gray-800 size-6 dark:text-white/90" /> */}
            {/* <AppointmentIcon /> */}
            <EventIcon className="dark:text-gray-400"/>
          </div>

          <div className="mt-5">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Total Appointment
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {loading ? "—" : metrics.totalAppointments.toLocaleString()}
            </h4>
          </div>
        </div>
      </div>
    </div>
  );
}
