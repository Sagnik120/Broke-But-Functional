/** Decorative logo: a notebook page with a rupee sign and a highlighter stroke. */
export function BrandMark() {
  return (
    <svg className="brand-mark" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <rect x="6" y="3" width="36" height="42" rx="8" className="brand-mark__page" />
      <line x1="15" y1="4" x2="15" y2="44" className="brand-mark__margin" />
      <rect x="19" y="27" width="19" height="7" rx="3" className="brand-mark__marker" />
      <text x="29" y="33" textAnchor="middle" className="brand-mark__rupee">
        ₹
      </text>
    </svg>
  );
}
