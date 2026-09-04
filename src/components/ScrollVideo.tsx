import { useEffect, useRef, useState } from "react";

const VIDEO_URL =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260611_104107_121bfb5a-b1df-4e0d-8240-25b81f7cc85d.mp4";

const MAX_FRAMES = 120;
const MAX_FRAME_WIDTH = 1280;

export default function ScrollVideo() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fallbackVideoRef = useRef<HTMLVideoElement>(null);
  const [framesReady, setFramesReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const fallbackVideo = fallbackVideoRef.current;
    if (!canvas || !fallbackVideo) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let cancelled = false;
    let frames: ImageBitmap[] = [];
    let framesReadyLocal = false;
    let targetProgress = 0;
    let smoothed = 0;
    let lastFrameIndex = -1;
    let videoSeeking = false;
    let rafId = 0;
    let objectUrl: string | null = null;

    function resizeCanvas() {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      lastFrameIndex = -1;
    }

    function drawCover(frame: ImageBitmap) {
      if (!canvas || !ctx) return;
      const cw = canvas.width;
      const ch = canvas.height;
      const s = Math.max(cw / frame.width, ch / frame.height);
      const dw = frame.width * s;
      const dh = frame.height * s;
      ctx.drawImage(frame, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
    }

    function onScroll() {
      const scrollable =
        document.documentElement.scrollHeight - window.innerHeight;
      targetProgress =
        scrollable > 0
          ? Math.min(Math.max(window.scrollY / scrollable, 0), 1)
          : 0;
    }

    function onSeeked() {
      videoSeeking = false;
    }

    function tick() {
      rafId = requestAnimationFrame(tick);
      smoothed += (targetProgress - smoothed) * 0.1;

      if (framesReadyLocal && frames.length > 1) {
        const index = Math.min(
          Math.round(smoothed * (frames.length - 1)),
          frames.length - 1
        );
        if (index !== lastFrameIndex) {
          lastFrameIndex = index;
          drawCover(frames[index]);
        }
      } else if (fallbackVideo && fallbackVideo.duration && !videoSeeking) {
        const t = smoothed * fallbackVideo.duration;
        if (Math.abs(fallbackVideo.currentTime - t) > 0.001) {
          videoSeeking = true;
          fallbackVideo.currentTime = t;
        }
      }
    }

    async function extractFrames(src: string): Promise<ImageBitmap[]> {
      const video = document.createElement("video");
      video.src = src;
      video.muted = true;
      video.playsInline = true;
      video.preload = "auto";

      await new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = () => resolve();
        video.onerror = () => reject(new Error("video load failed"));
      });

      if (cancelled) return [];

      const scale = Math.min(1, MAX_FRAME_WIDTH / video.videoWidth);
      const w = Math.round(video.videoWidth * scale);
      const h = Math.round(video.videoHeight * scale);
      const count = Math.min(
        Math.max(Math.round(video.duration * 24), 30),
        MAX_FRAMES
      );
      const result: ImageBitmap[] = [];

      for (let i = 0; i < count; i++) {
        if (cancelled) break;
        const time = (i / (count - 1)) * Math.max(video.duration - 0.05, 0);
        await new Promise<void>((resolve) => {
          video.onseeked = () => resolve();
          video.currentTime = time;
        });
        if (cancelled) break;
        result.push(
          await createImageBitmap(video, { resizeWidth: w, resizeHeight: h })
        );
      }

      video.removeAttribute("src");
      video.load();
      return result;
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", resizeCanvas);
    fallbackVideo.addEventListener("seeked", onSeeked);
    resizeCanvas();
    onScroll();
    rafId = requestAnimationFrame(tick);

    (async () => {
      try {
        const res = await fetch(VIDEO_URL);
        if (!res.ok || cancelled) return;
        const blob = await res.blob();
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        const extracted = await extractFrames(objectUrl);

        if (!cancelled && extracted.length > 1) {
          frames = extracted;
          framesReadyLocal = true;
          setFramesReady(true);
        }
      } catch {
        // fallback video continues working
      }
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", resizeCanvas);
      fallbackVideo.removeEventListener("seeked", onSeeked);
      frames.forEach((f) => f.close());
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, []);

  return (
    <div className="fixed inset-0 -z-10 bg-[#0a0a0a]">
      <video
        ref={fallbackVideoRef}
        muted
        playsInline
        preload="auto"
        src={VIDEO_URL}
        className="absolute inset-0 h-full w-full object-cover"
        style={{ display: framesReady ? "none" : undefined }}
      />
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 h-full w-full ${
          framesReady ? "" : "invisible"
        }`}
      />
      <div className="absolute inset-0 bg-black/20" />
    </div>
  );
}
