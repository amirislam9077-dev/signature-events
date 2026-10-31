import { useEffect, useRef, useState } from "react";
import { BACKGROUND_MUSIC } from "../data";

const MUTE_KEY = "signature_music_muted";
const readMuted = () => {
  try { return localStorage.getItem(MUTE_KEY) === "1"; } catch { return false; }
};

// Website ke background mein music + mute button.
// Browser awaaz wala music khud se shuru nahi hone dete, is liye visitor ke pehle click/touch par shuru hota hai.
export default function MusicPlayer() {
  const audioRef = useRef(null);
  const [available, setAvailable] = useState(false);
  const [muted, setMuted] = useState(readMuted);
  const [playing, setPlaying] = useState(false);

  // file mojood hai ya nahi
  useEffect(() => {
    if (!BACKGROUND_MUSIC) return;
    fetch(BACKGROUND_MUSIC, { method: "HEAD" })
      .then((r) => setAvailable(r.ok && (r.headers.get("content-type") || "").startsWith("audio")))
      .catch(() => setAvailable(false));
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!available || !audio) return;
    audio.volume = 0.35;
    audio.muted = muted;
    if (muted) return;

    const start = () => audio.play().then(() => setPlaying(true)).catch(() => {});
    start();
    const events = ["pointerdown", "keydown", "touchstart"];
    const onFirst = () => { start(); events.forEach((e) => window.removeEventListener(e, onFirst)); };
    events.forEach((e) => window.addEventListener(e, onFirst, { once: true, passive: true }));
    return () => events.forEach((e) => window.removeEventListener(e, onFirst));
  }, [available, muted]);

  const toggle = () => {
    const audio = audioRef.current;
    const next = !muted;
    setMuted(next);
    try { localStorage.setItem(MUTE_KEY, next ? "1" : "0"); } catch { /* private mode */ }
    if (!audio) return;
    audio.muted = next;
    if (!next) audio.play().then(() => setPlaying(true)).catch(() => {});
  };

  if (!available) return null;

  const on = playing && !muted;
  return (
    <>
      <audio ref={audioRef} src={BACKGROUND_MUSIC} loop preload="auto" onPause={() => setPlaying(false)} onPlay={() => setPlaying(true)} />
      <button className={`music-btn ${on ? "is-on" : ""}`} onClick={toggle}
        aria-label={muted ? "Unmute music" : "Mute music"} title={muted ? "Play music" : "Mute music"}>
        {on ? (
          <span className="music-btn__bars" aria-hidden="true"><i /><i /><i /><i /></span>
        ) : (
          <span aria-hidden="true">🔇</span>
        )}
        <span className="music-btn__label">{muted ? "Music off" : on ? "Mute" : "Play music"}</span>
      </button>
    </>
  );
}
