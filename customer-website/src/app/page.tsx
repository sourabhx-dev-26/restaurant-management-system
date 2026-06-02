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
    (sum, item) =>
      sum +
      Number(item.price || 0) *
        Number(item.quantity || 1),
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
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-orange-950 p-6">
      <div className="max-w-7xl mx-auto">

        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-5xl font-extrabold text-white">
              🍽 DEMO
            </h1>

            <p className="text-orange-300 mt-2">
              Premium Dining Experience
            </p>
          </div>

          <div className="bg-orange-500 text-white px-6 py-3 rounded-2xl shadow-xl">
            🛒 Cart ({cartItems.length})
          </div>
        </div>

        <div className="mb-8 bg-white/10 backdrop-blur-lg border border-white/20 p-6 rounded-3xl shadow-2xl">

          <h2 className="text-xl font-bold text-white">
            Cart Items
          </h2>

          {cartItems.length === 0 ? (
            <p className="text-gray-300">
              🛒 Your cart is waiting for something delicious
            </p>
          ) : (
            <ul>
		              {cartItems.map((item, index) => (
                <li
                  key={index}
                  className="flex justify-between items-center py-2"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-white">
                      {item.name} - ₹
                      {Number(item.price) *
                        Number(item.quantity)}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          if (item.quantity === 1) {
                            setCartItems(
                              cartItems.filter(
                                (cartItem) =>
                                  cartItem.id !== item.id
                              )
                            );
                          } else {
                            setCartItems(
                              cartItems.map((cartItem) =>
                                cartItem.id === item.id
                                  ? {
                                      ...cartItem,
                                      quantity:
                                        cartItem.quantity - 1,
                                    }
                                  : cartItem
                              )
                            );
                          }
                        }}
                        className="bg-red-500 text-white px-2 rounded"
                      >
                        -
                      </button>

                      <span className="text-white font-semibold">
                        {item.quantity}
                      </span>

                      <button
                        onClick={() => {
                          setCartItems(
                            cartItems.map((cartItem) =>
                              cartItem.id === item.id
                                ? {
                                    ...cartItem,
                                    quantity:
                                      cartItem.quantity + 1,
                                  }
                                : cartItem
                            )
                          );
                        }}
                        className="bg-green-500 text-white px-2 rounded"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 font-bold text-white text-xl">
            Total: ₹{totalPrice}
          </div>

          <div className="mt-6">
            <input
              type="text"
              placeholder="Your Name (Optional)"
              value={customerName}
              onChange={(e) =>
                setCustomerName(e.target.value)
              }
              className="border border-white/20 bg-white/10 text-white p-3 rounded-xl w-full mb-3"
            />

            <input
              type="text"
              placeholder="Table Number"
              value={tableNumber}
              onChange={(e) =>
                setTableNumber(e.target.value)
              }
              className="border border-white/20 bg-white/10 text-white p-3 rounded-xl w-full mb-3"
            />

            <button
              onClick={placeOrder}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl"
            >
              Place Order
            </button>
          </div>
        </div>
	        {loading ? (
          <p className="text-white">
            Loading menu...
          </p>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {menuItems
              .filter(
                (item) =>
                  item.available !== false
              )
              .map((item) => (
                <div
                  key={item.id}
                  className="bg-white/10 backdrop-blur-lg border border-white/20 p-6 rounded-3xl shadow-xl hover:scale-105 transition-all duration-300"
                >
                  <h3 className="text-xl font-bold text-white">
                    {item.name}
                  </h3>

                  <p className="text-orange-300 mt-2">
                    ₹{item.price}
                  </p>

                  <p className="text-gray-300">
                    {item.category}
                  </p>

                  <button
                    onClick={() => {
                      const existingItem =
                        cartItems.find(
                          (cartItem) =>
                            cartItem.id === item.id
                        );

                      if (existingItem) {
                        setCartItems(
                          cartItems.map(
                            (cartItem) =>
                              cartItem.id === item.id
                                ? {
                                    ...cartItem,
                                    quantity:
                                      (cartItem.quantity || 1) + 1,
                                  }
                                : cartItem
                          )
                        );
                      } else {
                        setCartItems([
                          ...cartItems,
                          {
                            ...item,
                            quantity: 1,
                          },
                        ]);
                      }
                    }}
                    className="mt-4 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl w-full"
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