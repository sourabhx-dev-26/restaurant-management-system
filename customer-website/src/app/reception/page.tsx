"use client";

import ProtectedRoute from "../../components/ProtectedRoute";
import { useEffect, useState } from "react";

import {
  collection,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";

import { db } from "../../lib/firebase";

export default function ReceptionPage() {
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const updateTableStatus = async (
    tableId: string,
    status: string
  ) => {
    try {
      await updateDoc(
        doc(db, "tables", tableId),
        {
          status,
        }
      );

      setTables((prev) =>
        prev.map((table) =>
          table.id === tableId
            ? {
                ...table,
                status,
              }
            : table
        )
      );
    } catch (error) {
      console.error(error);
    }
  };
  useEffect(() => {
    const fetchTables = async () => {
      try {
        const querySnapshot = await getDocs(
          collection(db, "tables")
        );

        const data: any[] = [];

        querySnapshot.forEach((doc) => {
          data.push({
            id: doc.id,
            ...doc.data(),
          });
        });

        setTables(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchTables();
  }, []);

  return (
    <ProtectedRoute allowedRole="reception">
      <main className="min-h-screen bg-slate-100 p-6">
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <div className="bg-white rounded-3xl shadow-lg p-6 mb-8">

            <h1 className="text-4xl font-bold text-slate-900">
              🏨 Reception Dashboard
            </h1>

            <p className="text-slate-500 mt-2">
              Manage restaurant tables and reservations
            </p>

          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">

            <div className="bg-white rounded-3xl shadow-lg p-6">
              <p className="text-slate-500">
                Total Tables
              </p>

              <h2 className="text-3xl font-bold text-slate-900">
                {tables.length}
              </h2>
            </div>

            <div className="bg-white rounded-3xl shadow-lg p-6">
              <p className="text-slate-500">
                Available
              </p>

              <h2 className="text-3xl font-bold text-green-600">
                {
                  tables.filter(
                    (t) => t.status === "available"
                  ).length
                }
              </h2>
            </div>

            <div className="bg-white rounded-3xl shadow-lg p-6">
              <p className="text-slate-500">
                Occupied / Booked
              </p>

              <h2 className="text-3xl font-bold text-red-500">
                {
                  tables.filter(
                    (t) => t.status !== "available"
                  ).length
                }
              </h2>
            </div>

          </div>

	          {loading ? (
            <p className="text-black">
              Loading Tables...
            </p>
          ) : (
            <div className="grid md:grid-cols-3 gap-4">

              {tables.map((table) => (
                <div
                  key={table.id}
                  className="bg-white rounded-3xl shadow-lg border border-slate-200 p-6"
                >
                  <h2 className="text-2xl font-bold text-black">
                    Table {table.tableNumber}
                  </h2>

                  <p className="text-gray-600 mt-2">
                    Capacity: {table.capacity}
                  </p>

                  <p
                    className={`font-bold mt-3 ${
                      table.status === "available"
                        ? "text-green-600"
                        : table.status === "occupied"
                        ? "text-red-500"
                        : "text-yellow-600"
                    }`}
                  >
                    {table.status.toUpperCase()}
                  </p>

                  <div className="flex gap-2 mt-4 flex-wrap">
		                    <button
                      onClick={() =>
                        updateTableStatus(
                          table.id,
                          "available"
                        )
                      }
                      className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg"
                    >
                      Available
                    </button>

                    <button
                      onClick={() =>
                        updateTableStatus(
                          table.id,
                          "occupied"
                        )
                      }
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg"
                    >
                      Occupied
                    </button>

                    <button
                      onClick={() =>
                        updateTableStatus(
                          table.id,
                          "booked"
                        )
                      }
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg"
                    >
                      Booked
                    </button>

                  </div>
                </div>
              ))}

            </div>
          )}

        </div>
      </main>
    </ProtectedRoute>
  );
}