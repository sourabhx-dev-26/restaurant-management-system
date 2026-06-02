"use client";

import ProtectedRoute from "../../../components/ProtectedRoute";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
} from "firebase/firestore";

import { signOut } from "firebase/auth";
import { db, auth } from "../../../lib/firebase";

type MenuItem = {
  id: string;
  name: string;
  price: number;
  category: string;
  available: boolean;
};

export default function AdminMenuPage() {
  const router = useRouter();

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");

  const logout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  const fetchMenuItems = async () => {
    try {
      const querySnapshot = await getDocs(
        collection(db, "menuItems")
      );

      const items: MenuItem[] = [];

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();

        items.push({
          id: docSnap.id,
          name: data.name || "",
          price: data.price || 0,
          category: data.category || "",
          available:
            data.available !== undefined
              ? data.available
              : true,
        });
      });

      setMenuItems(items);
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const addMenuItem = async () => {
    if (!name || !price || !category) {
      alert("Please fill all fields");
      return;
    }

    try {
      await addDoc(
        collection(db, "menuItems"),
        {
          name,
          price: Number(price),
          category,
          available: true,
        }
      );

      setName("");
      setPrice("");
      setCategory("");

      await fetchMenuItems();

      alert("Menu Item Added Successfully");
    } catch (error) {
      console.error("Add Error:", error);
    }
  };
  const deleteMenuItem = async (
    itemId: string
  ) => {
    try {
      await deleteDoc(
        doc(db, "menuItems", itemId)
      );

      await fetchMenuItems();
    } catch (error) {
      console.error("Delete Error:", error);
    }
  };

  const toggleAvailability = async (
    itemId: string,
    currentValue: boolean
  ) => {
    try {
      await updateDoc(
        doc(db, "menuItems", itemId),
        {
          available: !currentValue,
        }
      );

      await fetchMenuItems();
    } catch (error) {
      console.error("Update Error:", error);
    }
  };

  return (
    <ProtectedRoute allowedRole="manager">
      <main className="min-h-screen bg-slate-100">
        <div className="flex">

          {/* Sidebar */}
          <div className="w-64 min-h-screen bg-slate-900 text-white p-6">

            <h1 className="text-2xl font-bold mb-10">
              🍽 RMS
            </h1>

            <div className="space-y-4">

              <div className="bg-slate-800 p-3 rounded-lg">
                Dashboard
              </div>

              <div className="bg-slate-800 p-3 rounded-lg">
                Menu Management
              </div>

              <button
                onClick={logout}
                className="w-full bg-red-500 hover:bg-red-600 p-3 rounded-lg"
              >
                Logout
              </button>

            </div>

          </div>

          {/* Main Content */}
          <div className="flex-1 p-8">

            <div className="mb-8">

              <h1 className="text-4xl font-bold text-slate-900">
                Restaurant Manager
              </h1>

              <p className="text-slate-500 mt-2">
                Control menu items and availability
              </p>

            </div>

            {/* Stats Cards */}
            <div className="grid md:grid-cols-3 gap-4 mb-8">

              <div className="bg-white rounded-3xl shadow-lg p-6 border border-slate-200">
                <p className="text-gray-500">
                  Total Items
                </p>

                <h2 className="text-3xl font-bold text-black">
                  {menuItems.length}
                </h2>
              </div>

              <div className="bg-white rounded-3xl shadow-lg p-6 border border-slate-200">
                <p className="text-gray-500">
                  Available
                </p>

                <h2 className="text-3xl font-bold text-green-600">
                  {
                    menuItems.filter(
                      (item) =>
                        item.available !== false
                    ).length
                  }
                </h2>
              </div>

              <div className="bg-white rounded-3xl shadow-lg p-6 border border-slate-200">
                <p className="text-gray-500">
                  Out Of Stock
                </p>

                <h2 className="text-3xl font-bold text-red-500">
                  {
                    menuItems.filter(
                      (item) =>
                        item.available === false
                    ).length
                  }
                </h2>
              </div>

            </div>

            {/* Add Menu Item */}
            <div className="bg-white rounded-3xl shadow-lg p-8 border border-slate-200 mb-8">

              <h2 className="text-3xl font-bold text-slate-900 mb-6">
                Add Menu Item
              </h2>

              <input
                type="text"
                placeholder="Item Name"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                className="border border-slate-300 p-3 rounded-xl w-full mb-3 text-black"
              />

              <input
                type="number"
                placeholder="Price"
                value={price}
                onChange={(e) =>
                  setPrice(e.target.value)
                }
                className="border border-slate-300 p-3 rounded-xl w-full mb-3 text-black"
              />

              <input
                type="text"
                placeholder="Category"
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value)
                }
                className="border border-slate-300 p-3 rounded-xl w-full mb-5 text-black"
              />

              <button
                onClick={addMenuItem}
                className="bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-xl"
              >
                Add Item
              </button>

            </div>

            <h2 className="text-3xl font-bold text-slate-900 mb-6">
              Menu Items
            </h2>
		            {loading ? (
              <p className="text-black">
                Loading...
              </p>
            ) : (
              <div className="grid md:grid-cols-3 gap-4">

                {menuItems.length === 0 ? (
                  <p className="text-black">
                    No Menu Items Found
                  </p>
                ) : (
                  menuItems.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white rounded-3xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition"
                    >
                      <h3 className="text-xl font-bold text-black">
                        {item.name}
                      </h3>

                      <p className="text-gray-700">
                        ₹{item.price}
                      </p>

                      <p className="text-gray-500">
                        {item.category}
                      </p>

                      <p
                        className={
                          item.available
                            ? "text-green-600 font-semibold"
                            : "text-red-500 font-semibold"
                        }
                      >
                        {item.available
                          ? "Available"
                          : "Out of Stock"}
                      </p>

                      <div className="flex gap-2 mt-4">

                        <button
                          onClick={() =>
                            toggleAvailability(
                              item.id,
                              item.available
                            )
                          }
                          className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg"
                        >
                          Toggle
                        </button>

                        <button
                          onClick={() =>
                            deleteMenuItem(item.id)
                          }
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg"
                        >
                          Delete
                        </button>

                      </div>
                    </div>
                  ))
                )}

              </div>
            )}

          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}