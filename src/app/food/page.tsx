"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import RestaurantPartnerPortal from "./RestaurantPartnerPortal";

function FoodPortalContent() {
  const searchParams = useSearchParams();

  const [token, setToken] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [initialTab, setInitialTab] = useState<string>("dashboard");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search);
      const t = p.get("token") || p.get("accesstoken") || searchParams.get("token") || searchParams.get("accesstoken") || "";
      const ph = p.get("phone") || searchParams.get("phone") || "";
      const tab = p.get("tab") || searchParams.get("tab") || "dashboard";

      if (t) setToken(t);
      if (ph) setPhone(ph);
      if (tab) setInitialTab(tab);
    }
  }, [searchParams]);

  return (
    <RestaurantPartnerPortal
      token={token}
      phone={phone}
      initialTab={initialTab}
    />
  );
}

export default function FoodPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-500 font-sans font-medium text-sm">Loading Fiinway Food Portal...</div>}>
      <FoodPortalContent />
    </Suspense>
  );
}