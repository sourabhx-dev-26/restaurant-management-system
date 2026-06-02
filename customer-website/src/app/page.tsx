"use client";

import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  addDoc,
} from "firebase/firestore";
import { db } from "../lib/firebase";

export default function Home() {
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [tableNumber, setTableNumber] = useState("");

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

        querySnapshot.forEach((doc) => {
          items.push({
            id: doc.id,
            ...doc.data(),
          });
        });

        setMenuItems(items);
      } catch (error) {
        console.error("Error fetching menu:", error);
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
      await addDoc(collection(db, "orders"), {
        customerName,
        tableNumber,
        items: cartItems,
        totalPrice,
        status: "PLACED",
        createdAt: new Date(),
      });

      alert("Order Placed Successfully!");

      setCartItems([]);
      setCustomerName("");
      setTableNumber("");
    } catch (error) {
      console.error(error);
      alert("Failed to place order");
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-black">
            🍽 Restaurant Management System
          </h1>

          <div className="bg-blue-500 text-white px-4 py-2 rounded">
            🛒 Cart ({cartItems.length})
          </div>
        </div>

        <div className="mb-8 bg-white p-4 rounded shadow">
          <h2 className="text-xl font-bold text-black">
            Cart Items
          </h2>

          {cartItems.length === 0 ? (
            <p className="text-gray-500">
              Cart is empty
            </p>
          ) : (
            <ul>
              {cartItems.map((item, index) => (
                <li
                  key={index}
                  className="flex justify-between items-center py-1"
                >
                  <span className="text-black">
                    {item.name} - ₹{item.price}
                  </span>

                  <button
                    onClick={() =>
                      setCartItems(
                        cartItems.filter((_, i) => i !== index)
                      )
                    }
                    className="bg-red-500 text-white px-2 py-1 rounded"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 font-bold text-black">
            Total: ₹{totalPrice}
          </div>

          <div className="mt-6">
            <input
              type="text"
              placeholder="Your Name (Optional)"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="border p-2 rounded w-full mb-2 text-black"
            />

            <input
              type="text"
              placeholder="Table Number"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              className="border p-2 rounded w-full mb-2 text-black"
            />

            <button
              onClick={placeOrder}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Place Order
            </button>
          </div>
        </div>
                {loading ? (
          <p className="text-black">Loading menu...</p>
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
                  className="bg-white p-4 rounded shadow"
                >
                  <h3 className="text-xl font-bold text-black">
                    {item.name}
                  </h3>

                  <p className="text-gray-700">
                    ₹{item.price}
                  </p>

                  <p className="text-sm text-gray-500">
                    {item.category}
                  </p>

                  <button
                    onClick={() =>
                      setCartItems([...cartItems, item])
                    }
                    className="mt-3 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
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