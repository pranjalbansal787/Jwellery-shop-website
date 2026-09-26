import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };
const base = (size = 20) => ({ width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.25, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true });

export const IconSearch = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></svg>);
export const IconBag = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M5.5 8h13l-1 12.5h-11z" /><path d="M9 8V6.5a3 3 0 0 1 6 0V8" /></svg>);
export const IconHeart = ({ size, filled, ...p }: P & { filled?: boolean }) => (<svg {...base(size)} fill={filled ? "currentColor" : "none"} {...p}><path d="M12 19.5s-7-4.3-7-9.4A3.9 3.9 0 0 1 12 8a3.9 3.9 0 0 1 7 2.1c0 5.1-7 9.4-7 9.4z" /></svg>);
export const IconUser = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><circle cx="12" cy="8.5" r="3.5" /><path d="M5 20c1.2-3.5 4-5 7-5s5.8 1.5 7 5" /></svg>);
export const IconClose = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M6 6l12 12M18 6 6 18" /></svg>);
export const IconMenu = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M4 9h16M4 15h16" /></svg>);
export const IconArrow = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M4 12h15M14 7l5 5-5 5" /></svg>);
export const IconArrowLeft = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M20 12H5M10 7l-5 5 5 5" /></svg>);
export const IconChevron = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="m7 10 5 5 5-5" /></svg>);
export const IconPlus = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M12 5v14M5 12h14" /></svg>);
export const IconMinus = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M5 12h14" /></svg>);
export const IconCheck = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>);
export const IconRotate = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M20 12a8 8 0 1 1-2.3-5.7" /><path d="M20 4v4h-4" /></svg>);
export const IconExpand = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>);
export const IconCamera = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M4 8h3.5L9 6h6l1.5 2H20v11H4z" /><circle cx="12" cy="13" r="3.5" /></svg>);
export const IconPin = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11z" /><circle cx="12" cy="10" r="2.3" /></svg>);
export const IconCalendar = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><rect x="4" y="5.5" width="16" height="14.5" /><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" /></svg>);
export const IconRuler = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="m3.5 16.5 13-13 4 4-13 13z" /><path d="m7 13 1.5 1.5M10 10l1.5 1.5M13 7l1.5 1.5" /></svg>);
export const IconGift = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><rect x="4" y="9" width="16" height="11" /><path d="M3 9h18M12 9v11M12 9c-1.5-3.5-5-4-5-1.8C7 9 12 9 12 9zm0 0c1.5-3.5 5-4 5-1.8C17 9 12 9 12 9z" /></svg>);
export const IconShield = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M12 3.5 5 6v5.5c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6z" /><path d="m9 12 2.2 2.2L15.5 10" /></svg>);
export const IconTruck = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M3 6.5h11v10H3zM14 10h4l3 3.5v3h-7" /><circle cx="7" cy="17.5" r="1.6" /><circle cx="17.5" cy="17.5" r="1.6" /></svg>);
export const IconSparkle = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M12 3v5M12 16v5M3 12h5M16 12h5M6.5 6.5l2.5 2.5M15 15l2.5 2.5M17.5 6.5 15 9M9 15l-2.5 2.5" /></svg>);
export const IconWhatsApp = ({ size = 20, ...p }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden {...p}>
    <path d="M12.04 2.5a9.4 9.4 0 0 0-8.1 14.2L2.6 21.5l4.9-1.3a9.4 9.4 0 1 0 4.54-17.7zm0 17.2a7.8 7.8 0 0 1-4-1.1l-.3-.17-2.9.76.78-2.83-.19-.3a7.8 7.8 0 1 1 6.6 3.64zm4.3-5.85c-.24-.12-1.4-.69-1.6-.77-.22-.08-.37-.12-.53.12-.16.23-.61.77-.75.93-.14.16-.28.18-.51.06a6.4 6.4 0 0 1-3.2-2.8c-.24-.41.24-.38.7-1.27.07-.16.04-.3-.02-.41-.06-.12-.53-1.28-.73-1.75-.19-.46-.39-.4-.53-.4h-.45a.87.87 0 0 0-.63.29 2.64 2.64 0 0 0-.82 1.96 4.6 4.6 0 0 0 .96 2.44 10.5 10.5 0 0 0 4.03 3.56c1.5.65 2.08.7 2.83.6.46-.07 1.4-.57 1.6-1.13.2-.55.2-1.03.14-1.13-.06-.1-.22-.16-.45-.28z" />
  </svg>
);
