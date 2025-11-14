import React from "react";
import { Link, useLocation } from "react-router";

export default function Error404() {
  const location = useLocation();

  return (
    <>
      <h2 className="mb-5 text-2xl font-bold">Error 404: Page Not Found</h2>
      <p>
        The requested URL <code>{location.pathname}</code> was not found on this
        server.
      </p>
      <hr className="mb-5 mt-10" />
      <Link
        to="/"
        className="rounded border bg-zinc-100 px-3 py-2 shadow-sm hover:bg-zinc-400 hover:text-white"
      >
        Go back to Home
      </Link>
    </>
  );
}
