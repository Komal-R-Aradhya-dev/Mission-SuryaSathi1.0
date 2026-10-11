export function WebGLFallback() {
  return (
    <div className="h-full w-full bg-[#8ec4e4]" aria-hidden="true">
      <svg viewBox="0 0 800 520" className="h-full w-full" role="img">
        <title>Flat diagram of a terrace, solar panels, water tank and stair cabin</title>
        <defs>
          <linearGradient id="surya-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3d8ec4" />
            <stop offset="62%" stopColor="#d7ecf6" />
            <stop offset="100%" stopColor="#f3d7a6" />
          </linearGradient>
        </defs>
        <rect width="800" height="520" fill="url(#surya-sky)" />
        <circle cx="610" cy="120" r="54" fill="#ffd27a" />
        <circle cx="610" cy="120" r="92" fill="#f0a202" opacity="0.18" />
        <circle cx="610" cy="120" r="140" fill="#e08912" opacity="0.08" />
        <g transform="translate(150 250)">
          <polygon points="40,150 420,40 560,120 180,240" fill="#e7d3b4" />
          <polygon points="40,150 180,240 180,280 40,190" fill="#c4a07a" />
          <polygon points="180,240 560,120 560,160 180,280" fill="#d9c4a4" />
          <polygon points="70,150 400,62 500,118 170,210" fill="#d9cbb6" />
          <g fill="#1f6494" stroke="#f6f1e6" strokeWidth="2">
            <polygon points="150,150 210,128 250,146 190,170" />
            <polygon points="220,124 280,102 320,120 260,144" />
            <polygon points="290,98 350,76 390,94 330,118" />
            <polygon points="175,176 235,154 275,172 215,196" />
            <polygon points="245,150 305,128 345,146 285,170" />
          </g>
          <ellipse cx="120" cy="118" rx="28" ry="16" fill="#3b93c9" />
          <rect x="390" y="78" width="46" height="28" fill="#ecdcc4" />
        </g>
        <text x="40" y="470" fill="#07110e" fontSize="16" fontFamily="Georgia, serif">
          WebGL is unavailable. This flat terrace stands in for the 3D scene.
        </text>
      </svg>
    </div>
  );
}
