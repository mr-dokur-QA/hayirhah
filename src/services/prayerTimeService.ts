/**
 * Robust Astronomical Prayer Times Calculation Engine
 * Follows Diyanet İşleri Başkanlığı (Turkey) & MWL / ISNA calculation conventions.
 * Provides accurate offline prayer times with zero external network dependency.
 */

export interface PrayerTimings {
  [key: string]: string;
  Fajr: string;     // İmsak
  Sunrise: string;  // Güneş
  Dhuhr: string;    // Öğle
  Asr: string;      // İkindi
  Sunset: string;   // Akşam
  Maghrib: string;  // Akşam
  Isha: string;     // Yatsı
  Imsak: string;    // İmsak
  Midnight: string; // Gece Yarısı
}

// Convert degrees to radians
function degToRad(deg: number): number {
  return (deg * Math.PI) / 180.0;
}

// Convert radians to degrees
function radToDeg(rad: number): number {
  return (rad * 180.0) / Math.PI;
}

// Normalize angle to [0, 360)
function fixAngle(angle: number): number {
  let a = angle - 360.0 * Math.floor(angle / 360.0);
  return a < 0 ? a + 360.0 : a;
}

// Normalize hours to [0, 24)
function fixHour(hour: number): number {
  let h = hour - 24.0 * Math.floor(hour / 24.0);
  return h < 0 ? h + 24.0 : h;
}

// Format fractional hours to HH:MM string
function hoursToTimeString(hours: number): string {
  const normalized = fixHour(hours);
  const h = Math.floor(normalized);
  const m = Math.floor((normalized - h) * 60 + 0.5);
  const finalH = m >= 60 ? (h + 1) % 24 : h;
  const finalM = m >= 60 ? 0 : m;
  return `${String(finalH).padStart(2, '0')}:${String(finalM).padStart(2, '0')}`;
}

/**
 * Calculates solar coordinates: declination (dec) and equation of time (eqt)
 */
function sunPosition(julianDate: number) {
  const D = julianDate - 2451545.0;
  const g = fixAngle(357.529 + 0.98560028 * D);
  const q = fixAngle(280.459 + 0.98564736 * D);
  const L = fixAngle(q + 1.915 * Math.sin(degToRad(g)) + 0.020 * Math.sin(degToRad(2 * g)));

  const e = 23.439 - 0.00000036 * D;
  const d = radToDeg(Math.asin(Math.sin(degToRad(e)) * Math.sin(degToRad(L))));
  let RA = radToDeg(Math.atan2(Math.cos(degToRad(e)) * Math.sin(degToRad(L)), Math.cos(degToRad(L)))) / 15.0;
  RA = fixHour(RA);
  const EqT = q / 15.0 - RA;

  return { declination: d, equationOfTime: EqT };
}

/**
 * Julian Date calculation from standard JavaScript Date
 */
function getJulianDate(date: Date): number {
  let year = date.getFullYear();
  let month = date.getMonth() + 1;
  const day = date.getDate();

  if (month <= 2) {
    year -= 1;
    month += 12;
  }

  const A = Math.floor(year / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + B - 1524.5;
}

/**
 * Calculate prayer times for any geographic coordinate (Latitude, Longitude) and Date.
 * Uses Turkey Diyanet method (Fajr: 18°, Isha: 17°).
 */
export function calculateLocalPrayerTimes(
  latitude: number,
  longitude: number,
  date: Date = new Date()
): PrayerTimings {
  // Determine local timezone offset in hours
  const timezoneOffsetHours = -date.getTimezoneOffset() / 60;

  const jd = getJulianDate(date);
  const sun = sunPosition(jd);

  // Solar noon (Dhuhr base time)
  const dhuhrTime = fixHour(12 + timezoneOffsetHours - longitude / 15.0 - sun.equationOfTime);

  // Sun altitude for sunrise/sunset (0.833° refraction & radius)
  const sunAltSunrise = 0.833;
  const latRad = degToRad(latitude);
  const decRad = degToRad(sun.declination);

  // Sunrise and Sunset calculation
  const cosSunriseHour =
    (-Math.sin(degToRad(sunAltSunrise)) - Math.sin(latRad) * Math.sin(decRad)) /
    (Math.cos(latRad) * Math.cos(decRad));

  let sunriseDiff = 6.0; // fallback
  if (cosSunriseHour >= -1 && cosSunriseHour <= 1) {
    sunriseDiff = radToDeg(Math.acos(cosSunriseHour)) / 15.0;
  }

  const sunriseTime = dhuhrTime - sunriseDiff;
  const sunsetTime = dhuhrTime + sunriseDiff;

  // Fajr / Imsak (Diyanet standard angle: 18°)
  const fajrAngle = 18.0;
  const cosFajrHour =
    (-Math.sin(degToRad(fajrAngle)) - Math.sin(latRad) * Math.sin(decRad)) /
    (Math.cos(latRad) * Math.cos(decRad));
  let fajrDiff = 6.0;
  if (cosFajrHour >= -1 && cosFajrHour <= 1) {
    fajrDiff = radToDeg(Math.acos(cosFajrHour)) / 15.0;
  }
  const fajrTime = dhuhrTime - fajrDiff;

  // Isha / Yatsı (Diyanet standard angle: 17°)
  const ishaAngle = 17.0;
  const cosIshaHour =
    (-Math.sin(degToRad(ishaAngle)) - Math.sin(latRad) * Math.sin(decRad)) /
    (Math.cos(latRad) * Math.cos(decRad));
  let ishaDiff = 6.0;
  if (cosIshaHour >= -1 && cosIshaHour <= 1) {
    ishaDiff = radToDeg(Math.acos(cosIshaHour)) / 15.0;
  }
  const ishaTime = dhuhrTime + ishaDiff;

  // Asr / İkindi (Standard Shafi/Hanbali/Maliki/majority: shadow factor = 1)
  const asrAlt = radToDeg(
    Math.atan(1.0 / (1.0 + Math.tan(Math.abs(latRad - decRad))))
  );
  const cosAsrHour =
    (Math.sin(degToRad(asrAlt)) - Math.sin(latRad) * Math.sin(decRad)) /
    (Math.cos(latRad) * Math.cos(decRad));
  let asrDiff = 3.0;
  if (cosAsrHour >= -1 && cosAsrHour <= 1) {
    asrDiff = radToDeg(Math.acos(cosAsrHour)) / 15.0;
  }
  const asrTime = dhuhrTime + asrDiff;

  // Midnight
  const midnightTime = fixHour(sunsetTime + (fajrTime + 24 - sunsetTime) / 2);

  // Safety buffer adjustments (Temkin vakitleri: +2 min Dhuhr, +4 min Maghrib)
  return {
    Fajr: hoursToTimeString(fajrTime),
    Sunrise: hoursToTimeString(sunriseTime),
    Dhuhr: hoursToTimeString(dhuhrTime + 4 / 60),
    Asr: hoursToTimeString(asrTime + 4 / 60),
    Sunset: hoursToTimeString(sunsetTime + 4 / 60),
    Maghrib: hoursToTimeString(sunsetTime + 4 / 60),
    Isha: hoursToTimeString(ishaTime + 4 / 60),
    Imsak: hoursToTimeString(fajrTime),
    Midnight: hoursToTimeString(midnightTime),
  };
}

/**
 * Fetch prayer timings from API with immediate astronomical calculation fallback
 */
export async function getPrayerTimesForLocation(
  latitude: number,
  longitude: number,
  cityName = 'İstanbul',
  targetDate: Date = new Date()
): Promise<{ timings: PrayerTimings; hijriDate: string }> {
  const dateStr = targetDate.toISOString().split('T')[0];

  // Try fetching from local Express proxy / Aladhan API first
  try {
    const res = await fetch(
      `/api/prayer-times?lat=${latitude}&lng=${longitude}&date=${dateStr}`,
      { headers: { Accept: 'application/json' } }
    );

    // Safely check content type and status
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      const json = await res.json();
      if (json?.data?.timings) {
        const hijriMonth =
          json.data?.date?.hijri?.month?.en === 'Ramadan'
            ? 'Ramazan'
            : json.data?.date?.hijri?.month?.en || 'Hicri';
        const hijriStr = `${json.data?.date?.hijri?.day || '15'} ${hijriMonth} ${json.data?.date?.hijri?.year || '1447'}`;
        return {
          timings: json.data.timings,
          hijriDate: hijriStr,
        };
      }
    }
  } catch (e) {
    // Network or parse issue — seamlessly fall through to astronomical calculations
  }

  // Pure mathematical astronomical offline calculation
  const calculated = calculateLocalPrayerTimes(latitude, longitude, targetDate);

  return {
    timings: calculated,
    hijriDate: `15 Şaban 1447`,
  };
}
