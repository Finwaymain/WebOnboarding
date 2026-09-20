"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import RestaurantPartnerPortal from "./RestaurantPartnerPortal";
import CustomerFoodOrdering from "./CustomerFoodOrdering";

function FoodPortalContent() {
  const searchParams = useSearchParams();

  const [token, setToken] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [lat, setLat] = useState<number | undefined>(undefined);
  const [lng, setLng] = useState<number | undefined>(undefined);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [userId, setUserId] = useState<string>("");
  const [initialTab, setInitialTab] = useState<string>("dashboard");
  const [portalMode, setPortalMode] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search);
      const t = p.get("token") || p.get("accesstoken") || searchParams.get("token") || searchParams.get("accesstoken") || "";
      const ph = p.get("phone") || searchParams.get("phone") || "";
      const nm = p.get("name") || p.get("username") || p.get("customer_name") || searchParams.get("name") || searchParams.get("username") || "";
      const wb = p.get("wallet_balance") || p.get("balance") || searchParams.get("wallet_balance") || searchParams.get("balance") || "0";
      const uid = p.get("user_id") || p.get("id_user") || searchParams.get("user_id") || searchParams.get("id_user") || "";
      const tab = p.get("tab") || searchParams.get("tab") || "dashboard";
      const view = p.get("view") || searchParams.get("view") || "";
      const userType = p.get("user_type") || searchParams.get("user_type") || "";
      const role = p.get("role") || searchParams.get("role") || "";

      const rawLat = p.get("lat") || p.get("latitude") || searchParams.get("lat") || searchParams.get("latitude");
      const rawLng = p.get("lng") || p.get("longitude") || searchParams.get("lng") || searchParams.get("longitude");

      if (t) setToken(t);
      if (ph) setPhone(ph);
      if (nm) setName(nm);
      if (wb) setWalletBalance(parseFloat(wb) || 0);
      if (uid) setUserId(uid);
      if (tab) setInitialTab(tab);
      if (rawLat) setLat(Number(rawLat));
      if (rawLng) setLng(Number(rawLng));

      const isPortal = view === "portal" || role === "restaurant" || userType === "restaurant" || (p.has("tab") && userType !== "customer");
      setPortalMode(isPortal);
    }
  }, [searchParams]);

  if (portalMode) {
    return (
      <RestaurantPartnerPortal
        token={token}
        phone={phone}
        initialTab={initialTab}
      />
    );
  }

  return (
    <CustomerFoodOrdering
      initialLat={lat}
      initialLng={lng}
      userPhone={phone}
      userName={name}
      initialWalletBalance={walletBalance}
      token={token}
      userId={userId}
      onSwitchToMerchant={() => setPortalMode(true)}
    />
  );
}

export default function FoodPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-500 font-sans font-medium text-sm">Loading Fiinway Food...</div>}>
      <FoodPortalContent />
    </Suspense>
  );
}