"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import VinFastLogo from "./VinFastLogo";

// load Google Maps only on client
const GoogleMapPanel = dynamic(() => import("./GoogleMapPanel"), { ssr: false });

type Weather = "cold" | "cool" | "mild";
type HomeType = "apartment" | "house" | "condo" | "townhouse" | "other";
type ParkingAccess = "garage" | "shared_lot" | "street" | "none";
type Inputs = {
  kmPerWeek: number;
  hasHomeCharging: boolean;
  chargerCountNearby: number;
  weather: Weather;
  fuelSpendMonthly: number;
  homeType: HomeType;
  numberOfSeats: number;
  parkingAccess: ParkingAccess;
  budget: number;
  drivesLongDistances: boolean;
  primaryConcern: string;
};

function computeScore(x: Inputs) {
  let s = 50;
  const reasons: string[] = [];
  if (x.kmPerWeek <= 350) { s += 12; reasons.push("+12 short weekly distance"); }
  else if (x.kmPerWeek <= 600) { s += 6; reasons.push("+6 moderate distance"); }
  else { s -= 6; reasons.push("−6 high weekly distance"); }

  if (x.hasHomeCharging) { s += 22; reasons.push("+22 home charging"); }

  const chargerBoost = Math.min(16, x.chargerCountNearby * 2);
  s += chargerBoost; reasons.push(`+${chargerBoost} charger density`);

  if (x.weather === "cold") { s -= 10; reasons.push("−10 winter penalty"); }
  else if (x.weather === "cool") { s -= 5; reasons.push("−5 cool climate"); }

  if (x.fuelSpendMonthly >= 250) { s += 10; reasons.push("+10 high savings potential"); }
  else if (x.fuelSpendMonthly >= 150) { s += 6; reasons.push("+6 savings potential"); }

  s = Math.max(0, Math.min(100, s));
  return { score: s, reasons };
}
function recommendModel(x: Inputs) {
  if (x.kmPerWeek > 500 || x.weather === "cold" || x.numberOfSeats > 6) return "VF9";
  if (x.kmPerWeek > 250 || x.numberOfSeats > 5) return "VF8";
  return "VF6";
}

export default function ChatFitPage() {
  const [step, setStep] = useState<2 | 3 | 4>(2);
  const [inputs, setInputs] = useState<Inputs>({
    kmPerWeek: 200,
    hasHomeCharging: true,
    chargerCountNearby: 4,
    weather: "cool",
    fuelSpendMonthly: 180,
    homeType: "house",
    numberOfSeats: 5,
    parkingAccess: "garage",
    budget: 50000,
    drivesLongDistances: false,
    primaryConcern: "range",
  });
  const [score, setScore] = useState(0);
  const [reasons, setReasons] = useState<string[]>([]);
  const [model, setModel] = useState("VF8");
  const router = useRouter();

  useEffect(() => {
    if (step === 4) {
      const { score, reasons } = computeScore(inputs);
      setScore(score);
      setReasons(reasons);
      setModel(recommendModel(inputs));
    }
  }, [step, inputs]);

  return (
    <main className="min-h-[100dvh] bg-white text-gray-900">
      <div className="px-5 md:px-10 py-4 flex items-center justify-between border-b border-gray-200">
        <button 
          onClick={() => router.push('/hero')}
          className="flex items-center gap-4 hover:opacity-80 transition-opacity"
        >
          <VinFastLogo />
        </button>
        <div className="text-xs text-gray-500">Hackathon Demo</div>
      </div>

      {step === 2 && <MapSection key="map-step" onNext={() => setStep(3)} />}
      {step === 3 && <QuizSection inputs={inputs} setInputs={setInputs} onNext={() => setStep(4)} />}
      {step === 4 && <ResultSection score={score} reasons={reasons} model={model} inputs={inputs} />}
    </main>
  );
}

function MapSection({ onNext }: { onNext: () => void }) {
  return (
    <section className="h-[calc(100dvh-73px)] p-3 md:p-4 lg:p-5 grid lg:grid-cols-12 gap-3 lg:gap-4 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
      <div className="lg:col-span-7 rounded-xl overflow-hidden bg-white border border-gray-200 shadow-lg h-full">
        <GoogleMapPanel visibleToken={2} />
      </div>
      <div className="lg:col-span-5 flex flex-col h-full">
        <div className="rounded-xl bg-white border border-gray-200 shadow-lg p-4 lg:p-5 flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Header */}
          <div className="mb-4 flex-shrink-0">
            <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-1.5">Map Your Journey</h2>
            <p className="text-xs lg:text-sm text-gray-600 leading-tight">
              Pin your important locations and discover EV charging stations along your route.
            </p>
          </div>

          {/* Scrollable content area */}
          <div className="flex-1 overflow-y-auto min-h-0 space-y-3 pr-1">
            {/* Pin Types Section */}
            <div className="flex-shrink-0">
              <h3 className="text-xs font-semibold text-gray-900 mb-2 uppercase tracking-wide">Pin Types</h3>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="w-3.5 h-3.5 rounded-full bg-blue-500 shadow-sm"></div>
                  <span className="text-xs lg:text-sm text-gray-700 font-medium">Home</span>
                  <span className="ml-auto text-xs text-gray-500">🏠</span>
                </div>
                <div className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="w-3.5 h-3.5 rounded-full bg-red-500 shadow-sm"></div>
                  <span className="text-xs lg:text-sm text-gray-700 font-medium">Work/School</span>
                  <span className="ml-auto text-xs text-gray-500">🏢</span>
                </div>
                <div className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="w-3.5 h-3.5 rounded-full bg-green-500 shadow-sm"></div>
                  <span className="text-xs lg:text-sm text-gray-700 font-medium">Favorite Spot</span>
                  <span className="ml-auto text-xs text-gray-500">⭐</span>
                </div>
              </div>
            </div>

            {/* EV Charging Stations Feature */}
            <div className="flex-shrink-0 p-3 bg-gradient-to-br from-red-50 to-orange-50 rounded-lg border border-red-100">
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5 flex-shrink-0">
                  <div className="w-7 h-7 rounded-full bg-red-500 flex items-center justify-center shadow-sm">
                    <span className="text-white text-sm">⚡</span>
                  </div>
        </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs font-semibold text-gray-900 mb-1">EV Charging Stations</h3>
                  <p className="text-[10px] lg:text-xs text-gray-700 leading-tight">
                    When you create a route between pins, we automatically display EV charging stations along your path. Look for the <span className="font-semibold text-red-600">red markers with lightning bolts</span> on the map.
          </p>
        </div>
              </div>
            </div>

            {/* Auto-Route Feature */}
            <div className="flex-shrink-0 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <h3 className="text-xs font-semibold text-gray-900 mb-1.5">Auto-Route Feature</h3>
              <p className="text-[10px] lg:text-xs text-gray-700 leading-tight mb-2">
                Routes automatically connect when you place both Home and Work pins. You can also manually select any two pins from the legend to create a custom route.
              </p>
              <div className="flex items-center gap-1.5 text-[10px] lg:text-xs text-blue-700">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Routes include turn-by-turn directions</span>
              </div>
            </div>

            {/* Quick Guide */}
            <div className="flex-shrink-0">
              <h3 className="text-xs font-semibold text-gray-900 mb-2 uppercase tracking-wide">Quick Guide</h3>
              <ol className="space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-[10px] font-semibold flex items-center justify-center mt-0.5">1</span>
                  <span className="text-[10px] lg:text-xs text-gray-700 leading-tight pt-0.5">Select a pin type from the top toolbar</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-[10px] font-semibold flex items-center justify-center mt-0.5">2</span>
                  <span className="text-[10px] lg:text-xs text-gray-700 leading-tight pt-0.5">Click anywhere on the map to place your pin</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-[10px] font-semibold flex items-center justify-center mt-0.5">3</span>
                  <span className="text-[10px] lg:text-xs text-gray-700 leading-tight pt-0.5">Add multiple pins to map your locations</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-[10px] font-semibold flex items-center justify-center mt-0.5">4</span>
                  <span className="text-[10px] lg:text-xs text-gray-700 leading-tight pt-0.5">View charging stations along your route</span>
                </li>
          </ol>
            </div>
          </div>

          {/* Next Button - Fixed at bottom */}
          <button 
            onClick={onNext} 
            className="mt-3 flex-shrink-0 w-full py-2.5 lg:py-3 rounded-xl bg-gradient-to-r from-[#1b5cff] to-[#00a4ff] text-white text-xs lg:text-sm font-semibold hover:shadow-lg hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-2"
          >
            <span>Continue to Questions</span>
            <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}

function QuizSection({
  inputs, setInputs, onNext
}: {
  inputs: Inputs;
  setInputs: (x: Inputs) => void;
  onNext: () => void;
}) {
  return (
    <section className="h-[calc(100dvh-73px)] p-4 md:p-6 lg:p-8 grid lg:grid-cols-12 gap-4 lg:gap-6 bg-gradient-to-br from-gray-50 to-gray-100 overflow-y-auto">
      <div className="lg:col-span-7 space-y-4">
        <div className="rounded-2xl bg-white border border-gray-200 shadow-lg p-6 lg:p-8">
          <div className="mb-6">
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Tell Us About Your Lifestyle</h2>
            <p className="text-sm text-gray-600">Help us understand your driving habits and preferences</p>
          </div>

          <div className="space-y-6">
            {/* Home Type */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-900">
                What type of home do you live in? 🏠
              </label>
              <select 
                value={inputs.homeType} 
                onChange={(e) => setInputs({ ...inputs, homeType: e.target.value as HomeType })}
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 focus:border-blue-500 focus:outline-none transition-colors"
              >
                <option value="house">House</option>
                <option value="apartment">Apartment</option>
                <option value="condo">Condo</option>
                <option value="townhouse">Townhouse</option>
                <option value="other">Other</option>
            </select>
            </div>

            {/* Parking Access */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-900">
                What type of parking do you have? 🅿️
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: "garage", label: "Garage", icon: "🚗" },
                  { value: "shared_lot", label: "Shared Lot", icon: "🏢" },
                  { value: "street", label: "Street", icon: "🛣️" },
                  { value: "none", label: "No Parking", icon: "❌" },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setInputs({ ...inputs, parkingAccess: option.value as ParkingAccess })}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      inputs.parkingAccess === option.value
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <div className="text-2xl mb-1">{option.icon}</div>
                    <div className="text-sm font-medium">{option.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Home Charging */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-900">
                Is home charging available? 🔌
              </label>
              <div className="flex gap-4">
                <button
                  onClick={() => setInputs({ ...inputs, hasHomeCharging: true })}
                  className={`flex-1 py-3 px-4 rounded-xl border-2 font-semibold transition-all ${
                    inputs.hasHomeCharging
                      ? "border-green-500 bg-green-50 text-green-700"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Yes ✓
                </button>
                <button
                  onClick={() => setInputs({ ...inputs, hasHomeCharging: false })}
                  className={`flex-1 py-3 px-4 rounded-xl border-2 font-semibold transition-all ${
                    !inputs.hasHomeCharging
                      ? "border-red-500 bg-red-50 text-red-700"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                  }`}
                >
                  No ✗
                </button>
              </div>
            </div>

            {/* Number of Seats */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-900">
                How many seats do you need? 👨‍👩‍👧‍👦
              </label>
              <div className="relative py-2">
                <input 
                  type="range" 
                  min={2} 
                  max={8} 
                  value={inputs.numberOfSeats}
                  onChange={(e) => setInputs({ ...inputs, numberOfSeats: +e.target.value })}
                  className="w-full h-4 bg-gray-300 rounded-full appearance-none cursor-pointer range-slider" 
                  style={{
                    background: `linear-gradient(to right, #2563eb 0%, #2563eb ${((inputs.numberOfSeats - 2) / 6) * 100}%, #d1d5db ${((inputs.numberOfSeats - 2) / 6) * 100}%, #d1d5db 100%)`
                  }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">2</span>
                <span className="text-lg font-bold text-blue-600">{inputs.numberOfSeats} seats</span>
                <span className="text-xs text-gray-500">8</span>
              </div>
            </div>

            {/* Budget */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-900">
                What's your vehicle budget? 💰
              </label>
              <div className="relative py-2">
                <input 
                  type="range" 
                  min={20000} 
                  max={100000} 
                  step={5000}
                  value={inputs.budget}
                  onChange={(e) => setInputs({ ...inputs, budget: +e.target.value })}
                  className="w-full h-4 bg-gray-300 rounded-full appearance-none cursor-pointer range-slider" 
                  style={{
                    background: `linear-gradient(to right, #2563eb 0%, #2563eb ${((inputs.budget - 20000) / 80000) * 100}%, #d1d5db ${((inputs.budget - 20000) / 80000) * 100}%, #d1d5db 100%)`
                  }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">$20k</span>
                <span className="text-lg font-bold text-blue-600">
                  ${(inputs.budget / 1000).toFixed(0)}k
                </span>
                <span className="text-xs text-gray-500">$100k+</span>
              </div>
            </div>

            {/* Long Distance Driving */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-900">
                Do you drive long distances regularly? 🛣️
              </label>
              <div className="flex gap-4">
                <button
                  onClick={() => setInputs({ ...inputs, drivesLongDistances: true })}
                  className={`flex-1 py-3 px-4 rounded-xl border-2 font-semibold transition-all ${
                    inputs.drivesLongDistances
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Yes, regularly
                </button>
                <button
                  onClick={() => setInputs({ ...inputs, drivesLongDistances: false })}
                  className={`flex-1 py-3 px-4 rounded-xl border-2 font-semibold transition-all ${
                    !inputs.drivesLongDistances
                      ? "border-gray-400 bg-gray-50 text-gray-700"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                  }`}
                >
                  No, mostly local
                </button>
              </div>
            </div>

            {/* Monthly Fuel Spend */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-900">
                How much do you spend on fuel per month? ⛽
              </label>
              <div className="relative py-2">
                <input 
                  type="range" 
                  min={0} 
                  max={500} 
                  step={10}
                  value={inputs.fuelSpendMonthly}
              onChange={(e) => setInputs({ ...inputs, fuelSpendMonthly: +e.target.value })}
                  className="w-full h-4 bg-gray-300 rounded-full appearance-none cursor-pointer range-slider" 
                  style={{
                    background: `linear-gradient(to right, #2563eb 0%, #2563eb ${(inputs.fuelSpendMonthly / 500) * 100}%, #d1d5db ${(inputs.fuelSpendMonthly / 500) * 100}%, #d1d5db 100%)`
                  }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">$0</span>
                <span className="text-lg font-bold text-blue-600">${inputs.fuelSpendMonthly}</span>
                <span className="text-xs text-gray-500">$500+</span>
              </div>
            </div>
          </div>

          <button 
            onClick={onNext} 
            className="mt-8 w-full py-4 rounded-xl bg-gradient-to-r from-[#1b5cff] to-[#00a4ff] text-white font-semibold text-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-2"
          >
            <span>Calculate My VinFast Life Score</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>
      </div>

      <div className="lg:col-span-5">
        <div className="rounded-2xl bg-white border border-gray-200 shadow-lg p-6 lg:p-8 sticky top-4">
          <div className="mb-6">
            <h3 className="text-xl lg:text-2xl font-bold text-gray-900 mb-3">What We Analyze</h3>
            <p className="text-sm text-gray-600">Your responses help us calculate your personalized VinFast Life Score</p>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-sm font-bold">1</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Distance & Range</h4>
                  <p className="text-xs text-gray-700">We compare your weekly driving distance with EV range capabilities</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-green-50 rounded-xl border border-green-100">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-sm font-bold">2</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Charging Access</h4>
                  <p className="text-xs text-gray-700">Home charging feasibility and nearby public charging stations</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-sm font-bold">3</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Climate Impact</h4>
                  <p className="text-xs text-gray-700">How winter conditions affect EV battery performance and range</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-sm font-bold">4</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Savings Potential</h4>
                  <p className="text-xs text-gray-700">Your current fuel spend converted to potential EV savings</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-pink-50 rounded-xl border border-pink-100">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-pink-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-sm font-bold">5</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Lifestyle Fit</h4>
                  <p className="text-xs text-gray-700">Home type, parking, seats, and long-distance needs</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
            <p className="text-xs text-gray-700 leading-relaxed">
              <strong className="text-gray-900">💡 Tip:</strong> The more accurate your answers, the better we can match you with the perfect VinFast model!
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}


function ResultSection({ score, reasons, model, inputs }: { score: number; reasons: string[]; model: string; inputs: Inputs }) {
  // Calculate annual savings
  const annualSavings = Math.round(inputs.fuelSpendMonthly * 12 * 0.7); // Assuming 70% savings with EV
  
  // Model specifications
  const modelSpecs: Record<string, {
    name: string;
    range: string;
    seats: number;
    safety: string;
    charging: string;
    price: string;
    image: string;
  }> = {
    VF6: {
      name: "VF 6",
      range: "450 km",
      seats: 5,
      safety: "5-Star",
      charging: "Fast charging: 10-80% in 28 min",
      price: "Starting at $35,000",
      image: "https://images.unsplash.com/photo-1593941707882-a5bac6861d75?w=800&h=600&fit=crop"
    },
    VF8: {
      name: "VF 8",
      range: "550 km",
      seats: 7,
      safety: "5-Star",
      charging: "Fast charging: 10-80% in 26 min",
      price: "Starting at $45,000",
      image: "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=800&h=600&fit=crop"
    },
    VF9: {
      name: "VF 9",
      range: "680 km",
      seats: 8,
      safety: "5-Star",
      charging: "Fast charging: 10-80% in 24 min",
      price: "Starting at $55,000",
      image: "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800&h=600&fit=crop"
    }
  };

  const specs = modelSpecs[model] || modelSpecs.VF6;
  
  // Compatibility info
  const carSeats = inputs.numberOfSeats >= 7 ? "Fits 2+ car seats" : "Fits 2 car seats";
  
  // Comparison advantages
  const advantages = [
    {
      title: "Superior Range",
      description: `${specs.range} range vs. 350-400 km average for competitors in this price range`,
      icon: "🔋"
    },
    {
      title: "Faster Charging",
      description: `${specs.charging.split(":")[1].trim()} - 20% faster than most competitors`,
      icon: "⚡"
    },
    {
      title: "Better Value",
      description: `More features and range at ${specs.price.toLowerCase()} compared to similar EVs`,
      icon: "💰"
    },
    {
      title: "5-Star Safety",
      description: "Top safety rating with advanced driver assistance systems",
      icon: "🛡️"
    }
  ];

  return (
    <section className="min-h-[calc(100dvh-73px)] p-4 md:p-6 lg:p-8 bg-gradient-to-br from-gray-50 to-gray-100 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Score Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-block px-6 py-2 bg-blue-50 rounded-full mb-4">
            <span className="text-sm font-semibold text-blue-600">VinFast Life Score</span>
          </div>
          <div className="mb-2">
            <span className="text-7xl md:text-8xl font-bold text-gray-900">{score}</span>
            <span className="text-4xl md:text-5xl font-bold text-gray-400">/100</span>
          </div>
          <div className="text-xl md:text-2xl text-gray-600">
            Your Perfect Match: <span className="text-blue-600 font-bold">{specs.name}</span>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Car Image and Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Car Image Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl bg-white border border-gray-200 shadow-lg overflow-hidden"
            >
              <div className="relative h-64 md:h-80 bg-gradient-to-br from-blue-50 to-gray-100">
                <img 
                  src={specs.image} 
                  alt={specs.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://via.placeholder.com/800x600/1e40af/ffffff?text=VinFast+" + model;
                  }}
                />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-md">
                  <div className="text-2xl font-bold text-gray-900">{specs.name}</div>
                  <div className="text-sm text-gray-600">{specs.price}</div>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Key Specifications</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-xl">
                    <div className="text-2xl mb-1">🔋</div>
                    <div className="text-sm font-semibold text-gray-900">{specs.range}</div>
                    <div className="text-xs text-gray-500">Range</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-xl">
                    <div className="text-2xl mb-1">👥</div>
                    <div className="text-sm font-semibold text-gray-900">{specs.seats} Seats</div>
                    <div className="text-xs text-gray-500">Capacity</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-xl">
                    <div className="text-2xl mb-1">🛡️</div>
                    <div className="text-sm font-semibold text-gray-900">{specs.safety}</div>
                    <div className="text-xs text-gray-500">Safety</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-xl">
                    <div className="text-2xl mb-1">⚡</div>
                    <div className="text-sm font-semibold text-gray-900">Fast</div>
                    <div className="text-xs text-gray-500">Charging</div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Why VinFast Section */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl bg-white border border-gray-200 shadow-lg p-6"
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Why {specs.name} Over Other EVs?</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {advantages.map((advantage, i) => (
                  <div key={i} className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                    <div className="flex items-start gap-3">
                      <div className="text-3xl">{advantage.icon}</div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">{advantage.title}</h4>
                        <p className="text-sm text-gray-700">{advantage.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right Column - Details and Actions */}
          <div className="space-y-6">
            {/* Score Breakdown */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl bg-white border border-gray-200 shadow-lg p-6"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-4">Score Breakdown</h3>
              <div className="space-y-2">
                {reasons.map((r, i) => {
                  const isPositive = r.startsWith("+");
                  const isNegative = r.startsWith("−");
                  return (
                    <div 
                      key={i} 
                      className={`p-3 rounded-lg ${
                        isPositive ? "bg-green-50 border border-green-100" : 
                        isNegative ? "bg-red-50 border border-red-100" : 
                        "bg-gray-50 border border-gray-100"
                      }`}
                    >
                      <span className={`text-sm font-medium ${
                        isPositive ? "text-green-700" : 
                        isNegative ? "text-red-700" : 
                        "text-gray-700"
                      }`}>
                        {r}
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Compatibility & Features */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl bg-white border border-gray-200 shadow-lg p-6"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-4">Perfect for You</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl">
                  <div className="text-2xl">👶</div>
                  <div>
                    <div className="font-semibold text-gray-900">Compatibility</div>
                    <div className="text-sm text-gray-700">{carSeats}; {specs.safety} safety rating</div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-green-50 rounded-xl">
                  <div className="text-2xl">⚡</div>
                  <div>
                    <div className="font-semibold text-gray-900">Charging Stations</div>
                    <div className="text-sm text-gray-700">Charging stations shown on map around your route</div>
                    <div className="text-xs text-gray-600 mt-1">• Estimated charging time & suggested stops</div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Estimated Savings */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 shadow-lg p-6"
            >
              <div className="text-center">
                <div className="text-4xl mb-2">💰</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Estimated Savings</h3>
                <div className="text-3xl font-bold text-green-600 mb-2">${annualSavings.toLocaleString()}</div>
                <div className="text-sm text-gray-700">per year on fuel</div>
                <div className="text-xs text-gray-600 mt-2">
                  Based on your current spending of ${inputs.fuelSpendMonthly}/month
                </div>
              </div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-3"
            >
              <a 
                href="https://vinfastus.my.site.com/TestDriveRequest" 
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-4 px-6 rounded-xl bg-gradient-to-r from-[#1b5cff] to-[#00a4ff] text-white font-semibold text-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200 text-center"
              >
                Book a Test Drive
              </a>
              <button className="w-full py-4 px-6 rounded-xl bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-all duration-200">
                Share My Fit
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

