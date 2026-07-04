"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function OnboardingForm() {
  const searchParams = useSearchParams();
  const driverId = searchParams.get("driver_id") || "";
  const accesstoken = searchParams.get("accesstoken") || "";

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    category: "",
    vehicle_brand: "",
    vehicle_model: "",
    vehicle_number_plate: "",
  });

  const [documents, setDocuments] = useState<Record<string, File | null>>({
    doc_0: null, // Driving Licence
    doc_1: null, // Aadhaar Card
    doc_2: null, // RC Book
    doc_3: null, // Insurance
    doc_4: null, // Pollution Certificate
    doc_5: null, // Profile Photo
    doc_6: null, // Bank Passbook
  });

  const categories = [
    { name: "Cab Driver", icon: "🚕", type: "Car" },
    { name: "Bike Rider", icon: "🏍️", type: "Bike" },
    { name: "Auto Driver", icon: "🛺", type: "Auto" },
    { name: "E-Rickshaw", icon: "🔋", type: "Auto" },
    { name: "Pickup", icon: "🛻", type: "Truck" },
    { name: "Fleet Owner", icon: "🏢", type: "Fleet" },
    { name: "Truck Owner", icon: "🚚", type: "Truck" },
    { name: "Food Delivery", icon: "🍔", type: "Bike" },
    { name: "Parcel Delivery", icon: "📦", type: "Bike" },
  ];

  // Map backend brands and models to specific category types
  const vehicleData = {
    Bike: {
      brands: ["Hero", "Honda", "TVS", "Bajaj", "Royal Enfield", "Yamaha", "Suzuki", "KTM", "Ather", "Ola"],
      models: {
        Hero: ["Splendor Plus", "HF Deluxe", "Glamour", "Xpulse 200"],
        Honda: ["Shine", "Activa", "Dio", "SP125"],
        TVS: ["Radeon", "Jupiter", "Ntorq", "Apache RTR 160"],
        Bajaj: ["Platina", "Pulsar 150", "Pulsar NS200", "Dominar 400"],
        "Royal Enfield": ["Classic 350", "Bullet 350", "Meteor 350", "Hunter 350"],
        Yamaha: ["R15", "FZ", "MT-15", "RayZR"],
        Suzuki: ["Access 125", "Burgman Street", "Gixxer", "Avenis"],
        KTM: ["Duke 200", "RC 200", "Duke 390", "Adventure 390"],
        Ather: ["450X", "450S"],
        Ola: ["S1 Pro", "S1 Air", "S1 X"]
      }
    },
    Car: {
      brands: ["Maruti Suzuki", "Hyundai", "Tata", "Toyota", "Honda", "Kia", "MG"],
      models: {
        "Maruti Suzuki": ["Swift", "Dzire", "Ertiga", "Brezza"],
        Hyundai: ["i20", "Verna", "Creta", "Venue"],
        Tata: ["Tiago", "Nexon", "Harrier", "Punch"],
        Toyota: ["Innova", "Fortuner", "Glanza"],
        Honda: ["City", "Amaze", "Elevate"],
        Kia: ["Seltos", "Sonet", "Carens"],
        MG: ["Hector", "Astor", "Comet EV"]
      }
    },
    Auto: {
      brands: ["Bajaj", "Piaggio", "Mahindra", "TVS"],
      models: {
        Bajaj: ["RE", "Maxima"],
        Piaggio: ["Ape City", "Ape Auto"],
        Mahindra: ["Alfa", "Treo"],
        TVS: ["King Duramax"],
      }
    },
    Truck: {
      brands: ["Tata", "Ashok Leyland", "Mahindra", "Eicher", "BharatBenz"],
      models: {
        Tata: ["Ace", "407", "Signa"],
        "Ashok Leyland": ["Dost", "Bada Dost", "Ecomet"],
        Mahindra: ["Bolero Pickup", "Supro"],
        Eicher: ["Pro 2049", "Pro 3015"],
      }
    },
    Fleet: {
      brands: ["Multiple Brands"],
      models: { "Multiple Brands": ["Mixed Fleet"] }
    }
  };

  const requiredDocs = [
    { id: 0, title: "Driving Licence" },
    { id: 1, title: "Aadhaar Card" },
    { id: 2, title: "RC Book / Vehicle Registration" },
    { id: 3, title: "Insurance" },
    { id: 4, title: "Pollution Certificate" },
    { id: 5, title: "Profile Photo" },
    { id: 6, title: "Bank Passbook / Cancelled Cheque" },
  ];

  const handleCategorySelect = (catName: string) => {
    setFormData({ ...formData, category: catName, vehicle_brand: "", vehicle_model: "" });
    setStep(2);
  };

  const getVehicleType = () => {
    const cat = categories.find(c => c.name === formData.category);
    return cat ? cat.type as keyof typeof vehicleData : "Car";
  };

  const handleFileChange = (id: number, file: File | null) => {
    setDocuments(prev => ({ ...prev, [`doc_${id}`]: file }));
  };

  const submitForm = async () => {
    if (!driverId) {
      setError("Driver ID is missing. Please restart the app.");
      return;
    }

    setLoading(true);
    setError("");

    const data = new FormData();
    data.append("driver_id", driverId);
    data.append("category", formData.category);
    data.append("vehicle_brand", formData.vehicle_brand);
    data.append("vehicle_model", formData.vehicle_model);
    data.append("vehicle_number_plate", formData.vehicle_number_plate);

    Object.entries(documents).forEach(([key, file]) => {
      if (file) {
        data.append(key, file);
      }
    });

    try {
      const res = await fetch("/api/v1/driver/onboarding/submit", {
        method: "POST",
        headers: {
          "accesstoken": accesstoken,
          "apikey": "base64:nTfofcBByTDenJQYlsRbH0JjeVFW5lWsIIyXtq8/9sU="
        },
        body: data,
      });

      const result = await res.json();
      if (result.success === "Success" || result.success === "success") {
        setSuccess(true);
      } else {
        setError(result.error || result.message || "Failed to submit onboarding details");
      }
    } catch (err: any) {
      setError(err.message || "A network error occurred.");
    } finally {
      setLoading(false);
    }
  };

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
              } catch (e) {}
            }}
            className="w-full bg-slate-900 text-white font-semibold py-4 rounded-2xl hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20"
          >
            Return to App
          </button>
        </div>
      </div>
    );
  }

  const vType = getVehicleType();
  const availableBrands = vehicleData[vType]?.brands || [];
  const availableModels = (formData.vehicle_brand && vehicleData[vType]?.models[formData.vehicle_brand as keyof typeof vehicleData[typeof vType]["models"]]) || [];

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 pt-6 px-4 font-sans">
      <div className="max-w-lg mx-auto">
        
        {/* Header / Stepper */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Driver Profile</h1>
          <p className="text-slate-500 mt-2 font-medium">Complete your onboarding to start earning.</p>
          
          <div className="flex items-center mt-8 space-x-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex-1">
                <div className={`h-1.5 rounded-full transition-all duration-500 ${step >= s ? "bg-blue-600" : "bg-slate-200"}`} />
                <p className={`text-xs mt-2 font-semibold transition-colors ${step >= s ? "text-blue-600" : "text-slate-400"}`}>
                  {s === 1 ? "Category" : s === 2 ? "Vehicle" : "Documents"}
                </p>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100 flex items-start">
            <svg className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            {error}
          </div>
        )}

        {/* Step 1: Category */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-bold text-slate-800 mb-6">Select your service type</h2>
            <div className="grid grid-cols-2 gap-4">
              {categories.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => handleCategorySelect(cat.name)}
                  className={`flex flex-col items-center justify-center p-6 rounded-3xl border-2 transition-all duration-200 ${
                    formData.category === cat.name 
                      ? "border-blue-600 bg-blue-50/50 shadow-sm" 
                      : "border-transparent bg-white shadow-sm hover:shadow-md hover:border-slate-100"
                  }`}
                >
                  <span className="text-4xl mb-4 transform transition-transform group-hover:scale-110">{cat.icon}</span>
                  <span className="font-semibold text-slate-700 text-sm text-center">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Vehicle */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-bold text-slate-800">Vehicle Information</h2>
            
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Vehicle Brand</label>
                <div className="relative">
                  <select 
                    value={formData.vehicle_brand}
                    onChange={(e) => setFormData({ ...formData, vehicle_brand: e.target.value, vehicle_model: "" })}
                    className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 block p-4 pr-10 font-medium transition-all"
                  >
                    <option value="">Select a brand...</option>
                    {availableBrands.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Vehicle Model</label>
                <div className="relative">
                  <select 
                    value={formData.vehicle_model}
                    onChange={(e) => setFormData({ ...formData, vehicle_model: e.target.value })}
                    disabled={!formData.vehicle_brand}
                    className="w-full appearance-none disabled:opacity-50 bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 block p-4 pr-10 font-medium transition-all"
                  >
                    <option value="">Select a model...</option>
                    {availableModels.map((m: string) => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Number Plate</label>
                <input 
                  type="text"
                  placeholder="e.g. MH 01 AB 1234"
                  value={formData.vehicle_number_plate}
                  onChange={(e) => setFormData({ ...formData, vehicle_number_plate: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 block p-4 font-medium transition-all uppercase placeholder:normal-case"
                />
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <button 
                onClick={() => setStep(1)}
                className="flex-1 py-4 bg-white border border-slate-200 text-slate-700 font-semibold rounded-2xl hover:bg-slate-50 transition-colors"
              >
                Back
              </button>
              <button 
                onClick={() => setStep(3)}
                disabled={!formData.vehicle_brand || !formData.vehicle_model || !formData.vehicle_number_plate}
                className="flex-[2] py-4 bg-blue-600 text-white font-semibold rounded-2xl hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors shadow-lg shadow-blue-600/20"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Documents */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold text-slate-800">Required Documents</h2>
              <span className="text-xs font-bold px-3 py-1 bg-blue-100 text-blue-700 rounded-full">Secure Upload</span>
            </div>
            
            <div className="space-y-4">
              {requiredDocs.map(doc => {
                const file = documents[`doc_${doc.id}`];
                return (
                  <div key={doc.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-slate-300 transition-colors">
                    <div className="flex-1 pr-4">
                      <p className="font-semibold text-slate-800 text-sm mb-1">{doc.title}</p>
                      <p className={`text-xs font-medium ${file ? 'text-emerald-600' : 'text-rose-500'}`}>
                        {file ? "✓ Uploaded: " + file.name : "Required"}
                      </p>
                    </div>
                    <div>
                      <label className="cursor-pointer bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-sm px-5 py-3 rounded-2xl transition-colors inline-block border border-slate-200 shadow-sm">
                        {file ? 'Change' : 'Upload'}
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          onChange={(e) => handleFileChange(doc.id, e.target.files?.[0] || null)}
                        />
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex space-x-3 pt-6">
              <button 
                onClick={() => setStep(2)}
                disabled={loading}
                className="flex-1 py-4 bg-white border border-slate-200 text-slate-700 font-semibold rounded-2xl hover:bg-slate-50 transition-colors"
              >
                Back
              </button>
              <button 
                onClick={submitForm}
                disabled={loading}
                className="flex-[2] py-4 bg-slate-900 text-white font-semibold rounded-2xl hover:bg-slate-800 disabled:opacity-50 transition-colors shadow-lg shadow-slate-900/20 flex items-center justify-center"
              >
                {loading ? (
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : "Submit Profile"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center text-slate-400 font-medium">Loading...</div>}>
      <OnboardingForm />
    </Suspense>
  );
}
