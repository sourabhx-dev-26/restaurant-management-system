"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../lib/firebase";

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const querySnapshot = await getDocs(
          collection(db, "bookings")
        );

        const data: any[] = [];

        querySnapshot.forEach((doc) => {
          data.push({
            id: doc.id,
            ...doc.data(),
          });
        });

        setBookings(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">

        <h1 className="text-4xl font-bold mb-8 text-black">
          Bookings Dashboard
        </h1>

        {loading ? (
          <p className="text-black">Loading Bookings...</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white p-4 rounded shadow"
              >
                <h2 className="text-2xl font-bold text-black">
                  {booking.customerName}
                </h2>

                <p className="text-gray-700">
                  Phone: {booking.phone}
                </p>

                <p className="text-gray-700">
                  Guests: {booking.guests}
                </p>

                <p className="text-gray-700">
                  Table: {booking.tableNumber}
                </p>

                <p className="font-semibold text-green-600 mt-2">
                  {booking.status}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}