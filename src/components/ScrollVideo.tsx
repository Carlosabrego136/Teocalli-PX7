const VIDEO_URL =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260611_104107_121bfb5a-b1df-4e0d-8240-25b81f7cc85d.mp4";

export default function ScrollVideo() {
  return (
    <div className="fixed inset-0 -z-10 bg-[#0a0a0a]">
      <video
        autoPlay
        loop
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
