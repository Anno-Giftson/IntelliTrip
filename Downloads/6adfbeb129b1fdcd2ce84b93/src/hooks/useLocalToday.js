import { useEffect, useState } from "react";
import { isoToday } from "@/lib/calendarLinks";

export default function useLocalToday() {
  const [today, setToday] = useState("");
  useEffect(() => {
    const update = () => setToday(isoToday());
    update();
    window.addEventListener("focus", update);
    const timer = setInterval(update, 60000);
    return () => { clearInterval(timer); window.removeEventListener("focus", update); };
  }, []);
  return today;
}