import { createRoot } from "react-dom/client";
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { nanoid } from "nanoid";
import Home from "./pages/home/index";

import "./tailwindcss.css";

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
createRoot(document.getElementById("root")!).render(
  <div className="p-10">
    <div className="mx-auto max-w-4xl rounded-xl border bg-white p-6 shadow-sm">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to={`/${nanoid()}`} />} />
          <Route path="/:room" element={<Home />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </div>
  </div>,
);
