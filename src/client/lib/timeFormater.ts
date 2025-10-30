import day from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

day.extend(relativeTime);

export default function timeFormater(time: string, specificFormat?: string) {
  let format = "MM/DD HH:mm:ss";
  const dayTime = day(time);

  const today = day().startOf("day");

  if (specificFormat) {
    return dayTime.format(specificFormat);
  }

  if (dayTime.diff(today, "day") < 0) {
    return dayTime.format(format);
  } else {
    return dayTime.fromNow();
  }
}
