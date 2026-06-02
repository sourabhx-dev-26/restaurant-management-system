"use client";

import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
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
    const fetchOrders = async () => {
      try {
        const querySnapshot = await getDocs(
          collection(db, "orders")
        );

        const data: any[] = [];

        querySnapshot.forEach((doc) => {
          data.push({
            id: doc.id,
            ...doc.data(),
          });
        });

        setOrders(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">

        <h1 className="text-4xl font-bold mb-8 text-black">
          Kitchen Dashboard
        </h1>

        {loading ? (
          <p className="text-black">
            Loading Orders...
          </p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white p-4 rounded shadow"
              >
                <h2 className="text-2xl font-bold text-black">
                  {order.customerName}
                </h2>

                <p className="text-gray-700">
                  Table: {order.tableNumber}
                </p>

                <p className="text-gray-700">
                  Total: ₹{order.totalPrice}
                </p>

                <div className="mt-3">
                  <h3 className="font-semibold text-black">
                    Items
                  </h3>

                  <ul>
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

                <p className="font-bold mt-3 text-blue-600">
                  {order.status}
                </p>

                <div className="flex gap-2 mt-4 flex-wrap">

                  <button
                    onClick={() =>
                      updateOrderStatus(
                        order.id,
                        "PREPARING"
                      )
                    }
                    className="bg-yellow-500 text-white px-3 py-1 rounded"
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
                    className="bg-green-500 text-white px-3 py-1 rounded"
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
                    className="bg-blue-500 text-white px-3 py-1 rounded"
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
  );
}