import { useCallback, useEffect, useState } from "react";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import { Modal } from "../ui/modal";
import { useModal } from "../../hooks/useModal";
import Button from "../ui/button/Button";
import Card from "@mui/material/Card";
import Table from "@mui/material/Table";
import TableRow from "@mui/material/TableRow";
import TableBody from "@mui/material/TableBody";
import TableHead from "@mui/material/TableHead";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
// import TablePagination from "@mui/material/TablePagination";
import { TablePagination } from "../ui/table/TablePagination";
import { url } from "../../baseUrl";
import { TrashBinIcon } from "../../icons";
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import { DatePicker } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import { ConvertTime } from "../../utils/timeUtils";
import { dateFormat } from "../../utils/dateUtils";
import { requiredPermissions } from "../../utils/permissions";
import { Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";
import { toast } from "react-toastify";

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
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const [mode, setMode] = useState<"add" | "view" | "edit">("add");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  // const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

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

  // const clinicName =
  // appointments.find((c) => c.clinicId?._id === formData.clinicId)?.name || "N/A";


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
    const res = await fetch(`${url}/appointments`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.errorMessage || 'Failed to fetch appointment');
      return;
    }
    setAppointments(data.data || []);
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

  // convert time

  // const ConvertTime = (time: string) => {
  //   if (!time) return "";

  //   const [hourstr, min] = time.split(":");
  //   let hour = Number(hourstr);
  //   const ampm = hour >= 12 ? "PM" : "AM";
  //   hour = hour % 12 || 12;

  //   return `${hour}:${min} ${ampm}`;
  // };

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

    // if (mode === "edit" && selectedId !== null) {
    //   setAppointments((prev) =>
    //     prev.map((item) =>
    //       item._id === selectedId ? { ...item, ...formData } : item
    //     )
    //   );
    // } else {
    //   setAppointments((prev) => [
    //     ...prev,
    //     {
    //       _id: item._id,
    //       ...formData,
    //     },
    //   ]);
    // }

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
  // EDIT (FORM)
  // --------------------
  // const handleEdit = (item: Appointment) => {
  //   setFormData({ ...item, clinicId: item.clinicId._id });
  //   // setFormData(item)
  //   setSelectedId(item._id);
  //   // setSelectedDate(item.appointmentDate)
  //   setMode("edit");
  //   openModal();
  // };

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



  // const handleDelete = async (item: Appointment) => {
  //   if (!confirm("Are you sure you want to delete this appointment?")) return;
  //   const token = localStorage.getItem("token");
  //   if (!token) return;
  //   const response = await fetch(`${url}/appointments/${item._id}`, {
  //     method: "DELETE",
  //     headers: {
  //       Authorization: `Bearer ${token}`,
  //     },
  //   });

  //   const res = await response.json();


  //   // setAppointments((prev) => prev.filter((item) => item._id !== item._id));

  //   fetchAppointments();
  // };

  // const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <div className="p-6 sameCSS ml-0 md:ml-[260px] lg:ml-0 sm:ml-[100px] xs:ml-[100px] transition-all duration-300">
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
      <Card>
        <TableContainer>
          <Table className="dark:bg-gray-900">
            <TableHead>
              <TableRow>
                <TableCell className="dark:text-gray-400">Patient Name</TableCell>
                <TableCell className="dark:text-gray-400">Phone</TableCell>
                <TableCell className="dark:text-gray-400">Date</TableCell>
                <TableCell className="dark:text-gray-400">Start Time</TableCell>
                <TableCell className="dark:text-gray-400">End Time</TableCell>
                <TableCell className="dark:text-gray-400" align="center">Actions</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {appointments
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((item) => (
                  <TableRow key={item._id}>
                    <TableCell className="dark:text-gray-400">{item.patientName}</TableCell>
                    <TableCell className="dark:text-gray-400">{item.patientMobile}</TableCell>
                    <TableCell className="dark:text-gray-400">{dateFormat(item.appointmentDate)}</TableCell>
                    <TableCell className="dark:text-gray-400">{ConvertTime(item.startTime)}</TableCell>
                    <TableCell className="dark:text-gray-400">{ConvertTime(item.endTime)}</TableCell>
                    <TableCell className="dark:text-gray-400" align="center">
                      <div className="flex align-middle justify-center gap-1">
                        {requiredPermissions("appointment:list") && (
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

                        {requiredPermissions("appointment:delete") && (
                          <TrashBinIcon
                            className="text-2xl cursor-pointer"
                            onClick={() => handleDelete(item)}
                          />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}

              {appointments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" className="dark:text-gray-400">
                    No appointments found
                  </TableCell>
                </TableRow>
              )}

              {/* <TableRow>
                <TableCell colSpan={6} align="center">
                  <TablePagination
                    component="div"
                    count={appointments.length}
                    page={page}
                    rowsPerPage={rowsPerPage}
                    rowsPerPageOptions={[5, 10, 25]}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    sx={{
                      visibility: isOpen ? "hidden" : "visible",
                      pointerEvents: isOpen ? "none" : "auto",
                    }}
                  />
                </TableCell>
              </TableRow> */}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          totalItems={appointments.length}
          currentPage={page + 1}
          rowsPerPage={rowsPerPage}
          onPageChange={(p) => setPage(p - 1)}
          onRowsPerPageChange={(size) => {
            setRowsPerPage(size);
            setPage(0);
          }}
        />
      </Card>

      {/* MODAL */}
      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        className="max-w-[600px] m-4 max-h-[600px] mt-4"
      >
        <div className="px-6 bg-white rounded-xl dark:bg-gray-900">
          <h3 className="mb-4 font-semibold py-3 text-2xl dark:text-white">
            {mode === "view"
              ? "Appointment Details"
              : mode === "edit"
                ? "Edit Appointment"
                : "New Appointment"}
          </h3>
          {/* <h1 className="font-bold py-5 text-2xl">Appointments</h1> */}

          {/* VIEW MODE (LIKE IMAGE) */}
          {mode === "view" && (
            <div className="space-y-4 dark:text-gray-400">
              <p >
                <strong className="dark:text-white">Patient Name:</strong> {formData.patientName}
              </p>
              <p>
                <strong className="dark:text-white">Mobile Number:</strong> {formData.patientMobile}
              </p>
              <p>
                <strong className="dark:text-white">Date:</strong> {dateFormat(formData.appointmentDate)}
              </p>
              <p>
                <strong className="dark:text-white">Start Time:</strong> {ConvertTime(formData.startTime)}
              </p>
              <p>
                <strong className="dark:text-white">End Time:</strong> {ConvertTime(formData.endTime)}
              </p>
              <p>
                <strong className="dark:text-white">Clinic Name:</strong> {clinicName}
              </p>
            </div>
          )}

          {/* ADD / EDIT FORM */}
          {mode !== "view" && (
            <div className="grid gap-4">
              <Label>Clinic</Label>
              <select
                name="clinicId"
                value={formData.clinicId}
                onChange={(e) =>
                  setFormData({ ...formData, clinicId: e.target.value })
                }
                className="border p-2 rounded dark:bg-gray-900 dark:text-gray-400"
              >
                <option value="">Select Clinic</option>
                {clinics.map((c) => {

                  return (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  );
                })}
              </select>

              <Label>Patient Name</Label>
              <Input
                name="patientName"
                value={formData.patientName}
                onChange={handleChange}
                className="dark:text-gray-400"
              />

              <Label>Phone</Label>
              <Input
                name="patientMobile"
                value={formData.patientMobile}
                onChange={handleChange}
                className="dark:text-gray-400"
                maxLength={10}
              />

              <Label>Date</Label>
              {/* <input
                type="date"
                name="appointmentDate"
                value={formData.appointmentDate}
                onChange={handleChange}
              /> */}
              <DatePicker
                selected={formData.appointmentDate}
                onChange={handleChangeDate}
                dateFormat="dd-MM-yyyy"
                className="w-full border border-b-gray-300 rounded dark:bg-gray-900 dark:text-gray-400"
                minDate={appointMentDate}
              />

              <Label>Start Time</Label>
              <Input
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
              />

              <Label>End Time</Label>
              <Input
                type="time"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
              />
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={closeModal}>
              Close
            </Button>
            {mode !== "view" && <Button onClick={handleSave}>Save</Button>}
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
