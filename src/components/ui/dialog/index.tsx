// import  { useState } from 'react'
// import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material'

// type Appointment = {
//   _id: string;
//   clinicId: string;
//   patientName: string;
//   patientMobile: string;
//   appointmentDate: string;
//   startTime: string;
//   endTime: string;
// };

// const index = () => {
//     const [confirmOpen, setConfirmOpen] = useState(false);
//       const [deleteItem, setDeleteItem] = useState<Appointment | null>(null);
    
//       const handleDelete = (item: Appointment) => {
//         setDeleteItem(item);
//         setConfirmOpen(true);
//       };
//   return (
//     <>
//     <Dialog
//         open={confirmOpen}
//         onClose={() => setConfirmOpen(false)}
//       >
//         <DialogTitle>Delete Appointment</DialogTitle>

//         <DialogContent
//         >
//           Are you sure you want to delete this appointment?
//         </DialogContent>

//         <DialogActions>
//           <Button variant="outline" onClick={() => setConfirmOpen(false)}>
//             Cancel
//           </Button>

//           <Button onClick={confirmDelete}>
//             Yes, Delete
//           </Button>
//         </DialogActions>
//       </Dialog>
//     </>
//   )
// }

// export default index