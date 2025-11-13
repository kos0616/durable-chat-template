import { createRoot } from "react-dom/client";
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import Chat from "./pages/chat/index";
import Home from "./pages/home/index";
import Navbar from "./components/navbar";

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <div className="bg-slate-300">
      <Navbar className="container mx-auto max-w-4xl" />
    </div>
    <div className="container mx-auto my-6 max-w-4xl rounded-xl border bg-white p-6 shadow-sm">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/:room" element={<Chat />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  </BrowserRouter>,
);
