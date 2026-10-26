import { qs } from "./api.js";
import { addDays, startOfDay } from "./shape.js";

/** Primary-calendar events from the start of today to the end of tomorrow. */
export async function listTodayTomorrow(fetchJson, today = new Date()) {
  const res = await fetchJson(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events" +
      qs({
        timeMin: startOfDay(today).toISOString(),
        timeMax: addDays(today, 2).toISOString(),
        singleEvents: true,
        orderBy: "startTime",
        maxResults: 50,
      }),
  );
  return res.items || [];
}
