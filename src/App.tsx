import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

import SignIn from './pages/AuthPages/SignIn';
import NotFound from './pages/OtherPage/NotFound';

import UserProfiles from './pages/UserProfiles';
import Videos from './pages/UiElements/Videos';
import Images from './pages/UiElements/Images';
import Alerts from './pages/UiElements/Alerts';
import Badges from './pages/UiElements/Badges';
import Avatars from './pages/UiElements/Avatars';
import Buttons from './pages/UiElements/Buttons';
import LineChart from './pages/Charts/LineChart';
import BarChart from './pages/Charts/BarChart';
import Calendar from './pages/Calender/Calendar';
import BasicTables from './pages/Tables/BasicTables';
import FormElements from './pages/Forms/FormElements';
import Blank from './pages/Blank';

import AppLayout from './layout/AppLayout';
import { ScrollToTop } from './components/common/ScrollToTop';
import Home from './pages/Dashboard/Home';
import EcommerceMetrics from './components/ecommerce/EcommerceMetrics';

// 🔒 AUTH
// import ProtectedRoute from './components/auth/ProtectedRoute';
import AppointmentCard from './components/appointment/AppointmentTable';

import ClinicsForm from './components/clinics/ClinicsForm';
import ClinicDashboard from './pages/ClinicDashboard/ClinicDashboard';
import ClinicProtectedRoute from './components/auth/ClinicProtectedRoute';
import ClinicAppointment from './components/clinicDashboard/ClinicAppointment';
import ResetPassword from './components/header/ResetPassword';
// import { authFetch } from "./api/authFetch";
import { useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

let isRedirecting = false;

export default function App() {
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).__FETCH_PATCHED__) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).__FETCH_PATCHED__ = true;

    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
      const response = await originalFetch(...args);

      // clone response so app can still read it
      const cloned = response.clone();

      try {
        const data = await cloned.json();

        if ((response.status === 401 || data?.code === 401) && !isRedirecting) {
          isRedirecting = true;
          localStorage.clear();
          toast.error(data.errorMessage || 'Session expired');
          setTimeout(() => {
            window.location.href = '/signin';
          }, 2000);
        }
      } catch {
        throw new Error('Session expired');
        // ignore json parse errors
      }

      return response;
    };
  }, []);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      const activeElement = document.activeElement as HTMLInputElement | null;

      if (activeElement?.type === 'number') {
        e.preventDefault();
      }
    };

    document.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      document.removeEventListener('wheel', handleWheel);
    };
  }, []);

  return (
    <>
      <Router>
        <ScrollToTop />

        <Routes>
          <Route path="/" element={<Navigate to="/signin" replace />} />

          {/* 🔹 SIGN IN */}
          <Route path="/signin" element={<SignIn />} />

          {/* 🔒 PROTECTED ROUTES */}
          {/* <Route element={<ProtectedRoute />}> */}
            <Route element={<AppLayout />}>
              {/* DASHBOARD */}
              <Route path="/dashboard" element={<Home />} />
              <Route path="/ecommercemetrics" element={<EcommerceMetrics />} />
              {/* <Route path="/clinic-dashboard" element={<ClinicDashboard />} /> */}
              <Route
                path="/clinic-dashboard"
                element={
                  <ClinicProtectedRoute>
                    <ClinicDashboard />
                  </ClinicProtectedRoute>
                }
              />

              {/* ✅ CLINIC ROUTES (ADDED, NO CHANGE) */}
              <Route path="clinicAppointment" element={<ClinicAppointment />} />

              {/* EXISTING ROUTES */}
              <Route path="/users" element={<UserProfiles />} />
              <Route path="/appointment" element={<AppointmentCard />} />
              <Route path="/clinics" element={<ClinicsForm />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/blank" element={<Blank />} />
              <Route path="/resetPassword" element={<ResetPassword />} />

              <Route path="/form-elements" element={<FormElements />} />
              <Route path="/basic-tables" element={<BasicTables />} />

              <Route path="/alerts" element={<Alerts />} />
              <Route path="/avatars" element={<Avatars />} />
              <Route path="/badge" element={<Badges />} />
              <Route path="/buttons" element={<Buttons />} />
              <Route path="/images" element={<Images />} />
              <Route path="/videos" element={<Videos />} />

              <Route path="/line-chart" element={<LineChart />} />
              <Route path="/bar-chart" element={<BarChart />} />
            </Route>
          {/* </Route> */}

          {/* 🔹 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
      <ToastContainer
        position="top-right"
        autoClose={2000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        style={{ zIndex: 99999 }}
      />
    </>
  );
}
