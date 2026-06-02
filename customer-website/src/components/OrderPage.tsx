"use client";

import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  addDoc,
} from "firebase/firestore";
import { db } from "../lib/firebase";

interface OrderPageProps {
  tableNumber?: string;
}

export default function OrderPage({
  tableNumber,
}: OrderPageProps) {
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [customerName, setCustomerName] = useState("");
  const [cartItems, setCartItems] = useState<any[]>([]);

  const totalPrice = cartItems.reduce(
    (sum, item) => sum + Number(item.price || 0),
    0
  );

  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        const querySnapshot = await getDocs(
          collection(db, "menuItems")
        );

        const items: any[] = [];

        querySnapshot.forEach((docSnap) => {
          items.push({
            id: docSnap.id,
            ...docSnap.data(),
          });
        });

        setMenuItems(items);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchMenuItems();
  }, []);

  const placeOrder = async () => {
    if (cartItems.length === 0) {
      alert("Cart is empty");
      return;
    }

    try {
      await addDoc(
        collection(db, "orders"),
        {
          customerName,
          tableNumber,
          items: cartItems,
          totalPrice,
          status: "PLACED",
          createdAt: new Date(),
        }
      );

      alert("Order Placed Successfully!");

      setCartItems([]);
      setCustomerName("");
    } catch (error) {
      console.error(error);
      alert("Failed to place order");
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="bg-white rounded-3xl shadow-lg p-6 mb-6 text-center">
          <h1 className="text-4xl font-bold text-slate-900">
            🍽 Restaurant
          </h1>

          <p className="text-slate-500 mt-2">
            Digital Ordering System
          </p>
        </div>

        {/* Table Details */}
        <div className="bg-white rounded-3xl shadow-lg border border-slate-200 p-6 mb-6">
          <h2 className="text-2xl font-bold text-black">
            Table {tableNumber}
          </h2>

          <input
            type="text"
            placeholder="Your Name (Optional)"
            value={customerName}
            onChange={(e) =>
              setCustomerName(e.target.value)
            }
            className="border p-3 rounded-xl w-full mt-4 text-black"
          />
        </div>

        {/* Cart */}
        <div className="bg-white rounded-3xl shadow-lg border border-slate-200 p-6 mb-6">

          <h2 className="text-2xl font-bold text-slate-900">
            🛒 Cart
          </h2>

          {cartItems.length === 0 ? (
            <p className="text-gray-500 mt-3">
              🛒 Your cart is empty
            </p>
          ) : (
            <>
              <ul className="mt-3">
                {cartItems.map((item, index) => (
                  <li
                    key={index}
                    className="text-black py-1"
                  >
                    {item.name} - ₹{item.price}
                  </li>
                ))}
              </ul>

              <div className="mt-4 font-bold text-black text-lg">
                Total: ₹{totalPrice}
              </div>

              <button
                onClick={placeOrder}
                className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold"
              >
                Place Order
              </button>
            </>
          )}

        </div>

        {/* Menu Header */}
        <h2 className="text-3xl font-bold text-slate-900 mb-6">
          Menu
        </h2>

        {loading ? (
          <p className="text-black">
            Loading Menu...
          </p>
        ) : (
          <div className="grid md:grid-cols-3 gap-4">

            {menuItems
              .filter(
                (item) =>
                  item.available !== false
              )
              .map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-3xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition"
                >
                  <h3 className="text-xl font-bold text-black">
                    {item.name}
                  </h3>

                  <p className="text-gray-700 mt-2">
                    ₹{item.price}
                  </p>

                  <p className="text-gray-500">
                    {item.category}
                  </p>

                  <button
                    onClick={() =>
                      setCartItems([
                        ...cartItems,
                        item,
                      ])
                    }
                    className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-xl font-semibold"
                  >
                    Add To Cart
                  </button>
                </div>
              ))}

          </div>
        )}

      </div>
    </main>
  );
}