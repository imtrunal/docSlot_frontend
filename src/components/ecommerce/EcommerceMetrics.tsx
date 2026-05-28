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

  // return (
  //   <div className="p-6 sameCSS ml-0 md:ml-[260px] lg:ml-0 sm:ml-[100px] xs:ml-[100px] transition-all duration-300">
  //     <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 md:gap-6">
  //       {/* Total Clinics */}
  //       <div
  //         // onClick={() => navigate("/clinics/total")}
  //         className="cursor-pointer rounded-2xl border border-gray-200 bg-white p-5 transition hover:shadow-md dark:border-gray-800 dark:bg-white/[0.03] md:p-6"
  //       >
  //         <div className="flex items-center text-brand-500  bg-brand-500/10 justify-center w-12 h-12 rounded-xl dark:bg-gray-800">
  //           {/* <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />           */}
  //           {/* <ClinicIcon /> */}
  //           <ApartmentIcon className="dark:text-gray-400"/>
  //         </div>

  //         <div className="mt-5">
  //           <span className="text-sm text-gray-500 dark:text-gray-400">
  //             Total Clinics
  //           </span>
  //           <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
  //             {loading ? "—" : metrics.totalClinics.toLocaleString()}
  //           </h4>
  //         </div>
  //       </div>

  //       {/* Active Clinics */}
  //       <div
  //         // onClick={() => navigate("/clinics/inactive")}
  //         className="cursor-pointer rounded-2xl border border-gray-200 bg-white p-5 transition hover:shadow-md dark:border-gray-800 dark:bg-white/[0.03] md:p-6"
  //       >
  //         <div className="flex items-center text-brand-500  bg-brand-500/10 justify-center w-12 h-12 rounded-xl dark:bg-gray-800">
  //           {/* <BoxIconLine className="text-gray-800 size-6 dark:text-white/90" /> */}
  //           {/* <ClinicIcon /> */}
  //           <VerifiedIcon className="dark:text-gray-400"/>
  //         </div>

  //         <div className="mt-5">
  //           <span className="text-sm text-gray-500 dark:text-gray-400">
  //             Total Active Clinics
  //           </span>
  //           <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
  //             {loading ? "—" : metrics.inActiveClinics.toLocaleString()}
  //           </h4>
  //         </div>
  //       </div>

  //       {/* Total Appointments */}
  //       <div
  //         // onClick={() => navigate("/appointments")}
  //         className="cursor-pointer rounded-2xl border border-gray-200 bg-white p-5 transition hover:shadow-md dark:border-gray-800 dark:bg-white/[0.03] md:p-6"
  //       >
  //         <div className="flex items-center text-brand-500  bg-brand-500/10 justify-center w-12 h-12 rounded-xl dark:bg-gray-800">
  //           {/* <BoxIconLine className="text-gray-800 size-6 dark:text-white/90" /> */}
  //           {/* <AppointmentIcon /> */}
  //           <EventIcon className="dark:text-gray-400"/>
  //         </div>

  //         <div className="mt-5">
  //           <span className="text-sm text-gray-500 dark:text-gray-400">
  //             Total Appointment
  //           </span>
  //           <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
  //             {loading ? "—" : metrics.totalAppointments.toLocaleString()}
  //           </h4>
  //         </div>
  //       </div>
  //     </div>
  //   </div>
  // );

  return (
    <div className="p-6 ml-0 md:ml-[260px] lg:ml-0 sm:ml-[100px] xs:ml-[100px] transition-all duration-300">
      {/* header  */}
        <div className="pb-6">
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Welcome back! Here’s an overview of your clinic’s performance.
          </p>
        </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 md:gap-6">


        {/* Total Clinics */}
        <div className="rounded-2xl border border-gray-100 bg-white dark:border-white/10 dark:bg-white/[0.03] p-5 md:p-6 group hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10">
              <ApartmentIcon style={{ fontSize: 20 }} className="text-indigo-500 dark:text-indigo-400" />
            </div>
            <span className="text-xs font-medium text-indigo-400 dark:text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 px-2.5 py-1 rounded-full">
              All time
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">
              Total Clinics
            </p>
            <h4 className="mt-1 text-2xl font-semibold text-gray-800 dark:text-white/90 tabular-nums">
              {loading ? (
                <span className="inline-block w-16 h-7 bg-gray-100 dark:bg-white/10 rounded animate-pulse" />
              ) : (
                metrics.totalClinics.toLocaleString()
              )}
            </h4>
          </div>
        </div>

        {/* Active Clinics */}
        <div className="rounded-2xl border border-gray-100 bg-white dark:border-white/10 dark:bg-white/[0.03] p-5 md:p-6 group hover:border-emerald-200 dark:hover:border-emerald-500/30 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10">
              <VerifiedIcon style={{ fontSize: 20 }} className="text-emerald-500 dark:text-emerald-400" />
            </div>
            <span className="text-xs font-medium text-emerald-500 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-full">
              Active
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">
              Active Clinics
            </p>
            <h4 className="mt-1 text-2xl font-semibold text-gray-800 dark:text-white/90 tabular-nums">
              {loading ? (
                <span className="inline-block w-16 h-7 bg-gray-100 dark:bg-white/10 rounded animate-pulse" />
              ) : (
                metrics.inActiveClinics.toLocaleString()
              )}
            </h4>
          </div>
        </div>

        {/* Total Appointments */}
        <div className="rounded-2xl border border-gray-100 bg-white dark:border-white/10 dark:bg-white/[0.03] p-5 md:p-6 group hover:border-violet-200 dark:hover:border-violet-500/30 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-500/10">
              <EventIcon style={{ fontSize: 20 }} className="text-violet-500 dark:text-violet-400" />
            </div>
            <span className="text-xs font-medium text-violet-500 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10 px-2.5 py-1 rounded-full">
              Booked
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">
              Total Appointments
            </p>
            <h4 className="mt-1 text-2xl font-semibold text-gray-800 dark:text-white/90 tabular-nums">
              {loading ? (
                <span className="inline-block w-16 h-7 bg-gray-100 dark:bg-white/10 rounded animate-pulse" />
              ) : (
                metrics.totalAppointments.toLocaleString()
              )}
            </h4>
          </div>
        </div>

      </div>
    </div>
  );

}
