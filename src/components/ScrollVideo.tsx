import { useEffect, useRef } from "react";

const VIDEO_URL =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260611_104107_121bfb5a-b1df-4e0d-8240-25b81f7cc85d.mp4";

// Point (in seconds) where the intro finishes and the "observing" loop
// should start. Adjust this to match the exact moment the eye is fully
// formed in the video.
const LOOP_START = 4.5;

export default function ScrollVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    function onTimeUpdate() {
      if (!video) return;
      // Once we reach the end, jump back to LOOP_START instead of the
      // beginning, so the intro only plays once and the tail loops.
      if (video.currentTime >= video.duration - 0.05) {
        video.currentTime = LOOP_START;
        video.play();
      }
    }

    video.addEventListener("timeupdate", onTimeUpdate);
    return () => video.removeEventListener("timeupdate", onTimeUpdate);
  }, []);

  return (
    <div className="fixed inset-0 -z-10 bg-[#0a0a0a]">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        preload="auto"
        src={VIDEO_URL}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-black/20" />
    </div>
  );
}
