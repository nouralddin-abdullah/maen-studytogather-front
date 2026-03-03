import { useEffect, useRef, useState, useCallback } from "react";
import {
  SOUND_TRACKS,
  R2_SOUNDS_BASE,
  AMBIENT_SOUNDS,
} from "@/utils/constants";

/* ────────────────────────────────────────────────────
   Radio Browser API — fetch top lofi stations
   ──────────────────────────────────────────────────── */
const RADIO_BROWSER_URL =
  "https://de1.api.radio-browser.info/json/stations/search";

async function fetchLofiStations() {
  const params = new URLSearchParams({
    tag: "lofi",
    limit: "20",
    order: "votes",
    reverse: "true",
    hidebroken: "true",
    has_extended_info: "false",
  });
  const res = await fetch(`${RADIO_BROWSER_URL}?${params}`);
  if (!res.ok) throw new Error("Failed to fetch lofi stations");
  const data = await res.json();
  // Filter to stations that actually have a stream URL
  return data
    .filter((s) => s.url_resolved || s.url)
    .map((s) => ({
      id: s.stationuuid,
      label: `🎵 ${s.name}`,
      streamUrl: s.url_resolved || s.url,
      favicon: s.favicon || null,
    }));
}

/* ────────────────────────────────────────────────────
   Storage keys for remembering user track choices
   ──────────────────────────────────────────────────── */
const STORAGE_KEY = "ambient_track_prefs";

function loadPrefs() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function savePrefs(prefs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

/* ════════════════════════════════════════════════════
   useAmbientSound hook
   ════════════════════════════════════════════════════ */
/**
 * @param {string}  ambientSound – AMBIENT_SOUNDS enum value from room
 * @param {number}  volume       – 0-100
 * @param {boolean} isMuted
 */
export default function useAmbientSound(ambientSound, volume, isMuted) {
  const audioRef = useRef(null);
  const prevSoundRef = useRef(null);

  // ── Track management ──
  const [currentTrackId, setCurrentTrackId] = useState(() => {
    const prefs = loadPrefs();
    return prefs[ambientSound] || null;
  });

  // ── Lofi stations ──
  const [lofiStations, setLofiStations] = useState([]);
  const [isLoadingLofi, setIsLoadingLofi] = useState(false);
  const lofiLoadedRef = useRef(false);

  // ── Resolve the current track object ──
  const resolveTrack = useCallback(
    (sound, trackId) => {
      if (sound === AMBIENT_SOUNDS.RAIN || sound === AMBIENT_SOUNDS.SEA) {
        const tracks = SOUND_TRACKS[sound === AMBIENT_SOUNDS.RAIN ? "RAIN" : "SEA"];
        if (!tracks?.length) return null;
        return tracks.find((t) => t.id === trackId) || tracks[0];
      }
      if (sound === AMBIENT_SOUNDS.LOFIC_MUSIC) {
        if (!lofiStations.length) return null;
        return lofiStations.find((s) => s.id === trackId) || lofiStations[0];
      }
      return null;
    },
    [lofiStations],
  );

  // ── Build audio URL ──
  const getAudioUrl = useCallback((sound, track) => {
    if (!track) return null;
    if (sound === AMBIENT_SOUNDS.RAIN || sound === AMBIENT_SOUNDS.SEA) {
      return `${R2_SOUNDS_BASE}/${track.file}`;
    }
    if (sound === AMBIENT_SOUNDS.LOFIC_MUSIC) {
      return track.streamUrl;
    }
    return null;
  }, []);

  // ── Stop current audio ──
  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current.load();
      audioRef.current = null;
    }
  }, []);

  // ── Play audio ──
  const playAudio = useCallback(
    (url, shouldLoop) => {
      stopAudio();
      const audio = new Audio(url);
      audio.loop = shouldLoop;
      audio.volume = isMuted ? 0 : volume / 100;
      audio.crossOrigin = "anonymous";
      audio.play().catch((err) => {
        console.warn("Ambient audio play failed:", err.message);
      });
      audioRef.current = audio;
    },
    [volume, isMuted, stopAudio],
  );

  // ── Fetch lofi stations when LOFIC_MUSIC is active ──
  useEffect(() => {
    if (ambientSound !== AMBIENT_SOUNDS.LOFIC_MUSIC) return;
    if (lofiLoadedRef.current) return;

    setIsLoadingLofi(true);
    lofiLoadedRef.current = true;

    fetchLofiStations()
      .then((stations) => {
        setLofiStations(stations);
      })
      .catch((err) => {
        console.error("Failed to load lofi stations:", err);
        lofiLoadedRef.current = false; // allow retry
      })
      .finally(() => setIsLoadingLofi(false));
  }, [ambientSound]);

  // ── When ambientSound type changes, reset to saved pref or default ──
  useEffect(() => {
    if (ambientSound !== prevSoundRef.current) {
      prevSoundRef.current = ambientSound;
      const prefs = loadPrefs();
      setCurrentTrackId(prefs[ambientSound] || null);
    }
  }, [ambientSound]);

  // ── Main effect: play / switch audio when sound, track, or lofi stations change ──
  useEffect(() => {
    if (ambientSound === AMBIENT_SOUNDS.NONE || !ambientSound) {
      stopAudio();
      return;
    }

    const track = resolveTrack(ambientSound, currentTrackId);
    if (!track) {
      // Lofi stations might still be loading
      stopAudio();
      return;
    }

    const url = getAudioUrl(ambientSound, track);
    if (!url) {
      stopAudio();
      return;
    }

    const shouldLoop =
      ambientSound === AMBIENT_SOUNDS.RAIN ||
      ambientSound === AMBIENT_SOUNDS.SEA;

    playAudio(url, shouldLoop);

    // Cleanup on unmount or before re-fire
    return () => stopAudio();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ambientSound, currentTrackId, lofiStations, resolveTrack, getAudioUrl]);

  // ── Volume / mute reactivity ──
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume / 100;
    }
  }, [volume, isMuted]);

  // ── Change track (user picks a variant) ──
  const changeTrack = useCallback(
    (trackId) => {
      setCurrentTrackId(trackId);
      // Persist preference
      const prefs = loadPrefs();
      prefs[ambientSound] = trackId;
      savePrefs(prefs);
    },
    [ambientSound],
  );

  // ── Derive track list for current sound ──
  const availableTracks =
    ambientSound === AMBIENT_SOUNDS.RAIN
      ? SOUND_TRACKS.RAIN
      : ambientSound === AMBIENT_SOUNDS.SEA
        ? SOUND_TRACKS.SEA
        : ambientSound === AMBIENT_SOUNDS.LOFIC_MUSIC
          ? lofiStations
          : [];

  const currentTrack = resolveTrack(ambientSound, currentTrackId);

  return {
    currentTrack,
    availableTracks,
    changeTrack,
    isLoadingLofi,
  };
}
