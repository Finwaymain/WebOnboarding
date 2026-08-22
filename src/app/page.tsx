'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  collectLeafSkillNodes,
  formatAdminCommission,
  getDefaultExpandedIds,
  getProfessionSkillHeading,
  isHealthcareProfession,
  isPackagePricingProfession,
  isParentGroupPricingProfession,
  normalizeLabel,
  PACKAGE_GROUP_LABELS,
  resolveNodeIcon,
  resolveSkillCatalogForProfession,
  usesInlineSkillPricing,
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

function resolveEditMode(search?: string) {
  if (typeof window === 'undefined' && !search) return false;
  const params = new URLSearchParams(search ?? window.location.search);
  const mode = params.get('mode');
  return mode === 'edit_profile' || mode === 'edit_category' || params.get('edit') === '1';
}

function applyExistingSelection(
  categories: any[],
  selection: any,
  homeServiceGroups: HomeServiceGroup[],
  setters: {
    setPrimaryCategory: (value: any) => void;
    setBusinessType: (value: any) => void;
    setSelectedHomeGroup: (value: HomeServiceGroup | null) => void;
    setBankName: (value: string) => void;
    setAccountNo: (value: string) => void;
    setIfscCode: (value: string) => void;
    setZoneId: (value: string) => void;
  }
) {
  if (!selection || !categories.length) return;

  const businessId = Number(selection.business_subcategory_id || 0);
  if (!businessId) return;

  let foundParent: any = null;
  let foundBusiness: any = null;

  for (const parent of categories) {
    const directSub = parent.subcategories?.find((sub: any) => Number(sub.id) === businessId);
    if (directSub) {
      foundParent = parent;
      foundBusiness = directSub;
      break;
    }
    if (Number(parent.id) === businessId) {
      foundParent = parent;
      foundBusiness = parent;
      break;
    }
  }

  if (foundParent) setters.setPrimaryCategory(foundParent);
  if (foundBusiness) setters.setBusinessType(foundBusiness);

  const businessLabel = normalizeLabel(selection.business_subcategory_label || foundBusiness?.libelle || '');
  if (businessLabel) {
    const matchedGroup = homeServiceGroups.find((group) =>
      group.professions.some((profession) => normalizeLabel(profession) === businessLabel)
    );
    if (matchedGroup) {
      setters.setSelectedHomeGroup(matchedGroup);
    }
  }

  if (selection.bank_name) setters.setBankName(String(selection.bank_name));
  if (selection.account_no) setters.setAccountNo(String(selection.account_no));
  if (selection.ifsc_code) setters.setIfscCode(String(selection.ifsc_code));
  if (selection.zone_id) setters.setZoneId(String(selection.zone_id));
}

function OnboardingForm() {
  const [urlParams, setUrlParams] = useState(() => readUrlParams());
  const [paramsReady, setParamsReady] = useState(false);

  useEffect(() => {
    setUrlParams(readUrlParams());
    setParamsReady(true);
  }, []);

  useEffect(() => {
    const showBootError = (message: string) => {
      setInitError(message || 'Onboarding failed to load. Please reopen from the app.');
      setLoadingInit(false);
    };

    const onWindowError = (event: ErrorEvent) => {
      showBootError(event.message || 'Unexpected script error');
    };
    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      showBootError(String(event.reason || 'Unhandled promise rejection'));
    };

    window.addEventListener('error', onWindowError);
    window.addEventListener('unhandledrejection', onUnhandledRejection);

    return () => {
      window.removeEventListener('error', onWindowError);
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
    };
  }, []);

  const driverId = urlParams.driverId;
  const accesstoken = urlParams.accesstoken;
  const mode = urlParams.mode;
  const isEditCategoryMode = mode === 'edit_category';
  const isEditProfileMode = mode === 'edit_profile';
  const isEditMode = isEditCategoryMode || isEditProfileMode;
  const editModeActive = isEditMode || (paramsReady && resolveEditMode());

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
  const [skillPrices, setSkillPrices] = useState<Record<number, string>>({});
  const [adminCommission, setAdminCommission] = useState<{ value?: string | number; type?: string } | null>(null);
  const [expandedSkillGroups, setExpandedSkillGroups] = useState<Record<number, boolean>>({});
  const [homeServiceGroups, setHomeServiceGroups] = useState<HomeServiceGroup[]>(HOME_SERVICE_GROUPS);
  const [selectedHomeGroup, setSelectedHomeGroup] = useState<HomeServiceGroup | null>(null);
  const [professionSearch, setProfessionSearch] = useState('');

  // UI State
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [deliveryVehicleRole, setDeliveryVehicleRole] = useState<any>(null);
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({});
  const [step3Tab, setStep3Tab] = useState<'docs' | 'zone' | 'kyc'>('docs');
  const [hasRegisteredShop, setHasRegisteredShop] = useState<'yes' | 'no' | ''>('');
  const [serviceDeclarationAccepted, setServiceDeclarationAccepted] = useState(false);
  const [homeDocs, setHomeDocs] = useState<Record<string, File | null>>({
    selfie: null,
    aadhaar_front: null,
    aadhaar_back: null,
    shop_photo: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);

  useEffect(() => {
    if (paramsReady && resolveEditMode()) {
      setAlreadySubmitted(false);
    }
  }, [paramsReady, mode]);

  // Fetch Init Data
  useEffect(() => {
    if (!paramsReady) return;

    const fetchInitData = async () => {
      const editMode = resolveEditMode();
      const currentMode = new URLSearchParams(window.location.search).get('mode');

      try {
        const initUrl = new URL("/api/v1/driver/onboarding/init", window.location.origin);
        if (driverId) {
          initUrl.searchParams.set("driver_id", driverId);
        }
        if (currentMode) {
          initUrl.searchParams.set("mode", currentMode);
        }
        if (new URLSearchParams(window.location.search).get('edit') === '1') {
          initUrl.searchParams.set("edit", "1");
        }

        const res = await fetch(initUrl.toString(), {
          headers: {
            "accesstoken": accesstoken || "",
            "apikey": "base64:nTfofcBByTDenJQYlsRbH0JjeVFW5lWsIIyXtq8/9sU="
          }
        });
        const result = await res.json();
        if (result.success === 'success' || result.success === 'Success') {
          const canEdit = editMode || result.data.allow_edit === true;
          if (result.data.onboarding_completed) {
            if (!canEdit) {
              setAlreadySubmitted(true);
              setLoadingInit(false);
              return;
            }
            setAlreadySubmitted(false);
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
          if (result.data.admin_commission) {
            setAdminCommission(result.data.admin_commission);
          }

          if (result.data.service_pricing) {
            const pricing = result.data.service_pricing;
            setVisitingCharge(pricing.visiting_charge?.toString() || "");
            const loadedItems = (pricing.service_items || []).map((item: any, index: number) => ({
              id: Date.now() + index,
              name: item.name || "",
              price: item.price?.toString() || "",
            }));
            setAdditionalServices(loadedItems);

            const catalog = result.data.home_service_catalog || [];
            const leafNodes = collectLeafSkillNodes(catalog);

            // Helper to search ALL nodes (including parent/subfolder nodes) by label.
            // Used to restore prices for Doctor/Physio where price is on the subfolder, not leaf.
            const findAnyNodeByLabel = (nodes: any[], label: string): any | null => {
              const target = normalizeLabel(label);
              for (const node of nodes) {
                if (normalizeLabel(node.libelle) === target) return node;
                if (node.children?.length) {
                  const found = findAnyNodeByLabel(node.children, label);
                  if (found) return found;
                }
              }
              return null;
            };

            const restoredPrices: Record<number, string> = {};
            loadedItems.forEach((item: { name: string; price: string }) => {
              if (!item.price) return;
              // Try leaf nodes first (Nurse, Lab Technician, etc.)
              let node: any = leafNodes.find(
                (leaf) => normalizeLabel(leaf.libelle) === normalizeLabel(item.name)
              );
              // If not found as a leaf, search all nodes —
              // Doctor/Physio stores prices on subfolder nodes, not leaves.
              if (!node) {
                node = findAnyNodeByLabel(catalog, item.name);
              }
              if (node) {
                restoredPrices[node.id] = item.price;
              }
            });
            if (Object.keys(restoredPrices).length > 0) {
              setSkillPrices(restoredPrices);
            }
          }

          if (result.data.existing_selection) {
            applyExistingSelection(
              categories,
              result.data.existing_selection,
              Array.isArray(result.data.home_service_groups) && result.data.home_service_groups.length > 0
                ? result.data.home_service_groups
                : HOME_SERVICE_GROUPS,
              {
                setPrimaryCategory,
                setBusinessType,
                setSelectedHomeGroup,
                setBankName,
                setAccountNo,
                setIfscCode,
                setZoneId,
              }
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
  }, [paramsReady, accesstoken, driverId, mode]);

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

  const skillCatalogForDisplay = useMemo(
    () => resolveSkillCatalogForProfession(homeServiceCatalog, businessType?.libelle || ''),
    [homeServiceCatalog, businessType?.id, businessType?.libelle]
  );

  const skillSectionHeading = useMemo(
    () => getProfessionSkillHeading(businessType?.libelle || ''),
    [businessType?.libelle]
  );

  const isHealthcareBusinessType = () => isHealthcareProfession(businessType?.libelle || '');

  const isPackagePricingFlow = () => isPackagePricingProfession(businessType?.libelle || '');

  const isInlineSkillPricingFlow = () =>
    usesInlineSkillPricing(businessType?.libelle || '', skillCatalogForDisplay);

  const isParentGroupPricingFlow = () => isParentGroupPricingProfession(businessType?.libelle || '');

  const commissionLabel = formatAdminCommission(adminCommission);

  const buildServiceItemsPayload = () => {
    if (isParentGroupPricingFlow()) {
      return selectedSkillIds
        .map((skillId) => {
          const node = findSkillNodeById(skillCatalogForDisplay, skillId);
          const price = skillPrices[skillId];
          if (!node) return null;
          return { name: node.libelle, price: price?.trim() || '' };
        })
        .filter(Boolean) as { name: string; price: string }[];
    }

    if (isInlineSkillPricingFlow()) {
      return selectedSkillIds
        .map((skillId) => {
          const node = findSkillNodeById(skillCatalogForDisplay, skillId);
          const price = skillPrices[skillId];
          if (!node || !price?.trim()) return null;
          return { name: node.libelle, price: price.trim() };
        })
        .filter(Boolean) as { name: string; price: string }[];
    }

    return additionalServices
      .filter((item) => item.name.trim())
      .map((item) => ({
        name: item.name.trim(),
        price: item.price.trim(),
      }));
  };

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

  const getPriceLabelInfo = (profName?: string, grpName?: string): { label: string; placeholder: string } => {
    const p = (profName || businessType?.libelle || '').toLowerCase();
    const g = (grpName || selectedHomeGroup?.name || primaryCategory?.libelle || '').toLowerCase();
    const text = `${p} ${g}`;

    // 1. PER DAY RATE (Outdoor services construction service, Personal home assistant, Pet service)
    if (
      text.includes('outdoor') ||
      text.includes('construction') ||
      text.includes('personal home assistant') ||
      text.includes('home assistant') ||
      text.includes('pet service') ||
      text.includes('pet care') ||
      text.includes('dog walker') ||
      text.includes('mason') ||
      text.includes('welder') ||
      text.includes('gardener') ||
      text.includes('cook') ||
      text.includes('maid') ||
      text.includes('caretaker') ||
      text.includes('housekeeper')
    ) {
      return { label: 'PER DAY RATE', placeholder: 'PER DAY RATE' };
    }

    // 2. Sqft Rate (Interior and renovation, Furniture service)
    if (
      text.includes('interior') ||
      text.includes('renovation') ||
      text.includes('furniture') ||
      text.includes('flooring') ||
      text.includes('tiler') ||
      text.includes('pop') ||
      text.includes('false ceiling') ||
      text.includes('carpenter') ||
      text.includes('sofa')
    ) {
      return { label: 'Sqft Rate', placeholder: 'Sqft Rate' };
    }

    // 3. installation price (Security and safety, Smart home services)
    if (
      text.includes('security') ||
      text.includes('safety') ||
      text.includes('smart home') ||
      text.includes('cctv') ||
      text.includes('automation') ||
      text.includes('biometric') ||
      text.includes('fire safety')
    ) {
      return { label: 'installation price', placeholder: 'installation price' };
    }

    // 4. Rate Per Pice (Laundry and textile)
    if (
      text.includes('laundry') ||
      text.includes('textile') ||
      text.includes('ironing') ||
      text.includes('dry clean') ||
      text.includes('washing') ||
      text.includes('tailor') ||
      text.includes('alteration')
    ) {
      return { label: 'Rate Per Pice', placeholder: 'Rate Per Pice' };
    }

    // 5. Monthly Fees (Education Service)
    if (
      text.includes('education') ||
      text.includes('tutor') ||
      text.includes('coaching') ||
      text.includes('teacher') ||
      text.includes('tuition')
    ) {
      return { label: 'Monthly Fees', placeholder: 'Monthly Fees' };
    }

    // 6. My Fees (Health service: Nurse, Doctor, Physiotherapist - EXCLUDING lab technician & ambulance)
    if (
      !text.includes('lab') &&
      !text.includes('technician') &&
      !text.includes('ambulance') &&
      !text.includes('driver') &&
      (
        text.includes('health') ||
        text.includes('nurse') ||
        text.includes('doctor') ||
        text.includes('physiotherapist') ||
        text.includes('physio')
      )
    ) {
      return { label: 'My Fees', placeholder: 'My Fees' };
    }

    // Default: Price (No change for drivers, lab technician, ambulance, etc.)
    return { label: 'Price', placeholder: 'Price' };
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

  const isProfessionRootNode = (node: any) =>
    Boolean(businessType?.libelle && normalizeLabel(node.libelle) === normalizeLabel(businessType.libelle));

  const findParentSubfolderNode = (nodes: any[], targetId: number, currentParent: any | null = null): any | null => {
    for (const node of nodes) {
      if (node.id === targetId) {
        if (currentParent && isProfessionRootNode(currentParent)) return null;
        return currentParent;
      }
      if (node.children?.length) {
        const found = findParentSubfolderNode(node.children, targetId, node);
        if (found) return found;
      }
    }
    return null;
  };

  const toggleSkillSelection = (skillId: number) => {
    setSelectedSkillIds((prev) => {
      const isSelected = prev.includes(skillId);
      if (isSelected) {
        setSkillPrices((prices) => {
          const next = { ...prices };
          delete next[skillId];
          return next;
        });
        const node = findSkillNodeById(skillCatalogForDisplay, skillId);
        if (node && node.children?.length) {
          const childIds = collectLeafSkillNodes(node.children).map((c) => c.id);
          return prev.filter((id) => id !== skillId && !childIds.includes(id));
        }
        return prev.filter((id) => id !== skillId);
      } else {
        const next = [...prev, skillId];
        if (isParentGroupPricingFlow()) {
          const parentSubfolder = findParentSubfolderNode(skillCatalogForDisplay, skillId);
          if (parentSubfolder && !next.includes(parentSubfolder.id)) {
            next.push(parentSubfolder.id);
          }
        }
        return next;
      }
    });
  };

  const updateSkillPrice = (skillId: number, price: string) => {
    setSkillPrices((prev) => ({ ...prev, [skillId]: price }));
  };

  const toggleSkillGroup = (groupId: number) => {
    setExpandedSkillGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const renderSkillNodes = (nodes: any[], depth = 0) => {
    return nodes.map((node) => {
      const hasChildren = node.children && node.children.length > 0;
      const isLeaf = isLeafSkillNode(node);
      const isSelected = selectedSkillIds.includes(node.id);

      // Top profession root container (e.g. "Doctor Home Visit"):
      // Render its subfolders directly without a checkbox or price field on the root itself.
      if (hasChildren && isProfessionRootNode(node)) {
        return (
          <div key={node.id} className="space-y-2">
            {renderSkillNodes(node.children, depth + 1)}
          </div>
        );
      }

      // Subfolder category (e.g. "Child Doctor", "Diabetes Doctor"):
      // Shows Checkbox + Price Tag Input + Expand Arrow + Sub-skills inside
      if (isParentGroupPricingFlow() && hasChildren) {
        const expanded = expandedSkillGroups[node.id] ?? true;
        const showPriceField = isSelected;
        return (
          <div key={node.id} className="mb-3">
            <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-colors ${isSelected ? 'bg-emerald-50 border-emerald-500' : 'bg-white border-slate-200'}`}>
              <label className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleSkillSelection(node.id)}
                  className="w-5 h-5 accent-emerald-600 shrink-0"
                />
                <span className="flex items-center gap-2 min-w-0">
                  <span className="text-base shrink-0" aria-hidden>{resolveNodeIcon(node)}</span>
                  <span className="text-sm font-semibold text-slate-800 flex-1 leading-snug">{node.libelle}</span>
                </span>
              </label>
              {showPriceField && (
                <div className="w-[88px] shrink-0">
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 font-semibold">{(typeof window !== 'undefined' && (window as any).CURRENCY_SYMBOL) || '₹'}</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder={getPriceLabelInfo(node.libelle).placeholder}
                      value={skillPrices[node.id] || ''}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => updateSkillPrice(node.id, e.target.value)}
                      className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg pl-5 pr-2 py-2 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={() => toggleSkillGroup(node.id)}
                className="p-1 shrink-0 text-slate-500 hover:text-slate-700"
                aria-label="toggle"
              >
                <svg className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </button>
            </div>
            {expanded && (
              <div className="mt-1.5 ml-4 pl-3 border-l-2 border-slate-100 space-y-1.5">
                {renderSkillNodes(node.children, depth + 1)}
              </div>
            )}
          </div>
        );
      }

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
                <span className="text-sm font-semibold text-gray-800">{node.libelle}</span>
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

      // In parent-group pricing mode, leaf skills are checkable but have NO individual price input
      const showPriceField = !isParentGroupPricingFlow() && isInlineSkillPricingFlow() && isSelected;

      return (
        <div
          key={node.id}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-colors ${isSelected ? 'bg-emerald-50 border-emerald-500' : 'bg-white border-slate-200'}`}
        >
          <label className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => toggleSkillSelection(node.id)}
              className="w-4 h-4 accent-emerald-600 shrink-0"
            />
            <span className="text-xs font-medium text-slate-800 flex-1 leading-snug">{node.libelle}</span>
          </label>
          {showPriceField && (
            <div className="w-[88px] shrink-0">
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 font-semibold">{(typeof window !== 'undefined' && (window as any).CURRENCY_SYMBOL) || '₹'}</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder={getPriceLabelInfo(node.libelle).placeholder}
                  value={skillPrices[node.id] || ''}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => updateSkillPrice(node.id, e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg pl-5 pr-2 py-1.5 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>
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
    if (isParentGroupPricingFlow()) {
      const selectedSubfolders = selectedSkillIds
        .map((id) => findSkillNodeById(skillCatalogForDisplay, id))
        .filter((node) => node && node.children?.length > 0 && !isProfessionRootNode(node));

      const allSubfoldersPriced = selectedSubfolders.every((node) => {
        const price = parseFloat(skillPrices[node.id] || '');
        return !isNaN(price) && price >= 0 && skillPrices[node.id]?.trim() !== '';
      });
      if (!allSubfoldersPriced) return false;
    } else if (isInlineSkillPricingFlow()) {
      const allPriced = selectedSkillIds.every((skillId) => {
        const price = parseFloat(skillPrices[skillId] || '');
        return !isNaN(price) && price >= 0 && skillPrices[skillId]?.trim() !== '';
      });
      if (!allPriced) return false;
    }
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

  const isTransportOrDeliveryCategory = () => {
    return !isHomeServicesCategory();
  };

  // Deduplicate adminDocs by normalized title so each document type (e.g. Aadhaar) is requested only once and shop photos are excluded for Transport & Delivery
  const uniqueAdminDocs = useMemo(() => {
    const seen = new Set<string>();
    return adminDocs
      .map((doc) => {
        if (!doc || !doc.title) return null;
        const titleLower = doc.title.toLowerCase().trim();
        if (titleLower.includes('aadhaar') || titleLower.includes('aadhar')) {
          return { ...doc, title: 'Aadhaar Card' };
        }
        return doc;
      })
      .filter((doc): doc is any => {
        if (!doc || !doc.title) return false;
        const rawTitle = doc.title.toLowerCase().trim();

        // Exclude Shop/Store photos for Transport & Delivery
        if (rawTitle.includes('shop') || rawTitle.includes('store')) {
          return false;
        }

        // Exclude Bank Passbook/Cheque (handled in KYC tab)
        if (rawTitle.includes('bank') || rawTitle.includes('passbook') || rawTitle.includes('cheque')) {
          return false;
        }

        let key = rawTitle
          .replace(/licence/g, 'license')
          .replace(/aadhar/g, 'aadhaar');

        if (key.includes('aadhaar')) {
          key = 'aadhaar';
        }

        if (seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      });
  }, [adminDocs]);

  const handleHomeDocChange = (key: string, file: File | null) => {
    if (file) {
      setHomeDocs((prev) => ({ ...prev, [key]: file }));
    }
  };

  const canProceedFromDocsTab = () => {
    if (isEditMode) return true;
    if (isTransportOrDeliveryCategory()) return true;
    if (!homeDocs.selfie || !homeDocs.aadhaar_front || !homeDocs.aadhaar_back) return false;
    if (!hasRegisteredShop) return false;
    if (hasRegisteredShop === 'yes' && !homeDocs.shop_photo) return false;
    if (hasRegisteredShop === 'no' && !serviceDeclarationAccepted) return false;
    return true;
  };

  const renderUploadCard = (
    label: string,
    hint: string,
    file: File | null,
    onChange: (file: File | null) => void,
    required = true,
    capture?: 'user' | 'environment',
  ) => (
    <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between group hover:border-green-200 transition-colors">
      <div className="flex-1 pr-3">
        <p className="font-semibold text-gray-800 text-[13px] mb-0.5">{label}</p>
        <p className={`text-[10px] font-medium ${file ? 'text-green-600' : required ? 'text-red-500' : 'text-gray-400'}`}>
          {file ? `✓ ${file.name}` : required ? 'Required' : 'Optional'}
        </p>
        {hint ? <p className="text-[10px] text-gray-400 mt-1">{hint}</p> : null}
      </div>
      <label className="cursor-pointer bg-gray-50 hover:bg-green-50 text-gray-700 font-semibold text-[11px] px-3 py-2 rounded-lg transition-colors inline-block border border-gray-200 shadow-sm">
        {file ? 'Change' : 'Upload'}
        <input
          type="file"
          className="hidden"
          accept="image/*"
          {...(capture ? { capture } : {})}
          onChange={(e) => onChange(e.target.files?.[0] || null)}
        />
      </label>
    </div>
  );

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

      if (isInlineSkillPricingFlow()) {
        const charge = parseFloat(visitingCharge);
        return !isNaN(charge) && charge >= 0;
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

  const closeOnboarding = () => {
    try {
      // @ts-ignore
      if (window.AppBridge) window.AppBridge.postMessage('close');
      window.history.back();
    } catch (e) { /* ignore */ }
  };

  const handleBackNavigation = () => {
    if (step === 3) {
      if (step3Tab === 'kyc') {
        setStep3Tab('zone');
        return;
      }
      if (step3Tab === 'zone') {
        setStep3Tab('docs');
        return;
      }
      setStep3Tab('docs');
      if (businessRequiresVehicle() || businessRequiresHomeVisitPricing()) {
        setStep(2);
      } else {
        setStep(1);
      }
      return;
    }

    if (step === 2) {
      setStep(1);
      return;
    }

    if (isEditMode && step === 1) {
      if (isCategoryOpen) {
        setIsCategoryOpen(false);
        return;
      }
      if (professionSearch.trim()) {
        setProfessionSearch('');
        return;
      }
      if (isHomeServicesCategory() && selectedHomeGroup && !businessType) {
        setSelectedHomeGroup(null);
        return;
      }
      closeOnboarding();
      return;
    }

    if (isCategoryOpen) {
      setIsCategoryOpen(false);
      return;
    }

    if (businessType) {
      setBusinessType(null);
      setSelectedSkillIds([]);
      setSkillPrices({});
      setProvidesDelivery(false);
      setSecondaryTypes([]);
      setDeliveryVehicleRole(null);
      return;
    }

    if (isHomeServicesCategory() && selectedHomeGroup) {
      setSelectedHomeGroup(null);
      setProfessionSearch('');
      return;
    }

    if (primaryCategory) {
      setPrimaryCategory(null);
      setBusinessType(null);
      setSelectedHomeGroup(null);
      setSelectedSkillIds([]);
      setSkillPrices({});
      setProvidesDelivery(false);
      setSecondaryTypes([]);
      setDeliveryVehicleRole(null);
      setExpandedSkillGroups({});
      setProfessionSearch('');
      return;
    }

    closeOnboarding();
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

    if (bankName || accountNo || ifscCode) {
      const cleanBank = bankName.trim();
      const cleanAcc = accountNo.trim();
      const cleanIfsc = ifscCode.trim().toUpperCase();

      if (!/^[a-zA-Z\s]+$/.test(cleanBank)) {
        setError("Bank name must contain only letters and spaces (no numbers or special characters).");
        return;
      }
      if (!/^[0-9]{8,22}$/.test(cleanAcc)) {
        setError("Account number must contain only numeric digits (9 to 18 digits).");
        return;
      }
      if (!/^[A-Z0-9]{11}$/.test(cleanIfsc)) {
        setError("IFSC code must be 11 alphanumeric characters (e.g. SBIN0001234).");
        return;
      }
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
      const serviceItems = buildServiceItemsPayload();
      data.append("service_items", JSON.stringify(serviceItems));
      data.append("selected_skills", JSON.stringify(selectedSkillIds));
    }

    Object.entries(documents).forEach(([key, file]) => {
      if (file) {
        data.append(key, file);
      }
    });

    if (!isTransportOrDeliveryCategory()) {
      data.append('has_registered_shop', hasRegisteredShop);
      data.append('service_declaration_accepted', hasRegisteredShop === 'no' && serviceDeclarationAccepted ? '1' : '0');
      if (homeDocs.selfie) data.append('home_selfie', homeDocs.selfie);
      if (homeDocs.aadhaar_front) data.append('home_aadhaar_front', homeDocs.aadhaar_front);
      if (homeDocs.aadhaar_back) data.append('home_aadhaar_back', homeDocs.aadhaar_back);
      if (homeDocs.shop_photo) data.append('home_shop_photo', homeDocs.shop_photo);
    }

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
          <h2 className="text-2xl font-bold text-slate-800 mb-3">
            {isEditMode ? 'Profile Updated!' : 'Onboarding Complete!'}
          </h2>
          <p className="text-slate-500 mb-6 leading-relaxed">
            {isEditMode
              ? 'Your profile and services have been saved successfully.'
              : 'Your details have been successfully submitted. Our team will verify your profile within 24-48 hours.'}
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

  if (alreadySubmitted && !editModeActive) {
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

  if (!paramsReady || loadingInit) {
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
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
        html, body { height: 100%; margin: 0; overflow: hidden; }
        .onboarding-page {
          height: 100vh;
          height: 100dvh;
          width: 100%;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: #f8fafc;
        }
        .onboarding-scroll {
          flex: 1;
          min-height: 0;
          overflow-x: hidden;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          overscroll-behavior-y: contain;
        }
        .onboarding-header {
          background: #fff;
          border-bottom: 1px solid #e2e8f0;
        }
        .onboarding-main {
          padding: 0.75rem 1rem 2rem;
        }
        .onboarding-footer {
          flex-shrink: 0;
          background: #fff;
          border-top: 1px solid #e2e8f0;
          box-shadow: 0 -4px 16px rgba(15, 23, 42, 0.06);
          padding: 0.75rem 1rem calc(0.75rem + env(safe-area-inset-bottom, 0px));
        }
      `}} />
      <div className="onboarding-page antialiased text-slate-800">
      <div className="onboarding-scroll">
        <header className="onboarding-header px-4 pt-5 pb-3 border-b border-slate-100">
          <div className="w-full flex items-center relative mb-2">
            <button
              onClick={handleBackNavigation}
              className="p-2 -ml-2 text-gray-800 hover:bg-gray-100 rounded-full transition-colors absolute left-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
            </button>
            <div className="w-full text-center flex-1">
              <h1 className="text-xl font-bold text-gray-900 leading-tight tracking-tight">
                {isEditProfileMode
                  ? 'Edit Profile & Services'
                  : isEditCategoryMode
                    ? 'Edit Categories'
                    : step === 1
                      ? 'Choose Services'
                      : step === 2
                        ? (step2IsPricing() ? 'Service Pricing' : 'Profession Info')
                        : 'Upload Docs'}
              </h1>
            </div>
          </div>
          {step === 1 && <p className="text-xs text-gray-500 font-medium">Select the services you want to work on</p>}

          {/* Stepper */}
          {mode !== 'edit_category' && (
          <div className="w-full px-4 mt-4 flex justify-between items-start relative">
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
                            setSkillPrices({});
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
                              setSkillPrices({});
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
                            setSkillPrices({});
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
                      <div className="grid grid-cols-2 gap-3">
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
                              setSkillPrices({});
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
                  <div className="grid grid-cols-2 gap-3">
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
                          setSkillPrices({});
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
                  {commissionLabel && (
                    <div className="mb-3 mx-1 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
                      <p className="text-[11px] text-amber-900 leading-relaxed">
                        <span className="font-bold">Admin commission:</span> {commissionLabel} will be deducted from each completed service booking.
                      </p>
                    </div>
                  )}
                  {isInlineSkillPricingFlow() && (
                    <div className="flex items-center justify-end gap-2 mb-2 px-1">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">{getPriceLabelInfo().label}</span>
                    </div>
                  )}
                  <div className="space-y-2">
                    {renderSkillNodes(skillCatalogForDisplay)}
                  </div>
                  {selectedSkillIds.length === 0 && (
                    <p className="text-xs text-amber-600 mt-3 px-1 font-medium">Select at least one skill to continue.</p>
                  )}
                  {isInlineSkillPricingFlow() && selectedSkillIds.length > 0 && !canProceedToStep2() && (
                    <p className="text-xs text-amber-600 mt-3 px-1 font-medium">Add a price for every selected service to continue.</p>
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
                  <div className="grid grid-cols-2 gap-3">
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
                  <div className="grid grid-cols-2 gap-3">
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
              {commissionLabel && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <p className="text-xs text-amber-900 leading-relaxed">
                    <span className="font-bold">Admin commission:</span> {commissionLabel} will be deducted from each completed service booking.
                  </p>
                </div>
              )}
              <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                <h2 className="text-sm font-bold text-green-700 mb-1">
                  {isPackagePricingFlow()
                    ? 'Healthcare Booking Packages'
                    : isInlineSkillPricingFlow()
                      ? 'Home Visit Charge'
                      : 'Home Visit Service Pricing'}
                </h2>
                <p className="text-xs text-green-600 leading-relaxed">
                  {isPackagePricingFlow()
                    ? 'Add optional prices for nursing/healthcare packages. Prices are not compulsory — leave blank to discuss with customer.'
                    : isInlineSkillPricingFlow()
                      ? 'Set your fixed visiting charge. Service prices were added in the previous step.'
                      : 'Set your fixed visiting charge and add optional service prices customers can book (e.g. AC repair, AC installation).'}
                </p>
              </div>

              {!isPackagePricingFlow() && (
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <label className="block text-sm font-bold text-gray-800 mb-2">Visiting Charge (Fixed)</label>
                <p className="text-xs text-gray-500 mb-3">One-time fee for visiting the customer&apos;s home (e.g. 300)</p>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="300"
                    value={visitingCharge}
                    onChange={(e) => setVisitingCharge(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-3 py-3 text-sm font-medium focus:ring-2 focus:ring-green-600 focus:outline-none"
                  />
                </div>
              </div>
              )}

              {!isInlineSkillPricingFlow() && (
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
                          {index === 0 && <label className="block text-[10px] font-semibold text-gray-600 mb-1">{getPriceLabelInfo().label}</label>}
                          <input
                            type="number"
                            min="0"
                            step="1"
                            placeholder={getPriceLabelInfo().placeholder}
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
              )}
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
                        <div className="grid grid-cols-2 gap-3">
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
                    <h2 className="text-sm font-bold text-gray-800">
                      {isTransportOrDeliveryCategory() ? 'Required Documents' : 'Identity & Business Documents'}
                    </h2>
                    <span className="text-[10px] font-bold px-2 py-1 bg-green-100 text-green-700 rounded-full">Secure Upload</span>
                  </div>

                  {isTransportOrDeliveryCategory() ? (
                    <div className="space-y-3">
                      {uniqueAdminDocs.map(doc => {
                        const file = documents[`doc_${doc.id}`];
                        return (
                          <div key={doc.id} className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between group hover:border-gray-300 transition-colors">
                            <div className="flex-1 pr-3">
                              <p className="font-semibold text-gray-800 text-[13px] mb-0.5">{doc.title}</p>
                              <p className={`text-[10px] font-medium ${file ? 'text-green-600' : 'text-red-500'}`}>
                                {file ? '✓ ' + file.name : 'Required'}
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
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-3">
                        {renderUploadCard('Selfie', 'Take a clear photo of your face', homeDocs.selfie, (file) => handleHomeDocChange('selfie', file), true, 'user')}
                        {renderUploadCard('Aadhaar Front', 'Upload front side of Aadhaar card', homeDocs.aadhaar_front, (file) => handleHomeDocChange('aadhaar_front', file))}
                        {renderUploadCard('Aadhaar Back', 'Upload back side of Aadhaar card', homeDocs.aadhaar_back, (file) => handleHomeDocChange('aadhaar_back', file))}
                      </div>

                      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                        <p className="font-semibold text-gray-800 text-[13px] mb-3">Do you have a Registered Business Shop?</p>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              setHasRegisteredShop('yes');
                              setServiceDeclarationAccepted(false);
                            }}
                            className={`py-2.5 rounded-xl text-sm font-bold border transition-colors ${hasRegisteredShop === 'yes' ? 'bg-green-600 text-white border-green-600' : 'bg-gray-50 text-gray-600 border-gray-200'}`}
                          >
                            Yes
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setHasRegisteredShop('no');
                              setHomeDocs((prev) => ({ ...prev, shop_photo: null }));
                            }}
                            className={`py-2.5 rounded-xl text-sm font-bold border transition-colors ${hasRegisteredShop === 'no' ? 'bg-green-600 text-white border-green-600' : 'bg-gray-50 text-gray-600 border-gray-200'}`}
                          >
                            No
                          </button>
                        </div>
                      </div>

                      {hasRegisteredShop === 'yes' && (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-gray-700">Upload Shop Photo</p>
                          {renderUploadCard('Shop Photo', 'Upload a clear photo of your registered shop', homeDocs.shop_photo, (file) => handleHomeDocChange('shop_photo', file))}
                        </div>
                      )}

                      {hasRegisteredShop === 'no' && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                          <label className="flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={serviceDeclarationAccepted}
                              onChange={(e) => setServiceDeclarationAccepted(e.target.checked)}
                              className="mt-1 h-4 w-4 rounded border-amber-300 text-green-600 focus:ring-green-600"
                            />
                            <span className="text-[12px] text-gray-700 leading-relaxed">
                              <span className="font-bold text-gray-900">I Declaration</span>
                              <br />
                              I have complete knowledge of the services we are going to provide through your app, and we will deliver all those services in the correct and proper manner.
                            </span>
                          </label>
                        </div>
                      )}
                    </div>
                  )}
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
                        onChange={e => setBankName(e.target.value.replace(/[^a-zA-Z\s]/g, ''))}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-600 focus:outline-none"
                        placeholder="e.g. State Bank of India (Words only)"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Account Number</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={accountNo}
                        onChange={e => setAccountNo(e.target.value.replace(/[^0-9]/g, ''))}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-600 focus:outline-none font-mono"
                        placeholder="Enter Account Number (Numbers only)"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">IFSC Code</label>
                      <input
                        type="text"
                        maxLength={11}
                        value={ifscCode}
                        onChange={e => setIfscCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11))}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-600 focus:outline-none uppercase font-mono"
                        placeholder="e.g. SBIN0001234 (11 characters)"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

        {/* Bottom Action Bar — outside scroll area so it never overlaps content */}
        <footer className="onboarding-footer">
          {step === 1 && (
            mode === 'edit_category' ? (
              <button
                onClick={
                  businessRequiresHomeVisitPricing()
                    ? handleNextFromStep1
                    : submitForm
                }
                disabled={!canProceedToStep2() || loading}
                className="w-full py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm text-sm"
              >
                {loading ? 'Saving...' : businessRequiresHomeVisitPricing() ? 'Continue' : 'Save Category'}
              </button>
            ) : (
              <button
                onClick={handleNextFromStep1}
                disabled={!canProceedToStep2()}
                className="w-full py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm text-sm"
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
              className="w-full py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm text-sm"
            >
              {mode === 'edit_category' ? (loading ? 'Saving...' : 'Save Category') : 'Continue'}
            </button>
          )}
          {step === 3 && (
            <button
              onClick={() => {
                if (step3Tab === 'docs') {
                  if (!canProceedFromDocsTab()) {
                    setError(isTransportOrDeliveryCategory()
                      ? 'Please upload the required documents.'
                      : 'Please complete all required uploads and questions before continuing.');
                    return;
                  }
                  setError('');
                  setStep3Tab('zone');
                } else if (step3Tab === 'zone') {
                  if (!zoneId) {
                    setError('Please select your working zone.');
                    return;
                  }
                  setError('');
                  setStep3Tab('kyc');
                } else {
                  submitForm();
                }
              }}
              disabled={loading || (step3Tab === 'zone' && !zoneId) || (step3Tab === 'docs' && !canProceedFromDocsTab())}
              className="w-full py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm flex items-center justify-center text-sm"
            >
              {loading ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : step3Tab === 'docs' ? 'Continue to Zone' : step3Tab === 'zone' ? 'Continue to KYC' : (isEditMode ? 'Save Changes' : 'Submit Application')}
            </button>
          )}
        </footer>
      </div>
    </>
  );
}

export default function Page() {
  return (
    <OnboardingErrorBoundary>
      <OnboardingForm />
    </OnboardingErrorBoundary>
  );
}
