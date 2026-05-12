// export const ConvertTime = (time : string): string =>{
// if(!time) return "";

// const [hourstr, min] = time.split(":");
//     let hour = Number(hourstr);

//     if (hour >= 1 && hour <= 11) {
//       hour += 12;
//     }

//     hour = hour % 12 || 12;
//     const ampm = hour >= 12 ? "PM" : "AM";
    

//     return `${hour}:${min.toString().padStart(2, "0")} ${ampm}`;
// }

export const ConvertTime = (time: string) => {
    if (!time) return "";

    const [hourstr, min] = time.split(":");
    let hour = Number(hourstr);
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12;

    return `${hour}:${min} ${ampm}`;
  };