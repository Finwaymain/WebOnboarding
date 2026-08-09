'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  getDefaultExpandedIds,
  getProfessionSkillHeading,
  isHealthcareProfession,
  isPackagePricingProfession,
  PACKAGE_GROUP_LABELS,
  resolveNodeIcon,
  resolveSkillCatalogForProfession,
} from '@/lib/skillCatalog';
import { HOME_SERVICE_GROUPS, HomeServiceGroup } from '@/lib/homeServiceGroups';
import { ProfessionCard, ServiceGroupCard } from '@/components/ProfessionCard';
import { OnboardingErrorBoundary } from '@/components/OnboardingErrorBoundary';

function readUrlParams() {
  if (typeof window === 'undefined') {
    return { driverId: null as string | null, accesstoken: null as string | null, mode: null as string | null };
  }

  const params = new URLSearchParams(window.location.search);
  return {
    driverId: params.get('driver_id'),
    accesstoken: params.get('accesstoken'),
    mode: params.get('mode'),
  };
}

function OnboardingForm() {
  const [urlParams, setUrlParams] = useState(() => readUrlParams());

  useEffect(() => {
    setUrlParams(readUrlParams());
  }, []);

  const driverId = urlParams.driverId;
  const accesstoken = urlParams.accesstoken;
  const mode = urlParams.mode;

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
  const [homeServiceCatalog, setHomeServiceCatalog] = useState<any[]>([]);
  const [selectedSkillIds, setSelectedSkillIds] = useState<number[]>([]);
  const [expandedSkillGroups, setExpandedSkillGroups] = useState<Record<number, boolean>>({});
  const [homeServiceGroups, setHomeServiceGroups] = useState<HomeServiceGroup[]>(HOME_SERVICE_GROUPS);
  const [selectedHomeGroup, setSelectedHomeGroup] = useState<HomeServiceGroup | null>(null);
  const [professionSearch, setProfessionSearch] = useState('');

  // UI State
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [deliveryVehicleRole, setDeliveryVehicleRole] = useState<any>(null);
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({});
  const [step3Tab, setStep3Tab] = useState<'docs' | 'zone' | 'kyc'>('docs');
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
          setHomeServiceCatalog(result.data.home_service_catalog || []);
          if (Array.isArray(result.data.home_service_groups) && result.data.home_service_groups.length > 0) {
            setHomeServiceGroups(result.data.home_service_groups);
          }
          setSelectedSkillIds(result.data.selected_skills || []);

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

  const isHomeServicesCategory = (category: any = primaryCategory) => {
    const label = (category?.libelle || '').toLowerCase();
    return label.includes('home services');
  };

  const isHealthcareBusinessType = () => isHealthcareProfession(businessType?.libelle || '');

  const isPackagePricingFlow = () => isPackagePricingProfession(businessType?.libelle || '');

  const skillCatalogForDisplay = useMemo(
    () => resolveSkillCatalogForProfession(homeServiceCatalog, businessType?.libelle || ''),
    [homeServiceCatalog, businessType?.id, businessType?.libelle]
  );

  const skillSectionHeading = useMemo(
    () => getProfessionSkillHeading(businessType?.libelle || ''),
    [businessType?.libelle]
  );

  const findSkillNodeById = (nodes: any[], targetId: number): any | null => {
    for (const node of nodes) {
      if (node.id === targetId) return node;
      if (node.children?.length) {
        const found = findSkillNodeById(node.children, targetId);
        if (found) return found;
      }
    }
    return null;
  };

  const findSkillPathLabels = (nodes: any[], targetId: number, trail: string[] = []): string[] | null => {
    for (const node of nodes) {
      const nextTrail = [...trail, node.libelle];
      if (node.id === targetId) return nextTrail;
      if (node.children?.length) {
        const found = findSkillPathLabels(node.children, targetId, nextTrail);
        if (found) return found;
      }
    }
    return null;
  };

  const prefillPackageRowsFromSkills = () => {
    const packageNames: string[] = [];
    selectedSkillIds.forEach((skillId) => {
      const path = findSkillPathLabels(homeServiceCatalog, skillId) || [];
      const isPackageLeaf = PACKAGE_GROUP_LABELS.some((group) => path.includes(group));
      if (!isPackageLeaf) return;
      const node = findSkillNodeById(homeServiceCatalog, skillId);
      if (node?.libelle) packageNames.push(node.libelle);
    });

    if (packageNames.length === 0) return;

    setAdditionalServices((prev) => {
      const existing = new Set(prev.map((item) => item.name.trim().toLowerCase()));
      const rows = [...prev];
      packageNames.forEach((name, index) => {
        if (existing.has(name.trim().toLowerCase())) return;
        rows.push({ id: Date.now() + index, name, price: '' });
      });
      return rows;
    });
  };

  useEffect(() => {
    if (!businessType || skillCatalogForDisplay.length === 0) return;
    setExpandedSkillGroups((prev) => ({
      ...prev,
      ...getDefaultExpandedIds(skillCatalogForDisplay),
    }));
  }, [businessType?.id, skillCatalogForDisplay]);

  const isLeafSkillNode = (node: any) => !node?.has_children && (!node?.children || node.children.length === 0);

  const toggleSkillSelection = (skillId: number) => {
    setSelectedSkillIds((prev) =>
      prev.includes(skillId) ? prev.filter((id) => id !== skillId) : [...prev, skillId]
    );
  };

  const toggleSkillGroup = (groupId: number) => {
    setExpandedSkillGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const renderSkillNodes = (nodes: any[], depth = 0) => {
    return nodes.map((node) => {
      const hasChildren = node.children && node.children.length > 0;
      const isLeaf = isLeafSkillNode(node);
      const isSelected = selectedSkillIds.includes(node.id);

      if (hasChildren) {
        const expanded = expandedSkillGroups[node.id] ?? depth === 0;
        return (
          <div key={node.id} className="mb-2">
            <button
              type="button"
              onClick={() => toggleSkillGroup(node.id)}
              className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-left gap-2"
            >
              <span className="flex items-center gap-2 min-w-0">
                <span className="text-base shrink-0" aria-hidden>{resolveNodeIcon(node)}</span>
                <span className="text-sm font-semibold text-gray-800 truncate">{node.libelle}</span>
              </span>
              <svg className={`w-4 h-4 text-gray-500 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>
            {expanded && (
              <div className={`mt-2 space-y-2 ${depth === 0 ? 'pl-2' : 'pl-3 border-l border-gray-100 ml-2'}`}>
                {renderSkillNodes(node.children, depth + 1)}
              </div>
            )}
          </div>
        );
      }

      if (!isLeaf) return null;

      return (
        <label
          key={node.id}
          className={`flex items-center gap-3 px-3 py-3 rounded-xl border cursor-pointer transition-colors ${isSelected ? 'bg-emerald-50 border-emerald-500' : 'bg-white border-slate-200 hover:border-slate-300'}`}
        >
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => toggleSkillSelection(node.id)}
            className="w-5 h-5 accent-emerald-600 shrink-0"
          />
          <span className="text-sm font-medium text-slate-800 flex-1 leading-snug">{node.libelle}</span>
        </label>
      );
    });
  };

  const homeServiceProfessions = useMemo(() => {
    if (!primaryCategory?.subcategories?.length) return [];
    if (!selectedHomeGroup) return [];

    const allowed = new Set(selectedHomeGroup.professions);
    const query = professionSearch.trim().toLowerCase();

    return primaryCategory.subcategories.filter((sub: any) => {
      if (!allowed.has(sub.libelle)) return false;
      if (!query) return true;
      return (sub.libelle || '').toLowerCase().includes(query);
    });
  }, [primaryCategory, selectedHomeGroup, professionSearch]);

  // Validation
  const canProceedToStep2 = () => {
    if (!primaryCategory || !businessType) return false;
    if (isHomeServicesCategory() && selectedSkillIds.length === 0) return false;
    if (primaryCategory?.libelle && ['Delivery', 'Logistics'].some(t => primaryCategory.libelle.includes(t)) && !deliveryVehicleRole) return false;
    if (providesDelivery && secondaryTypes.length === 0) return false;
    return true;
  };

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
    return isHomeServicesCategory() || businessType.requires_home_visit === true;
  };

  const step2IsPricing = () => businessRequiresHomeVisitPricing();

  const isFleetOwner = () => {
    return businessType?.libelle === 'Fleet Owner';
  };

  const canProceedToStep3 = () => {
    if (businessRequiresHomeVisitPricing()) {
      if (isPackagePricingFlow()) {
        return additionalServices.every((service) => {
          if (!service.name.trim() && !service.price.trim()) return true;
          const price = parseFloat(service.price);
          return service.name.trim() !== '' && (service.price.trim() === '' || (!isNaN(price) && price >= 0));
        });
      }

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
      if (businessRequiresHomeVisitPricing() && isPackagePricingFlow()) {
        prefillPackageRowsFromSkills();
      }
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
    if (businessType?.libelle) {
      data.append("business_subcategory_label", businessType.libelle);
    }
    if (mode) data.append("mode", mode);

    if (secondaryTypes.length > 0) {
      data.append("secondary_types", JSON.stringify(secondaryTypes));
    }

    if (businessRequiresVehicle()) {
      data.append("vehicles", JSON.stringify(vehicles));
    }

    if (businessRequiresHomeVisitPricing()) {
      if (!isPackagePricingFlow() || visitingCharge.trim() !== '') {
        data.append("visiting_charge", visitingCharge);
      }
      const serviceItems = additionalServices
        .filter((item) => item.name.trim())
        .map((item) => ({
          name: item.name.trim(),
          price: item.price.trim(),
        }));
      data.append("service_items", JSON.stringify(serviceItems));
      data.append("selected_skills", JSON.stringify(selectedSkillIds));
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
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <p className="text-red-600 font-semibold mb-2">{initError}</p>
        <p className="text-sm text-slate-500">Close onboarding and open it again from the driver app.</p>
      </div>
    );
  }

  if (!categoriesData.length) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <p className="text-slate-800 font-semibold mb-2">No service categories available</p>
        <p className="text-sm text-slate-500">Please try again in a few minutes or contact support.</p>
      </div>
    );
  }

  // Allowed Delivery Types for this business
  const allowedDeliveryTypes = businessType
    ? (transportDeliveryMap[businessType.libelle] || []).filter((type: string) => {
        if (businessType.libelle === 'Cab Driver' || businessType.libelle?.toLowerCase().includes('cab')) {
          return !type.toLowerCase().includes('logistic');
        }
        return true;
      })
    : [];

  return (
    <div className="bg-slate-100 min-h-screen antialiased text-slate-800">
      <style dangerouslySetInnerHTML={{
        __html: `
        html, body { height: auto; min-height: 100%; overflow-x: hidden; overflow-y: auto; -webkit-overflow-scrolling: touch; }
        .onboarding-shell { width: 100%; min-height: 100vh; min-height: 100dvh; display: flex; flex-direction: column; background: #f8fafc; }
        .onboarding-header { position: sticky; top: 0; z-index: 20; backdrop-filter: blur(10px); background: rgba(255,255,255,0.95); }
        .onboarding-main { flex: 1; padding: 1rem 1rem 6.5rem; }
        .onboarding-footer { position: fixed; left: 0; right: 0; bottom: 0; z-index: 30; padding: 0.75rem 1rem calc(0.75rem + env(safe-area-inset-bottom)); background: rgba(255,255,255,0.96); border-top: 1px solid #e2e8f0; backdrop-filter: blur(8px); }
        @media (min-width: 640px) {
          .onboarding-shell { max-width: 420px; margin: 0 auto; border-left: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; box-shadow: 0 10px 40px rgba(15,23,42,0.08); }
          .onboarding-footer { max-width: 420px; left: 50%; transform: translateX(-50%); }
        }
      `}} />
      <div className="onboarding-shell">
        <header className="onboarding-header px-4 pt-10 pb-4 border-b border-slate-100">
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

        <main className="onboarding-main space-y-5">
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
                  <div className="mt-2 bg-white border border-slate-100 rounded-2xl shadow-lg overflow-hidden">
                    <div className="divide-y divide-slate-50">
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
                            setSelectedSkillIds([]);
                            setExpandedSkillGroups({});
                            setSelectedHomeGroup(null);
                            setProfessionSearch('');
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
                      {isHomeServicesCategory() ? '🧹' : ['Transport & Mobility', 'Delivery & Logistics'].some((n) => primaryCategory.libelle.includes(n)) ? '🚘' : '💼'}
                    </span>
                    <h2 className="text-sm font-bold text-green-600 tracking-wide">
                      {isHomeServicesCategory()
                        ? selectedHomeGroup
                          ? `${selectedHomeGroup.emoji} ${selectedHomeGroup.group}`
                          : 'Choose Service Group'
                        : ['Transport & Mobility', 'Delivery & Logistics'].some((n) => primaryCategory.libelle.includes(n))
                          ? 'Select Vehicle'
                          : 'Select Your Service'}
                    </h2>
                  </div>

                  {isHomeServicesCategory() && !selectedHomeGroup && (
                    <>
                      <p className="text-xs text-slate-500 mb-3 px-1">
                        Pick your service area, then choose your exact profession.
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        {homeServiceGroups.map((group) => (
                          <ServiceGroupCard
                            key={group.group}
                            emoji={group.emoji}
                            title={group.group}
                            count={group.professions.length}
                            onClick={() => {
                              setSelectedHomeGroup(group);
                              setBusinessType(null);
                              setSelectedSkillIds([]);
                              setProfessionSearch('');
                            }}
                          />
                        ))}
                      </div>
                    </>
                  )}

                  {isHomeServicesCategory() && selectedHomeGroup && (
                    <>
                      <div className="flex items-center gap-2 mb-3 px-1">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedHomeGroup(null);
                            setBusinessType(null);
                            setSelectedSkillIds([]);
                            setProfessionSearch('');
                          }}
                          className="text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5"
                        >
                          ← All groups
                        </button>
                        <input
                          type="search"
                          value={professionSearch}
                          onChange={(e) => setProfessionSearch(e.target.value)}
                          placeholder="Search profession..."
                          className="flex-1 text-sm border border-slate-200 rounded-xl px-3 py-2.5 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {homeServiceProfessions.map((sub: any) => (
                          <ProfessionCard
                            key={sub.id}
                            label={sub.libelle}
                            image={sub.image}
                            groupEmoji={selectedHomeGroup?.emoji}
                            selected={businessType?.id === sub.id}
                            onClick={() => {
                              setBusinessType(sub);
                              setProvidesDelivery(false);
                              setSecondaryTypes([]);
                              setDeliveryVehicleRole(null);
                              setSelectedSkillIds([]);
                            }}
                          />
                        ))}
                      </div>
                      {homeServiceProfessions.length === 0 && (
                        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3 mt-2">
                          No professions loaded for this group yet. Ask admin to run:{' '}
                          <span className="font-mono">php artisan db:seed --class=HomeServicesProfessionSeeder</span>
                        </p>
                      )}
                    </>
                  )}

                  {!isHomeServicesCategory() && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {(primaryCategory.subcategories || []).map((sub: any) => (
                      <ProfessionCard
                        key={sub.id}
                        label={sub.libelle}
                        image={sub.image}
                        selected={businessType?.id === sub.id}
                        onClick={() => {
                          setBusinessType(sub);
                          setProvidesDelivery(false);
                          setSecondaryTypes([]);
                          setDeliveryVehicleRole(null);
                          setSelectedSkillIds([]);
                        }}
                      />
                    ))}
                  </div>
                  )}
                </section>
              )}

              {isHomeServicesCategory() && businessType && skillCatalogForDisplay.length === 0 && (
                <section className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-semibold text-amber-800">Skills catalog not available</p>
                  <p className="text-xs text-amber-700 mt-1">
                    Ask your admin to run database seeders on the server, then reopen onboarding.
                  </p>
                </section>
              )}

              {isHomeServicesCategory() && businessType && skillCatalogForDisplay.length > 0 && (
                <section className="mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center justify-between mb-3 px-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-green-600 text-xl">{isHealthcareBusinessType() ? '🏥' : '🛠️'}</span>
                      <h2 className="text-sm font-bold text-green-600 tracking-wide">
                        {skillSectionHeading.title}
                      </h2>
                    </div>
                    <span className="text-[11px] font-semibold text-gray-500">{selectedSkillIds.length} selected</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-3 px-1">
                    {skillSectionHeading.hint}
                  </p>
                  <div className="space-y-2">
                    {renderSkillNodes(skillCatalogForDisplay)}
                  </div>
                  {selectedSkillIds.length === 0 && (
                    <p className="text-xs text-amber-600 mt-3 px-1 font-medium">Select at least one skill to continue.</p>
                  )}
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
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {(categoriesData.find(c => c.libelle.includes('Transport'))?.subcategories || [])
                      .filter((sub: any) => !sub.libelle.toLowerCase().includes('cab'))
                      .map((sub: any) => (
                        <ProfessionCard
                          key={sub.id}
                          label={sub.libelle}
                          image={sub.image}
                          selected={deliveryVehicleRole?.id === sub.id}
                          onClick={() => setDeliveryVehicleRole(sub)}
                        />
                      ))}
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
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {allowedDeliveryTypes.map((delType: string) => (
                      <ProfessionCard
                        key={delType}
                        label={delType}
                        image={categoryImageMap[delType]}
                        selected={secondaryTypes.includes(delType)}
                        onClick={() => {
                          if (secondaryTypes.includes(delType)) {
                            setSecondaryTypes(secondaryTypes.filter((t) => t !== delType));
                          } else {
                            setSecondaryTypes([...secondaryTypes, delType]);
                          }
                        }}
                      />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}

          {step === 2 && step2IsPricing() && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                <h2 className="text-sm font-bold text-green-700 mb-1">
                  {isPackagePricingFlow() ? 'Healthcare Booking Packages' : 'Home Visit Service Pricing'}
                </h2>
                <p className="text-xs text-green-600 leading-relaxed">
                  {isPackagePricingFlow()
                    ? 'Add optional prices for nursing/healthcare packages. Prices are not compulsory — leave blank to discuss with customer.'
                    : 'Set your fixed visiting charge and add optional service prices customers can book (e.g. AC repair, AC installation).'}
                </p>
              </div>

              {!isPackagePricingFlow() && (
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
              )}

              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-gray-800">
                      {isPackagePricingFlow() ? 'Booking Packages (Optional Prices)' : 'Additional Services'}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {isPackagePricingFlow()
                        ? 'e.g. One-Time Nurse Visit, Full-Day Nursing Care, Weekly Package'
                        : 'Add custom services with your own prices'}
                    </p>
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
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {availableTypes.map((t: any) => (
                            <ProfessionCard
                              key={t.id}
                              label={t.name}
                              image={t.image}
                              selected={veh.type_id == t.id}
                              onClick={() => updateVehicle(veh.id, 'type_id', t.id.toString())}
                            />
                          ))}
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
        <div className="onboarding-footer">
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
    <OnboardingErrorBoundary>
      <OnboardingForm />
    </OnboardingErrorBoundary>
  );
}
