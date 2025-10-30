import React from "react";
import timeFormater from "../lib/timeFormater";

interface TimeDisplayProps extends React.TimeHTMLAttributes<HTMLTimeElement> {
  timestamp: string;
  // className 已經包含在 TimeHTMLAttributes 中
}

export default function TimeDisplay({
  timestamp,
  className,
}: TimeDisplayProps) {
  const displayTime = timeFormater(timestamp);
  const fullTime = timeFormater(timestamp, "YYYY-MM-DD HH:mm:ss");

  return (
    <time
      className={`cursor-help ${className || ""}`}
      dateTime={fullTime}
      title={fullTime}
    >
      {displayTime}
    </time>
  );
}
