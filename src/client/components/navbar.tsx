import React from "react";
import { Link, NavLink } from "react-router";

interface NavbarProps {
  className?: string;
  // 其他 props
}

const links = [
  { to: "/porn", label: "Porn" },
  { to: "/travel", label: "Travel" },
  { to: "/car", label: "Car" },
];

export default function Navbar({ className }: NavbarProps) {
  return (
    <header className={`sticky top-0 z-10 shadow-sm ${className}`}>
      <nav className="flex items-center">
        {/* my-1 flex max-w-40 items-center self-stretch rounded-full border-2 border-slate-400 bg-slate-100 p-1 px-5 shadow-sm */}
        <Link to="/" title="Back Home" className="">
          <span className="text-xl font-semibold">Chat!</span>
        </Link>
        <div className="ml-auto">
          <ul className="flex gap-1">
            {links.map((link) => (
              <li key={link.to} className="">
                <NavLink
                  to={link.to}
                  className={({ isActive }) =>
                    "block px-2 py-2 hover:text-blue-800 hover:underline " +
                    (isActive ? "text-blue-500" : "text-gray-700")
                  }
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </header>
  );
}
