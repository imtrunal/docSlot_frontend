import {  useEffect, useState } from 'react';
import Button from '../ui/button/Button';
import Input from '../form/input/InputField';
import Label from '../form/Label';
import { Modal } from '../ui/modal';
import { useModal } from '../../hooks/useModal';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableHead from '@mui/material/TableHead';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
// import TablePagination from "@mui/material/TablePagination";
import { TablePagination } from '../ui/table/TablePagination';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { url } from '../../baseUrl';
import { TrashBinIcon } from '../../icons';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import Paper from '@mui/material/Paper';
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
  const [rowsPerPage, setRowsPerPage] = useState(5);

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
    if (!token) return;

    try {
      if (role === 'SUPER ADMIN') {
        aurl = `${url}/admin/clinics`;
      }

      // ✅ CLINIC → own clinic only
      if (role === 'ADMIN') {
        aurl = `${url}/clinic/profile`; // or /clinic/me
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
      // const data = response.data ?? response;
      const rawData = response.data ?? response;

      const clinicArray = Array.isArray(rawData) ? rawData : [rawData];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

        // setClinics((prev) => [...prev, mappedClinic]);
        setClinics((prev) => {
          const exists = prev.some((c) => c.clinicId === mappedClinic.clinicId);

          if (exists) return prev;

          return [mappedClinic, ...prev];
        });

        toast.success('Clinic added successfully');
      } 
      // else if (mode === 'edit' && selectedClinicId) {
      //   // update clinic 
      //   const res = await fetch(`${url}/admin/clinics/${selectedClinicId}`, {
      //     method: 'PUT',
      //     headers: {
      //       'Content-Type': 'application/json',
      //       Authorization: `Bearer ${token}`,
      //     },
      //     body: JSON.stringify(payload),
      //   });

        

      //   if (!res.ok) {
      //     const err = await res.text();
      //     toast.error(err || 'Failed to update clinic');
      //     return;
      //   }

      //   const response = await res.json();
      //   const updated = response.data || response;

      //   setClinics((prev) =>
      //     prev.map((c) =>
      //       c.clinicId === selectedClinicId
      //         ? {
      //           ...c,
      //           clinicName: updated.name,
      //           ownerName: updated.ownerName,
      //           ownerMobile: updated.ownerMobile,
      //           // loginNumber: updated.loginNumber,
      //           address: updated.address,
      //           city: updated.city,
      //           state: updated.state,
      //         }
      //         : c,
      //     ),
      //   );

      //   toast.success('Clinic updated successfully');
      // }

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

  // const handleEdit = (clinic: Clinic) => {
  //   setFormData({
  //     clinicId: clinic.clinicId,
  //     clinicName: clinic.clinicName,
  //     ownerName: clinic.ownerName,
  //     ownerMobile: clinic.ownerMobile,
  //     password: '',
  //     loginNumber: clinic.loginNumber,
  //     address: clinic.address,
  //     city: clinic.city,
  //     state: clinic.state,
  //   });
  //   setMode('edit');
  //   setSelectedClinicId(clinic.clinicId);
  //   openModal();
  // };

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



  // const handleDelete = async (clinicId: string) => {
  //   if (!confirm('Are you sure you want to delete this clinic?')) return;
  //   const token = localStorage.getItem('token');
  //   if (!token) return;
  //   console.log('hello');

  //   const res = await fetch(`${url}/admin/clinics/${clinicId}`, {
  //     method: 'DELETE',
  //     headers: {
  //       // "Content-Type": "application/json",
  //       Authorization: `Bearer ${token}`,
  //     },
  //   });
  //   console.log('full ', res);

  //   const data = await res.json();
  //   console.log('delete api', data);

  //   // setClinics(clinics.filter((c) => c.clinicId !== clinicId));
  //   fetchClinics();
  // };

  // pagination handlers
  // const handleChangePage = useCallback((_e: unknown, newPage: number) => {
  //   setPage(newPage);
  // }, []);

  // const handleChangeRowsPerPage = useCallback(
  //   (event: React.ChangeEvent<HTMLInputElement>) => {
  //     setRowsPerPage(parseInt(event.target.value, 10));
  //     setPage(0);
  //   },
  //   [],
  // );

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
    <div className="p-6 sameCSS ml-0 md:ml-[260px] lg:ml-0 sm:ml-[100px] xs:ml-[100px] transition-all duration-300 ">
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

      <div className="w-full overflow-x-auto ">
        <Card className="min-w-[800px]">
          <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
            <Table className="dark:bg-gray-900" aria-label="simple table">
              <TableHead>
                <TableRow sx={{ overflowX: 'auto' }}>
                  <TableCell className="dark:text-gray-400 !p-3">
                    Clinic Name
                  </TableCell>
                  <TableCell className="dark:text-gray-400 !p-3">
                    Owner Name
                  </TableCell>
                  <TableCell className="dark:text-gray-400 !p-3">
                    Owner Mobile
                  </TableCell>
                  <TableCell className="dark:text-gray-400 !p-3">Address</TableCell>
                  {/* <TableCell>Password</TableCell> */}
                  <TableCell className="dark:text-gray-400 !p-3">
                    Login Number
                  </TableCell>
                  <TableCell className="dark:text-gray-400 !p-3">City</TableCell>
                  <TableCell className="dark:text-gray-400 !p-3">State</TableCell>
                  <TableCell className="dark:text-gray-400 !p-3">Status</TableCell>
                  <TableCell className="dark:text-gray-400 !p-3" align="center">
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {filteredClinics
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((clinic) => (
                    <TableRow key={clinic.clinicId}>
                      <TableCell className="dark:text-gray-400 !p-2">
                        {clinic.clinicName}
                      </TableCell>
                      <TableCell className="dark:text-gray-400 !p-2">
                        {clinic.ownerName}
                      </TableCell>
                      <TableCell className="dark:text-gray-400 !p-2">
                        {clinic.ownerMobile}
                      </TableCell>
                      <TableCell className="dark:text-gray-400 !p-2">
                        {clinic.address}
                      </TableCell>
                      {/* <TableCell>{clinic.password}</TableCell> */}
                      <TableCell className="dark:text-gray-400 !p-2">
                        {clinic.loginNumber}
                      </TableCell>
                      <TableCell className="dark:text-gray-400 !p-2">
                        {clinic.city}
                      </TableCell>
                      <TableCell className="dark:text-gray-400 !p-2">
                        {clinic.state}
                      </TableCell>
                      <TableCell className="dark:text-gray-400 !p-2">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={clinic.isActive === true}
                            onChange={(e) =>
                              updateClinicStatus(clinic, e.target.checked)
                            }
                          />
                          <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:bg-green-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                          {/* <span className="ml-3 text-sm font-medium">
                          {clinic.status}
                        </span> */}
                        </label>
                      </TableCell>

                      <TableCell className="dark:text-gray-400" align="center">
                        <div className="flex justify-center items-center gap-2">
                          {requiredPermissions('clinic:view') && (
                            <RemoveRedEyeIcon
                              className="text-2xl cursor-pointer"
                              onClick={() => handleView(clinic)}
                            />
                          )}

                          {/* {requiredPermissions("clinic:status_change") && (
                              <PencilIcon
                              onClick={() => handleEdit(clinic)}
                              className="text-2xl"
                            />
                            )} */}
                          {requiredPermissions('clinic:delete') && (
                            <TrashBinIcon
                              className="text-2xl cursor-pointer"
                              onClick={() => handleDelete(clinic.clinicId)}
                            />
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}

                {clinics.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center" className="dark:text-gray-400">
                      No Clinics found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            totalItems={clinics.length}
            currentPage={page + 1}
            rowsPerPage={rowsPerPage}
            onPageChange={(p) => setPage(p - 1)}
            onRowsPerPageChange={(size) => {
              setRowsPerPage(size);
              setPage(0);
            }}
          />
        </Card>
      </div>

      {/* MODAL */}
      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        className="max-w-[600px] m-4 mt-15 max-h-[600px]"
      >
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
            {mode === 'add' && 'New Clinic'}
            {mode === 'edit' && 'Edit Clinic'}
            {mode === 'view' && 'View Clinic'}
          </h3>

          {mode !== 'view' && (
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label>Clinic Name</Label>
                <Input
                  name="clinicName"
                  value={formData.clinicName}
                  onChange={handleChange}
                />
              </div>

              <div>
                <Label>Owner Name</Label>
                <Input
                  name="ownerName"
                  value={formData.ownerName}
                  onChange={handleChange}
                />
              </div>

              <div className="w-full gap-7 flex">
                <div className="w-full">
                  <Label>Login Number</Label>
                  <Input
                    className="border-gray-300 rounded-lg"
                    name="loginNumber"
                    value={formData.loginNumber}
                    onChange={handleChange}
                    maxLength={10}
                  />
                </div>
                <div className="w-full">
                  <Label>Password</Label>
                  <Input
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="w-full">
                <Label>Owner Mobile</Label>
                <Input
                  className="border-gray-300 rounded-lg "
                  name="ownerMobile"
                  value={formData.ownerMobile}
                  onChange={handleChange}
                  maxLength={10}
                />
              </div>

              <div>
                <Label>Clinic Address</Label>
                <Input
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>

              <div className="w-full flex gap-7">
                <div className="w-full">
                  <Label>City</Label>
                  <Input
                    className="border-gray-300 rounded-lg"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                  />
                </div>

                <div className="w-full">
                  <Label>State</Label>
                  <Input
                    className="border-gray-300 rounded-lg"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          )}

          {mode === 'view' && (
            <div className="mt-6">
              <div className="border dark:border-dark rounded-xl p-5 bg-gray-50 dark:bg-gray-800 dark:border-gray-500">
                <h4 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
                  Clinic Details
                </h4>

                <div className="grid  grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium dark:text-white">Clinic Name:</span>
                    <p className="text-gray-600 dark:text-gray-300">
                      {formData.clinicName}
                    </p>
                  </div>

                  <div>
                    <span className="font-medium dark:text-white">Owner Name:</span>
                    <p className="text-gray-600 dark:text-gray-300">
                      {formData.ownerName || '-'}
                    </p>
                  </div>

                  <div>
                    <span className="font-medium dark:text-white">Owner Mobile:</span>
                    <p className="text-gray-600 dark:text-gray-300">
                      {formData.ownerMobile}
                    </p>
                  </div>

                  <div>
                    <span className="font-medium dark:text-white">Login Number:</span>
                    <p className="text-gray-600 dark:text-gray-300">
                      {formData.loginNumber}
                    </p>
                  </div>

                  <div className="md:col-span-2">
                    <span className="font-medium dark:text-white">Clinic Address:</span>
                    <p className="text-gray-600 dark:text-gray-300">
                      {formData.address}, {formData.city}, {formData.state}.
                    </p>
                  </div>

                  {/* <div>
                    <span className="font-medium">Status:</span>
                    <p
                      className={`font-semibold ${
                        formData.status === "ACTIVE"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {formData.status}
                    </p>
                  </div> */}
                </div>
              </div>
            </div>
          )}

          {mode === 'view' && (
            <div className="mt-6 space-y-4">
              {/* ---------------- Appointment Statistics ---------------- */}
              <div className="border rounded-lg p-4 dark:bg-gray-800 dark:border-gray-500">
                <h4 className="font-semibold mb-2 dark:text-white">Appointment Statistics</h4>

                {loadingView ? (
                  <p>Loading...</p>
                ) : appointmentStats ? (
                  <ul className="text-sm space-y-1 grid grid-cols-2 dark:text-white">
                    <li>Total: {appointmentStats.totalAppointments.length}</li>
                    <li>Today: {appointmentStats.todayAppointments.length}</li>
                    <li>
                      Completed: {appointmentStats.completedAppointments.length}
                    </li>
                    <li>
                      Cancelled:{' '}
                      {appointmentStats.totalAppointments.length -
                        appointmentStats.completedAppointments.length -
                        appointmentStats.pendingAppointments.length}
                    </li>
                  </ul>
                ) : (
                  <p>No data available</p>
                )}
              </div>

              {/* ---------------- Last Login Info ---------------- */}
              <div className="border rounded-lg p-4 dark:bg-gray-800 dark:border-gray-500">
                <h4 className="font-semibold mb-2 dark:text-white">Last Login Info</h4>

                {lastLoginInfo ? (
                  <ul className="text-sm space-y-1 dark:text-white">
                    <li>
                      Ip: {lastLoginInfo.ipAddress?.replace('::ffff:', '')}
                    </li>
                    <li>User Agent: {lastLoginInfo.userAgent}</li>
                    <li>Login At: {dateFormat(lastLoginInfo.loginAt)}</li>
                  </ul>
                ) : (
                  <p className='dark:text-white'>No login data</p>
                )}
              </div>

              {/* ---------------- Clinic Activity ---------------- */}
              <div className="border rounded-lg p-4 dark:bg-gray-800 dark:border-gray-500">
                <h4 className="font-semibold mb-2 dark:text-white">Clinic Activity</h4>

                <div>
                  <span className="font-medium dark:text-white">Status:</span>
                  <p
                    className={`font-semibold ${clinicStatus === 'ACTIVE'
                      ? 'text-green-600'
                      : 'text-red-600'
                      }`}
                  >
                    {clinicStatus}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <Button size="sm" variant="outline" onClick={closeModal}>
              Close
            </Button>

            {mode !== 'view' && (
              <Button size="sm" onClick={handleSave}>
                {mode === 'edit' ? 'Update' : 'Save'}
              </Button>
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
  );
}
