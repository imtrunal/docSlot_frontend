// import { useState, useRef, useEffect } from "react";
// import FullCalendar from "@fullcalendar/react";
// import dayGridPlugin from "@fullcalendar/daygrid";
// import timeGridPlugin from "@fullcalendar/timegrid";
// import interactionPlugin from "@fullcalendar/interaction";
// import { EventInput, DateSelectArg, EventClickArg } from "@fullcalendar/core";
// import { Modal } from "../../components/ui/modal";
// import { useModal } from "../../hooks/useModal";
// import { url } from "../../baseUrl";
// import { ConvertTime } from "../../utils/timeUtils";
// import { toast } from "react-toastify";

// interface CalendarEvent extends EventInput {
//   extendedProps: {
//     calendar: string;
//   };
// }

// const Calendar: React.FC = () => {
//   const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
//     null,
//   );
//   const [eventTitle, setEventTitle] = useState("");
//   const [eventStartDate, setEventStartDate] = useState("");
//   const [eventEndDate, setEventEndDate] = useState("");
//   const [eventLevel, setEventLevel] = useState("");
//   const [events, setEvents] = useState<CalendarEvent[]>([]);
//   const calendarRef = useRef<FullCalendar>(null);
//   const { isOpen, openModal, closeModal } = useModal();

//   // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   const [appointmentsByDate, setAppointmentsByDate] = useState<any[]>([]);
//   const [viewMode, setViewMode] = useState<"form" | "list">("form");
//   const [selectedDate, setSelectedDate] = useState<string>("");

//   // const calendarsEvents = {
//   //   Danger: "danger",
//   //   Success: "success",
//   //   Primary: "primary",
//   //   Warning: "warning",
//   // };

//   useEffect(() => {
//     // Initialize with some events
//     // setEvents([
//     //   {
//     //     id: "1",
//     //     title: "Event Conf.",
//     //     start: new Date().toISOString().split("T")[0],
//     //     extendedProps: { calendar: "Danger" },
//     //   },
//     //   {
//     //     id: "2",
//     //     title: "Meeting",
//     //     start: new Date(Date.now() + 86400000).toISOString().split("T")[0],
//     //     extendedProps: { calendar: "Success" },
//     //   },
//     //   {
//     //     id: "3",
//     //     title: "Workshop",
//     //     start: new Date(Date.now() + 172800000).toISOString().split("T")[0],
//     //     end: new Date(Date.now() + 259200000).toISOString().split("T")[0],
//     //     extendedProps: { calendar: "Primary" },
//     //   },
//     // ]);
//     fetchAppointmentsForCalendar();
//   }, []);

//   const toLocalDate = (dateString: string) => {
//     const d = new Date(dateString); // backend UTC
//     const y = d.getFullYear(); // LOCAL YEAR
//     const m = String(d.getMonth() + 1).padStart(2, "0");
//     const day = String(d.getDate()).padStart(2, "0");
//     return `${y}-${m}-${day}`; // ✅ LOCAL YYYY-MM-DD
//   };

//   //fetch api
//   const fetchAppointmentsForCalendar = async () => {
//     try {
//       const token = localStorage.getItem("token");
//       if (!token) return;

//       const res = await fetch(`${url}/appointments`, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       });

//       const json = await res.json();
//       if (!res.ok) {  
//         toast.error(json.errorMessage || 'Failed to fetch appointment');
//         return;
//       }

//       const appointments = Array.isArray(json)
//         ? json
//         : Array.isArray(json.data)
//           ? json.data
//           : Array.isArray(json.appointments)
//             ? json.appointments
//             : [];

//       if (!appointments.length) {
//         // toast.error("No appointments found for calendar")
//         // console.warn("No appointments found for calendar");
//         setEvents([]);
//         return;
//       }

//       // Group by date
//       const grouped: Record<string, number> = {};

//       // appointments.forEach((appt: any) => {
//       //   if (!appt.appointmentDate) return;
//       //   const date = appt.appointmentDate.split("T")[0];

//       //   grouped[date] = (grouped[date] || 0) + 1;
//       // });
//       // eslint-disable-next-line @typescript-eslint/no-explicit-any
//       appointments.forEach((appt: any) => {
//         if (!appt.appointmentDate) return;

//         const date = toLocalDate(appt.appointmentDate);

//         grouped[date] = (grouped[date] || 0) + 1;
//       });

//       // Convert to calendar events
//       const calendarEvents: CalendarEvent[] = Object.keys(grouped).map(
//         (date) => ({
//           id: date,
//           title: ` ${grouped[date]}`,
//           start: date,
//           allDay: true,
//           extendedProps: {
//             calendar: "Primary",
//           },
//         }),
//       );

//       setEvents(calendarEvents);
//     } catch (error) {
//       console.error("Calendar fetch error", error);
//     }
//   };
//   // fetchAppointmentsForCalendar();

//   const handleDateSelect = (selectInfo: DateSelectArg) => {
//     resetModalFields();
//     setEventStartDate(selectInfo.startStr);
//     setEventEndDate(selectInfo.endStr || selectInfo.startStr);
//     openModal();
//   };

//   const handleEventClick = async (clickInfo: EventClickArg) => {
//     const clickedDate = clickInfo.event.startStr;

//     setSelectedDate(clickedDate);
//     setViewMode("list");
//     openModal();

//     try {
//       const token = localStorage.getItem("token");
//       if (!token) return;

//       const res = await fetch(`${url}/appointments`, {
//         method: "GET",
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       });

//       const json = await res.json();
//       if (!res.ok) {  
//         toast.error(json.errorMessage || 'Failed to fetch appointment');
//         return;
//       }

//       // ✅ extract array safely
//       const allAppointments = Array.isArray(json)
//         ? json
//         : json.data || json.appointments || [];

//       // ✅ FILTER BY CLICKED DATE
//       // eslint-disable-next-line @typescript-eslint/no-explicit-any
//       const filteredAppointments = allAppointments.filter((appt: any) => {
//         if (!appt.appointmentDate) return false;
//         // return appt.appointmentDate.split("T")[0] === clickedDate;
//         return toLocalDate(appt.appointmentDate) === clickedDate;
//       });

//       setAppointmentsByDate(filteredAppointments);

//     } catch (error) {
//       console.error("Failed to fetch appointments for day", error);
//     }
//   };

//   // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   const addNewAppointment = async (payload: any) => {
//     try {
//       const token = localStorage.getItem("token");
//       if (!token) return;

//       const res = await fetch(`${url}/appointments`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify(payload),
//       });

//       if (!res.ok) {
//         throw new Error("Failed to add appointment");
//       }

//       // ✅ REFRESH CALENDAR EVENTS
//       await fetchAppointmentsForCalendar();
//     } catch (error) {
//       console.error("Add appointment failed", error);
//     }
//   };

//   // const handleAddOrUpdateEvent = () => {
//   //   if (selectedEvent) {
//   //     // Update existing event
//   //     setEvents((prevEvents) =>
//   //       prevEvents.map((event) =>
//   //         event.id === selectedEvent.id
//   //           ? {
//   //               ...event,
//   //               title: eventTitle,
//   //               start: eventStartDate,
//   //               end: eventEndDate,
//   //               extendedProps: { calendar: eventLevel },
//   //             }
//   //           : event
//   //       )
//   //     );
//   //     const payload = {
//   //       appointmentDate: eventStartDate,
//   //       patientName: eventTitle,
//   //       startTime: "10:00",
//   //       endTime: "10:30",
//   //       status: "Scheduled",
//   //     };

//   //     // 🔥 CALL API
//   //     addNewAppointment(payload);
//   //   } else {
//   //     // Add new event
//   //     const newEvent: CalendarEvent = {
//   //       id: Date.now().toString(),
//   //       title: eventTitle,
//   //       start: eventStartDate,
//   //       end: eventEndDate,
//   //       allDay: true,
//   //       extendedProps: { calendar: eventLevel },
//   //     };
//   //     setEvents((prevEvents) => [...prevEvents, newEvent]);
//   //   }
//   //   closeModal();
//   //   resetModalFields();
//   // };

//   const handleAddOrUpdateEvent = async () => {
//     const payload = {
//       appointmentDate: eventStartDate,
//       patientName: eventTitle,
//       startTime: "10:00",
//       endTime: "10:30",
//       status: "Scheduled",
//     };

//     if (selectedEvent) {
//       // update local event
//       setEvents((prevEvents) =>
//         prevEvents.map((event) =>
//           event.id === selectedEvent.id
//             ? {
//                 ...event,
//                 title: eventTitle,
//                 start: eventStartDate,
//                 end: eventEndDate,
//                 extendedProps: { calendar: eventLevel },
//               }
//             : event,
//         ),
//       );
//     } else {
//       // add local event (optional)
//       setEvents((prevEvents) => [
//         ...prevEvents,
//         {
//           id: Date.now().toString(),
//           title: eventTitle,
//           start: eventStartDate,
//           allDay: true,
//           extendedProps: { calendar: "Primary" },
//         },
//       ]);
//     }

//     // 🔥 ALWAYS CALL API
//     await addNewAppointment(payload);

//     closeModal();
//     resetModalFields();
//   };

//   const resetModalFields = () => {
//     setEventTitle("");
//     setEventStartDate("");
//     setEventEndDate("");
//     setEventLevel("");
//     setSelectedEvent(null);
//     setAppointmentsByDate([]);
//     setViewMode("form");
//   };

//   // resetModalFields()

//   return (
//     <>
//       {/* <PageMeta
//         title="React.js Calendar Dashboard | DocSlot - Next.js Admin Dashboard Template"
//         description="This is React.js Calendar Dashboard page for DocSlot - React.js Tailwind CSS Admin Dashboard Template"
//       /> */}
      
//       <div className="rounded-2xl border p-6 sameCSS ml-0 md:ml-[260px] lg:ml-0 sm:ml-[100px] xs:ml-[100px] transition-all duration-300 border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
//         <div className="custom-calendar relative overflow-y-scroll ">
//           <FullCalendar
//           // className={overflow: }
//             timeZone="local"
//             ref={calendarRef}
//             plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
//             initialView="dayGridMonth"
//             headerToolbar={{
//               left: "prev,next",
//               center: "title",
//               right: "dayGridMonth,timeGridWeek,timeGridDay",
//             }}
//             events={events}
//             selectable={true}
//             // select={handleDateSelect}
//             eventClick={handleEventClick}
//             eventContent={renderEventContent}
//             // customButtons={{
//             //   addEventButton: {
//             //     text: "Add Event +",
//             //     click: openModal,
//             //   },
//             // }}
//           />
//         </div>

//         <Modal
//           isOpen={isOpen}
//           onClose={closeModal}
//           className="max-w-[700px] p-6 lg:p-10 dark:text-white"
//         >
//           <div className="flex flex-col px-2 overflow-y-auto custom-scrollbar">
//             {/* <div>
//               <h5 className="mb-2 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
//                 {selectedEvent ? "Edit Event" : "Add Event"}
//               </h5>
//               <p className="text-sm text-gray-500 dark:text-gray-400">
//                 Plan your next big moment: schedule or edit an event to stay on
//                 track
//               </p>
//             </div> */}
//             {/* <div className="mt-8">
//               <div>
//                 <div>
//                   <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
//                     Event Title
//                   </label>
//                   <input
//                     id="event-title"
//                     type="text"
//                     value={eventTitle}
//                     onChange={(e) => setEventTitle(e.target.value)}
//                     className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
//                   />
//                 </div>
//               </div>
//               <div className="mt-6">
//                 <label className="block mb-4 text-sm font-medium text-gray-700 dark:text-gray-400">
//                   Event Color
//                 </label>
//                 <div className="flex flex-wrap items-center gap-4 sm:gap-5">
//                   {Object.entries(calendarsEvents).map(([key, value]) => (
//                     <div key={key} className="n-chk">
//                       <div
//                         className={`form-check form-check-${value} form-check-inline`}
//                       >
//                         <label
//                           className="flex items-center text-sm text-gray-700 form-check-label dark:text-gray-400"
//                           htmlFor={`modal${key}`}
//                         >
//                           <span className="relative">
//                             <input
//                               className="sr-only form-check-input"
//                               type="radio"
//                               name="event-level"
//                               value={key}
//                               id={`modal${key}`}
//                               checked={eventLevel === key}
//                               onChange={() => setEventLevel(key)}
//                             />
//                             <span className="flex items-center justify-center w-5 h-5 mr-2 border border-gray-300 rounded-full box dark:border-gray-700">
//                               <span className="w-2 h-2 bg-white rounded-full dark:bg-transparent"></span>
//                             </span>
//                           </span>
//                           {key}
//                         </label>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>

//               <div className="mt-6">
//                 <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
//                   Enter Start Date
//                 </label>
//                 <div className="relative">
//                   <input
//                     id="event-start-date"
//                     type="date"
//                     value={eventStartDate}
//                     onChange={(e) => setEventStartDate(e.target.value)}
//                     className="dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pl-4 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
//                   />
//                 </div>
//               </div>

//               <div className="mt-6">
//                 <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
//                   Enter End Date
//                 </label>
//                 <div className="relative">
//                   <input
//                     id="event-end-date"
//                     type="date"
//                     value={eventEndDate}
//                     onChange={(e) => setEventEndDate(e.target.value)}
//                     className="dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pl-4 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
//                   />
//                 </div>
//               </div>
//             </div> */}

//             <div className="mt-8">
//               {/* 🔹 APPOINTMENT LIST VIEW */}
//               {viewMode === "list" && (
//                 <>
//                   <h1 className="mb-4 text-lg font-semibold">
//                     Appointments on {selectedDate}
//                   </h1>

//                   {appointmentsByDate.length === 0 ? (
//                     <p className="text-sm text-gray-500">
//                       No appointments found for this date.
//                     </p>
//                   ) : (
//                     <div className="space-y-3">
//                       {appointmentsByDate.map((appt, index) => (
//                         <div
//                           key={appt._id || index}
//                           className="flex justify-between rounded-lg border dark:border-gray-700 p-3"
//                         >
//                           <div>
//                             <p className="font-medium">{appt.patientName}</p>
//                             <p className="text-sm text-gray-500">
//                               {ConvertTime(appt.startTime)} - {ConvertTime(appt.endTime)}
//                             </p>
//                           </div>
//                           <span className="text-sm font-semibold">
//                             {appt.status}
//                           </span>
//                         </div>
//                       ))}
//                     </div>
//                   )}
//                 </>
//               )}

//               {/* 🔹 EVENT FORM VIEW */}
//               {viewMode === "form" && (
//                 <>
//                   {/* 👇 KEEP YOUR EXISTING FORM CODE AS IS */}
//                   {/* Event Title, Color, Start Date, End Date */}
//                 </>
//               )}
//             </div>

//             <div className="flex items-center gap-3 mt-6 modal-footer sm:justify-end">
//               <button
//                 onClick={closeModal}
//                 type="button"
//                 className="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] sm:w-auto"
//               >
//                 Close
//               </button>
//               {/* <button
//                 onClick={handleAddOrUpdateEvent}
//                 type="button"
//                 className="btn btn-success btn-update-event flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 sm:w-auto"
//               >
//                 {selectedEvent ? "Update Changes" : "Add Event"}
//               </button> */}
//             </div>
//           </div>
//         </Modal>
//       </div>
//     </>
//   );
// };

// // eslint-disable-next-line @typescript-eslint/no-explicit-any
// const renderEventContent = (eventInfo: any) => {
//   const colorClass = `fc-bg-${eventInfo.event.extendedProps.calendar.toLowerCase()}`;
//   return (
//     <div
//       className={`event-fc-color flex fc-event-main ${colorClass} p-1 rounded`}
//     >
//       <div className="fc-daygrid-event-dot"></div>
//       <div className="fc-event-time">{eventInfo.timeText}</div>
//       <div className="fc-event-title">{eventInfo.event.title}</div>
//     </div>
//   );
// };

// export default Calendar;


import { useState, useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { EventInput, DateSelectArg, EventClickArg } from "@fullcalendar/core";
import { Modal } from "../../components/ui/modal";
import { useModal } from "../../hooks/useModal";
import { url } from "../../baseUrl";
import { ConvertTime } from "../../utils/timeUtils";
import { toast } from "react-toastify";

interface CalendarEvent extends EventInput {
  extendedProps: {
    calendar: string;
  };
}

const Calendar: React.FC = () => {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [eventTitle, setEventTitle] = useState("");
  const [eventStartDate, setEventStartDate] = useState("");
  const [eventEndDate, setEventEndDate] = useState("");
  const [eventLevel, setEventLevel] = useState("");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const calendarRef = useRef<FullCalendar>(null);
  const { isOpen, openModal, closeModal } = useModal();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [appointmentsByDate, setAppointmentsByDate] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<"form" | "list">("form");
  const [selectedDate, setSelectedDate] = useState<string>("");

  useEffect(() => {
    fetchAppointmentsForCalendar();
  }, []);

  const toLocalDate = (dateString: string) => {
    const d = new Date(dateString);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const fetchAppointmentsForCalendar = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`${url}/appointments`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const json = await res.json();
      if (!res.ok) {
        toast.error(json.errorMessage || "Failed to fetch appointment");
        return;
      }

      const appointments = Array.isArray(json)
        ? json
        : Array.isArray(json.data)
          ? json.data
          : Array.isArray(json.appointments)
            ? json.appointments
            : [];

      if (!appointments.length) { setEvents([]); return; }

      const grouped: Record<string, number> = {};
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      appointments.forEach((appt: any) => {
        if (!appt.appointmentDate) return;
        const date = toLocalDate(appt.appointmentDate);
        grouped[date] = (grouped[date] || 0) + 1;
      });

      const calendarEvents: CalendarEvent[] = Object.keys(grouped).map((date) => ({
        id: date,
        title: `${grouped[date]}`,
        start: date,
        allDay: true,
        extendedProps: { calendar: "Primary" },
      }));

      setEvents(calendarEvents);
    } catch (error) {
      console.error("Calendar fetch error", error);
    }
  };

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    resetModalFields();
    setEventStartDate(selectInfo.startStr);
    setEventEndDate(selectInfo.endStr || selectInfo.startStr);
    openModal();
  };

  const handleEventClick = async (clickInfo: EventClickArg) => {
    const clickedDate = clickInfo.event.startStr;
    setSelectedDate(clickedDate);
    setViewMode("list");
    openModal();

    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`${url}/appointments`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      const json = await res.json();
      if (!res.ok) {
        toast.error(json.errorMessage || "Failed to fetch appointment");
        return;
      }

      const allAppointments = Array.isArray(json) ? json : json.data || json.appointments || [];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const filteredAppointments = allAppointments.filter((appt: any) => {
        if (!appt.appointmentDate) return false;
        return toLocalDate(appt.appointmentDate) === clickedDate;
      });

      setAppointmentsByDate(filteredAppointments);
    } catch (error) {
      console.error("Failed to fetch appointments for day", error);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const addNewAppointment = async (payload: any) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`${url}/appointments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to add appointment");
      await fetchAppointmentsForCalendar();
    } catch (error) {
      console.error("Add appointment failed", error);
    }
  };

  const handleAddOrUpdateEvent = async () => {
    const payload = {
      appointmentDate: eventStartDate,
      patientName: eventTitle,
      startTime: "10:00",
      endTime: "10:30",
      status: "Scheduled",
    };

    if (selectedEvent) {
      setEvents((prevEvents) =>
        prevEvents.map((event) =>
          event.id === selectedEvent.id
            ? { ...event, title: eventTitle, start: eventStartDate, end: eventEndDate, extendedProps: { calendar: eventLevel } }
            : event
        )
      );
    } else {
      setEvents((prevEvents) => [
        ...prevEvents,
        { id: Date.now().toString(), title: eventTitle, start: eventStartDate, allDay: true, extendedProps: { calendar: "Primary" } },
      ]);
    }

    await addNewAppointment(payload);
    closeModal();
    resetModalFields();
  };

  const resetModalFields = () => {
    setEventTitle("");
    setEventStartDate("");
    setEventEndDate("");
    setEventLevel("");
    setSelectedEvent(null);
    setAppointmentsByDate([]);
    setViewMode("form");
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  };

  const getStatusStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed": return { bg: "#dcfce7", color: "#16a34a" };
      case "cancelled": return { bg: "#fff0f0", color: "#e05252" };
      case "scheduled":
      default: return { bg: "#eef0ff", color: "#465FFF" };
    }
  };

  return (
    <>
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-5 sameCSS ml-0 md:ml-[260px] lg:ml-0 sm:ml-[100px] xs:ml-[100px] transition-all duration-300">

        {/* Calendar header strip */}
        <div className="flex items-center gap-3 mb-5">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "#eef0ff" }}
          >
            <svg className="w-5 h-5" style={{ color: "#465FFF" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-800 dark:text-white m-0">Appointment Calendar</h2>
            <p className="text-xs text-gray-400 m-0">Click any date marker to view appointments</p>
          </div>
        </div>

        <div className="custom-calendar relative overflow-y-scroll">
          <FullCalendar
            timeZone="local"
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: "prev,next",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            events={events}
            selectable={true}
            eventClick={handleEventClick}
            eventContent={renderEventContent}
          />
        </div>

        {/* ── Modal ── */}
        <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[520px]">
          <div className="dark:bg-gray-900">

            {/* Header */}
            <div className="flex items-center gap-4 px-6 py-5" style={{ background: "#465FFF" }}>
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(255,255,255,0.2)" }}
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-base m-0">
                  {viewMode === "list" ? "Appointments" : selectedEvent ? "Edit Event" : "New Event"}
                </p>
                <p className="text-white/60 text-xs mt-0.5 m-0 truncate">
                  {viewMode === "list" ? formatDisplayDate(selectedDate) : "Fill in the details below"}
                </p>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto max-h-[55vh]">

              {/* LIST VIEW */}
              {viewMode === "list" && (
                <div>
                  {appointmentsByDate.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-3">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "#eef0ff" }}>
                        <svg className="w-6 h-6" style={{ color: "#465FFF" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <p className="text-sm text-gray-400 dark:text-gray-500">No appointments on this day</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {/* Count badge */}
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
                          style={{ background: "#eef0ff", color: "#465FFF" }}
                        >
                          {appointmentsByDate.length} appointment{appointmentsByDate.length !== 1 ? "s" : ""}
                        </span>
                      </div>

                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {appointmentsByDate.map((appt: any, index: number) => {
                        const statusStyle = getStatusStyle(appt.status);
                        return (
                          <div
                            key={appt._id || index}
                            className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {/* Avatar circle */}
                              <div
                                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold"
                                style={{ background: "#eef0ff", color: "#465FFF" }}
                              >
                                {appt.patientName?.charAt(0)?.toUpperCase() || "?"}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-800 dark:text-white m-0 truncate">
                                  {appt.patientName || "—"}
                                </p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 m-0 flex items-center gap-1 mt-0.5">
                                  <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  {ConvertTime(appt.startTime)} – {ConvertTime(appt.endTime)}
                                </p>
                              </div>
                            </div>
                            <span
                              className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
                              style={{ background: statusStyle.bg, color: statusStyle.color }}
                            >
                              {appt.status || "Scheduled"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* FORM VIEW */}
              {viewMode === "form" && (
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                      Event Title
                    </label>
                    <input
                      type="text"
                      value={eventTitle}
                      onChange={(e) => setEventTitle(e.target.value)}
                      placeholder="Patient name or event..."
                      className="w-full rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2.5 text-sm bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#465FFF]/30 focus:border-[#465FFF] transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={eventStartDate}
                        onChange={(e) => setEventStartDate(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2.5 text-sm bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#465FFF]/30 focus:border-[#465FFF] transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={eventEndDate}
                        onChange={(e) => setEventEndDate(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2.5 text-sm bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#465FFF]/30 focus:border-[#465FFF] transition-all"
                      />
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
              {viewMode === "form" && (
                <button
                  onClick={handleAddOrUpdateEvent}
                  className="px-5 py-2 text-sm font-semibold rounded-lg text-white transition hover:opacity-90"
                  style={{ background: "#465FFF" }}
                >
                  {selectedEvent ? "Update Event" : "Save Event"}
                </button>
              )}
            </div>

          </div>
        </Modal>
      </div>
    </>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderEventContent = (eventInfo: any) => {
  return (
    <div className="flex items-center gap-1 px-2 py-0.5 rounded-md w-full" style={{ background: "#465FFF" }}>
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ background: "rgba(255,255,255,0.7)" }}
      />
      <span className="text-white text-[11px] font-semibold truncate">
        {eventInfo.event.title} appt{Number(eventInfo.event.title) !== 1 ? "s" : ""}
      </span>
    </div>
  );
};

export default Calendar;