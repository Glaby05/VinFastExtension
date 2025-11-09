"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import VinFastLogo from "./VinFastLogo";

// load Google Maps only on client
const GoogleMapPanel = dynamic(() => import("./GoogleMapPanel"), { ssr: false });

type Weather = "cold" | "cool" | "mild";
type Inputs = {
  kmPerWeek: number;
  hasHomeCharging: boolean;
  chargerCountNearby: number;
  weather: Weather;
  fuelSpendMonthly: number;
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
  if (x.kmPerWeek > 500 || x.weather === "cold") return "VF9";
  if (x.kmPerWeek > 250) return "VF8";
  return "VF6";
}

export default function ChatFitPage() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [inputs, setInputs] = useState<Inputs>({
    kmPerWeek: 200,
    hasHomeCharging: true,
    chargerCountNearby: 4,
    weather: "cool",
    fuelSpendMonthly: 180,
  });
  const [score, setScore] = useState(0);
  const [reasons, setReasons] = useState<string[]>([]);
  const [model, setModel] = useState("VF8");

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
          onClick={() => setStep(1)}
          className="flex items-center gap-4 hover:opacity-80 transition-opacity"
        >
          <VinFastLogo />
          <span className="text-sm text-gray-600 hidden md:inline">— EVE The VinFast Life</span>
        </button>
        <div className="text-xs text-gray-500">Hackathon Demo</div>
      </div>

      {step === 1 && <Hero onStart={() => setStep(2)} />}
      {step === 2 && <MapSection key="map-step" onNext={() => setStep(3)} />}
      {step === 3 && <QuizSection inputs={inputs} setInputs={setInputs} onNext={() => setStep(4)} />}
      {step === 4 && <ResultSection score={score} reasons={reasons} model={model} />}
    </main>
  );
}

function Hero({ onStart }: { onStart: () => void }) {
  return (
    <section className="h-[70dvh] flex flex-col items-center justify-center text-center px-6 bg-gradient-to-b from-white to-gray-50">
      <motion.h1 className="text-4xl md:text-6xl font-bold text-gray-900" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        Is <span className="text-blue-600">VinFast</span> for you?
      </motion.h1>
      <p className="mt-4 text-gray-600 max-w-2xl">
        Pin your places, answer a few fun questions, and get your <b>VinFast Life Score</b> in under a minute.
      </p>
      <button onClick={onStart} className="mt-8 px-6 py-3 rounded-xl bg-gradient-to-r from-[#1b5cff] to-[#00a4ff] text-white font-semibold hover:shadow-lg transition-shadow">
        Start
      </button>
    </section>
  );
}

function MapSection({ onNext }: { onNext: () => void }) {
  return (
    <section className="p-4 md:p-8 grid md:grid-cols-5 gap-6 bg-gray-50">
      <div className="md:col-span-3 rounded-2xl overflow-hidden bg-white border border-gray-200 shadow-sm">
        <GoogleMapPanel visibleToken={2} />
      </div>
      <div className="md:col-span-2 rounded-2xl bg-white border border-gray-200 shadow-sm p-5">
        <h3 className="text-xl font-semibold text-gray-900">Pin your life 🗺️</h3>
        <p className="text-gray-600 text-sm mt-2">
          Select a pin type from the top, then click on the map to place it. Add as many pins as you want!
        </p>
        <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-700 mb-2 font-semibold">Pin Types:</p>
          <ul className="text-xs text-gray-600 space-y-1">
            <li className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span>🏠 Home</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span>🏢 Work/School</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>⭐ Favorite Spot</span>
            </li>
          </ul>
        </div>
        <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-700 mb-2 font-semibold">Auto-Route Feature:</p>
          <p className="text-xs text-gray-600">
            When you place both Home 🏠 and Work 🏢 pins, a route line will automatically connect them! You can also manually select any 2 pins to create a route.
          </p>
        </div>
        <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-700 mb-2">How to use:</p>
          <ol className="text-xs text-gray-600 space-y-1 list-decimal list-inside">
            <li>Select pin type from the top bar</li>
            <li>Click on the map to place the pin</li>
            <li>Repeat to add more pins (unlimited!)</li>
            <li>Routes auto-connect Home & Work</li>
            <li>Or click pins in legend to manually create routes</li>
          </ol>
        </div>
        <button onClick={onNext} className="mt-6 w-full py-3 rounded-xl bg-gradient-to-r from-[#1b5cff] to-[#00a4ff] text-white font-semibold hover:shadow-lg transition-shadow">
          Next: Quick Questions →
        </button>
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
    <section className="p-4 md:p-8 grid md:grid-cols-2 gap-6 bg-gray-50">
      <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-5">
        <h3 className="text-xl font-semibold text-gray-900">Quick questions</h3>
        <div className="mt-4 space-y-4">
          <Field label="How many km/week? 🚗">
            <input type="range" min={0} max={800} value={inputs.kmPerWeek}
              onChange={(e) => setInputs({ ...inputs, kmPerWeek: +e.target.value })}
              className="flex-1 accent-blue-500" />
            <span className="min-w-[80px] text-right text-gray-700">{inputs.kmPerWeek} km</span>
          </Field>
          <Field label="Home charging available? 🏠">
            <input type="checkbox" checked={inputs.hasHomeCharging}
              onChange={(e) => setInputs({ ...inputs, hasHomeCharging: e.target.checked })}
              className="w-5 h-5 accent-blue-500 cursor-pointer" />
            <span className="text-sm text-gray-600">{inputs.hasHomeCharging ? "Yes" : "No"}</span>
          </Field>
          <Field label="Chargers near you (within ~3km) 🔌">
            <input type="range" min={0} max={8} value={inputs.chargerCountNearby}
              onChange={(e) => setInputs({ ...inputs, chargerCountNearby: +e.target.value })}
              className="flex-1 accent-blue-500" />
            <span className="min-w-[40px] text-right text-gray-700">{inputs.chargerCountNearby}</span>
          </Field>
          <Field label="Winter severity ❄️">
            <select value={inputs.weather} onChange={(e) => setInputs({ ...inputs, weather: e.target.value as Weather })}
              className="bg-white text-gray-900 p-2 rounded border border-gray-300 focus:border-blue-500 focus:outline-none flex-1">
              <option value="mild">Mild</option>
              <option value="cool">Cool</option>
              <option value="cold">Cold</option>
            </select>
          </Field>
          <Field label="Monthly fuel spend 💸">
            <input type="range" min={0} max={500} value={inputs.fuelSpendMonthly}
              onChange={(e) => setInputs({ ...inputs, fuelSpendMonthly: +e.target.value })}
              className="flex-1 accent-blue-500" />
            <span className="min-w-[80px] text-right text-gray-700">${inputs.fuelSpendMonthly}</span>
          </Field>
        </div>
        <button onClick={onNext} className="mt-6 w-full py-3 rounded-xl bg-gradient-to-r from-[#1b5cff] to-[#00a4ff] text-white font-semibold hover:shadow-lg transition-shadow">
          Calculate My Life Score ⚡
        </button>
      </div>
      <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-5">
        <h3 className="text-xl font-semibold text-gray-900">What this measures</h3>
        <ul className="mt-3 text-gray-600 list-disc list-inside space-y-1 text-sm">
          <li>Distance vs EV range</li><li>Charging access at home & nearby</li>
          <li>Winter impact on range</li><li>Fuel spend → EV savings potential</li>
        </ul>
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <div className="text-gray-700">{label}</div>
      <div className="flex items-center gap-3">{children}</div>
    </label>
  );
}

function ResultSection({ score, reasons, model }: { score: number; reasons: string[]; model: string }) {
  return (
    <section className="p-6 md:p-12 flex flex-col items-center bg-gradient-to-b from-white to-gray-50">
      <div className="w-full max-w-2xl rounded-2xl bg-white border border-gray-200 shadow-lg p-6 text-center">
        <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <div className="text-sm text-gray-500">VinFast Life Score</div>
          <div className="text-6xl font-bold mt-2 text-gray-900">{score}</div>
          <div className="mt-2 text-gray-700">Recommended: <b className="text-blue-600">{model}</b></div>
          <ul className="mt-4 text-left list-disc list-inside text-gray-600 space-y-1">
            {reasons.map((r, i) => (<li key={i}>{r}</li>))}
          </ul>
          <div className="mt-6 flex gap-3 justify-center">
            <a href="https://vinfastauto.ca" target="_blank"
               className="px-4 py-3 rounded-xl bg-gradient-to-r from-[#1b5cff] to-[#00a4ff] text-white font-semibold hover:shadow-lg transition-shadow">
              Book a Test Drive
            </a>
            <button className="px-4 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition-colors">Share My Fit</button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

