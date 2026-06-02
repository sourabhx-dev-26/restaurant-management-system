"use client";

import ProtectedRoute from "../../components/ProtectedRoute";
import { useEffect, useState } from "react";

import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
} from "firebase/firestore";

import { db } from "../../lib/firebase";

export default function KitchenPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const updateOrderStatus = async (
    orderId: string,
    status: string
  ) => {
    try {
      await updateDoc(
        doc(db, "orders", orderId),
        {
          status,
        }
      );

      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId
            ? { ...order, status }
            : order
        )
      );
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "orders"),
      (snapshot) => {
        const data: any[] = [];

        snapshot.forEach((docSnap) => {
          data.push({
            id: docSnap.id,
            ...docSnap.data(),
          });
        });

        setOrders(data);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <ProtectedRoute allowedRole="kitchen">
      <main className="min-h-screen bg-slate-100 p-6">
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <div className="bg-white rounded-3xl shadow-lg p-6 mb-8">
            <h1 className="text-4xl font-bold text-slate-900">
              👨‍🍳 Kitchen Dashboard
            </h1>

            <p className="text-slate-500 mt-2">
              Manage incoming orders and preparation status
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-4 mb-8">

            <div className="bg-white rounded-3xl shadow-lg p-6">
              <p className="text-slate-500">
                Total Orders
              </p>

              <h2 className="text-3xl font-bold">
                {orders.length}
              </h2>
            </div>

            <div className="bg-white rounded-3xl shadow-lg p-6">
              <p className="text-slate-500">
                Placed
              </p>

              <h2 className="text-3xl font-bold text-blue-600">
                {
                  orders.filter(
                    (o) => o.status === "PLACED"
                  ).length
                }
              </h2>
            </div>

            <div className="bg-white rounded-3xl shadow-lg p-6">
              <p className="text-slate-500">
                Preparing
              </p>

              <h2 className="text-3xl font-bold text-yellow-600">
                {
                  orders.filter(
                    (o) => o.status === "PREPARING"
                  ).length
                }
              </h2>
            </div>

            <div className="bg-white rounded-3xl shadow-lg p-6">
              <p className="text-slate-500">
                Ready
              </p>

              <h2 className="text-3xl font-bold text-green-600">
                {
                  orders.filter(
                    (o) => o.status === "READY"
                  ).length
                }
              </h2>
            </div>

          </div>

          {loading ? (
            <p className="text-black">
              Loading Orders...
            </p>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">

              {orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-3xl shadow-lg border border-slate-200 p-6"
                >
                  <h2 className="text-2xl font-bold text-black">
                    {order.customerName || "Walk-in Customer"}
                  </h2>

                  <p className="text-gray-700 mt-2">
                    Table: {order.tableNumber}
                  </p>

                  <p className="text-gray-700">
                    Total: ₹{order.totalPrice}
                  </p>

                  <div className="mt-4">
                    <h3 className="font-semibold text-black">
                      Items
                    </h3>

                    <ul className="mt-2">
                      {order.items?.map(
                        (item: any, index: number) => (
                          <li
                            key={index}
                            className="text-gray-700"
                          >
                            • {item.name}
                          </li>
                        )
                      )}
                    </ul>
                  </div>

                  <div className="mt-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-bold ${
                        order.status === "PLACED"
                          ? "bg-blue-100 text-blue-700"
                          : order.status === "PREPARING"
                          ? "bg-yellow-100 text-yellow-700"
                          : order.status === "READY"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>

                  <div className="flex gap-2 mt-4 flex-wrap">

                    <button
                      onClick={() =>
                        updateOrderStatus(
                          order.id,
                          "PREPARING"
                        )
                      }
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg"
                    >
                      Preparing
                    </button>

                    <button
                      onClick={() =>
                        updateOrderStatus(
                          order.id,
                          "READY"
                        )
                      }
                      className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg"
                    >
                      Ready
                    </button>

                    <button
                      onClick={() =>
                        updateOrderStatus(
                          order.id,
                          "SERVED"
                        )
                      }
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg"
                    >
                      Served
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