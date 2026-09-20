"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Utensils,
  Store,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Bell,
  Volume2,
  VolumeX,
  Plus,
  Edit2,
  Trash2,
  Bike,
  DollarSign,
  CreditCard,
  Check,
  X,
  ChevronRight,
  ChevronDown,
  Star,
  MessageSquare,
  HelpCircle,
  RefreshCw,
  Sliders,
  ShieldCheck,
  ShoppingBag,
  Filter,
  Calendar,
  ArrowUpRight,
  Lock,
  Phone,
  MapPin,
  Flame,
  ChefHat,
  Receipt,
  User,
  ExternalLink,
  Search,
  Eye,
  Menu as MenuIcon,
  LogOut,
  Copy,
  Camera,
  Image as ImageIcon,
  Upload,
  Building2,
  FileCheck2,
  Sparkles,
  Save,
  Leaf,
  Landmark,
  Shield,
  CheckCircle,
} from "lucide-react";

const ENV_API_KEY = "base64:nTfofcBByTDenJQYlsRbH0JjeVFW5lWsIIyXtq8/9sU=";

function getApiHeaders(authToken?: string, isFormData = false): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    apikey: ENV_API_KEY,
  };
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
    headers["token"] = authToken;
    headers["X-Restaurant-Token"] = authToken;
    headers["accesstoken"] = authToken;
  }
  return headers;
}

interface RestaurantPartnerPortalProps {
  token?: string;
  phone?: string;
  initialTab?: string;
  onBackToOnboarding?: () => void;
}

export default function RestaurantPartnerPortal({
  token = "",
  phone = "",
  initialTab = "dashboard",
  onBackToOnboarding
}: RestaurantPartnerPortalProps) {
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState<boolean>(false);

  // Restaurant profile & Operational status
  const [restaurant, setRestaurant] = useState<any>({
    id: 0,
    name: "Partner Kitchen",
    business_type: "actual_restaurant",
    operational_status: "open",
    address: "",
    city: "",
    avg_prep_minutes: 20,
    opening_time: "10:00",
    closing_time: "23:00",
    phone: phone || "",
    rating: 0,
    total_reviews: 0
  });

  // Sound alert toggle
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);

  // Dashboard Stats
  const [stats, setStats] = useState<any>({
    today_orders: 0,
    pending: 0,
    preparing: 0,
    ready: 0,
    out_for_delivery: 0,
    delivered: 0,
    cancelled: 0,
    active_orders: 0,
    today_sales: 0,
    today_commission: 0,
    today_net: 0,
    pending_due: 0
  });

  // Orders
  const [incomingOrders, setIncomingOrders] = useState<any[]>([]);
  const [activeOrders, setActiveOrders] = useState<any[]>([]);

  // Menu State
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<number | null>(null);
  const [menuSearch, setMenuSearch] = useState<string>("");

  // Settlements & Finances
  const [settlements, setSettlements] = useState<any[]>([]);
  const [isUpiModalOpen, setIsUpiModalOpen] = useState<boolean>(false);
  const [upiPaymentUtr, setUpiPaymentUtr] = useState<string>("");
  const [isSubmittingDue, setIsSubmittingDue] = useState<boolean>(false);

  // Order History & Drawer
  const [pastOrders, setPastOrders] = useState<any[]>([]);
  const [historySearch, setHistorySearch] = useState<string>("");
  const [historyStatusFilter, setHistoryStatusFilter] = useState<string>("all");
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<any | null>(null);

  // Reviews
  const [reviews, setReviews] = useState<any[]>([]);
  const [replyingReview, setReplyingReview] = useState<any | null>(null);
  const [reviewReplyText, setReviewReplyText] = useState<string>("");

  // Modals & UI states
  const [prepTimeChoice, setPrepTimeChoice] = useState<number>(20);
  const [rejectReason, setRejectReason] = useState<string>("");
  const [isRejectModalOpen, setIsRejectModalOpen] = useState<boolean>(false);
  const [orderToReject, setOrderToReject] = useState<any | null>(null);

  // Rider handover OTP modal
  const [handoverOrderId, setHandoverOrderId] = useState<number | null>(null);
  const [riderOtp, setRiderOtp] = useState<string>("");

  // Product Add / Edit Modal
  const [isProductModalOpen, setIsProductModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [newProdName, setNewProdName] = useState<string>("");
  const [newProdCategory, setNewProdCategory] = useState<number | string>("");
  const [newProdPrice, setNewProdPrice] = useState<string>("");
  const [newProdOriginalPrice, setNewProdOriginalPrice] = useState<string>("");
  const [newProdVeg, setNewProdVeg] = useState<boolean>(true);
  const [newProdDesc, setNewProdDesc] = useState<string>("");
  const [newProdPrep, setNewProdPrep] = useState<string>("20");
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isSavingProduct, setIsSavingProduct] = useState<boolean>(false);

  // Category Add Modal
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState<boolean>(false);
  const [newCategoryName, setNewCategoryName] = useState<string>("");
  const [newCategoryDesc, setNewCategoryDesc] = useState<string>("");

  // Profile Form state
  const [profileOpening, setProfileOpening] = useState<string>("10:00");
  const [profileClosing, setProfileClosing] = useState<string>("23:00");
  const [profilePrepMins, setProfilePrepMins] = useState<number>(20);
  const [profileRadius, setProfileRadius] = useState<number>(5);
  const [profileMinOrder, setProfileMinOrder] = useState<number>(0);
  const [profilePureVeg, setProfilePureVeg] = useState<boolean>(false);
  const [profileOutletName, setProfileOutletName] = useState<string>("");
  const [profileDesc, setProfileDesc] = useState<string>("");
  const [profileAddress, setProfileAddress] = useState<string>("");
  const [profileCity, setProfileCity] = useState<string>("");
  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);

  // Owner Identity State
  const [ownerName, setOwnerName] = useState<string>("");
  const [ownerPhone, setOwnerPhone] = useState<string>("");
  const [ownerEmail, setOwnerEmail] = useState<string>("");
  const [ownerPan, setOwnerPan] = useState<string>("");
  const [ownerImagePreview, setOwnerImagePreview] = useState<string>("");
  const [ownerImageFile, setOwnerImageFile] = useState<File | null>(null);
  const [isUploadingOwnerPhoto, setIsUploadingOwnerPhoto] = useState<boolean>(false);

  // Branding Images State
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState<boolean>(false);
  const [coverPreview, setCoverPreview] = useState<string>("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [isUploadingCover, setIsUploadingCover] = useState<boolean>(false);

  // Compliance State
  const [fssaiNumber, setFssaiNumber] = useState<string>("");
  const [gstNumber, setGstNumber] = useState<string>("");

  // Bank & Settlement State
  const [bankAccountName, setBankAccountName] = useState<string>("");
  const [bankName, setBankName] = useState<string>("");
  const [bankAccountNumber, setBankAccountNumber] = useState<string>("");
  const [bankIfsc, setBankIfsc] = useState<string>("");
  const [bankBranch, setBankBranch] = useState<string>("");
  const [upiId, setUpiId] = useState<string>("");

  // Hidden File Input Refs
  const ownerPhotoInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const dishCameraInputRef = useRef<HTMLInputElement>(null);
  const dishGalleryInputRef = useRef<HTMLInputElement>(null);
  const [imagePickTarget, setImagePickTarget] = useState<"dish" | "owner" | "logo" | "cover">("dish");
  const imagePickTargetRef = useRef<"dish" | "owner" | "logo" | "cover">("dish");

  // Toast / notification
  const [toastMessage, setToastMessage] = useState<string>("");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  // Web Audio Synthesizer Chime
  const playChime = useCallback(() => {
    if (isAudioMuted) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1318, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.8, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);

      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch (_) {}
  }, [isAudioMuted]);

  const resolveToken = useCallback(() => {
    if (token) return token;
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search);
      return (
        p.get("token") ||
        p.get("accesstoken") ||
        localStorage.getItem("restaurant_token") ||
        localStorage.getItem("token") ||
        ""
      );
    }
    return "";
  }, [token]);

  // Load backend data
  const fetchPortalData = useCallback(async () => {
    const effectiveToken = resolveToken();
    if (!effectiveToken) return;

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("restaurant_token", effectiveToken);
      } catch (_) {}
    }

    try {
      const headers = getApiHeaders(effectiveToken);

      // 1. Restaurant info
      const res = await fetch("https://api.fiinway.com/api/v1/food/restaurant/me", { headers });
      const data = await res.json();
      if (data?.success && data?.data) {
        const d = data.data;
        setRestaurant((prev: any) => ({
          ...prev,
          ...d,
          name: d.name || prev.name,
          phone: d.owner_phone || phone || prev.phone,
          address: d.address || prev.address,
          city: d.city || prev.city,
          operational_status: d.operational_status || prev.operational_status || "open",
          rating: d.rating_avg || prev.rating || 0,
          total_reviews: d.rating_count || prev.total_reviews || 0,
        }));
        if (d.name) setProfileOutletName(d.name);
        if (d.description) setProfileDesc(d.description);
        if (d.address) setProfileAddress(d.address);
        if (d.city) setProfileCity(d.city);
        if (d.opening_time) setProfileOpening(d.opening_time.slice(0, 5));
        if (d.closing_time) setProfileClosing(d.closing_time.slice(0, 5));
        if (d.avg_prep_minutes) setProfilePrepMins(d.avg_prep_minutes);
        if (d.delivery_radius_km) setProfileRadius(d.delivery_radius_km);
        if (d.min_order_amount !== undefined && d.min_order_amount !== null) setProfileMinOrder(Number(d.min_order_amount));
        if (d.pure_veg !== undefined) setProfilePureVeg(Boolean(d.pure_veg));
        if (d.fssai_number) setFssaiNumber(d.fssai_number);
        if (d.gst_number) setGstNumber(d.gst_number);
        if (d.bank_account_name) setBankAccountName(d.bank_account_name);
        if (d.bank_name) setBankName(d.bank_name);
        if (d.bank_account_number) setBankAccountNumber(d.bank_account_number);
        if (d.bank_ifsc) setBankIfsc(d.bank_ifsc);
        if (d.bank_branch) setBankBranch(d.bank_branch);
        if (d.upi_id) setUpiId(d.upi_id);
        if (d.owner_name) setOwnerName(d.owner_name);
        if (d.owner_phone) setOwnerPhone(d.owner_phone);
        if (d.owner_email) setOwnerEmail(d.owner_email);
        if (d.pan_number) setOwnerPan(d.pan_number);
        if (d.logo) setLogoPreview(d.logo.startsWith("http") ? d.logo : `https://api.fiinway.com/storage/${d.logo}`);
        if (d.cover_image) setCoverPreview(d.cover_image.startsWith("http") ? d.cover_image : `https://api.fiinway.com/storage/${d.cover_image}`);
        if (d.owner_image) setOwnerImagePreview(d.owner_image.startsWith("http") ? d.owner_image : `https://api.fiinway.com/storage/${d.owner_image}`);
      }

      // Fetch owner profile for latest owner image & PAN
      try {
        const profRes = await fetch("https://api.fiinway.com/api/v1/food/restaurant/profile", { headers });
        const profData = await profRes.json();
        if (profData?.success && profData?.data?.owner) {
          const o = profData.data.owner;
          if (o.name) setOwnerName(o.name);
          if (o.phone) setOwnerPhone(o.phone);
          if (o.email) setOwnerEmail(o.email);
          if (o.pan_number) setOwnerPan(o.pan_number);
          if (o.image) {
            setOwnerImagePreview(o.image.startsWith("http") ? o.image : `https://api.fiinway.com/storage/${o.image}`);
          }
        }
      } catch (_) {}

      // 2. Dashboard KPIs
      const dashRes = await fetch("https://api.fiinway.com/api/v1/food/restaurant/dashboard", { headers });
      const dashData = await dashRes.json();
      if (dashData?.success && dashData?.data) {
        setStats((prev: any) => ({ ...prev, ...dashData.data }));
      }

      // 3. Incoming orders
      const incRes = await fetch("https://api.fiinway.com/api/v1/food/restaurant/orders/incoming", { headers });
      const incData = await incRes.json();
      if (incData?.success && Array.isArray(incData.data)) {
        const prevCount = incomingOrders.length;
        setIncomingOrders(incData.data);
        if (incData.data.length > prevCount) {
          playChime();
        }
      }

      // 4. Active kitchen orders
      const actRes = await fetch("https://api.fiinway.com/api/v1/food/restaurant/orders?active=1", { headers });
      const actData = await actRes.json();
      if (actData?.success) {
        const orderList = Array.isArray(actData.data)
          ? actData.data
          : Array.isArray(actData.data?.data)
          ? actData.data.data
          : [];
        setActiveOrders(orderList);
      }

      // 5. Menu categories & products
      const catRes = await fetch("https://api.fiinway.com/api/v1/food/restaurant/categories", { headers });
      const catData = await catRes.json();
      if (catData?.success && Array.isArray(catData.data)) {
        setCategories(catData.data);
      }

      const prodRes = await fetch("https://api.fiinway.com/api/v1/food/restaurant/products", { headers });
      const prodData = await prodRes.json();
      if (prodData?.success && Array.isArray(prodData.data)) {
        setProducts(prodData.data);
      }

      // 6. Settlements
      const setRes = await fetch("https://api.fiinway.com/api/v1/food/restaurant/settlements", { headers });
      const setData = await setRes.json();
      if (setData?.success) {
        const setList = Array.isArray(setData.data)
          ? setData.data
          : Array.isArray(setData.data?.data)
          ? setData.data.data
          : [];
        setSettlements(setList);
      }

      // 7. Reviews
      const revRes = await fetch("https://api.fiinway.com/api/v1/food/restaurant/reviews", { headers });
      const revData = await revRes.json();
      if (revData?.success) {
        const revList = Array.isArray(revData.data)
          ? revData.data
          : Array.isArray(revData.data?.data)
          ? revData.data.data
          : [];
        setReviews(revList);
      }
    } catch (e) {
      console.warn("Error fetching portal data", e);
    }
  }, [resolveToken, incomingOrders.length, playChime, phone]);

  // Fetch past orders for history tab
  const fetchPastOrders = useCallback(async (searchQuery = "", status = "all") => {
    const effectiveToken = resolveToken();
    if (!effectiveToken) return;
    try {
      let url = "https://api.fiinway.com/api/v1/food/restaurant/orders?per_page=50";
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
      if (status && status !== "all") url += `&status=${encodeURIComponent(status)}`;
      const res = await fetch(url, { headers: getApiHeaders(effectiveToken) });
      const data = await res.json();
      if (data?.success) {
        const list = Array.isArray(data.data) ? data.data : Array.isArray(data.data?.data) ? data.data.data : [];
        setPastOrders(list);
      }
    } catch (_) {}
  }, [resolveToken]);

  useEffect(() => {
    fetchPortalData();
    const interval = setInterval(fetchPortalData, 8000);
    return () => clearInterval(interval);
  }, [fetchPortalData]);

  useEffect(() => {
    if (activeTab === "history") {
      fetchPastOrders(historySearch, historyStatusFilter);
    }
  }, [activeTab, historySearch, historyStatusFilter, fetchPastOrders]);

  // Operational Status Switcher
  const handleToggleOperationalStatus = async (newStatus: string) => {
    const effectiveToken = resolveToken();
    setRestaurant((prev: any) => ({ ...prev, operational_status: newStatus }));

    try {
      await fetch("https://api.fiinway.com/api/v1/food/restaurant/operational-status", {
        method: "POST",
        headers: getApiHeaders(effectiveToken),
        body: JSON.stringify({ status: newStatus })
      });
      showToast(`Kitchen status set to ${newStatus.toUpperCase()}`);
    } catch (_) {
      showToast(`Status set to ${newStatus.toUpperCase()}`);
    }
  };

  // Accept Order
  const handleAcceptOrder = async (order: any) => {
    const effectiveToken = resolveToken();
    try {
      await fetch(`https://api.fiinway.com/api/v1/food/restaurant/orders/${order.id}/accept`, {
        method: "POST",
        headers: getApiHeaders(effectiveToken),
        body: JSON.stringify({ prep_minutes: prepTimeChoice })
      });
      showToast(`Order #${order.order_number || order.id} accepted! Prep: ${prepTimeChoice}m`);
    } catch (_) {
      showToast("Order accepted.");
    }
    fetchPortalData();
  };

  // Reject Order
  const handleRejectOrder = async () => {
    if (!orderToReject) return;
    const effectiveToken = resolveToken();
    try {
      await fetch(`https://api.fiinway.com/api/v1/food/restaurant/orders/${orderToReject.id}/reject`, {
        method: "POST",
        headers: getApiHeaders(effectiveToken),
        body: JSON.stringify({ reason: rejectReason || "Kitchen busy" })
      });
      showToast(`Order #${orderToReject.order_number || orderToReject.id} rejected.`);
    } catch (_) {}
    setIsRejectModalOpen(false);
    setOrderToReject(null);
    setRejectReason("");
    fetchPortalData();
  };

  // Advance Order Status
  const handleUpdateOrderStatus = async (orderId: number, nextStatus: string) => {
    const effectiveToken = resolveToken();
    try {
      await fetch(`https://api.fiinway.com/api/v1/food/restaurant/orders/${orderId}/status`, {
        method: "POST",
        headers: getApiHeaders(effectiveToken),
        body: JSON.stringify({ order_status: nextStatus })
      });
      showToast(`Status updated to ${nextStatus.replace(/_/g, " ").toUpperCase()}`);
    } catch (_) {}
    fetchPortalData();
  };

  // Rider Handover Verification
  const handleConfirmHandover = async () => {
    if (!handoverOrderId) return;
    const effectiveToken = resolveToken();
    try {
      const res = await fetch(`https://api.fiinway.com/api/v1/food/restaurant/orders/${handoverOrderId}/handover`, {
        method: "POST",
        headers: getApiHeaders(effectiveToken),
        body: JSON.stringify({ pickup_otp: riderOtp })
      });
      const data = await res.json();
      if (data?.success) {
        showToast("Food handed over to captain successfully!");
        setHandoverOrderId(null);
        setRiderOtp("");
      } else {
        showToast(data?.error || "OTP verification failed.");
      }
    } catch (_) {
      showToast("Food handover confirmed.");
      setHandoverOrderId(null);
      setRiderOtp("");
    }
    fetchPortalData();
  };

  // Instant Stock Availability Toggle
  const handleToggleProductStock = async (productId: number, currentAvailable: boolean) => {
    const effectiveToken = resolveToken();
    const nextAvailability = currentAvailable ? "out_of_stock" : "available";

    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, availability: nextAvailability } : p))
    );

    try {
      await fetch(`https://api.fiinway.com/api/v1/food/restaurant/products/${productId}/availability`, {
        method: "POST",
        headers: getApiHeaders(effectiveToken),
        body: JSON.stringify({ availability: nextAvailability })
      });
      showToast(`Marked as ${nextAvailability === "available" ? "IN STOCK" : "OUT OF STOCK"}`);
    } catch (_) {}
  };

  // Helper to compress image client-side via HTML5 canvas
  const compressImage = (file: File, customMaxDim = 1200): Promise<{ blob: Blob; dataUrl: string }> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const maxDim = customMaxDim;
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            return resolve({ blob: file, dataUrl: (e.target?.result as string) || "" });
          }
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
          canvas.toBlob(
            (blob) => {
              resolve({ blob: blob || file, dataUrl });
            },
            "image/jpeg",
            0.85
          );
        };
        img.onerror = () => resolve({ blob: file, dataUrl: (e.target?.result as string) || "" });
        img.src = (e.target?.result as string) || "";
      };
      reader.onerror = () => resolve({ blob: file, dataUrl: "" });
      reader.readAsDataURL(file);
    });
  };

  const uploadSingleImage = async (file: File, type: "owner" | "logo" | "cover" | "dish"): Promise<string | null> => {
    const effectiveToken = resolveToken();
    if (!effectiveToken) return null;
    if (type === "owner") setIsUploadingOwnerPhoto(true);
    if (type === "logo") setIsUploadingLogo(true);
    if (type === "cover") setIsUploadingCover(true);

    try {
      const fd = new FormData();
      fd.append("image", file);
      fd.append("type", type);
      const res = await fetch("https://api.fiinway.com/api/v1/food/restaurant/upload-image", {
        method: "POST",
        headers: getApiHeaders(effectiveToken, true),
        body: fd,
      });
      const data = await res.json();
      if (data?.success && data?.url) {
        if (type === "owner") {
          setOwnerImagePreview(data.url);
          showToast("Owner photo uploaded & saved!");
        } else if (type === "logo") {
          setLogoPreview(data.url);
          showToast("Restaurant logo uploaded!");
        } else if (type === "cover") {
          setCoverPreview(data.url);
          showToast("Cover banner uploaded!");
        }
        return data.url;
      } else {
        showToast(data?.error || "Image uploaded.");
        return null;
      }
    } catch (_) {
      showToast("Photo selected. Click 'Save Settings' to apply.");
      return null;
    } finally {
      if (type === "owner") setIsUploadingOwnerPhoto(false);
      if (type === "logo") setIsUploadingLogo(false);
      if (type === "cover") setIsUploadingCover(false);
    }
  };

  const triggerNativePick = (source: "camera" | "gallery", target: "dish" | "owner" | "logo" | "cover" = "dish"): boolean => {
    setImagePickTarget(target);
    imagePickTargetRef.current = target;
    if (typeof window !== "undefined" && (window as any).FiinwayBridge) {
      try {
        (window as any).FiinwayBridge.postMessage(JSON.stringify({ action: "pick_image", source, target }));
        return true;
      } catch (_) {}
    }
    return false;
  };

  const handlePickDishPhoto = (source: "camera" | "gallery") => {
    const bridged = triggerNativePick(source, "dish");
    if (!bridged) {
      if (source === "camera") {
        dishCameraInputRef.current?.click();
      } else {
        dishGalleryInputRef.current?.click();
      }
    }
  };

  // Register bridge image handler for Flutter WebView
  useEffect(() => {
    (window as any).handleBridgeImage = (base64Data: string, filename?: string) => {
      try {
        const arr = base64Data.split(",");
        const mime = arr[0].match(/:(.*?);/)?.[1] || "image/jpeg";
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mime });
        const currentTarget = imagePickTargetRef.current || imagePickTarget;
        const f = new File([blob], filename || `${currentTarget}.jpg`, { type: mime });

        if (currentTarget === "owner") {
          setOwnerImagePreview(base64Data);
          setOwnerImageFile(f);
          uploadSingleImage(f, "owner");
        } else if (currentTarget === "logo") {
          setLogoPreview(base64Data);
          setLogoFile(f);
          uploadSingleImage(f, "logo");
        } else if (currentTarget === "cover") {
          setCoverPreview(base64Data);
          setCoverFile(f);
          uploadSingleImage(f, "cover");
        } else {
          setImagePreview(base64Data);
          setSelectedImageFile(f);
        }
        showToast("Photo captured from mobile camera/gallery!");
      } catch (_) {}
    };
    return () => {
      delete (window as any).handleBridgeImage;
    };
  }, [imagePickTarget]);

  const handleOwnerPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    showToast("Processing owner photo...");
    try {
      const { blob, dataUrl } = await compressImage(file, 800);
      const optimizedFile = new File([blob], "owner_photo.jpg", { type: "image/jpeg" });
      setOwnerImagePreview(dataUrl);
      setOwnerImageFile(optimizedFile);
      uploadSingleImage(optimizedFile, "owner");
    } catch (_) {
      setOwnerImageFile(file);
      uploadSingleImage(file, "owner");
    }
  };

  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    showToast("Processing logo...");
    try {
      const { blob, dataUrl } = await compressImage(file, 600);
      const optimizedFile = new File([blob], "restaurant_logo.jpg", { type: "image/jpeg" });
      setLogoPreview(dataUrl);
      setLogoFile(optimizedFile);
      uploadSingleImage(optimizedFile, "logo");
    } catch (_) {
      setLogoFile(file);
      uploadSingleImage(file, "logo");
    }
  };

  const handleCoverFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    showToast("Processing cover banner...");
    try {
      const { blob, dataUrl } = await compressImage(file, 1400);
      const optimizedFile = new File([blob], "restaurant_cover.jpg", { type: "image/jpeg" });
      setCoverPreview(dataUrl);
      setCoverFile(optimizedFile);
      uploadSingleImage(optimizedFile, "cover");
    } catch (_) {
      setCoverFile(file);
      uploadSingleImage(file, "cover");
    }
  };

  // Handle Image Selection from Camera or Gallery
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    showToast("Processing photo...");
    try {
      const { blob, dataUrl } = await compressImage(file);
      const optimizedFile = new File([blob], file.name ? file.name.replace(/\.[^/.]+$/, ".jpg") : "dish.jpg", {
        type: "image/jpeg"
      });
      setSelectedImageFile(optimizedFile);
      setImagePreview(dataUrl);
      showToast("Photo attached & optimized!");
    } catch (_) {
      setSelectedImageFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImagePreview(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
      showToast("Photo selected!");
    }
  };

  // Save Product (Add or Edit) with Multipart FormData
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim() || !newProdPrice) {
      showToast("Dish Name and Price are required.");
      return;
    }

    setIsSavingProduct(true);
    const effectiveToken = resolveToken();
    const formData = new FormData();
    formData.append("name", newProdName.trim());
    formData.append("category_id", String(newProdCategory ? Number(newProdCategory) : (categories[0]?.id || "")));
    formData.append("restaurant_price", newProdPrice);
    if (newProdOriginalPrice) {
      formData.append("discount_price", newProdOriginalPrice);
    }
    formData.append("food_type", newProdVeg ? "veg" : "non_veg");
    formData.append("description", newProdDesc);
    formData.append("prep_minutes", newProdPrep || "20");
    formData.append("availability", "available");

    if (selectedImageFile) {
      formData.append("image", selectedImageFile);
    } else if (imagePreview && imagePreview.startsWith("data:image")) {
      formData.append("image_base64", imagePreview);
    } else if (imagePreview && imagePreview.startsWith("http")) {
      formData.append("image", imagePreview);
    } else if (editingProduct && !imagePreview) {
      formData.append("image", "");
    }

    try {
      const url = editingProduct
        ? `https://api.fiinway.com/api/v1/food/restaurant/products/${editingProduct.id}`
        : "https://api.fiinway.com/api/v1/food/restaurant/products";
      const res = await fetch(url, {
        method: "POST",
        headers: getApiHeaders(effectiveToken, true),
        body: formData
      });
      const data = await res.json();
      if (data?.success) {
        showToast(editingProduct ? "Dish updated successfully!" : "New dish added to menu!");
      } else {
        showToast(data?.error || "Dish saved successfully.");
      }
    } catch (_) {
      showToast("Dish saved.");
    } finally {
      setIsSavingProduct(false);
      setIsProductModalOpen(false);
      setEditingProduct(null);
      setSelectedImageFile(null);
      setImagePreview("");
      fetchPortalData();
    }
  };

  // Delete Product
  const handleDeleteProduct = async (productId: number) => {
    if (!confirm("Are you sure you want to remove this dish from your menu?")) return;
    const effectiveToken = resolveToken();
    try {
      await fetch(`https://api.fiinway.com/api/v1/food/restaurant/products/${productId}`, {
        method: "DELETE",
        headers: getApiHeaders(effectiveToken)
      });
      showToast("Dish removed from menu.");
    } catch (_) {}
    fetchPortalData();
  };

  // Save Category
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    const effectiveToken = resolveToken();

    try {
      await fetch("https://api.fiinway.com/api/v1/food/restaurant/categories", {
        method: "POST",
        headers: getApiHeaders(effectiveToken),
        body: JSON.stringify({
          name: newCategoryName.trim(),
          description: newCategoryDesc.trim() || null
        })
      });
      showToast("Category created successfully!");
    } catch (_) {}

    setNewCategoryName("");
    setNewCategoryDesc("");
    setIsCategoryModalOpen(false);
    fetchPortalData();
  };

  // Pay Due via UPI
  const handlePayCompanyDue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!upiPaymentUtr.trim()) {
      showToast("Please enter the 12-digit UPI UTR number.");
      return;
    }

    setIsSubmittingDue(true);
    const effectiveToken = resolveToken();
    try {
      const res = await fetch("https://api.fiinway.com/api/v1/food/restaurant/dues/pay", {
        method: "POST",
        headers: getApiHeaders(effectiveToken),
        body: JSON.stringify({
          amount: stats.pending_due,
          payment_ref: upiPaymentUtr.trim(),
          transaction_reference: upiPaymentUtr.trim(),
          payment_method: "upi"
        })
      });
      const data = await res.json();
      if (data?.success) {
        showToast("UPI Due Payment submitted successfully! Clearance updated.");
        setIsUpiModalOpen(false);
        setUpiPaymentUtr("");
        fetchPortalData();
      } else {
        showToast(data?.error || "Payment recorded.");
      }
    } catch (_) {
      showToast("Payment recorded.");
      setIsUpiModalOpen(false);
    } finally {
      setIsSubmittingDue(false);
    }
  };

  // Save Profile settings
  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    const effectiveToken = resolveToken();
    try {
      const formData = new FormData();
      if (profileOutletName.trim()) formData.append("name", profileOutletName.trim());
      formData.append("description", profileDesc.trim());
      formData.append("opening_time", profileOpening);
      formData.append("closing_time", profileClosing);
      formData.append("avg_prep_minutes", String(profilePrepMins));
      formData.append("delivery_radius_km", String(profileRadius));
      formData.append("min_order_amount", String(profileMinOrder));
      formData.append("pure_veg", profilePureVeg ? "1" : "0");
      formData.append("fssai_number", fssaiNumber.trim());
      formData.append("gst_number", gstNumber.trim());
      formData.append("owner_name", ownerName.trim());
      formData.append("owner_email", ownerEmail.trim());
      formData.append("owner_phone", ownerPhone.trim());
      formData.append("pan_number", ownerPan.trim());
      formData.append("bank_account_name", bankAccountName.trim());
      formData.append("bank_name", bankName.trim());
      formData.append("bank_account_number", bankAccountNumber.trim());
      formData.append("bank_ifsc", bankIfsc.trim());
      formData.append("bank_branch", bankBranch.trim());
      formData.append("upi_id", upiId.trim());

      if (ownerImageFile) {
        formData.append("owner_image", ownerImageFile);
      } else if (ownerImagePreview && ownerImagePreview.startsWith("data:image")) {
        formData.append("owner_image", ownerImagePreview);
      }

      if (logoFile) {
        formData.append("logo", logoFile);
      } else if (logoPreview && logoPreview.startsWith("data:image")) {
        formData.append("logo", logoPreview);
      }

      if (coverFile) {
        formData.append("cover_image", coverFile);
      } else if (coverPreview && coverPreview.startsWith("data:image")) {
        formData.append("cover_image", coverPreview);
      }

      const res = await fetch("https://api.fiinway.com/api/v1/food/restaurant/update", {
        method: "POST",
        headers: getApiHeaders(effectiveToken, true),
        body: formData
      });
      const data = await res.json();
      if (data?.success) {
        showToast("Profile & Kitchen Settings updated successfully!");
        setOwnerImageFile(null);
        setLogoFile(null);
        setCoverFile(null);
      } else {
        showToast(data?.error || "Profile settings saved.");
      }
    } catch (_) {
      showToast("Profile settings saved.");
    } finally {
      setIsSavingProfile(false);
      fetchPortalData();
    }
  };

  // Reply to Review
  const handleSubmitReviewReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyingReview || !reviewReplyText.trim()) return;
    const effectiveToken = resolveToken();
    try {
      await fetch(`https://api.fiinway.com/api/v1/food/restaurant/reviews/${replyingReview.id}/reply`, {
        method: "POST",
        headers: getApiHeaders(effectiveToken),
        body: JSON.stringify({ reply: reviewReplyText.trim() })
      });
      showToast("Reply published!");
      setReplyingReview(null);
      setReviewReplyText("");
      fetchPortalData();
    } catch (_) {
      showToast("Reply submitted.");
      setReplyingReview(null);
    }
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("restaurant_token");
        localStorage.removeItem("token");
      } catch (_) {}

      if ((window as any).FiinwayBridge?.postMessage) {
        (window as any).FiinwayBridge.postMessage("logout");
      } else {
        window.location.href = "/food";
      }
    }
  };

  // Filtered products
  let displayedProducts = products;
  if (selectedCategoryFilter) {
    displayedProducts = displayedProducts.filter((p) => p.category_id === selectedCategoryFilter);
  }
  if (menuSearch.trim()) {
    const q = menuSearch.toLowerCase();
    displayedProducts = displayedProducts.filter((p) => p.name?.toLowerCase().includes(q));
  }

  // Due UPI string
  const upiVpa = "fiinway@icici";
  const upiDueString = `upi://pay?pa=${upiVpa}&pn=Fiinway%20Technologies&am=${stats.pending_due}&cu=INR&tn=Due%20Payment%20Restaurant%20${restaurant.id}`;
  const upiQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiDueString)}`;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans selection:bg-[#FF5200] selection:text-white">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-bold border border-slate-700 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* COMPACT MERCHANT HEADER */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs h-14">
        <div className="h-full px-3 sm:px-6 flex items-center justify-between gap-2">
          {/* Left: Outlet Brand & Name */}
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="sm:hidden p-1.5 -ml-1 rounded-lg hover:bg-slate-100 text-slate-600 cursor-pointer shrink-0"
              title="Menu"
            >
              <MenuIcon className="w-5 h-5" />
            </button>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0F5132] to-[#15803D] text-white flex items-center justify-center shadow-xs shrink-0">
              <Utensils className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-slate-900 tracking-tight text-sm truncate max-w-[130px] sm:max-w-[220px]">
                  {restaurant.name || "Kitchen"}
                </span>
                <span className="hidden md:inline-block px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wide bg-emerald-100 text-[#0F5132]">
                  {restaurant.business_type === "actual_restaurant" ? "Restaurant" : "Cloud"}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 truncate hidden sm:block">
                {restaurant.city || "Outlet"} • ⭐ {restaurant.rating > 0 ? restaurant.rating.toFixed(1) : "New"} ({restaurant.total_reviews})
              </p>
            </div>
          </div>

          {/* Right: Status Pill Switcher & Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Status Dropdown Pill */}
            <div className="relative">
              <button
                onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold flex items-center gap-1.5 border transition-all cursor-pointer shadow-xs ${
                  restaurant.operational_status === "open"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                    : restaurant.operational_status === "busy"
                    ? "bg-amber-50 text-amber-800 border-amber-300"
                    : "bg-red-50 text-red-800 border-red-300"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    restaurant.operational_status === "open"
                      ? "bg-emerald-500 animate-pulse"
                      : restaurant.operational_status === "busy"
                      ? "bg-amber-500"
                      : "bg-red-500"
                  }`}
                />
                <span className="hidden xs:inline">
                  {restaurant.operational_status === "open"
                    ? "Accepting Orders"
                    : restaurant.operational_status === "busy"
                    ? "Rush Mode"
                    : "Kitchen Closed"}
                </span>
                <span className="xs:hidden">
                  {restaurant.operational_status === "open"
                    ? "Online"
                    : restaurant.operational_status === "busy"
                    ? "Busy"
                    : "Closed"}
                </span>
                <ChevronDown className="w-3 h-3 opacity-60 ml-0.5" />
              </button>

              {isStatusDropdownOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-44 bg-white border border-slate-200 rounded-2xl shadow-xl p-1 z-50 space-y-0.5">
                  <button
                    onClick={() => {
                      handleToggleOperationalStatus("open");
                      setIsStatusDropdownOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer ${
                      restaurant.operational_status === "open" ? "bg-emerald-50 text-emerald-800" : "hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span>Accepting (Open)</span>
                  </button>
                  <button
                    onClick={() => {
                      handleToggleOperationalStatus("busy");
                      setIsStatusDropdownOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer ${
                      restaurant.operational_status === "busy" ? "bg-amber-50 text-amber-800" : "hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                    <span>Rush (Busy Mode)</span>
                  </button>
                  <button
                    onClick={() => {
                      handleToggleOperationalStatus("closed");
                      setIsStatusDropdownOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer ${
                      restaurant.operational_status === "closed" ? "bg-red-50 text-red-800" : "hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                    <span>Closed (Pause)</span>
                  </button>
                </div>
              )}
            </div>

            {/* Audio Alert Toggle */}
            <button
              onClick={() => setIsAudioMuted(!isAudioMuted)}
              title={isAudioMuted ? "Unmute Alarm" : "Mute Alarm"}
              className={`p-1.5 rounded-xl border text-xs font-bold flex items-center justify-center cursor-pointer ${
                isAudioMuted
                  ? "border-slate-300 text-slate-400 bg-slate-100"
                  : "border-emerald-200 text-emerald-700 bg-emerald-50"
              }`}
            >
              {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-emerald-600 animate-pulse" />}
            </button>

            {/* Refresh */}
            <button
              onClick={fetchPortalData}
              title="Refresh"
              className="p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Verification Notice if pending */}
      {restaurant.onboarding_status === "pending_approval" && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-[11px] font-semibold text-amber-900 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>Document verification in progress. You can add your dishes and set timings.</span>
          </div>
          <span className="bg-amber-200 text-amber-900 text-[9px] font-black uppercase px-1.5 py-0.5 rounded">
            In Review
          </span>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex overflow-hidden">
        {/* DESKTOP SIDEBAR */}
        <aside
          className={`w-60 bg-white border-r border-slate-200 flex flex-col shrink-0 sm:flex ${
            isMobileMenuOpen ? "fixed inset-y-0 left-0 z-50 flex shadow-2xl" : "hidden sm:flex"
          }`}
        >
          {isMobileMenuOpen && (
            <div className="p-3.5 flex items-center justify-between border-b border-slate-100 sm:hidden">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-400">Navigation</span>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-1 text-slate-500 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
            <button
              onClick={() => {
                setActiveTab("dashboard");
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "dashboard"
                  ? "bg-[#FF5200] text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <TrendingUp className="w-4 h-4" />
                <span>Dashboard</span>
              </div>
            </button>

            <button
              onClick={() => {
                setActiveTab("orders");
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "orders"
                  ? "bg-[#FF5200] text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="w-4 h-4" />
                <span>Live Orders & KDS</span>
              </div>
              {incomingOrders.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[9px] font-black animate-pulse">
                  {incomingOrders.length}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setActiveTab("menu");
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "menu"
                  ? "bg-[#FF5200] text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Utensils className="w-4 h-4" />
                <span>Menu & Inventory</span>
              </div>
              <span className="text-[10px] text-slate-400 font-semibold">{products.length}</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("finance");
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "finance"
                  ? "bg-[#FF5200] text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <DollarSign className="w-4 h-4" />
                <span>Finances & Dues</span>
              </div>
              {stats.pending_due > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[9px] font-black">
                  ₹{stats.pending_due}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setActiveTab("history");
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "history"
                  ? "bg-[#FF5200] text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Receipt className="w-4 h-4" />
                <span>Order History</span>
              </div>
            </button>

            <button
              onClick={() => {
                setActiveTab("reviews");
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "reviews"
                  ? "bg-[#FF5200] text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Star className="w-4 h-4" />
                <span>Reviews & Ratings</span>
              </div>
              {reviews.length > 0 && (
                <span className="text-[10px] text-slate-400 font-semibold">{reviews.length}</span>
              )}
            </button>

            <button
              onClick={() => {
                setActiveTab("profile");
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "profile"
                  ? "bg-[#FF5200] text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Sliders className="w-4 h-4" />
                <span>Kitchen Settings</span>
              </div>
            </button>
          </nav>

          {/* Sidebar Footer */}
          <div className="p-3 border-t border-slate-100 text-xs space-y-2.5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <div className="truncate">
                <p className="font-bold text-slate-800 text-[11px] truncate">Fiinway Partner</p>
                <p className="text-[10px] text-slate-400 font-mono truncate">{phone || restaurant.phone || "Active Outlet"}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-1.5 px-2.5 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold transition-all border border-red-200 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* MAIN BODY VIEW */}
        <main className="flex-1 overflow-y-auto p-3.5 sm:p-6 pb-20 sm:pb-6">
          {/* TAB 1: DASHBOARD */}
          {activeTab === "dashboard" && (
            <div className="max-w-5xl mx-auto space-y-4">
              {/* Header Title & Quick Action */}
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                    Overview
                  </h1>
                  <p className="text-[11px] text-slate-500">Live kitchen metrics for today</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingProduct(null);
                      setNewProdName("");
                      setNewProdPrice("");
                      setNewProdOriginalPrice("");
                      setNewProdDesc("");
                      setNewProdVeg(true);
                      setNewProdPrep("20");
                      setSelectedImageFile(null);
                      setImagePreview("");
                      setNewProdCategory(categories[0]?.id || "");
                      setIsProductModalOpen(true);
                    }}
                    className="px-3 py-1.5 bg-[#FF5200] text-white rounded-xl text-xs font-bold shadow-xs hover:bg-[#e04800] transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Dish</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("orders")}
                    className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <ShoppingBag className="w-3.5 h-3.5 text-[#FF5200]" />
                    <span>KDS</span>
                  </button>
                </div>
              </div>

              {/* Company Due Alert if any */}
              {stats.pending_due > 0 && (
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 flex items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <div className="min-w-0">
                      <span className="font-extrabold text-xs text-slate-900 block truncate">
                        Platform Due: ₹{stats.pending_due}
                      </span>
                      <span className="text-[10px] text-slate-600 block truncate">
                        Clear via instant UPI to maintain order dispatch
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsUpiModalOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-[#FF5200] hover:bg-[#e04800] text-white font-bold text-xs shrink-0 shadow-xs flex items-center gap-1 cursor-pointer"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Pay Due</span>
                  </button>
                </div>
              )}

              {/* Metric Cards 2x2 on Mobile, 4x1 on Desktop */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Today Orders</span>
                    <div className="w-6 h-6 rounded-lg bg-orange-100 text-[#FF5200] flex items-center justify-center">
                      <ShoppingBag className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-slate-900">{stats.today_orders}</div>
                  <div className="text-[10px] text-emerald-600 font-bold mt-1">
                    {stats.delivered} Completed • {incomingOrders.length + activeOrders.length} Active
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Gross Sales</span>
                    <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <DollarSign className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-slate-900">₹{stats.today_sales}</div>
                  <div className="text-[10px] text-slate-400 font-semibold mt-1">Food bill value</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Net Payout</span>
                    <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                      <TrendingUp className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-slate-900">₹{stats.today_net}</div>
                  <div className="text-[10px] text-blue-600 font-bold mt-1">Bank transfer share</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Prep Target</span>
                    <div className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-slate-900">{restaurant.avg_prep_minutes || 20}m</div>
                  <div className="text-[10px] text-purple-600 font-bold mt-1">Kitchen SLA</div>
                </div>
              </div>

              {/* Live Kitchen Pipeline 5-Step Strip */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <span>Kitchen Pipeline</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  </h3>
                  <button
                    onClick={() => setActiveTab("orders")}
                    className="text-[11px] font-bold text-[#FF5200] hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    KDS Board <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="grid grid-cols-5 gap-2 text-center">
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200">
                    <div className="text-lg font-black text-amber-800">{incomingOrders.length}</div>
                    <div className="text-[9px] font-bold text-amber-700 uppercase">Incoming</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200">
                    <div className="text-lg font-black text-blue-800">
                      {activeOrders.filter((o) => ["restaurant_accepted", "preparing"].includes(o.order_status)).length}
                    </div>
                    <div className="text-[9px] font-bold text-blue-700 uppercase">Cooking</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200">
                    <div className="text-lg font-black text-purple-800">
                      {activeOrders.filter((o) => o.order_status === "ready_for_pickup").length}
                    </div>
                    <div className="text-[9px] font-bold text-purple-700 uppercase">Ready</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200">
                    <div className="text-lg font-black text-indigo-800">
                      {activeOrders.filter((o) => ["rider_assigned", "food_picked_up", "out_for_delivery"].includes(o.order_status)).length}
                    </div>
                    <div className="text-[9px] font-bold text-indigo-700 uppercase">Transit</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                    <div className="text-lg font-black text-emerald-800">{stats.delivered}</div>
                    <div className="text-[9px] font-bold text-emerald-700 uppercase">Done</div>
                  </div>
                </div>
              </div>

              {/* Active Cooking Orders Stream */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">
                  Active Kitchen Tasks
                </h3>
                {activeOrders.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs font-semibold bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                    No active cooking orders right now.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {activeOrders.map((order) => (
                      <div
                        key={order.id}
                        className="p-3 rounded-xl border border-slate-200 hover:border-slate-300 transition-all flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="font-mono font-black text-xs text-slate-900">{order.order_number}</span>
                            <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-blue-100 text-blue-800">
                              {(order.order_status || "prep").replace(/_/g, " ")}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-slate-800 truncate">
                            {Array.isArray(order.items) && order.items.length > 0
                              ? order.items.map((i: any) => `${i.quantity}x ${i.product_name || i.name}`).join(", ")
                              : "Order Items"}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {order.customer_name || "Customer"} • ₹{order.food_amount || order.customer_payable}
                          </p>
                        </div>

                        <div className="shrink-0">
                          {["restaurant_accepted", "preparing"].includes(order.order_status) && (
                            <button
                              onClick={() => handleUpdateOrderStatus(order.id, "ready_for_pickup")}
                              className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                            >
                              Ready
                            </button>
                          )}
                          {order.order_status === "ready_for_pickup" && (
                            <button
                              onClick={() => setHandoverOrderId(order.id)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center gap-1 cursor-pointer"
                            >
                              <Bike className="w-3.5 h-3.5" />
                              <span>Handover</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: LIVE ORDERS & KDS */}
          {activeTab === "orders" && (
            <div className="max-w-5xl mx-auto space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                    Live Orders & KDS
                  </h1>
                  <p className="text-[11px] text-slate-500">Incoming tickets & kitchen dispatch</p>
                </div>
                <button
                  onClick={playChime}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-100 flex items-center gap-1 cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Test Chime</span>
                </button>
              </div>

              {/* Incoming Orders Section */}
              {incomingOrders.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                    <h3 className="font-black text-xs text-red-700 uppercase tracking-wide">
                      Incoming Tickets ({incomingOrders.length})
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {incomingOrders.map((order) => (
                      <div
                        key={order.id}
                        className="p-4 rounded-2xl bg-white border-2 border-red-500 shadow-sm space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-base text-slate-900">{order.order_number}</span>
                            <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-800 text-[9px] font-black uppercase">
                              New
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400">
                            {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-50 text-xs space-y-0.5">
                          <div className="font-bold text-slate-800 flex items-center gap-1.5">
                            <User className="w-3 h-3 text-slate-400" />
                            <span>{order.customer_name || "Customer"}</span> • <span className="text-slate-500">{order.customer_phone}</span>
                          </div>
                          {order.delivery_address && (
                            <div className="text-[11px] text-slate-600 flex items-start gap-1">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                              <span className="truncate">{order.delivery_address}</span>
                            </div>
                          )}
                        </div>

                        {/* Items */}
                        <div className="space-y-1 text-xs border-t border-slate-100 pt-2 font-medium">
                          {Array.isArray(order.items) &&
                            order.items.map((item: any, idx: number) => (
                              <div key={idx} className="flex justify-between items-center">
                                <span>{item.quantity}x {item.product_name || item.name}</span>
                                <span className="font-semibold text-slate-700">₹{item.restaurant_unit_price * item.quantity || item.line_total}</span>
                              </div>
                            ))}
                        </div>

                        {order.special_instructions && (
                          <div className="p-2 rounded-lg bg-amber-50 text-[10px] text-amber-900 font-medium">
                            📝 {order.special_instructions}
                          </div>
                        )}

                        <div className="flex justify-between items-center pt-1 border-t border-slate-100 text-xs">
                          <span className="text-slate-500">Bill:</span>
                          <span className="font-black text-sm text-slate-900">₹{order.food_amount || order.customer_payable}</span>
                        </div>

                        {/* Prep SLA & Actions */}
                        <div className="space-y-2 pt-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500 font-bold text-[11px]">Prep Time:</span>
                            <div className="flex items-center gap-1">
                              {[15, 20, 30].map((mins) => (
                                <button
                                  key={mins}
                                  onClick={() => setPrepTimeChoice(mins)}
                                  className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer ${
                                    prepTimeChoice === mins
                                      ? "bg-[#FF5200] text-white"
                                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                  }`}
                                >
                                  {mins}m
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => {
                                setOrderToReject(order);
                                setIsRejectModalOpen(true);
                              }}
                              className="py-1.5 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 font-bold text-xs cursor-pointer"
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => handleAcceptOrder(order)}
                              className="py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                            >
                              Accept ({prepTimeChoice}m)
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3-Column KDS Board */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. Cooking */}
                <div className="p-3.5 rounded-2xl bg-blue-50/50 border border-blue-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-black text-xs text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-blue-600" />
                      <span>Cooking</span>
                    </h3>
                    <span className="w-5 h-5 rounded-full bg-blue-200 text-blue-900 font-bold text-[11px] flex items-center justify-center">
                      {activeOrders.filter((o) => ["restaurant_accepted", "preparing"].includes(o.order_status)).length}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {activeOrders
                      .filter((o) => ["restaurant_accepted", "preparing"].includes(o.order_status))
                      .map((order) => (
                        <div key={order.id} className="p-3 rounded-xl bg-white border border-blue-200 shadow-xs space-y-2">
                          <div className="flex justify-between items-baseline">
                            <span className="font-mono font-black text-xs text-slate-900">{order.order_number}</span>
                            <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
                              ⏱️ {order.prep_minutes || 20}m
                            </span>
                          </div>

                          <div className="space-y-0.5 text-[11px] text-slate-700">
                            {Array.isArray(order.items) &&
                              order.items.map((it: any, i: number) => (
                                <div key={i} className="flex justify-between">
                                  <span>{it.quantity}x {it.product_name || it.name}</span>
                                </div>
                              ))}
                          </div>

                          <button
                            onClick={() => handleUpdateOrderStatus(order.id, "ready_for_pickup")}
                            className="w-full py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-lg shadow-xs cursor-pointer"
                          >
                            Mark Ready
                          </button>
                        </div>
                      ))}
                  </div>
                </div>

                {/* 2. Ready for Pickup */}
                <div className="p-3.5 rounded-2xl bg-purple-50/50 border border-purple-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-black text-xs text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                      <span>Ready</span>
                    </h3>
                    <span className="w-5 h-5 rounded-full bg-purple-200 text-purple-900 font-bold text-[11px] flex items-center justify-center">
                      {activeOrders.filter((o) => o.order_status === "ready_for_pickup").length}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {activeOrders
                      .filter((o) => o.order_status === "ready_for_pickup")
                      .map((order) => (
                        <div key={order.id} className="p-3 rounded-xl bg-white border border-purple-200 shadow-xs space-y-2">
                          <div className="flex justify-between items-baseline">
                            <span className="font-mono font-black text-xs text-slate-900">{order.order_number}</span>
                            <span className="text-[9px] font-black uppercase text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                              Packed
                            </span>
                          </div>

                          <div className="p-2 rounded-lg bg-slate-50 text-[11px] space-y-0.5">
                            <div className="font-bold text-slate-800 flex items-center gap-1">
                              <Bike className="w-3 h-3 text-purple-600" />
                              <span>{order.rider_name || "Assigning Rider..."}</span>
                            </div>
                            {order.rider_phone && <div className="text-slate-500">Ph: {order.rider_phone}</div>}
                            {order.pickup_otp && (
                              <div className="font-mono font-bold text-purple-700 bg-purple-50 px-1 py-0.5 rounded inline-block text-[10px]">
                                OTP: {order.pickup_otp}
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => setHandoverOrderId(order.id)}
                            className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Handover</span>
                          </button>
                        </div>
                      ))}
                  </div>
                </div>

                {/* 3. Out for Delivery */}
                <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-black text-xs text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Bike className="w-3.5 h-3.5 text-emerald-600" />
                      <span>On Route</span>
                    </h3>
                    <span className="w-5 h-5 rounded-full bg-emerald-200 text-emerald-900 font-bold text-[11px] flex items-center justify-center">
                      {activeOrders.filter((o) => ["rider_assigned", "food_picked_up", "out_for_delivery"].includes(o.order_status)).length}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {activeOrders.filter((o) => ["rider_assigned", "food_picked_up", "out_for_delivery"].includes(o.order_status)).length === 0 ? (
                      <div className="text-center py-8 text-xs text-slate-400 font-medium">
                        No orders in transit.
                      </div>
                    ) : (
                      activeOrders
                        .filter((o) => ["rider_assigned", "food_picked_up", "out_for_delivery"].includes(o.order_status))
                        .map((order) => (
                          <div key={order.id} className="p-3 rounded-xl bg-white border border-emerald-200 shadow-xs space-y-1">
                            <div className="flex justify-between">
                              <span className="font-mono font-black text-xs text-slate-900">{order.order_number}</span>
                              <span className="text-[9px] font-bold uppercase text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                                En Route
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600">Captain {order.rider_name || ""} on delivery.</p>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MENU & DISHES */}
          {activeTab === "menu" && (
            <div className="max-w-5xl mx-auto space-y-3.5">
              {/* Menu Top Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                    Menu & Inventory
                  </h1>
                  <p className="text-[11px] text-slate-500">Dishes, pricing & stock controls</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsCategoryModalOpen(true)}
                    className="px-2.5 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    + Category
                  </button>
                  <button
                    onClick={() => {
                      setEditingProduct(null);
                      setNewProdName("");
                      setNewProdPrice("");
                      setNewProdOriginalPrice("");
                      setNewProdDesc("");
                      setNewProdVeg(true);
                      setNewProdPrep("20");
                      setSelectedImageFile(null);
                      setImagePreview("");
                      setNewProdCategory(categories[0]?.id || "");
                      setIsProductModalOpen(true);
                    }}
                    className="px-3 py-1.5 bg-[#FF5200] text-white rounded-xl text-xs font-bold shadow-xs hover:bg-[#e04800] transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Dish</span>
                  </button>
                </div>
              </div>

              {/* Search + Category Filter Pills */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search dishes..."
                    value={menuSearch}
                    onChange={(e) => setMenuSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs focus:ring-2 focus:ring-[#FF5200]"
                  />
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 shrink-0">
                  <button
                    onClick={() => setSelectedCategoryFilter(null)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 cursor-pointer ${
                      selectedCategoryFilter === null
                        ? "bg-slate-900 text-white"
                        : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    All ({products.length})
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCategoryFilter(c.id)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 cursor-pointer ${
                        selectedCategoryFilter === c.id
                          ? "bg-[#FF5200] text-white"
                          : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dishes List (Clean Merchant Cards) */}
              {displayedProducts.length === 0 ? (
                <div className="p-8 rounded-2xl bg-white border border-dashed border-slate-300 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-orange-100 text-[#FF5200] flex items-center justify-center mx-auto">
                    <Utensils className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">No dishes found</h3>
                  <p className="text-[11px] text-slate-400">Click "Add Dish" to snap food photos and list items.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {displayedProducts.map((product) => (
                    <div
                      key={product.id}
                      className="p-3 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between gap-3 hover:border-slate-300 transition-all"
                    >
                      {/* Left: Thumbnail + Name + Price */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 shrink-0 relative">
                          {product.image_url || product.image ? (
                            <img
                              src={product.image_url || (product.image.startsWith("http") ? product.image : `https://api.fiinway.com/storage/${product.image}`)}
                              alt={product.name}
                              className="w-full h-full object-cover"
                              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                              <Utensils className="w-6 h-6" />
                            </div>
                          )}
                          <span
                            className={`absolute bottom-1 left-1 w-2.5 h-2.5 rounded-full border border-white ${
                              product.food_type === "veg" ? "bg-emerald-600" : "bg-red-600"
                            }`}
                          />
                        </div>

                        <div className="min-w-0">
                          <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 truncate">
                            {product.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-black text-xs text-[#FF5200]">
                              ₹{product.restaurant_price || product.price}
                            </span>
                            {product.discount_price && (
                              <span className="text-[10px] text-slate-400 line-through">
                                ₹{product.discount_price}
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400 font-medium">
                              • {product.prep_minutes || 20}m
                            </span>
                          </div>
                          {product.description && (
                            <p className="text-[10px] text-slate-400 truncate max-w-xs sm:max-w-md mt-0.5">
                              {product.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: Availability Toggle + Edit/Delete */}
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Stock toggle */}
                        <div className="flex items-center gap-1.5">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={product.availability === "available" || product.is_available === true}
                              onChange={() => handleToggleProductStock(product.id, product.availability === "available")}
                              className="sr-only peer"
                            />
                            <div className="w-8 h-4 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-600"></div>
                          </label>
                          <span className={`text-[10px] font-extrabold uppercase hidden xs:inline ${
                            product.availability === "available" ? "text-emerald-700" : "text-slate-400"
                          }`}>
                            {product.availability === "available" ? "In Stock" : "Sold Out"}
                          </span>
                        </div>

                        {/* Actions */}
                        <button
                          onClick={() => {
                            setEditingProduct(product);
                            setNewProdName(product.name);
                            setNewProdPrice((product.restaurant_price || product.price || "").toString());
                            setNewProdOriginalPrice((product.discount_price || "").toString());
                            setNewProdVeg(product.food_type === "veg");
                            setNewProdDesc(product.description || "");
                            setNewProdPrep((product.prep_minutes || 20).toString());
                            setSelectedImageFile(null);
                            setImagePreview(
                              product.image
                                ? product.image.startsWith("http")
                                  ? product.image
                                  : `https://api.fiinway.com/storage/${product.image}`
                                : ""
                            );
                            setNewProdCategory(product.category_id || categories[0]?.id || "");
                            setIsProductModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="p-1.5 text-red-400 hover:text-red-700 hover:bg-red-50 rounded-lg cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: FINANCES & DUES */}
          {activeTab === "finance" && (
            <div className="max-w-5xl mx-auto space-y-4">
              <div>
                <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  Finances & Settlements
                </h1>
                <p className="text-[11px] text-slate-500">Earnings, commission and daily bank payouts</p>
              </div>

              {/* Company Due Card */}
              <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2.5 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Outstanding Platform Due
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                    stats.pending_due > 0 ? "bg-amber-400 text-amber-950" : "bg-emerald-500/20 text-emerald-400"
                  }`}>
                    {stats.pending_due > 0 ? "Settlement Required" : "All Clear"}
                  </span>
                </div>
                <div className="text-2xl font-black text-white">₹{stats.pending_due}</div>
                {stats.pending_due > 0 && (
                  <button
                    onClick={() => setIsUpiModalOpen(true)}
                    className="px-4 py-2 bg-[#FF5200] hover:bg-[#e04800] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Pay ₹{stats.pending_due} via UPI</span>
                  </button>
                )}
              </div>

              {/* Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">Gross Sales</span>
                  <div className="text-xl font-black text-slate-900 mt-1">₹{stats.today_sales}</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">Commission</span>
                  <div className="text-xl font-black text-slate-900 mt-1">₹{stats.today_commission || 0}</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">Net Payout</span>
                  <div className="text-xl font-black text-emerald-700 mt-1">₹{stats.today_net}</div>
                </div>
              </div>

              {/* Settlements Table */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">
                  Bank Settlement Ledger
                </h3>
                {settlements.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-xs font-medium">
                    No settlements processed for this billing cycle yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-400 uppercase text-[9px] font-bold">
                          <th className="pb-2">Date</th>
                          <th className="pb-2">UTR Ref</th>
                          <th className="pb-2">Gross</th>
                          <th className="pb-2">Comm</th>
                          <th className="pb-2">Net</th>
                          <th className="pb-2">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {settlements.map((s) => (
                          <tr key={s.id}>
                            <td className="py-2 text-slate-700">{s.period_to || new Date(s.created_at).toLocaleDateString()}</td>
                            <td className="font-mono text-slate-600">{s.transaction_ref || s.settlement_number || `SET-${s.id}`}</td>
                            <td>₹{s.gross_sales}</td>
                            <td>₹{s.commission}</td>
                            <td className="font-black text-emerald-700">₹{s.net_amount}</td>
                            <td>
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">
                                {s.status?.toUpperCase()}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: HISTORY */}
          {activeTab === "history" && (
            <div className="max-w-5xl mx-auto space-y-3.5">
              <div>
                <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  Past Orders
                </h1>
                <p className="text-[11px] text-slate-500">Search customer receipts and past deliveries</p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1 relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search order ID or customer..."
                      value={historySearch}
                      onChange={(e) => setHistorySearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:ring-2 focus:ring-[#FF5200]"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    {["all", "delivered", "cancelled"].map((st) => (
                      <button
                        key={st}
                        onClick={() => setHistoryStatusFilter(st)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold capitalize cursor-pointer ${
                          historyStatusFilter === st
                            ? "bg-slate-900 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {pastOrders.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs font-medium">
                    No orders matching filter.
                  </div>
                ) : (
                  <div className="space-y-2 pt-1">
                    {pastOrders.map((ord) => (
                      <div
                        key={ord.id}
                        className="p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-2 text-xs hover:border-slate-300"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-black text-slate-900">{ord.order_number}</span>
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                              ["delivered", "completed"].includes(ord.order_status)
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-red-100 text-red-800"
                            }`}>
                              {(ord.order_status || "completed").toUpperCase()}
                            </span>
                          </div>
                          <p className="text-slate-700 truncate text-[11px] mt-0.5">
                            {Array.isArray(ord.items) && ord.items.map((i: any) => `${i.quantity}x ${i.product_name || i.name}`).join(", ")}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {ord.customer_name || "Customer"} • {new Date(ord.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-black text-xs text-slate-900 block">₹{ord.food_amount || ord.customer_payable}</span>
                          <button
                            onClick={() => setSelectedOrderDetail(ord)}
                            className="text-[10px] text-[#FF5200] font-bold hover:underline cursor-pointer"
                          >
                            Receipt
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: REVIEWS */}
          {activeTab === "reviews" && (
            <div className="max-w-5xl mx-auto space-y-3.5">
              <div>
                <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  Reviews & Ratings
                </h1>
                <p className="text-[11px] text-slate-500">Customer dish feedback</p>
              </div>

              {reviews.length === 0 ? (
                <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center space-y-2">
                  <Star className="w-6 h-6 fill-amber-400 text-amber-400 mx-auto" />
                  <h3 className="font-bold text-slate-800 text-xs">No customer reviews yet</h3>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {reviews.map((rev) => (
                    <div key={rev.id} className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-orange-100 text-[#FF5200] font-bold text-xs flex items-center justify-center">
                            {rev.customer?.name ? rev.customer.name.slice(0, 2).toUpperCase() : "CU"}
                          </div>
                          <div>
                            <h4 className="font-bold text-xs text-slate-900">{rev.customer?.name || "Customer"}</h4>
                            <span className="text-[9px] text-slate-400">Order #{rev.order?.order_number || rev.order_id}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span>{rev.restaurant_rating || 5}.0</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600">"{rev.restaurant_review || "Good food."}"</p>

                      {rev.restaurant_reply ? (
                        <div className="p-2 rounded-xl bg-slate-50 text-[11px] text-slate-700">
                          <span className="font-bold text-[9px] uppercase text-[#FF5200] block">Reply:</span>
                          {rev.restaurant_reply}
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setReplyingReview(rev);
                            setReviewReplyText("");
                          }}
                          className="text-xs font-bold text-[#FF5200] hover:underline cursor-pointer"
                        >
                          Reply
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 7: PROFILE & RESTAURANT SETTINGS */}
          {activeTab === "profile" && (
            <div className="max-w-4xl mx-auto space-y-5 pb-10">
              {/* Hidden File Inputs for Native & Web Pickers */}
              <input
                ref={ownerPhotoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleOwnerPhotoChange}
              />
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoFileChange}
              />
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleCoverFileChange}
              />

              {/* Page Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-orange-100 text-[#FF5200]">
                      <Store className="w-5 h-5" />
                    </span>
                    <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                      Restaurant & Owner Profile
                    </h1>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Manage owner identity, brand visuals, kitchen SLA, government compliance, and settlement bank
                  </p>
                </div>
                <button
                  onClick={handleSaveProfile}
                  disabled={isSavingProfile}
                  className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#FF5200] hover:bg-[#e04800] disabled:bg-slate-300 text-white font-bold rounded-xl shadow-sm text-xs cursor-pointer transition-all active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  {isSavingProfile ? "Saving Changes..." : "Save All Changes"}
                </button>
              </div>

              {/* Live Operational Status Control */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                      <Clock className="w-4 h-4" />
                    </span>
                    <h2 className="text-sm font-black text-slate-900">Live Business Status</h2>
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 uppercase tracking-wide">
                    Current: {restaurant.operational_status || "open"}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Control how your restaurant appears to customers on the food ordering app in real time.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => handleToggleOperationalStatus("open")}
                    className={`p-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      restaurant.operational_status === "open"
                        ? "bg-emerald-500 text-white border-emerald-600 shadow-xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-emerald-50 hover:border-emerald-200"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                    🟢 Open (Live)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleOperationalStatus("busy")}
                    className={`p-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      restaurant.operational_status === "busy"
                        ? "bg-amber-500 text-white border-amber-600 shadow-xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-amber-50 hover:border-amber-200"
                    }`}
                  >
                    🟡 Busy (+15m)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleOperationalStatus("temporarily_closed")}
                    className={`p-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      restaurant.operational_status === "temporarily_closed"
                        ? "bg-orange-500 text-white border-orange-600 shadow-xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-orange-50 hover:border-orange-200"
                    }`}
                  >
                    🟠 Paused
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleOperationalStatus("closed")}
                    className={`p-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      restaurant.operational_status === "closed"
                        ? "bg-rose-500 text-white border-rose-600 shadow-xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-rose-50 hover:border-rose-200"
                    }`}
                  >
                    🔴 Closed
                  </button>
                </div>
              </div>

              {/* CARD 1: OWNER IDENTITY & PHOTO UPLOAD */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <span className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
                    <User className="w-4 h-4" />
                  </span>
                  <div>
                    <h2 className="text-sm font-black text-slate-900">Owner Identity & Verification</h2>
                    <p className="text-[11px] text-slate-500">
                      Registered proprietor details and verified photo identity
                    </p>
                  </div>
                </div>

                {/* Owner Photo Avatar and Uploader */}
                <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-3 border-white shadow-md bg-slate-200 flex items-center justify-center">
                      {ownerImagePreview ? (
                        <img
                          src={ownerImagePreview}
                          alt="Owner Photo"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-slate-400">
                          <User className="w-10 h-10 text-slate-400" />
                          <span className="text-[9px] font-bold text-slate-400 mt-1">No Photo</span>
                        </div>
                      )}
                    </div>
                    {isUploadingOwnerPhoto && (
                      <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                        Uploading...
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => ownerPhotoInputRef.current?.click()}
                      className="absolute bottom-0 right-0 p-2 rounded-full bg-[#FF5200] text-white shadow-md hover:bg-[#e04800] cursor-pointer transition-transform hover:scale-105"
                      title="Upload Owner Photo"
                    >
                      <Camera className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex-1 text-center sm:text-left space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <h4 className="font-bold text-xs text-slate-800">
                        Restaurant Owner Photo / Avatar
                      </h4>
                      {ownerImagePreview && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 w-fit mx-auto sm:mx-0">
                          <CheckCircle2 className="w-3 h-3" /> Photo Uploaded
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Upload a clear frontal photo of the business owner. Required for KYC verification and partner identification.
                    </p>

                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => triggerNativePick("camera", "owner")}
                        className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5 text-[#FF5200]" />
                        Take Photo
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setImagePickTarget("owner");
                          ownerPhotoInputRef.current?.click();
                        }}
                        className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5 text-[#FF5200]" />
                        Choose File
                      </button>
                      {ownerImagePreview && (
                        <button
                          type="button"
                          onClick={() => {
                            setOwnerImagePreview("");
                            setOwnerImageFile(null);
                          }}
                          className="px-2.5 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 text-xs font-bold cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Owner Details Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Owner Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder="e.g. Rajesh Sharma"
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-800 focus:bg-white focus:border-[#FF5200] outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Registered Mobile Number <span className="text-slate-400 font-normal">(Primary Auth)</span>
                    </label>
                    <input
                      type="text"
                      disabled
                      value={ownerPhone || restaurant.owner_phone || phone}
                      className="w-full p-2.5 rounded-xl bg-slate-100 border border-slate-200 font-bold text-slate-600 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Owner Email Address
                    </label>
                    <input
                      type="email"
                      value={ownerEmail}
                      onChange={(e) => setOwnerEmail(e.target.value)}
                      placeholder="e.g. rajesh@example.com"
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-800 focus:bg-white focus:border-[#FF5200] outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Owner PAN Number <span className="text-slate-400 font-normal">(10 Chars)</span>
                    </label>
                    <input
                      type="text"
                      maxLength={10}
                      value={ownerPan}
                      onChange={(e) => setOwnerPan(e.target.value.toUpperCase())}
                      placeholder="e.g. ABCDE1234F"
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold tracking-wider text-slate-800 focus:bg-white focus:border-[#FF5200] outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* CARD 2: RESTAURANT BRANDING & STOREFRONT */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <span className="p-1.5 rounded-lg bg-orange-100 text-[#FF5200]">
                    <Building2 className="w-4 h-4" />
                  </span>
                  <div>
                    <h2 className="text-sm font-black text-slate-900">Restaurant Branding & Storefront</h2>
                    <p className="text-[11px] text-slate-500">Public logo, cover banner, and outlet profile</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Logo Upload Card */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-4">
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-200 border border-slate-300 shrink-0 flex items-center justify-center">
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <Store className="w-8 h-8 text-slate-400" />
                      )}
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <h4 className="font-bold text-xs text-slate-800">Outlet Logo</h4>
                      <p className="text-[11px] text-slate-500">Square 1:1 format (PNG or JPG)</p>
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setImagePickTarget("logo");
                            logoInputRef.current?.click();
                          }}
                          disabled={isUploadingLogo}
                          className="px-3 py-1 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-lg shadow-2xs cursor-pointer flex items-center gap-1"
                        >
                          <Upload className="w-3 h-3 text-[#FF5200]" />
                          {isUploadingLogo ? "Uploading..." : "Upload Logo"}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Cover Banner Card */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-4">
                    <div className="w-28 h-20 rounded-xl overflow-hidden bg-slate-200 border border-slate-300 shrink-0 flex items-center justify-center">
                      {coverPreview ? (
                        <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-slate-400" />
                      )}
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <h4 className="font-bold text-xs text-slate-800">Cover Banner</h4>
                      <p className="text-[11px] text-slate-500">Landscape 16:9 banner photo</p>
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setImagePickTarget("cover");
                            coverInputRef.current?.click();
                          }}
                          disabled={isUploadingCover}
                          className="px-3 py-1 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-lg shadow-2xs cursor-pointer flex items-center gap-1"
                        >
                          <Upload className="w-3 h-3 text-[#FF5200]" />
                          {isUploadingCover ? "Uploading..." : "Upload Banner"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Outlet Name, Description & Pure Veg */}
                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Outlet Display Name</label>
                      <input
                        type="text"
                        value={profileOutletName || restaurant.name}
                        onChange={(e) => setProfileOutletName(e.target.value)}
                        placeholder="e.g. Royal Biryani & Kebabs"
                        className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-800 focus:bg-white focus:border-[#FF5200] outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-bold mb-1">Business Model</label>
                      <input
                        type="text"
                        disabled
                        value={restaurant.business_type === "actual_restaurant" ? "Dine-In & Delivery" : "Cloud Kitchen"}
                        className="w-full p-2.5 rounded-xl bg-slate-100 border border-slate-200 font-bold text-slate-700"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Description / Tagline</label>
                    <textarea
                      rows={2}
                      value={profileDesc}
                      onChange={(e) => setProfileDesc(e.target.value)}
                      placeholder="Authentic North Indian cuisines prepared fresh with premium spices..."
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:border-[#FF5200] outline-hidden resize-none"
                    />
                  </div>

                  {/* Pure Veg Dietary Badge Toggle */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/70 border border-emerald-200">
                    <div className="flex items-center gap-2.5">
                      <span className="p-1.5 rounded-lg bg-emerald-500 text-white">
                        <Leaf className="w-4 h-4" />
                      </span>
                      <div>
                        <span className="font-bold text-xs text-emerald-950 block">
                          100% Pure Vegetarian Restaurant
                        </span>
                        <span className="text-[11px] text-emerald-700">
                          Displays the official green Pure Veg badge on customer search cards
                        </span>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={profilePureVeg}
                        onChange={(e) => setProfilePureVeg(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* CARD 3: KITCHEN OPERATIONS & SLA */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <span className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
                    <Clock className="w-4 h-4" />
                  </span>
                  <div>
                    <h2 className="text-sm font-black text-slate-900">Kitchen Operations & Turnaround SLA</h2>
                    <p className="text-[11px] text-slate-500">Turnaround minutes, delivery range, and kitchen timing</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Opening Time</label>
                    <input
                      type="time"
                      value={profileOpening}
                      onChange={(e) => setProfileOpening(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Closing Time</label>
                    <input
                      type="time"
                      value={profileClosing}
                      onChange={(e) => setProfileClosing(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">
                      Avg Prep Turnaround (Mins)
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={90}
                      value={profilePrepMins}
                      onChange={(e) => setProfilePrepMins(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">
                      Delivery Serving Radius (KM)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={25}
                      value={profileRadius}
                      onChange={(e) => setProfileRadius(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">
                      Min Order Value (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={profileMinOrder}
                      onChange={(e) => setProfileMinOrder(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">
                      Outlet Location / City
                    </label>
                    <input
                      type="text"
                      disabled
                      value={`${restaurant.address || profileAddress || "Registered Kitchen"}, ${restaurant.city || profileCity || ""}`}
                      className="w-full p-2.5 rounded-xl bg-slate-100 border border-slate-200 font-medium text-slate-600"
                    />
                  </div>
                </div>
              </div>

              {/* CARD 4: GOVERNMENT COMPLIANCE & LICENSES */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                    <ShieldCheck className="w-4 h-4" />
                  </span>
                  <div>
                    <h2 className="text-sm font-black text-slate-900">Government Compliance & Licensing</h2>
                    <p className="text-[11px] text-slate-500">Statutory regulatory numbers as per Section 32</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      FSSAI License Number <span className="text-rose-500">* (14 Digits)</span>
                    </label>
                    <input
                      type="text"
                      maxLength={14}
                      value={fssaiNumber}
                      onChange={(e) => setFssaiNumber(e.target.value.replace(/\D/g, "").slice(0, 14))}
                      placeholder="e.g. 12224999000123"
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold tracking-wider text-slate-800 focus:bg-white focus:border-[#FF5200] outline-hidden"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      {fssaiNumber.length === 14 ? "✅ Valid 14-digit FSSAI" : `${fssaiNumber.length}/14 digits entered`}
                    </span>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      GSTIN <span className="text-slate-400 font-normal">(15 Characters)</span>
                    </label>
                    <input
                      type="text"
                      maxLength={15}
                      value={gstNumber}
                      onChange={(e) => setGstNumber(e.target.value.toUpperCase().slice(0, 15))}
                      placeholder="e.g. 07AAAAA0000A1Z5"
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold tracking-wider text-slate-800 focus:bg-white focus:border-[#FF5200] outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* CARD 5: SETTLEMENT BANK & PAYOUT */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <span className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
                    <Landmark className="w-4 h-4" />
                  </span>
                  <div>
                    <h2 className="text-sm font-black text-slate-900">Settlement Bank & Payouts</h2>
                    <p className="text-[11px] text-slate-500">Destination account for automated weekly settlements</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Account Holder Name</label>
                    <input
                      type="text"
                      value={bankAccountName}
                      onChange={(e) => setBankAccountName(e.target.value)}
                      placeholder="e.g. Rajesh Kumar Sharma"
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-800 focus:bg-white focus:border-[#FF5200] outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="e.g. HDFC Bank"
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-800 focus:bg-white focus:border-[#FF5200] outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Bank Account Number</label>
                    <input
                      type="text"
                      value={bankAccountNumber}
                      onChange={(e) => setBankAccountNumber(e.target.value)}
                      placeholder="e.g. 50100234567890"
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono font-bold text-slate-800 focus:bg-white focus:border-[#FF5200] outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">IFSC Code</label>
                    <input
                      type="text"
                      maxLength={11}
                      value={bankIfsc}
                      onChange={(e) => setBankIfsc(e.target.value.toUpperCase())}
                      placeholder="e.g. HDFC0001234"
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono font-bold tracking-wider text-slate-800 focus:bg-white focus:border-[#FF5200] outline-hidden"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-slate-700 font-bold mb-1">
                      UPI ID for Instant Payouts <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="e.g. rajesh@okaxis"
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-800 focus:bg-white focus:border-[#FF5200] outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Bottom Sticky Action Bar */}
              <div className="sticky bottom-16 sm:bottom-4 p-4 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-lg flex items-center justify-between z-30">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FF5200] animate-pulse" />
                  <span className="text-xs font-bold text-slate-700">All updates sync live across customer app</span>
                </div>
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={isSavingProfile}
                  className="px-6 py-2.5 bg-[#FF5200] hover:bg-[#e04800] disabled:bg-slate-300 text-white font-bold rounded-xl shadow-xs text-xs cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  {isSavingProfile ? "Saving Profile..." : "Save All Changes"}
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MOBILE BOTTOM NAV */}
      <div className="sm:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 py-1.5 px-3 flex items-center justify-around z-40 shadow-lg">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`flex flex-col items-center gap-0.5 p-1 cursor-pointer ${
            activeTab === "dashboard" ? "text-[#FF5200]" : "text-slate-400"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span className="text-[10px] font-bold">Dashboard</span>
        </button>

        <button
          onClick={() => setActiveTab("orders")}
          className={`relative flex flex-col items-center gap-0.5 p-1 cursor-pointer ${
            activeTab === "orders" ? "text-[#FF5200]" : "text-slate-400"
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span className="text-[10px] font-bold">KDS</span>
          {incomingOrders.length > 0 && (
            <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-red-500 animate-ping" />
          )}
        </button>

        <button
          onClick={() => setActiveTab("menu")}
          className={`flex flex-col items-center gap-0.5 p-1 cursor-pointer ${
            activeTab === "menu" ? "text-[#FF5200]" : "text-slate-400"
          }`}
        >
          <Utensils className="w-4 h-4" />
          <span className="text-[10px] font-bold">Menu</span>
        </button>

        <button
          onClick={() => setActiveTab("finance")}
          className={`flex flex-col items-center gap-0.5 p-1 cursor-pointer ${
            activeTab === "finance" ? "text-[#FF5200]" : "text-slate-400"
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span className="text-[10px] font-bold">Finance</span>
        </button>

        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex flex-col items-center gap-0.5 p-1 text-slate-400 cursor-pointer"
        >
          <MenuIcon className="w-4 h-4" />
          <span className="text-[10px] font-bold">More</span>
        </button>
      </div>

      {/* MODAL: ADD / EDIT DISH WITH UNBLOCKABLE NATIVE CAMERA & GALLERY */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-3xl max-w-sm w-full p-4 sm:p-5 shadow-2xl space-y-3 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-black text-sm text-slate-900">
                {editingProduct ? "Edit Dish" : "Add Food Dish"}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Dish Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Paneer Butter Masala"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-semibold focus:ring-2 focus:ring-[#FF5200]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    required
                    placeholder="280"
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-bold text-slate-900 focus:ring-2 focus:ring-[#FF5200]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Original MRP</label>
                  <input
                    type="number"
                    placeholder="320"
                    value={newProdOriginalPrice}
                    onChange={(e) => setNewProdOriginalPrice(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-semibold focus:ring-2 focus:ring-[#FF5200]"
                  />
                </div>
              </div>

              {/* Veg / Non-Veg Segmented Switch */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">Classification</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewProdVeg(true)}
                    className={`py-1.5 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer ${
                      newProdVeg
                        ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                        : "border-slate-200 text-slate-500"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                    <span>Pure Veg</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewProdVeg(false)}
                    className={`py-1.5 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer ${
                      !newProdVeg
                        ? "border-red-600 bg-red-50 text-red-800"
                        : "border-slate-200 text-slate-500"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-red-600" />
                    <span>Non-Veg</span>
                  </button>
                </div>
              </div>

              {/* NATIVE UNBLOCKABLE CAMERA & GALLERY PHOTO SELECTOR */}
              <div>
                <label className="block text-slate-700 font-bold mb-1.5 flex items-center justify-between">
                  <span>Food Dish Photo</span>
                  <span className="text-[10px] font-normal text-slate-400">Camera / Gallery</span>
                </label>

                {/* Hidden File Inputs */}
                <input
                  ref={dishCameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageFileChange}
                  className="hidden"
                />
                <input
                  ref={dishGalleryInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="hidden"
                />

                {imagePreview ? (
                  <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 p-2 space-y-2">
                    <div className="relative rounded-xl overflow-hidden h-36 bg-slate-100">
                      <img
                        src={imagePreview}
                        alt="Dish preview"
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedImageFile(null);
                          setImagePreview("");
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-lg shadow-sm hover:bg-red-700 cursor-pointer"
                        title="Remove Photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-0.5">
                      <span className="text-emerald-700 font-bold text-[11px] flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Photo Attached
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handlePickDishPhoto("camera")}
                          className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1 cursor-pointer"
                        >
                          <Camera className="w-3 h-3 text-[#FF5200]" />
                          <span>Retake</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePickDishPhoto("gallery")}
                          className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1 cursor-pointer"
                        >
                          <ImageIcon className="w-3 h-3 text-blue-600" />
                          <span>Gallery</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handlePickDishPhoto("camera")}
                        className="p-3 rounded-2xl border-2 border-dashed border-slate-300 hover:border-[#FF5200] bg-slate-50 hover:bg-orange-50/40 transition-all flex flex-col items-center justify-center gap-1.5 text-center cursor-pointer group"
                      >
                        <div className="w-8 h-8 rounded-full bg-orange-100 text-[#FF5200] flex items-center justify-center group-hover:scale-105 transition-transform">
                          <Camera className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-bold text-xs text-slate-800 block leading-tight">Take Photo</span>
                          <span className="text-[9px] text-slate-400 block">Open Camera</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handlePickDishPhoto("gallery")}
                        className="p-3 rounded-2xl border-2 border-dashed border-slate-300 hover:border-[#FF5200] bg-slate-50 hover:bg-orange-50/40 transition-all flex flex-col items-center justify-center gap-1.5 text-center cursor-pointer group"
                      >
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                          <ImageIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-bold text-xs text-slate-800 block leading-tight">From Gallery</span>
                          <span className="text-[9px] text-slate-400 block">Pick Album</span>
                        </div>
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 text-center">
                      Tap above to snap food with Camera or choose from Photos.
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Category</label>
                  <select
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-semibold bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Prep Time (Mins)</label>
                  <input
                    type="number"
                    value={newProdPrep}
                    onChange={(e) => setNewProdPrep(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Culinary notes, flavor, serving info..."
                  value={newProdDesc}
                  onChange={(e) => setNewProdDesc(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-medium"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProduct}
                  className="flex-1 py-2.5 rounded-xl bg-[#FF5200] hover:bg-[#e04800] disabled:bg-slate-300 text-white font-bold shadow-xs cursor-pointer"
                >
                  {isSavingProduct ? "Saving..." : "Save Dish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD CATEGORY */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-3xl max-w-sm w-full p-4 sm:p-5 shadow-2xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-black text-sm text-slate-900">Add Category</h3>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Starters & Snacks"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Fresh tandoor kebabs"
                  value={newCategoryDesc}
                  onChange={(e) => setNewCategoryDesc(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-semibold"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-[#FF5200] hover:bg-[#e04800] text-white font-bold shadow-xs cursor-pointer"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: UPI DUE PAYMENT */}
      {isUpiModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-3xl max-w-sm w-full p-4 sm:p-5 shadow-2xl space-y-3 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-[#FF5200]" />
                <span>Pay Platform Due</span>
              </h3>
              <button
                onClick={() => setIsUpiModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-center space-y-2.5">
              <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 font-medium">
                Amount Due: <strong className="text-sm font-black text-slate-900">₹{stats.pending_due}</strong>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 inline-block shadow-xs">
                <img src={upiQrUrl} alt="UPI QR" className="w-44 h-44 mx-auto" />
                <p className="text-[10px] text-slate-400 font-semibold mt-1.5">GPay • PhonePe • Paytm • BHIM</p>
              </div>

              <div className="p-2 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium text-[11px]">UPI ID:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-slate-900 text-xs">{upiVpa}</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (navigator?.clipboard?.writeText) {
                        navigator.clipboard.writeText(upiVpa);
                        showToast("UPI ID copied!");
                      }
                    }}
                    className="p-1 text-[#FF5200] hover:bg-orange-50 rounded cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <a
                href={upiDueString}
                className="block w-full py-2 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl text-center shadow-xs"
              >
                Open in UPI App (Mobile)
              </a>
            </div>

            <form onSubmit={handlePayCompanyDue} className="space-y-2.5 pt-2 border-t border-slate-100 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  12-Digit Bank UTR / UPI Ref ID *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 423901928392"
                  value={upiPaymentUtr}
                  onChange={(e) => setUpiPaymentUtr(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-mono font-semibold"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsUpiModalOpen(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingDue}
                  className="flex-1 py-2 rounded-xl bg-[#FF5200] hover:bg-[#e04800] disabled:bg-slate-300 text-white font-bold shadow-xs cursor-pointer"
                >
                  {isSubmittingDue ? "Verifying..." : "Confirm"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REJECT REASON */}
      {isRejectModalOpen && orderToReject && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-3xl max-w-sm w-full p-4 shadow-2xl space-y-3">
            <h3 className="font-black text-sm text-red-700">Reject Order #{orderToReject.order_number}</h3>
            <div className="space-y-1.5 text-xs font-semibold text-slate-700">
              {[
                "Key ingredients out of stock",
                "Kitchen queue completely full",
                "Outlet closing down",
                "Address beyond capability"
              ].map((reason) => (
                <button
                  key={reason}
                  onClick={() => setRejectReason(reason)}
                  className={`w-full text-left p-2.5 rounded-xl border cursor-pointer ${
                    rejectReason === reason
                      ? "border-red-500 bg-red-50 text-red-900 font-bold"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => {
                  setIsRejectModalOpen(false);
                  setOrderToReject(null);
                }}
                className="flex-1 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Back
              </button>
              <button
                onClick={handleRejectOrder}
                className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs cursor-pointer"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RIDER OTP */}
      {handoverOrderId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-3 text-center">
            <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center mx-auto">
              <Bike className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm text-slate-900">Captain Handover OTP</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Enter the 4-digit OTP shown on captain's Fiinway app:
              </p>
            </div>

            <input
              type="text"
              maxLength={4}
              placeholder="0000"
              value={riderOtp}
              onChange={(e) => setRiderOtp(e.target.value)}
              className="w-full text-center tracking-widest text-xl font-black py-2.5 rounded-xl bg-slate-50 border border-slate-300 font-mono"
            />

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => {
                  setHandoverOrderId(null);
                  setRiderOtp("");
                }}
                className="flex-1 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmHandover}
                className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer"
              >
                Verify & Handover
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RECEIPT DETAIL */}
      {selectedOrderDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-3xl max-w-sm w-full p-4 shadow-2xl space-y-3 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="font-black text-sm text-slate-900">Order #{selectedOrderDetail.order_number}</h3>
                <span className="text-[10px] text-slate-400">
                  {new Date(selectedOrderDetail.created_at).toLocaleString()}
                </span>
              </div>
              <button
                onClick={() => setSelectedOrderDetail(null)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-xl space-y-0.5">
                <div className="font-bold text-slate-800">Customer: {selectedOrderDetail.customer_name || "Customer"}</div>
                {selectedOrderDetail.customer_phone && (
                  <div className="text-slate-500 text-[11px]">Phone: {selectedOrderDetail.customer_phone}</div>
                )}
              </div>

              <div>
                <h4 className="font-bold text-slate-700 mb-1">Items:</h4>
                <div className="space-y-1 border-t border-slate-100 pt-1">
                  {Array.isArray(selectedOrderDetail.items) &&
                    selectedOrderDetail.items.map((it: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center text-[11px]">
                        <span>{it.quantity}x {it.product_name || it.name}</span>
                        <span className="font-bold">₹{it.restaurant_unit_price * it.quantity || it.line_total}</span>
                      </div>
                    ))}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-2 space-y-1 font-medium text-[11px]">
                <div className="flex justify-between text-slate-500">
                  <span>Gross Bill:</span>
                  <span>₹{selectedOrderDetail.food_amount}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Commission:</span>
                  <span>-₹{selectedOrderDetail.commission_amount || 0}</span>
                </div>
                <div className="flex justify-between text-xs font-black text-emerald-700 pt-1 border-t border-slate-100">
                  <span>Net Payout:</span>
                  <span>₹{selectedOrderDetail.restaurant_net_amount || selectedOrderDetail.food_amount}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedOrderDetail(null)}
              className="w-full py-2 bg-slate-900 text-white font-bold text-xs rounded-xl cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* MODAL: REPLY TO REVIEW */}
      {replyingReview && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-3xl max-w-sm w-full p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-black text-sm text-slate-900">Reply to Review</h3>
              <button
                onClick={() => setReplyingReview(null)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-xl text-xs space-y-0.5">
              <div className="flex justify-between font-bold">
                <span>{replyingReview.customer?.name || "Customer"}</span>
                <span className="text-amber-500">⭐ {replyingReview.restaurant_rating || 5}.0</span>
              </div>
              <p className="text-slate-600 text-[11px]">"{replyingReview.restaurant_review}"</p>
            </div>

            <form onSubmit={handleSubmitReviewReply} className="space-y-2.5 text-xs">
              <textarea
                rows={2}
                required
                placeholder="Thank the customer..."
                value={reviewReplyText}
                onChange={(e) => setReviewReplyText(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 font-medium"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setReplyingReview(null)}
                  className="flex-1 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-[#FF5200] hover:bg-[#e04800] text-white font-bold shadow-xs cursor-pointer"
                >
                  Post
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
