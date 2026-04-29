// ==============================
// AutoMotive Buddy - ADMIN PRO MAX DASHBOARD
// ==============================

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const API_URL = (import.meta as any).env.VITE_API_URL || '';

export default function AdminDashboardProMax() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [drawer, setDrawer] = useState(false);
  const [plan, setPlan] = useState("");
  const [loading, setLoading] = useState(false);
  const [guest, setGuest] = useState<any>(null);

  const token = localStorage.getItem("autobuddy_token");

  // FETCH USERS
  const fetchUsers = async () => {
    const res = await fetch(`${API_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setUsers(data);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // FILTER USERS
  const filtered = users.filter((u) =>
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  // SET SUBSCRIPTION
  const setSubscription = async () => {
    if (!selectedUser) return;
    setLoading(true);

    await fetch(`${API_URL}/admin/set-subscription`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        uid: selectedUser.uid,
        plan,
      }),
    });

    setLoading(false);
    setDrawer(false);
    fetchUsers();
  };

  // DISABLE USER
  const disableUser = async (uid: string) => {
    await fetch(`${API_URL}/admin/disable-user`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ uid }),
    });

    fetchUsers();
  };

  // CREATE GUEST
  const createGuest = async () => {
    const res = await fetch(`${API_URL}/admin/create-guest`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    setGuest(data);
    fetchUsers();
  };

  // TIME LEFT
  const getTimeLeft = (end: string) => {
    if (!end) return "No Plan";
    const diff = new Date(end).getTime() - new Date().getTime();
    if (diff <= 0) return "Expired";

    const hrs = Math.floor(diff / 1000 / 60 / 60);
    return `${hrs}h left`;
  };

  return (
    <div className="min-h-screen bg-black text-white p-4">

      {/* HEADER */}
      <h1 className="text-xl font-bold mb-4">🚗 Admin Pro Max</h1>

      {/* SEARCH */}
      <input
        placeholder="Search users..."
        className="w-full p-3 mb-4 bg-zinc-900 rounded-xl"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* CREATE GUEST */}
      <button
        onClick={createGuest}
        className="w-full mb-4 bg-blue-600 p-3 rounded-xl"
      >
        + Create Guest (24H)
      </button>

      {/* GUEST DISPLAY */}
      {guest && (
        <div className="bg-zinc-900 p-3 mb-4 rounded-xl">
          <p>Email: {guest.email}</p>
          <p>Password: {guest.password}</p>
        </div>
      )}

      {/* USER LIST */}
      <div className="space-y-3">
        {filtered.map((u) => (
          <motion.div
            key={u.uid}
            layout
            className="p-4 bg-zinc-900 rounded-xl"
          >
            <p className="font-semibold">{u.email}</p>

            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-400">{u.role}</span>

              <span
                className={`${
                  getTimeLeft(u.subscription?.endDate) === "Expired"
                    ? "text-red-400"
                    : "text-green-400"
                }`}
              >
                {getTimeLeft(u.subscription?.endDate)}
              </span>
            </div>

            {/* ACTIONS */}
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => {
                  setSelectedUser(u);
                  setDrawer(true);
                }}
                className="flex-1 bg-orange-500 p-2 rounded-lg"
              >
                Plan
              </button>

              <button
                onClick={() => disableUser(u.uid)}
                className="flex-1 bg-red-600 p-2 rounded-lg"
              >
                Disable
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* DRAWER */}
      <AnimatePresence>
        {drawer && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            className="fixed bottom-0 left-0 right-0 bg-zinc-900 p-6 rounded-t-3xl"
          >
            <h2 className="mb-3 font-bold">Select Plan</h2>

            {["1_month", "3_month", "6_month", "1_year"].map((p) => (
              <button
                key={p}
                onClick={() => setPlan(p)}
                className={`w-full mb-2 p-3 rounded-xl ${
                  plan === p ? "bg-orange-500" : "bg-zinc-800"
                }`}
              >
                {p.replace("_", " ")}
              </button>
            ))}

            <button
              onClick={setSubscription}
              className="w-full bg-green-500 p-3 rounded-xl mt-2"
            >
              {loading ? "Saving..." : "Confirm"}
            </button>

            <button
              onClick={() => setDrawer(false)}
              className="w-full mt-2 text-gray-400"
            >
              Cancel
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
