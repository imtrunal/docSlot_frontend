import { useEffect, useState } from 'react';
import Input from '../form/input/InputField';
import Label from '../form/Label';
import { Modal } from '../ui/modal';
import { useModal } from '../../hooks/useModal';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import Button from '../ui/button/Button';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableHead from '@mui/material/TableHead';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
// import TablePagination from "@mui/material/TablePagination";
import { TablePagination } from '../ui/table/TablePagination';
import { Menu, MenuItem } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

import { CloseIcon, CheckLineIcon } from '../../icons';
import { url } from '../../baseUrl';
import { TrashBinIcon } from '../../icons';
import DatePicker from 'react-datepicker';
import { ConvertTime } from '../../utils/timeUtils';
import { dateFormat } from '../../utils/dateUtils';
import { requiredPermissions } from '../../utils/permissions';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';

import 'react-datepicker/dist/react-datepicker.css';
import { toast } from 'react-toastify';

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
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // filter
  const [filter, setFilter] = useState<FilterType>('all');

  // mode
  const [mode, setMode] = useState<'add' | 'view' | 'edit' | 'delete'>('add');

  // data
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const clinicId = localStorage.getItem('clinicId');

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

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

        // map backend _id → appointmentId
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      }
    };

    fetchAppointments();
  }, []);

  // --------------------
  // VALIDATIONS
  // --------------------
  const isValidMobile = (mobile: string) => /^[6-9]\d{9}$/.test(mobile);

  // const timeToMinutes = (time: string) => {
  //   const [h, m] = time.split(':').map(Number);
  //   return h * 60 + m;
  // };

  // const isSlotOverlapping = (date: string, start: string, end: string) => {
  //   const newStart = timeToMinutes(start);
  //   const newEnd = timeToMinutes(end);
  //   const d = getDateOnly(date);

  //   return appointments.some((a) => {
  //     if (getDateOnly(a.appointmentDate) !== d) return false;
  //     const s = timeToMinutes(a.startTime);
  //     const e = timeToMinutes(a.endTime);
  //     return newStart < e && newEnd > s;
  //   });
  // };

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
    // return filtered.sort((a, b) => {
    //   const da = new Date(`${getDateOnly(a.appointmentDate)} ${a.startTime}`);
    //   const db = new Date(`${getDateOnly(b.appointmentDate)} ${b.startTime}`);
    //   return da.getTime() - db.getTime();
    // });
  };

  // --------------------
  // HANDLERS
  // --------------------
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  // const handleChangeDate = (date: Date | null) => {
  //   if (!date) return;
  //   setFormData({
  //     ...formData,
  //     appointmentDate: date ? date.toISOString().split('T')[0] : '',
  //   });
  //   setSelectedDate(date);
  // };

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

    // if (
    //   isSlotOverlapping(
    //     formData.appointmentDate,
    //     formData.startTime,
    //     formData.endTime,
    //   )
    // ) {
    //   toast.error('This time slot is already booked');
    //   return;
    // }

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

  // const handleEdit = (item: Appointment) => {
  //   setFormData({
  //     ...item,
  //     status: item.status ?? 'Scheduled',
  //   });
  //   setMode('edit');
  //   openModal();
  // };

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


  // const handleDelete = async (item: Appointment) => {
  //   if (!confirm('Are you sure you want to delete this appointment?')) return;

  //   try {
  //     const token = localStorage.getItem('token');
  //     if (!token) return;

  //     const res = await fetch(`${url}/appointments/${item.appointmentId}`, {
  //       method: 'DELETE',
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //       },
  //     });

  //     const response = await res.json();

  //     if (!res.ok) {
  //       toast.error(response.errorMessage || 'Failed to cancel appointment');
  //       return;
  //     }

  //     // ✅ Remove from UI
  //     setAppointments((prev) =>
  //       prev.filter((a) => a.appointmentId !== item.appointmentId),
  //     );
  //   } catch (error) {
  //     console.error(error);
  //     toast.error('Server error');
  //   }
  // };

  // pagination handlers
  // const handleChangePage = useCallback(
  //   (_: unknown, newPage: number) => setPage(newPage),
  //   [],
  // );

  // const handleChangeRowsPerPage = useCallback(
  //   (e: React.ChangeEvent<HTMLInputElement>) => {
  //     setRowsPerPage(parseInt(e.target.value, 10));
  //     setPage(0);
  //   },
  //   [],
  // );

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
    <div className="p-6 sameCSS ml-0 md:ml-[260px] lg:ml-0 sm:ml-[100px] xs:ml-[100px] transition-all duration-300">
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

      <Card>
        <TableContainer>
          <Table className="dark:bg-gray-900">
            <TableHead>
              <TableRow>
                <TableCell className="dark:text-gray-400">Patient Name</TableCell>
                <TableCell className="dark:text-gray-400">Mobile Number</TableCell>
                <TableCell className="dark:text-gray-400">Date</TableCell>
                <TableCell className="dark:text-gray-400">Start Time</TableCell>
                <TableCell className="dark:text-gray-400">End Time</TableCell>
                {requiredPermissions('appointment:status_change') && (
                  <TableCell className="dark:text-gray-400" align="center"> Status</TableCell>
                )}
                <TableCell className="dark:text-gray-400" align="center">Actions</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {filtered
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((item) => {
                  return (
                    <TableRow key={item.appointmentId}>
                      <TableCell className="dark:text-gray-400">{item.patientName}</TableCell>
                      <TableCell className="dark:text-gray-400">{item.patientMobile}</TableCell>
                      <TableCell className="dark:text-gray-400">{dateFormat(item.appointmentDate)}</TableCell>
                      <TableCell className="dark:text-gray-400">{ConvertTime(item.startTime)}</TableCell>
                      <TableCell className="dark:text-gray-400">{ConvertTime(item.endTime)}</TableCell>

                      {requiredPermissions('appointment:status_change') && (
                        <TableCell className="dark:text-gray-400" align="center">
                          <Button
                            size="sm"
                            variant="outline"
                            sx={{
                              border: '1px #4F46E5 solid',
                              color: '#4F46E5',
                            }}
                            onClick={(e) => handleStatusMenuOpen(e, item)}
                          >
                            {item.status !== 'Completed' ? (
                              <span className=" text-yellow-600">
                                {item.status}
                              </span>
                            ) : (
                              <span className=" text-green-600">
                                {item.status}
                              </span>
                            )}
                            <KeyboardArrowDownIcon />
                          </Button>

                          {/* <div>
                        {item.status !== "Completed" ? (
                          <span className=" text-yellow-600">
                            {item.status}
                          </span>
                        ) : (
                          <span className=" text-green-600">{item.status}</span>
                        )}
                        </div> */}
                        </TableCell>
                      )}

                      <TableCell className="dark:text-gray-400" align="center">
                        <div className="flex justify-center gap-1">
                          {requiredPermissions('appointment:list') && (
                            <RemoveRedEyeIcon
                              className="text-2xl cursor-pointer"
                              onClick={() => handleView(item)}
                            />
                          )}

                          {/* {requiredPermissions("") && (
                            <PencilIcon
                              className="text-2xl"
                              onClick={() => handleEdit(item)}
                            />
                          )} */}

                          {requiredPermissions('appointment:delete') && (
                            <TrashBinIcon
                              className="text-2xl cursor-pointer"
                              onClick={() => handleDelete(item)}
                            />
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}

              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" className='dark:text-gray-400'>
                    No appointments found
                  </TableCell>
                </TableRow>
              )}
              {/* 
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <TablePagination
                    component="div"
                    count={filtered.length}
                    page={page}
                    rowsPerPage={rowsPerPage}
                    rowsPerPageOptions={[5, 10, 25]}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                  />
                </TableCell>
              </TableRow> */}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          totalItems={filtered.length}
          currentPage={page + 1}
          rowsPerPage={rowsPerPage}
          onPageChange={(p) => setPage(p - 1)}
          onRowsPerPageChange={(size) => {
            setRowsPerPage(size);
            setPage(0);
          }}
        />
      </Card>
      <Menu
        anchorEl={statusAnchorEl}
        open={openStatusMenu}
        onClose={handleStatusMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}

      >
        <MenuItem
          onClick={() => {
            // handleComplete(selectedItem);
            openCompleteConfirm(selectedItem);
            handleStatusMenuClose();
          }}
        >
          <span className=" text-green-600">
            <CheckLineIcon />
          </span>{' '}
          Completed
        </MenuItem>

        <MenuItem
          onClick={() => {
            // handleCancel(selectedItem);
            openCancelConfirm(selectedItem);
            handleStatusMenuClose();
          }}
        >
          <span className=" text-red-600">
            <CloseIcon />
          </span>{' '}
          Cancelled
        </MenuItem>
      </Menu>

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


      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[600px] m-4">
        <div className="bg-white rounded-2xl p-6 dark:bg-gray-900">
          <h3 className="mb-4 text-lg font-semibold dark:text-white">
            {mode === 'add' && 'New Appointment'}
            {mode === 'edit' && 'Edit Appointment'}
            {mode === 'view' && 'View Appointment'}
          </h3>

          {mode === 'view' ? (
            <div className="space-y-4 text-gray-800 dark:text-white/90">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-semibold">Name:</p>
                  <p className="text-blue-600 dark:text-gray-400">{formData.patientName}</p>
                </div>

                <div>
                  <p className="font-semibold">Mobile:</p>
                  <p className="text-blue-600 dark:text-gray-400">{formData.patientMobile}</p>
                </div>
                <div>
                  <p className="font-semibold">Appointment Date:</p>
                  <p className="text-blue-600 dark:text-gray-400">
                    {dateFormat(formData.appointmentDate)}
                  </p>
                </div>

                <div>
                  <p className="font-semibold">Status:</p>
                  <p className="text-blue-600 dark:text-gray-400">{formData.status}</p>
                </div>

                <div>
                  <p className="font-semibold">Start Time:</p>
                  <p className="text-blue-600 dark:text-gray-400">
                    {ConvertTime(formData.startTime)}
                  </p>
                </div>

                <div>
                  <p className="font-semibold">End Time:</p>
                  <p className="text-blue-600 dark:text-gray-400">
                    {ConvertTime(formData.endTime)}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label>Patient Name:</Label>
                  <Input
                    type="text"
                    onChange={handleChange}
                    name="patientName"
                    value={formData.patientName}
                  />
                </div>

                <div>
                  <Label>Patient Mobiles:</Label>
                  <Input
                    onChange={handleChange}
                    name="patientMobile"
                    value={formData.patientMobile}
                    maxLength={10}
                  />
                </div>

                <div className="w-full">
                  <Label>Appointment Date:</Label>
                  {/* <Input
                    type="date"
                    onChange={handleChange}
                    name="appointmentDate"
                    value={formData.appointmentDate}
                  /> */}
                  <DatePicker
                    selected={
                      formData.appointmentDate
                        ? new Date(formData.appointmentDate)
                        : null
                    }
                    onChange={handleChangeDate}
                    dateFormat="dd-MM-yyyy"
                    className="w-full border border-b-gray-300 rounded dark:bg-gray-900 dark:text-gray-400"
                    minDate={appointMentDate}
                  />
                </div>

                <div>
                  <Label>Start Time:</Label>
                  <Input
                    type="time"
                    onChange={handleChange}
                    name="startTime"
                    value={formData.startTime}
                  />
                </div>

                <div>
                  <Label>End Time:</Label>
                  <Input
                    type="time"
                    onChange={handleChange}
                    name="endTime"
                    value={formData.endTime}
                  />
                </div>
              </div>
              {/* {[
            "patientName",
            "patientMobile",
            "appointmentDate",
            "startTime",
            "endTime",
          ].map((field) => (
            <div key={field} className="mb-3">
              <Label>{field}</Label>
              <Input
                type={
                  field === "appointmentDate"
                    ? "date"
                    : field.includes("Time")
                    ? "time"
                    : "text"
                }
                name={field}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                value={(formData as any)[field]}
                onChange={handleChange}
                // disabled={mode === "view"}
              />
            </div>
          ))} */}
            </div>
          )}

          <div className="flex justify-end gap-0 mt-6">
            <Button
              variant="outline"
              size="md"
              onClick={closeModal}
              className="mr-2"
            >
              Close
            </Button>
            {mode !== 'view' && (
              <Button variant="primary" size="sm" onClick={handleSave}>
                {mode === 'edit' ? 'Update' : 'Save'}
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
