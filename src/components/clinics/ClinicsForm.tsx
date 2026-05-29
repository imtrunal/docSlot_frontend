import { useEffect, useState } from 'react';
import Button from '../ui/button/Button';
import Input from '../form/input/InputField';
import { Modal } from '../ui/modal';
import { useModal } from '../../hooks/useModal';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { url } from '../../baseUrl';
import { requiredPermissions } from '../../utils/permissions';
import { dateFormat } from './../../utils/dateUtils';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';


// --------------------
// Types
// --------------------
type Clinic = {
  clinicId: string;
  clinicName: string;
  ownerName: string;
  ownerMobile: string;
  password: string;
  address: string;
  loginNumber: string;
  city: string;
  state: string;
  isActive: boolean;
};

export default function ClinicsForm() {
  const { isOpen, openModal, closeModal } = useModal();

  // pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [mode, setMode] = useState<'add' | 'view' | 'edit'>('add');
  const [selectedClinicId, setSelectedClinicId] = useState<string | null>(null);

  const [clinics, setClinics] = useState<Clinic[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  // const [openStatusMenuId, setOpenStatusMenuId] = useState<string | null>(null);

  // VIEW mode
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [appointmentStats, setAppointmentStats] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [lastLoginInfo, setLastLoginInfo] = useState<any>(null);
  // const [clinicActivities, setClinicActivities] = useState<any[]>([]);
  const [loadingView, setLoadingView] = useState(false);
  const [clinicStatus, setClinicStatus] = useState<'ACTIVE' | 'INACTIVE'>(
    'INACTIVE',
  );
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    clinicId: '',
    clinicName: '',
    ownerName: '',
    ownerMobile: '',
    password: '',
    loginNumber: '',
    address: '',
    city: '',
    state: '',
  });

  // --------------------
  // LOAD CLINICS ON PAGE LOAD (FIX FOR REFRESH ISSUE)
  // --------------------
  const fetchClinics = async () => {
    let aurl = '';

    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      if (role === 'SUPER ADMIN') {
        aurl = `${url}/admin/clinics`;
      }

      if (role === 'ADMIN') {
        aurl = `${url}/clinic/profile`;
      }

      const res = await fetch(aurl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 403) {
        toast.error("Access denied. You don't have permission.");
        return;
      }

      if (!res.ok) {
        toast.error('Failed to load clinics');
        return;
      }

      const response = await res.json();
      const rawData = response.data ?? response;

      const clinicArray = Array.isArray(rawData) ? rawData : [rawData];

      const mapped: Clinic[] = clinicArray.map((item: any) => ({
        clinicId: String(item._id),
        clinicName: item.name,
        ownerName: item.ownerName || '',
        ownerMobile: item.ownerMobile || '',
        password: '',
        address: item.address,
        loginNumber: item.loginNumber,
        city: item.city,
        state: item.state,
        isActive: item.isActive,
      }));

      setClinics(mapped);
    } catch (error) {
      console.error(error);
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClinics();
  }, []);

  // --------------------
  // Handlers
  // --------------------
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (!formData.clinicName || !formData.ownerMobile || !formData.address) {
      toast.error('All fields are required');
      return;
    }

    if (!/^[6-9]\d{9}$/.test(formData.ownerMobile)) {
      toast.error('Enter a valid 10-digit mobile number');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please login again');
      return;
    }

    const payload = {
      name: formData.clinicName,
      ownerName: formData.ownerName,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      ownerMobile: formData.ownerMobile,
      loginNumber: formData.loginNumber,
      password: formData.password,
      bookingSlug:
        formData.clinicName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
    };
    try {
      // ---------------- ADD CLINIC ----------------
      if (mode === 'add') {

        const res = await fetch(`${url}/admin/clinics`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const err = await res.text();
          console.error('Backend error:', err);
          toast.error(err || 'Failed to add clinic');
          return;
        }

        if (res.status === 403) {
          toast.error('Your clinic account is inactive. Contact admin.');
          return;
        }

        const response = await res.json();

        // Backend returns saved clinic
        const savedClinic = response?.data || response;

        // Map backend → frontend table format
        const mappedClinic: Clinic = {
          clinicId: String(savedClinic._id),
          clinicName: savedClinic.name,
          ownerName: savedClinic.ownerName,
          ownerMobile: savedClinic.ownerMobile,
          password: savedClinic.password,
          loginNumber: savedClinic.loginNumber,
          address: savedClinic.address,
          city: savedClinic.city,
          state: savedClinic.state,
          isActive: savedClinic.isActive,
        };

        console.log('Saved clinic from backend:', savedClinic);

        setClinics((prev) => {
          const exists = prev.some((c) => c.clinicId === mappedClinic.clinicId);

          if (exists) return prev;

          return [mappedClinic, ...prev];
        });

        toast.success('Clinic added successfully');
      }

      closeModal();
    } catch (error) {
      console.error(error);
      toast.error('Something went wrong');
    }
  };

  const handleView = (clinic: Clinic) => {
    setFormData(clinic); // existing data
    setMode('view'); // read-only
    setSelectedClinicId(clinic.clinicId);

    // 🔥 call API when opening popup
    fetchClinicDetails(clinic.clinicId);

    openModal();
  };


  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteClinicId, setDeleteClinicId] = useState<string | null>(null);

  const handleDelete = (clinicId: string) => {
    setDeleteClinicId(clinicId);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteClinicId) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(
        `${url}/admin/clinics/${deleteClinicId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      await res.json();
      if (!res.ok) {
        const err = await res.text();
        toast.error(err || 'Failed to delete clinic');
        return;
      }

      fetchClinics();
      toast.success('Clinic deleted successfully');
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete clinic');
    } finally {
      setConfirmOpen(false);
      setDeleteClinicId(null);
    }
  };
  // search
  const filteredClinics = clinics.filter(
    (clinic) =>
      clinic.clinicName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clinic.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clinic.ownerMobile.includes(searchTerm),
  );

  // status toggle
  const updateClinicStatus = async (
    clinic: Clinic,
    desiredStatus: true | false,
  ) => {
    if (!clinic.clinicId) {
      toast.error('Clinic ID missing');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please login again');
      return;
    }
    // update status 
    try {
      const res = await fetch(
        `${url}/admin/clinics/${clinic.clinicId}/status`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            isActive: desiredStatus === true,
          }),
        },
      );

      if (!res.ok) {
        const err = await res.text();
        console.error('Backend error:', err);
        toast.error(err || 'Failed to update status');
        return;
      }

      const response = await res.json();

      //  Backend is the source of truth
      const isActive = response?.data?.isActive ?? response?.isActive;

      setClinics((prev) =>
        prev.map((c) =>
          c.clinicId === clinic.clinicId ? { ...c, isActive: isActive } : c,
        ),
      );

      toast.success(`Clinic ${isActive ? 'Activeted' : 'Inactiveted'}`);
    } catch (error) {
      console.error(error);
      toast.error('Something went wrong');
    }
  };

  // view api
  const fetchClinicDetails = async (clinicId: string) => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please login again');
      return;
    }

    try {
      setLoadingView(true);

      const res = await fetch(`${url}/admin/clinics/${clinicId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log(res);

      if (!res.ok) {
        toast.error('Failed to load clinic details');
        return;
      }

      const data = await res.json();
      console.log(data);

      // 🔹 map API response
      const isActive = data?.data?.isActive ?? data?.isActive ?? false;

      // 🔹 SET STATUS FOR VIEW
      setClinicStatus(isActive ? 'ACTIVE' : 'INACTIVE');

      // 🔹 OPTIONAL (if present)
      setAppointmentStats(data?.data?.appointmentStats || null);
      setLastLoginInfo(data?.data?.lastLoginInfo || null);
    } catch (error) {
      console.error(error);
      toast.error('Something went wrong');
    } finally {
      setLoadingView(false);
    }
  };

  return (
    <>
      <div>
        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
            Clinics
          </h2>

          {requiredPermissions('clinic:create') && (
            <Button
              className="dark:bg-gray-700"
              size="sm"
              onClick={() => {
                setMode('add');
                setSelectedClinicId(null);
                setFormData({
                  clinicId: '',
                  clinicName: '',
                  ownerName: '',
                  ownerMobile: '',
                  password: '',
                  loginNumber: '',
                  address: '',
                  city: '',
                  state: '',
                });
                openModal();
              }}
            >
              + New Clinic
            </Button>
          )}
        </div>

        {/* TABLE */}
        <div className="relative mb-3 max-w-[600px] min-w-[200px] ">
          <button className="absolute -translate-y-1/2 left-4 top-1/2">
            <svg
              className="fill-gray-500 dark:fill-gray-400"
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M3.04175 9.37363C3.04175 5.87693 5.87711 3.04199 9.37508 3.04199C12.8731 3.04199 15.7084 5.87693 15.7084 9.37363C15.7084 12.8703 12.8731 15.7053 9.37508 15.7053C5.87711 15.7053 3.04175 12.8703 3.04175 9.37363ZM9.37508 1.54199C5.04902 1.54199 1.54175 5.04817 1.54175 9.37363C1.54175 13.6991 5.04902 17.2053 9.37508 17.2053C11.2674 17.2053 13.003 16.5344 14.357 15.4176L17.177 18.238C17.4699 18.5309 17.9448 18.5309 18.2377 18.238C18.5306 17.9451 18.5306 17.4703 18.2377 17.1774L15.418 14.3573C16.5365 13.0033 17.2084 11.2669 17.2084 9.37363C17.2084 5.04817 13.7011 1.54199 9.37508 1.54199Z"
                fill=""
              />
            </svg>
          </button>
          <input
            placeholder="Search clinic.."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-200 bg-transparent py-2.5 pl-12 pr-14 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:bg-white/[0.03] dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 xl:w-[500px] lg:w-[450px] md:w-[350px]"
          />
        </div>

        <div className="rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr style={{ background: "#465FFF" }}>
                  <th className="text-left px-4 py-4 text-xs font-semibold uppercase tracking-widest text-white/80 w-[14%]">Clinic Name</th>
                  <th className="text-left px-4 py-4 text-xs font-semibold uppercase tracking-widest text-white/80 w-[12%]">Owner Name</th>
                  <th className="text-left px-4 py-4 text-xs font-semibold uppercase tracking-widest text-white/80 w-[12%]">Owner Mobile</th>
                  <th className="text-left px-4 py-4 text-xs font-semibold uppercase tracking-widest text-white/80 w-[18%]">Address</th>
                  <th className="text-left px-4 py-4 text-xs font-semibold uppercase tracking-widest text-white/80 w-[12%]">Login Number</th>
                  <th className="text-left px-4 py-4 text-xs font-semibold uppercase tracking-widest text-white/80 w-[9%]">City</th>
                  <th className="text-left px-4 py-4 text-xs font-semibold uppercase tracking-widest text-white/80 w-[9%]">State</th>
                  <th className="text-left px-4 py-4 text-xs font-semibold uppercase tracking-widest text-white/80 w-[8%]">Status</th>
                  <th className="text-center px-4 py-4 text-xs font-semibold uppercase tracking-widest text-white/80 w-[6%]">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {loading ? (
                  [...Array(8)].map((_, index) => (
                    <tr key={index}>
                      {/* Clinic Name */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5 animate-pulse">
                          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700" />
                          <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700" />
                        </div>
                      </td>

                      {/* Owner Name */}
                      <td className="px-4 py-3.5">
                        <div className="h-4 w-20 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
                      </td>

                      {/* Mobile */}
                      <td className="px-4 py-3.5">
                        <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
                      </td>

                      {/* Address */}
                      <td className="px-4 py-3.5">
                        <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
                      </td>

                      {/* Login Number */}
                      <td className="px-4 py-3.5">
                        <div className="h-6 w-20 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
                      </td>

                      {/* City */}
                      <td className="px-4 py-3.5">
                        <div className="h-4 w-16 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
                      </td>

                      {/* State */}
                      <td className="px-4 py-3.5">
                        <div className="h-4 w-16 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <div className="h-5 w-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5">
                        <div className="flex justify-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" />
                          <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" />
                        </div>
                      </td>
                    </tr>
                  ))
                ) : filteredClinics.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center mb-1" style={{ background: "#eef0ff" }}>
                          <svg className="w-6 h-6" style={{ color: "#465FFF" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No clinics found</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">Try adjusting your search or filters</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredClinics
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((clinic) => (
                      <tr key={clinic.clinicId} className="group hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-150">

                        {/* Clinic Name */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                              style={{ background: "#eef0ff", color: "#465FFF" }}
                            >
                              {clinic.clinicName?.charAt(0)?.toUpperCase()}
                            </div>
                            <span className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[100px]">
                              {clinic.clinicName}
                            </span>
                          </div>
                        </td>

                        {/* Owner Name */}
                        <td className="px-4 py-3.5">
                          <span className="text-sm text-gray-600 dark:text-gray-400">{clinic.ownerName}</span>
                        </td>

                        {/* Owner Mobile */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <span className="text-sm text-gray-600 dark:text-gray-400">{clinic.ownerMobile}</span>
                          </div>
                        </td>

                        {/* Address */}
                        <td className="px-4 py-3.5">
                          <span className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1 max-w-[160px] block" title={clinic.address}>
                            {clinic.address}
                          </span>
                        </td>

                        {/* Login Number */}
                        <td className="px-4 py-3.5">
                          <span
                            className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
                            style={{ background: "#eef0ff", color: "#465FFF" }}
                          >
                            {clinic.loginNumber}
                          </span>
                        </td>

                        {/* City */}
                        <td className="px-4 py-3.5">
                          <span className="text-sm text-gray-600 dark:text-gray-400">{clinic.city}</span>
                        </td>

                        {/* State */}
                        <td className="px-4 py-3.5">
                          <span className="text-sm text-gray-600 dark:text-gray-400">{clinic.state}</span>
                        </td>

                        {/* Status toggle */}
                        <td className="px-4 py-3.5">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={clinic.isActive === true}
                              onChange={(e) => updateClinicStatus(clinic, e.target.checked)}
                            />
                            <div className="w-10 h-5 bg-gray-200 dark:bg-gray-700 rounded-full peer
                    peer-checked:bg-emerald-500
                    after:content-[''] after:absolute after:top-[2px] after:left-[2px]
                    after:bg-white after:rounded-full after:h-4 after:w-4
                    after:transition-all peer-checked:after:translate-x-5
                    transition-colors duration-200" />
                          </label>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center justify-center gap-1">
                            {requiredPermissions('clinic:view') && (
                              <button
                                onClick={() => handleView(clinic)}
                                title="View"
                                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150
                        text-gray-400 hover:text-[#465FFF] hover:bg-[#eef0ff]
                        dark:text-gray-500 dark:hover:text-[#7B91FF] dark:hover:bg-[#465FFF]/10"
                              >
                                <svg className="w-[15px] h-[15px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                            )}

                            {requiredPermissions('clinic:delete') && (
                              <button
                                onClick={() => handleDelete(clinic.clinicId)}
                                title="Delete"
                                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150
                        text-gray-400 hover:text-red-500 hover:bg-red-50
                        dark:text-gray-500 dark:hover:text-red-400 dark:hover:bg-red-500/10"
                              >
                                <svg className="w-[15px] h-[15px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
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
                  {page * rowsPerPage + 1}–{Math.min((page + 1) * rowsPerPage, filteredClinics.length)}
                </span>
                {" "}of{" "}
                <span className="font-semibold text-gray-700 dark:text-gray-200">{filteredClinics.length}</span>
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
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7M18 19l-7-7 7-7" />
                  </svg>
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
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                {/* Page pills */}
                {(() => {
                  const totalPages = Math.ceil(filteredClinics.length / rowsPerPage);
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
                  onClick={() => setPage((p) => Math.min(Math.ceil(filteredClinics.length / rowsPerPage) - 1, p + 1))}
                  disabled={page >= Math.ceil(filteredClinics.length / rowsPerPage) - 1}
                  title="Next page"
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 dark:text-gray-500
          hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200
          disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {/* Last */}
                <button
                  onClick={() => setPage(Math.ceil(filteredClinics.length / rowsPerPage) - 1)}
                  disabled={page >= Math.ceil(filteredClinics.length / rowsPerPage) - 1}
                  title="Last page"
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 dark:text-gray-500
          hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200
          disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M6 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* MODAL */}
        <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[600px]">
          <div className="dark:bg-gray-900">

            {/* ── Header ── */}
            <div className="flex items-center gap-4 px-6 py-5" style={{ background: "#465FFF" }}>
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(255,255,255,0.2)" }}
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-base m-0">
                  {mode === 'add' && 'New Clinic'}
                  {mode === 'edit' && 'Edit Clinic'}
                  {mode === 'view' && 'Clinic Details'}
                </p>
                <p className="text-white/60 text-xs mt-0.5 m-0">
                  {mode === 'view' ? 'Full clinic information & activity' : mode === 'edit' ? 'Update clinic details' : 'Fill in the details below'}
                </p>
              </div>
            </div>

            {/* ── Body ── */}
            <div className="p-6 overflow-y-auto max-h-[65vh]">

              {/* ── ADD / EDIT MODE ── */}
              {mode !== 'view' && (
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Clinic Name <span className="text-red-500">*</span></label>
                    <Input name="clinicName" value={formData.clinicName} onChange={handleChange} placeholder='Enter Clinic Name' />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Owner Name <span className="text-red-500">*</span></label>
                    <Input name="ownerName" value={formData.ownerName} onChange={handleChange} placeholder='Enter Owner Name' />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Login Number <span className="text-red-500">*</span></label>
                      <Input name="loginNumber" value={formData.loginNumber} onChange={handleChange} maxLength={10} placeholder='Enter Login Number' />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Password <span className="text-red-500">*</span></label>
                      <Input name="password" type="password" value={formData.password} onChange={handleChange} placeholder='Enter Password' />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Owner Mobile <span className="text-red-500">*</span></label>
                    <Input name="ownerMobile" value={formData.ownerMobile} onChange={handleChange} maxLength={10} placeholder='Enter Owner Mobile' />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Clinic Address <span className="text-red-500">*</span></label>
                    <Input name="address" value={formData.address} onChange={handleChange} placeholder='Enter Clinic Address' />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">City <span className="text-red-500">*</span></label>
                      <Input name="city" value={formData.city} onChange={handleChange} placeholder='Enter City' />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">State <span className="text-red-500">*</span></label>
                      <Input name="state" value={formData.state} onChange={handleChange} placeholder='Enter State' />
                    </div>
                  </div>
                </div>
              )}

              {/* ── VIEW MODE ── */}
              {mode === 'view' && (
                <div className="flex flex-col gap-4">

                  {/* Clinic Info Grid */}
                  <div className="grid grid-cols-2 gap-px bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800">
                    {[
                      {
                        label: 'Clinic Name',
                        icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
                        value: formData.clinicName,
                      },
                      {
                        label: 'Owner Name',
                        icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
                        value: formData.ownerName || '—',
                      },
                      {
                        label: 'Owner Mobile',
                        icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z',
                        value: formData.ownerMobile,
                      },
                      {
                        label: 'Login Number',
                        icon: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z',
                        value: formData.loginNumber,
                      },
                      {
                        label: 'Address',
                        icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z',
                        value: `${formData.address}, ${formData.city}, ${formData.state}`,
                        full: true,
                      },
                    ].map((field) => (
                      <div
                        key={field.label}
                        className={`bg-white dark:bg-gray-900 px-5 py-4 ${field.full ? 'col-span-2' : ''}`}
                      >
                        <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2 m-0">
                          <svg className="w-3 h-3 flex-shrink-0" style={{ color: '#465FFF' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={field.icon} />
                          </svg>
                          {field.label}
                        </p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white m-0">{field.value || '—'}</p>
                      </div>
                    ))}
                  </div>

                  {/* Appointment Statistics */}
                  <div className="border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                      <svg className="w-4 h-4 flex-shrink-0" style={{ color: '#465FFF' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400 m-0">Appointment Statistics</p>
                    </div>
                    <div className="p-4 bg-white dark:bg-gray-900">
                      {loadingView ? (
                        <p className="text-sm text-gray-400 m-0">Loading...</p>
                      ) : appointmentStats ? (
                        <div className="grid grid-cols-4 gap-3">
                          {[
                            { label: 'Total', value: appointmentStats.totalAppointments.length, color: '#465FFF', bg: '#eef0ff' },
                            { label: 'Today', value: appointmentStats.todayAppointments.length, color: '#0ea5e9', bg: '#e0f2fe' },
                            { label: 'Completed', value: appointmentStats.completedAppointments.length, color: '#16a34a', bg: '#dcfce7' },
                            {
                              label: 'Cancelled',
                              value:
                                appointmentStats.totalAppointments.length -
                                appointmentStats.completedAppointments.length -
                                appointmentStats.pendingAppointments.length,
                              color: '#e05252',
                              bg: '#fff0f0',
                            },
                          ].map((stat) => (
                            <div
                              key={stat.label}
                              className="rounded-lg px-3 py-3 flex flex-col gap-1"
                              style={{ background: stat.bg }}
                            >
                              <span className="text-xl font-semibold" style={{ color: stat.color }}>{stat.value}</span>
                              <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: stat.color, opacity: 0.75 }}>{stat.label}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400 m-0">No data available</p>
                      )}
                    </div>
                  </div>

                  {/* Last Login Info */}
                  <div className="border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                      <svg className="w-4 h-4 flex-shrink-0" style={{ color: '#465FFF' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400 m-0">Last Login Info</p>
                    </div>
                    <div className="p-4 bg-white dark:bg-gray-900">
                      {lastLoginInfo ? (
                        <div className="flex flex-col gap-2">
                          {[
                            { label: 'IP Address', value: lastLoginInfo.ipAddress?.replace('::ffff:', '') },
                            { label: 'User Agent', value: lastLoginInfo.userAgent },
                            { label: 'Login At', value: dateFormat(lastLoginInfo.loginAt) },
                          ].map((item) => (
                            <div key={item.label} className="flex items-start justify-between gap-4">
                              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{item.label}</span>
                              <span className="text-xs text-gray-700 dark:text-gray-300 text-right break-all">{item.value}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400 m-0">No login data</p>
                      )}
                    </div>
                  </div>

                  {/* Clinic Activity / Status */}
                  <div className="border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                      <svg className="w-4 h-4 flex-shrink-0" style={{ color: '#465FFF' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400 m-0">Clinic Activity</p>
                    </div>
                    <div className="p-4 bg-white dark:bg-gray-900 flex items-center gap-3">
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</span>
                      <span
                        className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full"
                        style={
                          clinicStatus === 'ACTIVE'
                            ? { background: '#dcfce7', color: '#16a34a' }
                            : { background: '#fff0f0', color: '#e05252' }
                        }
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full inline-block"
                          style={{ background: clinicStatus === 'ACTIVE' ? '#16a34a' : '#e05252' }}
                        />
                        {clinicStatus}
                      </span>
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
              {mode !== 'view' && (
                <button
                  onClick={handleSave}
                  className="px-5 py-2 text-sm font-semibold rounded-lg text-white transition hover:opacity-90"
                  style={{ background: '#465FFF' }}
                >
                  {mode === 'edit' ? 'Update Clinic' : 'Save Clinic'}
                </button>
              )}
            </div>

          </div>
        </Modal>

        <Dialog
          open={confirmOpen}
          onClose={() => setConfirmOpen(false)}
        >
          <div className="dark:bg-gray-800 dark:text-white">
            <DialogTitle>Delete Clinic</DialogTitle>

            <DialogContent>
              Are you sure you want to delete this clinic?
            </DialogContent>

            <DialogActions>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setConfirmOpen(false)}
              >
                Cancel
              </Button>

              <Button size="sm" onClick={confirmDelete}>
                Yes, Delete
              </Button>
            </DialogActions>
          </div>
        </Dialog>

      </div>
    </>
  );
}
