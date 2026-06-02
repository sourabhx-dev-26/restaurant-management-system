"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import {
  collection,
  getDocs,
} from "firebase/firestore";
import { auth, db } from "../../lib/firebase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const login = async () => {
    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }

    try {
      setLoading(true);

      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      const querySnapshot = await getDocs(
        collection(db, "users")
      );

      let role = "";querySnapshot.forEach((docSnap) => {
  const data = docSnap.data();

  console.log("DOC DATA:", data);

  if (
    data.email?.toLowerCase() ===
    email.toLowerCase()
  ) {
    role = data.role;

    console.log(
      "MATCH FOUND:",
      role
    );
  }
});

console.log("FINAL ROLE:", role);
      if (role === "manager") {
        router.push("/admin/menu");
      } else if (role === "kitchen") {
        router.push("/kitchen");
      } else if (role === "reception") {
        router.push("/reception");
      } else {
        alert("Role not found");
      }
    } catch (error: any) {
      console.error(error);

      alert(
        error?.message ||
          "Login Failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded shadow w-full max-w-md">

        <h1 className="text-3xl font-bold text-center mb-6 text-black">
          Restaurant Login
        </h1>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
          className="border p-3 rounded w-full mb-4 text-black"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
          className="border p-3 rounded w-full mb-4 text-black"
        />

        <button
          onClick={login}
          disabled={loading}
          className="bg-blue-500 text-white w-full py-3 rounded"
        >
          {loading
            ? "Logging In..."
            : "Login"}
        </button>

      </div>
    </main>
  );
}