import React, { useState, useEffect } from 'react';
import { Compass, Navigation, CheckCircle2, RotateCw, Sparkles, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CityLocation } from '../data/islamicData';

interface QiblaFinderProps {
  currentCity: CityLocation;
}

export const QiblaFinder: React.FC<QiblaFinderProps> = ({ currentCity }) => {
  const [heading, setHeading] = useState<number>(0);
  const [qiblaBearing, setQiblaBearing] = useState<number>(152); // Istanbul default Qibla angle approx 152°
  const [distanceKm, setDistanceKm] = useState<number>(2400);
  const [hasOrientationPermission, setHasOrientationPermission] = useState<boolean>(true);
  const [isSensorsSupported, setIsSensorsSupported] = useState<boolean>(false);

  // Calculate Qibla bearing and distance from coordinates
  useEffect(() => {
    // Kaaba Coordinates
    const kaabaLat = (21.4225 * Math.PI) / 180;
    const kaabaLng = (39.8262 * Math.PI) / 180;

    const userLat = (currentCity.latitude * Math.PI) / 180;
    const userLng = (currentCity.longitude * Math.PI) / 180;

    const deltaLng = kaabaLng - userLng;

    const y = Math.sin(deltaLng);
    const x = Math.cos(userLat) * Math.tan(kaabaLat) - Math.sin(userLat) * Math.cos(deltaLng);

    let qibla = (Math.atan2(y, x) * 180) / Math.PI;
    qibla = (qibla + 360) % 360;

    setQiblaBearing(Math.round(qibla));

    // Great circle distance
    const R = 6371; // Earth radius in km
    const dLat = kaabaLat - userLat;
    const dLon = kaabaLng - userLng;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(userLat) * Math.cos(kaabaLat) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    setDistanceKm(Math.round(R * c));
  }, [currentCity]);

  // Handle device orientation on mobile devices
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.alpha !== null) {
        setIsSensorsSupported(true);
        // Normalize alpha (0-360)
        // iOS provides webkitCompassHeading if available
        let compassHeading = e.alpha;
        if ((e as any).webkitCompassHeading !== undefined) {
          compassHeading = (e as any).webkitCompassHeading;
        }
        setHeading(Math.round(compassHeading));
      }
    };

    if (typeof window !== 'undefined' && window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleOrientation, true);
    }
    return () => {
      if (typeof window !== 'undefined' && window.DeviceOrientationEvent) {
        window.removeEventListener('deviceorientation', handleOrientation, true);
      }
    };
  }, []);

  // Request iOS permission if needed
  const requestIOSOrientationPermission = async () => {
    if (
      typeof window !== 'undefined' &&
      typeof (DeviceOrientationEvent as any).requestPermission === 'function'
    ) {
      try {
        const permission = await (DeviceOrientationEvent as any).requestPermission();
        if (permission === 'granted') {
          setHasOrientationPermission(true);
        } else {
          setHasOrientationPermission(false);
        }
      } catch (e) {
        console.warn('Orientation permission request failed', e);
      }
    }
  };

  const diffAngle = Math.abs((heading - qiblaBearing + 360) % 360);
  const isAligned = diffAngle < 4 || diffAngle > 356;
  const needleRotation = qiblaBearing - heading;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 sm:p-8 space-y-6 max-w-xl mx-auto text-center overflow-hidden">
      {/* Title */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
          <Compass className="w-3.5 h-3.5 text-emerald-600" />
          <span>Hassas Kıble Yönü & Manyetik Pusula</span>
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
          Kâbe-i Muazzama İstikameti
        </h3>
        <p className="text-xs text-slate-500">
          Bulunduğunuz konum ({currentCity.name}) için kesin Kıble açısı ve mesafe bilgisi.
        </p>
      </div>

      {/* Main Interactive Compass Display with Framer Motion */}
      <div className="relative w-68 h-68 sm:w-80 sm:h-80 mx-auto flex items-center justify-center select-none py-2">
        {/* Outer Ring with Glow Effect */}
        <motion.div
          animate={{
            borderColor: isAligned ? '#10b981' : '#e2e8f0',
            backgroundColor: isAligned ? 'rgba(236, 253, 245, 0.6)' : 'rgba(248, 250, 252, 0.7)',
            boxShadow: isAligned
              ? '0 0 35px rgba(16, 185, 129, 0.35)'
              : '0 4px 12px rgba(0, 0, 0, 0.03)',
            scale: isAligned ? 1.02 : 1,
          }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="absolute inset-2 sm:inset-0 rounded-full border-4"
        />

        {/* Outer Degree Tick Ring */}
        <motion.div
          animate={{ rotate: -heading }}
          transition={{
            type: 'spring',
            stiffness: 90,
            damping: 18,
            mass: 0.6,
          }}
          className="absolute inset-5 sm:inset-4 rounded-full border border-dashed border-slate-300"
        >
          {/* Cardinal Directions */}
          <span className="absolute top-1.5 left-1/2 -translate-x-1/2 text-[11px] font-black text-rose-600 tracking-wider">
            K (N)
          </span>
          <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-500">
            G (S)
          </span>
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500">
            D (E)
          </span>
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500">
            B (W)
          </span>

          {/* Subcardinal ticks */}
          <span className="absolute top-6 right-8 text-[9px] font-semibold text-slate-400">KD</span>
          <span className="absolute bottom-6 right-8 text-[9px] font-semibold text-slate-400">GD</span>
          <span className="absolute bottom-6 left-8 text-[9px] font-semibold text-slate-400">GB</span>
          <span className="absolute top-6 left-8 text-[9px] font-semibold text-slate-400">KB</span>
        </motion.div>

        {/* Smooth Animated Qibla Needle Pointer */}
        <motion.div
          animate={{ rotate: needleRotation }}
          transition={{
            type: 'spring',
            stiffness: 85,
            damping: 15,
            mass: 0.5,
          }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          {/* Kaaba Direction Head Indicator */}
          <div className="absolute top-2 flex flex-col items-center">
            <motion.div
              animate={{
                scale: isAligned ? [1, 1.12, 1] : 1,
                rotate: isAligned ? [0, -3, 3, 0] : 0,
              }}
              transition={{
                repeat: isAligned ? Infinity : 0,
                duration: 1.6,
                ease: 'easeInOut',
              }}
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm shadow-md transition-all ${
                isAligned
                  ? 'bg-emerald-900 border-2 border-amber-400 text-amber-300 ring-4 ring-emerald-400/30'
                  : 'bg-emerald-950 border border-amber-500 text-amber-400'
              }`}
            >
              🕋
            </motion.div>
            <span
              className={`text-[9px] font-bold px-2 py-0.5 rounded-full shadow-2xs mt-1 border transition-colors ${
                isAligned
                  ? 'bg-emerald-600 text-white border-emerald-700 font-black'
                  : 'bg-white text-emerald-900 border-emerald-200'
              }`}
            >
              KIBLE
            </span>
          </div>

          {/* Needle Center Stems */}
          <div className="relative flex flex-col items-center justify-center">
            {/* North/Qibla Pointer Arm */}
            <div
              className={`w-1.5 h-24 rounded-t-full transition-colors ${
                isAligned
                  ? 'bg-gradient-to-t from-emerald-500 via-teal-400 to-amber-400'
                  : 'bg-gradient-to-t from-slate-400 via-emerald-600 to-emerald-800'
              }`}
            />
            {/* South Tail Pointer Arm */}
            <div className="w-1 h-18 bg-gradient-to-b from-slate-400 to-rose-400/70 rounded-b-full" />
          </div>
        </motion.div>

        {/* Center Pivot Dial */}
        <motion.div
          animate={{ scale: isAligned ? 1.05 : 1 }}
          className="relative z-10 w-13 h-13 rounded-full bg-white border-2 border-emerald-600 shadow-md flex flex-col items-center justify-center font-bold text-xs text-emerald-950"
        >
          <span className="text-[11px] leading-tight font-extrabold">{qiblaBearing}°</span>
          <span className="text-[8px] font-semibold text-emerald-700 uppercase">Kıble</span>
        </motion.div>
      </div>

      {/* Alignment Status Banner */}
      <AnimatePresence mode="wait">
        <motion.div
          key={isAligned ? 'aligned' : 'searching'}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2 }}
          className={`p-3.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
            isAligned
              ? 'bg-emerald-600 text-white border-emerald-700 shadow-md shadow-emerald-600/20'
              : 'bg-slate-50 text-slate-700 border-slate-200'
          }`}
        >
          {isAligned ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-white animate-bounce" />
              <span>Tam Kıble İstikametindesiniz! Kâbe-i Muazzama'ya Yöneldiniz. 🤲</span>
            </>
          ) : (
            <>
              <Navigation className="w-4 h-4 text-emerald-600" />
              <span>
                Kıble Açısı: <strong>{qiblaBearing}°</strong> • Cihazı veya pusulayı Kâbe ikonuna doğru çevirin ({Math.round(diffAngle)}° fark)
              </span>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Manual Heading Slider for Desktop / Calibration */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
        <div className="flex items-center justify-between font-semibold text-slate-700">
          <span className="flex items-center gap-1.5">
            <RotateCw className="w-3.5 h-3.5 text-emerald-600" />
            <span>Pusula Açısı Simülasyonu / Kalibrasyon:</span>
          </span>
          <span className="font-bold text-emerald-900 bg-white px-2 py-0.5 rounded-md border border-slate-200 font-mono">
            {heading}°
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="360"
          value={heading}
          onChange={(e) => setHeading(Number(e.target.value))}
          className="w-full accent-emerald-600 cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-slate-400 font-medium">
          <span>0° (Kuzey)</span>
          <span>90° (Doğu)</span>
          <span>180° (Güney)</span>
          <span>270° (Batı)</span>
          <span>360°</span>
        </div>
      </div>

      {/* Sensor Permission / Mobile Advice */}
      {typeof window !== 'undefined' &&
        typeof (DeviceOrientationEvent as any)?.requestPermission === 'function' && (
          <button
            onClick={requestIOSOrientationPermission}
            className="w-full py-2 px-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold hover:bg-emerald-100 flex items-center justify-center gap-1.5 transition-colors"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Telefon Manyetik Sensörünü Etkinleştir</span>
          </button>
        )}

      {/* Distance and Location Details */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200/80 text-left">
          <span className="text-[10px] font-semibold text-emerald-800 uppercase block">Kâbe'ye Kuş Uçuşu</span>
          <span className="text-lg font-black text-emerald-950">{distanceKm.toLocaleString('tr-TR')} km</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Mekke-i Mükerreme</span>
        </div>
        <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200/80 text-left">
          <span className="text-[10px] font-semibold text-emerald-800 uppercase block">Kıble Açısı (Kuzeyden)</span>
          <span className="text-lg font-black text-emerald-950">{qiblaBearing}°</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">{currentCity.name} Merkezli</span>
        </div>
      </div>
    </div>
  );
};

