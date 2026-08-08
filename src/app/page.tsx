'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function OnboardingForm() {
  const searchParams = useSearchParams();

  // URL Params
  const driverId = searchParams.get("driver_id");
  const accesstoken = searchParams.get("accesstoken");
  const mode = searchParams.get("mode");

  // API Data State
  const [loadingInit, setLoadingInit] = useState(true);
  const [initError, setInitError] = useState("");

  const [categoriesData, setCategoriesData] = useState<any[]>([]);
  const [vehicleMappings, setVehicleMappings] = useState<any>({});
  const [vehiclesData, setVehiclesData] = useState<any[]>([]);
  const [transportDeliveryMap, setTransportDeliveryMap] = useState<any>({});
  const [adminDocs, setAdminDocs] = useState<any[]>([]);
  const [zonesData, setZonesData] = useState<any[]>([]);
  const [categoryImageMap, setCategoryImageMap] = useState<Record<string, string>>({});

  // Form State
  const [step, setStep] = useState(1);
  const [zoneId, setZoneId] = useState<string>("");

  const [primaryCategory, setPrimaryCategory] = useState<any>(null); // Top level
  const [businessType, setBusinessType] = useState<any>(null); // Subcategory

  const [providesDelivery, setProvidesDelivery] = useState(false);
  const [secondaryTypes, setSecondaryTypes] = useState<string[]>([]);

  // Vehicles Array (supports 1 for normal, multiple for Fleet Owner)
  const [vehicles, setVehicles] = useState<any[]>([{
    id: 1,
    type_id: '',
    brand: '',
    model: '',
    number_plate: '',
    color: '',
    car_make: '',
    passenger: '',
    milage: '',
    km: ''
  }]);

  const [documents, setDocuments] = useState<Record<string, File | null>>({});
  const [bankName, setBankName] = useState("");
  const [accountNo, setAccountNo] = useState("");
  const [ifscCode, setIfscCode] = useState("");

  const [visitingCharge, setVisitingCharge] = useState("");
  const [additionalServices, setAdditionalServices] = useState<{ id: number; name: string; price: string }[]>([]);

  // UI State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);

  // Fetch Init Data
  useEffect(() => {
    const fetchInitData = async () => {
      try {
        const initUrl = new URL("/api/v1/driver/onboarding/init", window.location.origin);
        if (driverId) {
          initUrl.searchParams.set("driver_id", driverId);
        }

        const res = await fetch(initUrl.toString(), {
          headers: {
            "accesstoken": accesstoken || "",
            "apikey": "base64:nTfofcBByTDenJQYlsRbH0JjeVFW5lWsIIyXtq8/9sU="
          }
        });
        const result = await res.json();
        if (result.success === 'success' || result.success === 'Success') {
          if (result.data.onboarding_completed) {
            if (mode === 'edit_category') {
              setAlreadySubmitted(false);
            } else {
              setAlreadySubmitted(true);
              setLoadingInit(false);
              return;
            }
          }
          const categories = result.data.categories || [];
          setCategoriesData(categories);

          const imageMap: Record<string, string> = {};
          categories.forEach((cat: any) => {
            if (cat.subcategories) {
              cat.subcategories.forEach((sub: any) => {
                if (sub.image) {
                  imageMap[sub.libelle] = sub.image;
                }
              });
            }
          });
          setCategoryImageMap(imageMap);

          setVehicleMappings(result.data.vehicle_mappings || {});
          setVehiclesData(result.data.vehicles || []);
          setTransportDeliveryMap(result.data.transport_delivery_map || {});
          // Load documents from API (matches admin_documents table exactly)
          setAdminDocs(result.data.admin_docs || []);
          setZonesData(result.data.zones || []);

          if (result.data.service_pricing) {
            const pricing = result.data.service_pricing;
            setVisitingCharge(pricing.visiting_charge?.toString() || "");
            setAdditionalServices(
              (pricing.service_items || []).map((item: any, index: number) => ({
                id: Date.now() + index,
                name: item.name || "",
                price: item.price?.toString() || "",
              }))
            );
          }
        } else {
          setInitError("Failed to load onboarding data.");
        }
      } catch (e) {
        setInitError("Network error while loading data.");
      } finally {
        setLoadingInit(false);
      }
    };

    if (accesstoken || driverId) {
      fetchInitData();
    } else {
      setInitError("Missing access token.");
      setLoadingInit(false);
    }
  }, [accesstoken, driverId]);

  // Disable pinch/gesture zoom on mobile devices (e.g. iOS Safari)
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    const handleGestureStart = (e: Event) => {
      e.preventDefault();
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('gesturestart', handleGestureStart);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('gesturestart', handleGestureStart);
    };
  }, []);

  // Validation
  const canProceedToStep2 = () => {
    if (!primaryCategory || !businessType) return false;
    if (primaryCategory?.libelle && ['Delivery', 'Logistics'].some(t => primaryCategory.libelle.includes(t)) && !deliveryVehicleRole) return false;
    if (providesDelivery && secondaryTypes.length === 0) return false;
    return true;
  };

  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [deliveryVehicleRole, setDeliveryVehicleRole] = useState<any>(null);
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({});
  const [step3Tab, setStep3Tab] = useState<'docs' | 'zone' | 'kyc'>('docs');

  const toggleDropdown = (key: string) => {
    setOpenDropdowns(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const businessRequiresVehicle = () => {
    if (!businessType) return false;

    // Safety check based on parent category name for absolute certainty
    if (primaryCategory?.libelle && ['Transport', 'Delivery', 'Mobility', 'Logistics'].some(t => primaryCategory.libelle.includes(t))) {
      return true;
    }

    // Primary source: API-provided flag (set by backend based on tj_category_user_vehicle_type)
    if (typeof businessType.requires_vehicle === 'boolean') {
      return businessType.requires_vehicle;
    }
    // Fallback: check vehicleMappings with string coercion (PHP groupBy uses string keys)
    return !!(vehicleMappings[String(businessType.id)] || vehicleMappings[businessType.id]);
  };

  const businessRequiresHomeVisitPricing = () => {
    if (!businessType || businessRequiresVehicle()) return false;

    if (typeof businessType.requires_home_visit === 'boolean') {
      return businessType.requires_home_visit;
    }

    const parentLabel = primaryCategory?.libelle || '';
    const excluded = [
      'Online Seller', 'Retail Shop', 'Restaurant', 'Hotel', 'Manufacturing',
      'Transport', 'Delivery', 'Mobility', 'Logistics',
    ];
    return !excluded.some((term) => parentLabel.includes(term));
  };

  const step2IsPricing = () => businessRequiresHomeVisitPricing();

  const isFleetOwner = () => {
    return businessType?.libelle === 'Fleet Owner';
  };

  const canProceedToStep3 = () => {
    if (businessRequiresHomeVisitPricing()) {
      const charge = parseFloat(visitingCharge);
      if (isNaN(charge) || charge < 0) return false;

      return additionalServices.every((service) => {
        if (!service.name.trim() && !service.price.trim()) return true;
        const price = parseFloat(service.price);
        return service.name.trim() !== '' && !isNaN(price) && price >= 0;
      });
    }

    if (!businessRequiresVehicle()) return true;

    // Ensure all active vehicles are fully filled
    return vehicles.every(v =>
      v.type_id && v.brand && v.model && v.number_plate &&
      v.color && v.car_make && v.passenger && v.milage && v.km
    );
  };

  const handleNextFromStep1 = () => {
    if (businessRequiresVehicle() || businessRequiresHomeVisitPricing()) {
      setStep(2);
    } else {
      setStep(3);
    }
  };

  const addServiceItem = () => {
    setAdditionalServices((prev) => [...prev, { id: Date.now(), name: "", price: "" }]);
  };

  const removeServiceItem = (id: number) => {
    setAdditionalServices((prev) => prev.filter((item) => item.id !== id));
  };

  const updateServiceItem = (id: number, field: "name" | "price", value: string) => {
    setAdditionalServices((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  // Vehicle Management
  const addVehicle = () => {
    setVehicles([...vehicles, {
      id: Date.now(),
      type_id: '',
      brand: '',
      model: '',
      number_plate: '',
      color: '',
      car_make: '',
      passenger: '',
      milage: '',
      km: ''
    }]);
  };

  const removeVehicle = (id: number) => {
    if (vehicles.length > 1) {
      setVehicles(vehicles.filter(v => v.id !== id));
    }
  };

  const updateVehicle = (id: number, field: string, value: string) => {
    setVehicles(vehicles.map(v => {
      if (v.id === id) {
        // If type changes, reset brand and model
        if (field === 'type_id') {
          return { ...v, type_id: value, brand: '', model: '' };
        }
        // If brand changes, reset model
        if (field === 'brand') {
          return { ...v, brand: value, model: '' };
        }
        return { ...v, [field]: value };
      }
      return v;
    }));
  };

  // File Management
  const handleFileChange = (docId: number, file: File | null) => {
    if (file) {
      setDocuments(prev => ({ ...prev, [`doc_${docId}`]: file }));
    }
  };

  // Submit Logic
  const submitForm = async () => {
    if (!driverId) {
      setError("Driver ID is missing.");
      return;
    }

    setLoading(true);
    setError("");

    const data = new FormData();
    data.append("driver_id", driverId);
    data.append("primary_category_id", businessType.id.toString());
    if (mode) data.append("mode", mode);

    if (secondaryTypes.length > 0) {
      data.append("secondary_types", JSON.stringify(secondaryTypes));
    }

    if (businessRequiresVehicle()) {
      data.append("vehicles", JSON.stringify(vehicles));
    }

    if (businessRequiresHomeVisitPricing()) {
      data.append("visiting_charge", visitingCharge);
      const serviceItems = additionalServices
        .filter((item) => item.name.trim() && item.price.trim())
        .map((item) => ({
          name: item.name.trim(),
          price: item.price.trim(),
        }));
      data.append("service_items", JSON.stringify(serviceItems));
    }

    Object.entries(documents).forEach(([key, file]) => {
      if (file) {
        data.append(key, file);
      }
    });

    data.append("bank_name", bankName);
    data.append("account_no", accountNo);
    data.append("ifsc_code", ifscCode);
    data.append("zone_id", zoneId);

    try {
      const res = await fetch("/api/v1/driver/onboarding/submit", {
        method: "POST",
        headers: {
          "accesstoken": accesstoken || "",
          "apikey": "base64:nTfofcBByTDenJQYlsRbH0JjeVFW5lWsIIyXtq8/9sU="
        },
        body: data,
      });

      const result = await res.json();
      if (result.success === "Success" || result.success === "success") {
        setSuccess(true);
      } else {
        setError(result.error || result.message || "Failed to submit.");
      }
    } catch (err: any) {
      setError(err.message || "Network error.");
    } finally {
      setLoading(false);
    }
  };

  // Success Screen
  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center border border-slate-100">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-3">Onboarding Complete!</h2>
          <p className="text-slate-500 mb-6 leading-relaxed">
            Your details have been successfully submitted. Our team will verify your profile within 24-48 hours.
          </p>
          <button
            onClick={() => {
              try {
                // @ts-ignore
                if (window.AppBridge) window.AppBridge.postMessage('close');
                window.history.back();
              } catch (e) { }
            }}
            className="w-full bg-slate-900 text-white font-semibold py-4 rounded-2xl hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20"
          >
            Return to App
          </button>
        </div>
      </div>
    );
  }

  if (alreadySubmitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center border border-slate-100">
          <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-3 font-sans">Already Submitted</h2>
          <p className="text-slate-500 mb-6 leading-relaxed font-sans">
            Your response is already submitted. Please wait 24-48 hours.
          </p>
          <button
            onClick={() => {
              try {
                // @ts-ignore
                if (window.AppBridge) window.AppBridge.postMessage('close');
                window.history.back();
              } catch (e) { }
            }}
            className="w-full bg-slate-900 text-white font-semibold py-4 rounded-2xl hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20 font-sans"
          >
            Return to App
          </button>
        </div>
      </div>
    );
  }

  if (loadingInit) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading Setup Data...</div>;
  }

  if (initError) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-red-500">{initError}</div>;
  }

  // Allowed Delivery Types for this business
  const allowedDeliveryTypes = businessType ? (transportDeliveryMap[businessType.libelle] || []) : [];

  return (
    <div className="bg-slate-50 sm:bg-gray-100 antialiased text-gray-800 min-h-screen sm:flex sm:items-center sm:justify-center">
      <style dangerouslySetInnerHTML={{
        __html: `
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #f1f1f1; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        .app-container { width: 100%; height: 100vh; background-color: #ffffff; position: relative; display: flex; flex-direction: column; overflow: hidden; }
        @media (min-width: 640px) {
          .app-container { width: 375px; height: 812px; max-height: 90vh; border-radius: 40px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); border: 8px solid #333; }
        }
        .scrollable-content { -ms-overflow-style: none; scrollbar-width: none; }
        .scrollable-content::-webkit-scrollbar { display: none; }
      `}} />
      <div className="app-container">
        {/* Header (Fixed) */}
        <header className="bg-white px-4 pt-12 pb-4 sm:pt-6 sticky top-0 z-10 flex flex-col items-center border-b border-gray-100">
          <div className="w-full flex items-center relative mb-2">
            <button
              onClick={() => {
                if (step > 1) setStep(step - 1);
                else {
                  try {
                    // @ts-ignore
                    if (window.AppBridge) window.AppBridge.postMessage('close');
                    window.history.back();
                  } catch (e) { }
                }
              }}
              className="p-2 -ml-2 text-gray-800 hover:bg-gray-100 rounded-full transition-colors absolute left-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
            </button>
            <div className="w-full text-center flex-1">
              <h1 className="text-xl font-bold text-gray-900 leading-tight tracking-tight">
                {step === 1 ? 'Choose Services' : step === 2 ? (step2IsPricing() ? 'Service Pricing' : 'Profession Info') : 'Upload Docs'}
              </h1>
            </div>
          </div>
          {step === 1 && <p className="text-xs text-gray-500 font-medium">Select the services you want to work on</p>}

          {/* Stepper */}
          {mode !== 'edit_category' && (
          <div className="w-full px-6 mt-6 flex justify-between items-start relative">
            <div className="absolute top-[14px] left-10 right-10 h-[1px] bg-gray-300 -z-10"></div>
            <div className={`absolute top-[14px] left-10 h-[1px] bg-green-600 -z-10 transition-all duration-300 ${step === 1 ? 'w-0' : step === 2 ? 'w-1/2' : 'w-full'}`}></div>

            {/* Step 1 */}
            <div className="flex flex-col items-center">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-sm ${step >= 1 ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'}`}>1</div>
              <span className={`text-[10px] mt-2 font-medium ${step >= 1 ? 'text-gray-800' : 'text-gray-400'}`}>Business Category</span>
            </div>
            {/* Step 2 */}
            <div className="flex flex-col items-center">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-sm ${step >= 2 ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'}`}>2</div>
              <span className={`text-[10px] mt-2 font-medium ${step >= 2 ? 'text-gray-800' : 'text-gray-400'}`}>
                {step2IsPricing() ? 'Pricing' : 'Profession'}
              </span>
            </div>
            {/* Step 3 */}
            <div className="flex flex-col items-center">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-sm ${step >= 3 ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'}`}>3</div>
              <span className={`text-[10px] mt-2 font-medium ${step >= 3 ? 'text-gray-800' : 'text-gray-400'}`}>KYC & Docs</span>
            </div>
          </div>
          )}
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto bg-white px-4 py-6 scrollable-content pb-32">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 font-medium text-sm border border-red-100 flex items-start">
              <svg className="w-5 h-5 mr-3 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <p>{error}</p>
            </div>
          )}

          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 relative">
                <label className="block text-sm font-bold text-gray-800 mb-2">Select Your Service Category</label>
                <div
                  className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-3 flex justify-between items-center cursor-pointer transition-all font-medium"
                  onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                >
                  <span className={primaryCategory ? "text-gray-900" : "text-gray-400"}>
                    {primaryCategory ? primaryCategory.libelle : "Choose a category..."}
                  </span>
                  <svg className={`w-5 h-5 text-gray-400 transition-transform ${isCategoryOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>

                {isCategoryOpen && (
                  <div className="absolute z-50 left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="max-h-[300px] overflow-y-auto divide-y divide-gray-50">
                      {categoriesData.map((cat: any) => (
                        <div
                          key={cat.id}
                          className={`px-5 py-4 flex items-center justify-between cursor-pointer transition-colors ${primaryCategory?.id === cat.id ? 'bg-green-50 text-green-700 font-bold' : 'text-gray-700 font-medium hover:bg-gray-50'}`}
                          onClick={() => {
                            setPrimaryCategory(cat);
                            setBusinessType(null);
                            setProvidesDelivery(false);
                            setSecondaryTypes([]);
                            setIsCategoryOpen(false);
                            setDeliveryVehicleRole(null);
                          }}
                        >
                          {cat.libelle}
                          {primaryCategory?.id === cat.id && (
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {primaryCategory && (
                <section className="mb-8 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center space-x-2 mb-4 px-1">
                    <span className="text-green-600 text-xl">
                      {["Transport & Mobility", "Delivery & Logistics", "Services"].findIndex(n => primaryCategory.libelle.includes(n)) === 0 ? "🚘" : "💼"}
                    </span>
                    <h2 className="text-sm font-bold text-green-600 tracking-wide">
                      Select Vehicle
                    </h2>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {primaryCategory.subcategories.map((sub: any) => {
                      const isSelected = businessType?.id === sub.id;
                      return (
                        <div
                          key={sub.id}
                          onClick={() => {
                            setBusinessType(sub);
                            setProvidesDelivery(false);
                            setSecondaryTypes([]);
                            setDeliveryVehicleRole(null);
                          }}
                          className={`relative rounded-xl p-2 flex flex-col items-center justify-start text-center cursor-pointer transition-all shadow-sm ${isSelected ? 'bg-green-100 border-2 border-green-600' : 'bg-white border border-gray-200 hover:border-gray-300'}`}
                        >
                          <img
                            src={sub.image || `https://placehold.co/80x60/${isSelected ? 'dcfce7' : 'f8f9fa'}/333333?text=${sub.libelle.split(' ')[0]}`}
                            alt={sub.libelle}
                            className="h-12 object-contain mb-2 mix-blend-multiply"
                          />
                          <h3 className="text-[11px] font-bold text-gray-900 leading-tight mb-1">{sub.libelle}</h3>

                          {isSelected && (
                            <div className="absolute -top-1.5 -right-1.5 bg-green-600 text-white rounded-full p-0.5 shadow-md">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" /></svg>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </section>
              )}

              {/* Delivery Vehicle Role Selection */}
              {businessType && primaryCategory?.libelle && ['Delivery', 'Logistics'].some(t => primaryCategory.libelle.includes(t)) && (
                <section className="mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center space-x-2 mb-4 px-1">
                    <span className="text-green-600 text-xl">🚚</span>
                    <h2 className="text-sm font-bold text-green-600 tracking-wide">
                      Select Delivery Vehicle Type
                    </h2>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {categoriesData.find(c => c.libelle.includes('Transport'))?.subcategories
                      .filter((sub: any) => !sub.libelle.toLowerCase().includes('cab'))
                      .map((sub: any) => {
                        const isSelected = deliveryVehicleRole?.id === sub.id;
                        return (
                          <div
                            key={sub.id}
                            onClick={() => setDeliveryVehicleRole(sub)}
                            className={`relative rounded-xl p-2 flex flex-col items-center justify-start text-center cursor-pointer transition-all shadow-sm ${isSelected ? 'bg-green-100 border-2 border-green-600' : 'bg-white border border-gray-200 hover:border-gray-300'}`}
                          >
                            <img
                              src={sub.image || `https://placehold.co/80x60/${isSelected ? 'dcfce7' : 'f8f9fa'}/333333?text=${sub.libelle.split(' ')[0]}`}
                              alt={sub.libelle}
                              className="h-12 object-contain mb-2 mix-blend-multiply"
                            />
                            <h3 className="text-[11px] font-bold text-gray-900 leading-tight mb-1">{sub.libelle}</h3>
                            {isSelected && (
                              <div className="absolute -top-1.5 -right-1.5 bg-green-600 text-white rounded-full p-0.5 shadow-md">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" /></svg>
                              </div>
                            )}
                          </div>
                        )
                      })}
                  </div>
                </section>
              )}

              {/* Delivery Cross-sell */}
              {businessType && allowedDeliveryTypes.length > 0 && (
                <section className="mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center space-x-2 mb-4 px-1">
                    <span className="text-green-600 text-xl">📦</span>
                    <h2 className="text-sm font-bold text-green-600 tracking-wide">
                      Choose Services
                    </h2>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {allowedDeliveryTypes.map((delType: string) => {
                      const isSelected = secondaryTypes.includes(delType);
                      return (
                        <div
                          key={delType}
                          onClick={() => {
                            if (isSelected) setSecondaryTypes(secondaryTypes.filter(t => t !== delType));
                            else setSecondaryTypes([...secondaryTypes, delType]);
                          }}
                          className={`relative rounded-xl p-2 flex flex-col items-center justify-start text-center cursor-pointer transition-all shadow-sm ${isSelected ? 'bg-green-100 border-2 border-green-600' : 'bg-white border border-gray-200 hover:border-gray-300'}`}
                        >
                          <img
                            src={categoryImageMap[delType] || `https://placehold.co/80x60/${isSelected ? 'dcfce7' : 'f8f9fa'}/333333?text=${delType.split(' ')[0]}`}
                            alt={delType}
                            className="h-12 object-contain mb-2 mix-blend-multiply"
                          />
                          <h3 className="text-[11px] font-bold text-gray-900 leading-tight mb-1">{delType}</h3>
                          {isSelected && (
                            <div className="absolute -top-1.5 -right-1.5 bg-green-600 text-white rounded-full p-0.5 shadow-md">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" /></svg>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </section>
              )}
            </div>
          )}

          {step === 2 && step2IsPricing() && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                <h2 className="text-sm font-bold text-green-700 mb-1">Home Visit Service Pricing</h2>
                <p className="text-xs text-green-600 leading-relaxed">
                  Set your fixed visiting charge and add optional service prices customers can book (e.g. AC repair, AC installation).
                </p>
              </div>

              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <label className="block text-sm font-bold text-gray-800 mb-2">Visiting Charge (Fixed)</label>
                <p className="text-xs text-gray-500 mb-3">One-time fee for visiting the customer&apos;s home (e.g. ₹300)</p>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="300"
                    value={visitingCharge}
                    onChange={(e) => setVisitingCharge(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl pl-8 pr-3 py-3 text-sm font-medium focus:ring-2 focus:ring-green-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-gray-800">Additional Services</h3>
                    <p className="text-xs text-gray-500 mt-1">Add custom services with your own prices</p>
                  </div>
                  <button
                    type="button"
                    onClick={addServiceItem}
                    className="text-xs font-bold text-green-700 bg-green-50 px-3 py-2 rounded-lg hover:bg-green-100"
                  >
                    + Add Service
                  </button>
                </div>

                {additionalServices.length === 0 ? (
                  <div className="text-center py-6 text-gray-400 text-sm border border-dashed border-gray-200 rounded-xl">
                    No extra services yet. Tap &quot;Add Service&quot; to add AC repair, installation, etc.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {additionalServices.map((service, index) => (
                      <div key={service.id} className="grid grid-cols-[1fr_110px_32px] gap-2 items-end">
                        <div>
                          {index === 0 && <label className="block text-[10px] font-semibold text-gray-600 mb-1">Service Name</label>}
                          <input
                            type="text"
                            placeholder="e.g. AC Repair"
                            value={service.name}
                            onChange={(e) => updateServiceItem(service.id, 'name', e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-3 py-2.5 text-sm font-medium"
                          />
                        </div>
                        <div>
                          {index === 0 && <label className="block text-[10px] font-semibold text-gray-600 mb-1">Price (₹)</label>}
                          <input
                            type="number"
                            min="0"
                            step="1"
                            placeholder="500"
                            value={service.price}
                            onChange={(e) => updateServiceItem(service.id, 'price', e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-3 py-2.5 text-sm font-medium"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeServiceItem(service.id)}
                          className="h-10 w-8 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 2 && !step2IsPricing() && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {vehicles.map((veh, index) => {
                const relevantRoleId = deliveryVehicleRole ? deliveryVehicleRole.id : businessType.id;
                const allowedVehTypes = vehicleMappings[String(relevantRoleId)] || vehicleMappings[relevantRoleId] || [];
                const availableTypes = vehiclesData.filter((v: any) => allowedVehTypes.some((av: any) => av.vehicle_type_id == v.id));
                const selectedTypeObj = availableTypes.find((t: any) => t.id == veh.type_id);
                const availableBrands = selectedTypeObj ? Object.keys(selectedTypeObj.brands) : [];
                const availableModels = (selectedTypeObj && veh.brand) ? (selectedTypeObj.brands[veh.brand] || []) : [];

                return (
                  <div key={veh.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 relative">
                    {isFleetOwner() && vehicles.length > 1 && (
                      <button onClick={() => removeVehicle(veh.id)} className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center bg-red-50 text-red-500 rounded-full hover:bg-red-100">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                      </button>
                    )}

                    {isFleetOwner() && <h3 className="font-bold text-xs text-green-600 mb-3 uppercase tracking-wider">Vehicle {index + 1}</h3>}

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-2">What do you drive?</label>
                        <div className="grid grid-cols-3 gap-3">
                          {availableTypes.map((t: any) => {
                            const isSelected = veh.type_id == t.id;
                            return (
                              <div
                                key={t.id}
                                onClick={() => updateVehicle(veh.id, 'type_id', t.id.toString())}
                                className={`relative rounded-xl p-2 flex flex-col items-center justify-start text-center cursor-pointer transition-all shadow-sm ${isSelected ? 'bg-green-100 border-2 border-green-600' : 'bg-white border border-gray-200 hover:border-gray-300'}`}
                              >
                                <img
                                  src={t.image || `https://placehold.co/80x60/${isSelected ? 'dcfce7' : 'f8f9fa'}/333333?text=${t.name.split(' ')[0]}`}
                                  alt={t.name}
                                  className="h-12 object-contain mb-2 mix-blend-multiply"
                                />
                                <h3 className="text-[11px] font-bold text-gray-900 leading-tight mb-1">{t.name}</h3>
                                {isSelected && (
                                  <div className="absolute -top-1.5 -right-1.5 bg-green-600 text-white rounded-full p-0.5 shadow-md">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" /></svg>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="relative z-30">
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Brand</label>
                          <div
                            className={`w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 flex justify-between items-center transition-all font-medium text-sm ${veh.type_id ? 'cursor-pointer text-gray-800' : 'cursor-not-allowed text-gray-400'}`}
                            onClick={() => veh.type_id && toggleDropdown(`veh_brand_${veh.id}`)}
                          >
                            <span className={veh.brand ? "text-gray-900" : "text-gray-400"}>
                              {veh.brand || "Brand..."}
                            </span>
                            <svg className={`w-4 h-4 text-gray-400 transition-transform ${openDropdowns[`veh_brand_${veh.id}`] ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                            </svg>
                          </div>
                          {openDropdowns[`veh_brand_${veh.id}`] && veh.type_id && (
                            <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                              <div className="max-h-[200px] overflow-y-auto divide-y divide-gray-50">
                                {availableBrands.map(b => (
                                  <div
                                    key={b}
                                    className={`px-4 py-3 flex items-center justify-between cursor-pointer transition-colors text-sm ${veh.brand === b ? 'bg-green-50 text-green-700 font-bold' : 'text-gray-700 font-medium hover:bg-gray-50'}`}
                                    onClick={() => {
                                      updateVehicle(veh.id, 'brand', b);
                                      toggleDropdown(`veh_brand_${veh.id}`);
                                    }}
                                  >
                                    {b}
                                    {veh.brand === b && <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="relative z-20">
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Model</label>
                          <div
                            className={`w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 flex justify-between items-center transition-all font-medium text-sm ${veh.brand ? 'cursor-pointer text-gray-800' : 'cursor-not-allowed text-gray-400'}`}
                            onClick={() => veh.brand && toggleDropdown(`veh_model_${veh.id}`)}
                          >
                            <span className={veh.model ? "text-gray-900" : "text-gray-400"}>
                              {veh.model || "Model..."}
                            </span>
                            <svg className={`w-4 h-4 text-gray-400 transition-transform ${openDropdowns[`veh_model_${veh.id}`] ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                            </svg>
                          </div>
                          {openDropdowns[`veh_model_${veh.id}`] && veh.brand && (
                            <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                              <div className="max-h-[200px] overflow-y-auto divide-y divide-gray-50">
                                {availableModels.map((m: string) => (
                                  <div
                                    key={m}
                                    className={`px-4 py-3 flex items-center justify-between cursor-pointer transition-colors text-sm ${veh.model === m ? 'bg-green-50 text-green-700 font-bold' : 'text-gray-700 font-medium hover:bg-gray-50'}`}
                                    onClick={() => {
                                      updateVehicle(veh.id, 'model', m);
                                      toggleDropdown(`veh_model_${veh.id}`);
                                    }}
                                  >
                                    {m}
                                    {veh.model === m && <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Number Plate</label>
                          <input type="text" placeholder="MH 12 AB 1234" className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-3 py-2.5 text-sm font-medium" value={veh.number_plate} onChange={(e) => updateVehicle(veh.id, 'number_plate', e.target.value.toUpperCase())} />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Car Manufacturer</label>
                          <input type="text" placeholder="e.g. Maruti" className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-3 py-2.5 text-sm font-medium" value={veh.car_make} onChange={(e) => updateVehicle(veh.id, 'car_make', e.target.value)} />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-700 mb-1">Color</label>
                          <input type="text" placeholder="White" className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-2 py-2.5 text-sm font-medium" value={veh.color} onChange={(e) => updateVehicle(veh.id, 'color', e.target.value)} />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-700 mb-1">Mileage (km/l)</label>
                          <input type="number" placeholder="15" className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-2 py-2.5 text-sm font-medium" value={veh.milage} onChange={(e) => updateVehicle(veh.id, 'milage', e.target.value)} />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-700 mb-1">KM Driven</label>
                          <input type="number" placeholder="12000" className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-2 py-2.5 text-sm font-medium" value={veh.km} onChange={(e) => updateVehicle(veh.id, 'km', e.target.value)} />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Number of Passengers Allowed</label>
                        <input type="number" placeholder="e.g. 4" className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-3 py-2.5 text-sm font-medium" value={veh.passenger} onChange={(e) => updateVehicle(veh.id, 'passenger', e.target.value)} />
                      </div>
                    </div>
                  </div>
                );
              })}

              {isFleetOwner() && (
                <button onClick={addVehicle} className="w-full py-3 border-2 border-dashed border-gray-300 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center text-sm">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                  Add Another Vehicle
                </button>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Tab Bar */}
              <div className="flex bg-gray-100 p-1 rounded-xl mb-4">
                <button
                  onClick={() => setStep3Tab('docs')}
                  className={`flex-1 py-2 text-[12px] font-bold rounded-lg transition-all ${step3Tab === 'docs' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
                >
                  📋 Documents
                </button>
                <button
                  onClick={() => setStep3Tab('zone')}
                  className={`flex-1 py-2 text-[12px] font-bold rounded-lg transition-all ${step3Tab === 'zone' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
                >
                  📍 Zone
                </button>
                <button
                  onClick={() => setStep3Tab('kyc')}
                  className={`flex-1 py-2 text-[12px] font-bold rounded-lg transition-all ${step3Tab === 'kyc' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
                >
                  🏦 KYC & Bank
                </button>
              </div>

              {/* Documents Tab */}
              {step3Tab === 'docs' && (
                <div className="animate-in fade-in duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-bold text-gray-800">Required Documents</h2>
                    <span className="text-[10px] font-bold px-2 py-1 bg-green-100 text-green-700 rounded-full">Secure Upload</span>
                  </div>
                  <div className="space-y-3">
                    {adminDocs
                      .filter(doc => businessRequiresVehicle() || doc.is_required === 'yes' || !['Driving License', 'Vehicle Registration', 'Vehicle Insurance', 'Vehicle Image'].includes(doc.title))
                      .map(doc => {
                        const file = documents[`doc_${doc.id}`];
                        return (
                          <div key={doc.id} className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between group hover:border-gray-300 transition-colors">
                            <div className="flex-1 pr-3">
                              <p className="font-semibold text-gray-800 text-[13px] mb-0.5">{doc.title}</p>
                              <p className={`text-[10px] font-medium ${file ? 'text-green-600' : 'text-red-500'}`}>
                                {file ? '✓ ' + file.name : doc.is_required === 'yes' ? 'Required' : 'Optional'}
                              </p>
                            </div>
                            <div>
                              <label className="cursor-pointer bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold text-[11px] px-3 py-2 rounded-lg transition-colors inline-block border border-gray-200 shadow-sm">
                                {file ? 'Change' : 'Upload'}
                                <input type="file" className="hidden" accept="image/*,.pdf" onChange={(e) => handleFileChange(doc.id, e.target.files?.[0] || null)} />
                              </label>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                  <button
                    onClick={() => setStep3Tab('zone')}
                    className="w-full mt-5 py-3 bg-green-600 text-white font-bold rounded-xl text-sm hover:bg-green-700 transition-colors"
                  >
                    Next: Select Zone →
                  </button>
                </div>
              )}

              {/* Zone Tab */}
              {step3Tab === 'zone' && (
                <div className="animate-in fade-in duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-bold text-gray-800">Operational Zone</h2>
                    <span className="text-[10px] font-bold px-2 py-1 bg-amber-100 text-amber-700 rounded-full">Required for Assignment</span>
                  </div>
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Select your working zone</label>
                    <select
                      value={zoneId}
                      onChange={e => setZoneId(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-600 focus:outline-none"
                    >
                      <option value="" disabled>Select a zone</option>
                      {zonesData.map((zone: any) => (
                        <option key={zone.id} value={zone.id}>{zone.name}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => setStep3Tab('kyc')}
                    className="w-full mt-5 py-3 bg-green-600 text-white font-bold rounded-xl text-sm hover:bg-green-700 transition-colors"
                  >
                    Next: KYC & Bank Details →
                  </button>
                </div>
              )}

              {/* KYC & Bank Details Tab */}
              {step3Tab === 'kyc' && (
                <div className="animate-in fade-in duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-bold text-gray-800">KYC & Bank Details</h2>
                    <span className="text-[10px] font-bold px-2 py-1 bg-amber-100 text-amber-700 rounded-full">Required for Payouts</span>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5">🔒</span>
                    <p className="text-[11px] text-amber-700 font-medium">Your bank details are securely stored and used only for salary and commission payouts.</p>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Bank Name</label>
                      <input
                        type="text"
                        value={bankName}
                        onChange={e => setBankName(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-600 focus:outline-none"
                        placeholder="e.g. State Bank of India"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Account Number</label>
                      <input
                        type="text"
                        value={accountNo}
                        onChange={e => setAccountNo(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-600 focus:outline-none"
                        placeholder="Enter Account Number"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">IFSC Code</label>
                      <input
                        type="text"
                        value={ifscCode}
                        onChange={e => setIfscCode(e.target.value.toUpperCase())}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-600 focus:outline-none"
                        placeholder="e.g. SBIN0001234"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>

        {/* Fixed Bottom Action Bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 pb-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          {step === 1 && (
            mode === 'edit_category' ? (
              <button
                onClick={businessRequiresHomeVisitPricing() ? handleNextFromStep1 : submitForm}
                disabled={!canProceedToStep2() || loading}
                className="w-full py-3.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm"
              >
                {loading ? 'Saving...' : businessRequiresHomeVisitPricing() ? 'Continue' : 'Save Category'}
              </button>
            ) : (
              <button
                onClick={handleNextFromStep1}
                disabled={!canProceedToStep2()}
                className="w-full py-3.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm"
              >
                Continue
              </button>
            )
          )}
          {step === 2 && (
            <button
              onClick={() => {
                if (mode === 'edit_category') {
                  submitForm();
                } else {
                  setStep(3);
                }
              }}
              disabled={!canProceedToStep3() || loading}
              className="w-full py-3.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              {mode === 'edit_category' ? (loading ? 'Saving...' : 'Save Category') : 'Continue'}
            </button>
          )}
          {step === 3 && (
            <button
              onClick={() => {
                if (step3Tab === 'docs') {
                  setStep3Tab('zone');
                } else if (step3Tab === 'zone') {
                  setStep3Tab('kyc');
                } else {
                  submitForm();
                }
              }}
              disabled={loading}
              className="w-full py-3.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm flex items-center justify-center"
            >
              {loading ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : step3Tab === 'docs' ? 'Next: Select Zone →' : step3Tab === 'zone' ? 'Next: KYC & Bank Details →' : 'Submit Application'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center text-slate-400 font-medium">Loading Setup...</div>}>
      <OnboardingForm />
    </Suspense>
  );
}
