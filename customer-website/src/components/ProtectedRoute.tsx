"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { useRouter } from "next/navigation";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole: string;
}

export default function ProtectedRoute({
  children,
  allowedRole,
}: ProtectedRouteProps) {
  const router = useRouter();

  const [authorized, setAuthorized] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (user) => {
          if (!user) {
            router.push("/login");
            return;
          }

          try {
            const querySnapshot =
              await getDocs(
                collection(
                  db,
                  "users"
                )
              );

            let role = "";

            querySnapshot.forEach(
              (docSnap) => {
                const data =
                  docSnap.data();

                if (
                  data.email ===
                  user.email
                ) {
                  role = data.role;
                }
              }
            );

            if (
              role !== allowedRole
            ) {
              alert(
                "Access Denied"
              );

              router.push(
                "/login"
              );

              return;
            }

            setAuthorized(
              true
            );
          } catch (error) {
            console.error(
              error
            );

            router.push(
              "/login"
            );
          } finally {
            setLoading(
              false
            );
          }
        }
      );

    return () =>
      unsubscribe();
  }, [allowedRole, router]);

  if (loading) {
    return (
      <div className="p-6">
        Checking Access...
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  return <>{children}</>;
}