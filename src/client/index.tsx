import { createRoot } from "react-dom/client";
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { nanoid } from "nanoid";
import Home from "./pages/home";

import "./tailwindcss.css";

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Navigate to={`/${nanoid()}`} />} />
      <Route path="/:room" element={<Home />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  </BrowserRouter>,
);
