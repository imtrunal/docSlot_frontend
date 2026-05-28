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
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null,
  );
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

  // const calendarsEvents = {
  //   Danger: "danger",
  //   Success: "success",
  //   Primary: "primary",
  //   Warning: "warning",
  // };

  useEffect(() => {
    // Initialize with some events
    // setEvents([
    //   {
    //     id: "1",
    //     title: "Event Conf.",
    //     start: new Date().toISOString().split("T")[0],
    //     extendedProps: { calendar: "Danger" },
    //   },
    //   {
    //     id: "2",
    //     title: "Meeting",
    //     start: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    //     extendedProps: { calendar: "Success" },
    //   },
    //   {
    //     id: "3",
    //     title: "Workshop",
    //     start: new Date(Date.now() + 172800000).toISOString().split("T")[0],
    //     end: new Date(Date.now() + 259200000).toISOString().split("T")[0],
    //     extendedProps: { calendar: "Primary" },
    //   },
    // ]);
    fetchAppointmentsForCalendar();
  }, []);

  const toLocalDate = (dateString: string) => {
    const d = new Date(dateString); // backend UTC
    const y = d.getFullYear(); // LOCAL YEAR
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`; // ✅ LOCAL YYYY-MM-DD
  };

  //fetch api
  const fetchAppointmentsForCalendar = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`${url}/appointments`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json();
      if (!res.ok) {  
        toast.error(json.errorMessage || 'Failed to fetch appointment');
        return;
      }

      const appointments = Array.isArray(json)
        ? json
        : Array.isArray(json.data)
          ? json.data
          : Array.isArray(json.appointments)
            ? json.appointments
            : [];

      if (!appointments.length) {
        // toast.error("No appointments found for calendar")
        // console.warn("No appointments found for calendar");
        setEvents([]);
        return;
      }

      // Group by date
      const grouped: Record<string, number> = {};

      // appointments.forEach((appt: any) => {
      //   if (!appt.appointmentDate) return;
      //   const date = appt.appointmentDate.split("T")[0];

      //   grouped[date] = (grouped[date] || 0) + 1;
      // });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      appointments.forEach((appt: any) => {
        if (!appt.appointmentDate) return;

        const date = toLocalDate(appt.appointmentDate);

        grouped[date] = (grouped[date] || 0) + 1;
      });

      // Convert to calendar events
      const calendarEvents: CalendarEvent[] = Object.keys(grouped).map(
        (date) => ({
          id: date,
          title: ` ${grouped[date]}`,
          start: date,
          allDay: true,
          extendedProps: {
            calendar: "Primary",
          },
        }),
      );

      setEvents(calendarEvents);
    } catch (error) {
      console.error("Calendar fetch error", error);
    }
  };
  // fetchAppointmentsForCalendar();

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
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json();
      if (!res.ok) {  
        toast.error(json.errorMessage || 'Failed to fetch appointment');
        return;
      }

      // ✅ extract array safely
      const allAppointments = Array.isArray(json)
        ? json
        : json.data || json.appointments || [];

      // ✅ FILTER BY CLICKED DATE
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const filteredAppointments = allAppointments.filter((appt: any) => {
        if (!appt.appointmentDate) return false;
        // return appt.appointmentDate.split("T")[0] === clickedDate;
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

      if (!res.ok) {
        throw new Error("Failed to add appointment");
      }

      // ✅ REFRESH CALENDAR EVENTS
      await fetchAppointmentsForCalendar();
    } catch (error) {
      console.error("Add appointment failed", error);
    }
  };

  // const handleAddOrUpdateEvent = () => {
  //   if (selectedEvent) {
  //     // Update existing event
  //     setEvents((prevEvents) =>
  //       prevEvents.map((event) =>
  //         event.id === selectedEvent.id
  //           ? {
  //               ...event,
  //               title: eventTitle,
  //               start: eventStartDate,
  //               end: eventEndDate,
  //               extendedProps: { calendar: eventLevel },
  //             }
  //           : event
  //       )
  //     );
  //     const payload = {
  //       appointmentDate: eventStartDate,
  //       patientName: eventTitle,
  //       startTime: "10:00",
  //       endTime: "10:30",
  //       status: "Scheduled",
  //     };

  //     // 🔥 CALL API
  //     addNewAppointment(payload);
  //   } else {
  //     // Add new event
  //     const newEvent: CalendarEvent = {
  //       id: Date.now().toString(),
  //       title: eventTitle,
  //       start: eventStartDate,
  //       end: eventEndDate,
  //       allDay: true,
  //       extendedProps: { calendar: eventLevel },
  //     };
  //     setEvents((prevEvents) => [...prevEvents, newEvent]);
  //   }
  //   closeModal();
  //   resetModalFields();
  // };

  const handleAddOrUpdateEvent = async () => {
    const payload = {
      appointmentDate: eventStartDate,
      patientName: eventTitle,
      startTime: "10:00",
      endTime: "10:30",
      status: "Scheduled",
    };

    if (selectedEvent) {
      // update local event
      setEvents((prevEvents) =>
        prevEvents.map((event) =>
          event.id === selectedEvent.id
            ? {
                ...event,
                title: eventTitle,
                start: eventStartDate,
                end: eventEndDate,
                extendedProps: { calendar: eventLevel },
              }
            : event,
        ),
      );
    } else {
      // add local event (optional)
      setEvents((prevEvents) => [
        ...prevEvents,
        {
          id: Date.now().toString(),
          title: eventTitle,
          start: eventStartDate,
          allDay: true,
          extendedProps: { calendar: "Primary" },
        },
      ]);
    }

    // 🔥 ALWAYS CALL API
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

  // resetModalFields()

  return (
    <>
      {/* <PageMeta
        title="React.js Calendar Dashboard | DocSlot - Next.js Admin Dashboard Template"
        description="This is React.js Calendar Dashboard page for DocSlot - React.js Tailwind CSS Admin Dashboard Template"
      /> */}
      
      <div className="rounded-2xl border p-6 sameCSS ml-0 md:ml-[260px] lg:ml-0 sm:ml-[100px] xs:ml-[100px] transition-all duration-300 border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="custom-calendar relative overflow-y-scroll ">
          <FullCalendar
          // className={overflow: }
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
            // select={handleDateSelect}
            eventClick={handleEventClick}
            eventContent={renderEventContent}
            // customButtons={{
            //   addEventButton: {
            //     text: "Add Event +",
            //     click: openModal,
            //   },
            // }}
          />
        </div>

        <Modal
          isOpen={isOpen}
          onClose={closeModal}
          className="max-w-[700px] p-6 lg:p-10 dark:text-white"
        >
          <div className="flex flex-col px-2 overflow-y-auto custom-scrollbar">
            {/* <div>
              <h5 className="mb-2 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
                {selectedEvent ? "Edit Event" : "Add Event"}
              </h5>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Plan your next big moment: schedule or edit an event to stay on
                track
              </p>
            </div> */}
            {/* <div className="mt-8">
              <div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Event Title
                  </label>
                  <input
                    id="event-title"
                    type="text"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  />
                </div>
              </div>
              <div className="mt-6">
                <label className="block mb-4 text-sm font-medium text-gray-700 dark:text-gray-400">
                  Event Color
                </label>
                <div className="flex flex-wrap items-center gap-4 sm:gap-5">
                  {Object.entries(calendarsEvents).map(([key, value]) => (
                    <div key={key} className="n-chk">
                      <div
                        className={`form-check form-check-${value} form-check-inline`}
                      >
                        <label
                          className="flex items-center text-sm text-gray-700 form-check-label dark:text-gray-400"
                          htmlFor={`modal${key}`}
                        >
                          <span className="relative">
                            <input
                              className="sr-only form-check-input"
                              type="radio"
                              name="event-level"
                              value={key}
                              id={`modal${key}`}
                              checked={eventLevel === key}
                              onChange={() => setEventLevel(key)}
                            />
                            <span className="flex items-center justify-center w-5 h-5 mr-2 border border-gray-300 rounded-full box dark:border-gray-700">
                              <span className="w-2 h-2 bg-white rounded-full dark:bg-transparent"></span>
                            </span>
                          </span>
                          {key}
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Enter Start Date
                </label>
                <div className="relative">
                  <input
                    id="event-start-date"
                    type="date"
                    value={eventStartDate}
                    onChange={(e) => setEventStartDate(e.target.value)}
                    className="dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pl-4 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  />
                </div>
              </div>

              <div className="mt-6">
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Enter End Date
                </label>
                <div className="relative">
                  <input
                    id="event-end-date"
                    type="date"
                    value={eventEndDate}
                    onChange={(e) => setEventEndDate(e.target.value)}
                    className="dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pl-4 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  />
                </div>
              </div>
            </div> */}

            <div className="mt-8">
              {/* 🔹 APPOINTMENT LIST VIEW */}
              {viewMode === "list" && (
                <>
                  <h1 className="mb-4 text-lg font-semibold">
                    Appointments on {selectedDate}
                  </h1>

                  {appointmentsByDate.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      No appointments found for this date.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {appointmentsByDate.map((appt, index) => (
                        <div
                          key={appt._id || index}
                          className="flex justify-between rounded-lg border dark:border-gray-700 p-3"
                        >
                          <div>
                            <p className="font-medium">{appt.patientName}</p>
                            <p className="text-sm text-gray-500">
                              {ConvertTime(appt.startTime)} - {ConvertTime(appt.endTime)}
                            </p>
                          </div>
                          <span className="text-sm font-semibold">
                            {appt.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* 🔹 EVENT FORM VIEW */}
              {viewMode === "form" && (
                <>
                  {/* 👇 KEEP YOUR EXISTING FORM CODE AS IS */}
                  {/* Event Title, Color, Start Date, End Date */}
                </>
              )}
            </div>

            <div className="flex items-center gap-3 mt-6 modal-footer sm:justify-end">
              <button
                onClick={closeModal}
                type="button"
                className="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] sm:w-auto"
              >
                Close
              </button>
              {/* <button
                onClick={handleAddOrUpdateEvent}
                type="button"
                className="btn btn-success btn-update-event flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 sm:w-auto"
              >
                {selectedEvent ? "Update Changes" : "Add Event"}
              </button> */}
            </div>
          </div>
        </Modal>
      </div>
    </>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderEventContent = (eventInfo: any) => {
  const colorClass = `fc-bg-${eventInfo.event.extendedProps.calendar.toLowerCase()}`;
  return (
    <div
      className={`event-fc-color flex fc-event-main ${colorClass} p-1 rounded`}
    >
      <div className="fc-daygrid-event-dot"></div>
      <div className="fc-event-time">{eventInfo.timeText}</div>
      <div className="fc-event-title">{eventInfo.event.title}</div>
    </div>
  );
};

export default Calendar;
