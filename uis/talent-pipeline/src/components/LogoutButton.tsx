"use client";

import { logout } from "@/lib/auth";

export default function LogoutButton() {
  return <button className="logout-button" type="button" onClick={logout}>Cerrar sesión</button>;
}