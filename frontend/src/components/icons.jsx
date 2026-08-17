import React from 'react';

const base = (props) => ({ width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', ...props });

export const HomeIcon = (p) => (<svg {...base(p)}><path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9"/></svg>);
export const DocIcon = (p) => (<svg {...base(p)}><path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"/><path d="M14 3v5h5"/></svg>);
export const ShareIcon = (p) => (<svg {...base(p)}><circle cx="18" cy="5" r="2.4"/><circle cx="6" cy="12" r="2.4"/><circle cx="18" cy="19" r="2.4"/><path d="m8.2 10.8 7.6-4.2M8.2 13.2l7.6 4.2"/></svg>);
export const StarIcon = (p) => (<svg {...base(p)}><path d="M12 3.5 14.6 9l6 .9-4.3 4.2 1 6-5.3-2.8-5.3 2.8 1-6-4.3-4.2 6-.9L12 3.5Z"/></svg>);
export const TrashIcon = (p) => (<svg {...base(p)}><path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="m6 7 .9 13a1 1 0 0 0 1 1h8.2a1 1 0 0 0 1-1L18 7"/><path d="M10 11v6M14 11v6"/></svg>);
export const FolderIcon = (p) => (<svg {...base(p)}><path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h4l2 2.5h9A1.5 1.5 0 0 1 21 9v9.5A1.5 1.5 0 0 1 19.5 20h-15A1.5 1.5 0 0 1 3 18.5Z"/></svg>);
export const PlusIcon = (p) => (<svg {...base(p)}><path d="M12 5v14M5 12h14"/></svg>);
export const MoonIcon = (p) => (<svg {...base(p)}><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z"/></svg>);
export const SunIcon = (p) => (<svg {...base(p)}><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/></svg>);
export const UndoIcon = (p) => (<svg {...base(p)}><path d="M9 7 4 12l5 5"/><path d="M4 12h11a5 5 0 0 1 0 10h-1"/></svg>);
export const RedoIcon = (p) => (<svg {...base(p)}><path d="m15 7 5 5-5 5"/><path d="M20 12H9a5 5 0 0 0 0 10h1"/></svg>);
export const BoldIcon = (p) => (<svg {...base(p)}><path d="M7 4h6a3.5 3.5 0 0 1 0 7H7z"/><path d="M7 11h7a3.5 3.5 0 0 1 0 7H7z"/></svg>);
export const ItalicIcon = (p) => (<svg {...base(p)}><path d="M11 4h6M7 20h6M14 4 10 20"/></svg>);
export const UnderlineIcon = (p) => (<svg {...base(p)}><path d="M6 4v7a6 6 0 0 0 12 0V4M5 20h14"/></svg>);
export const LinkIcon = (p) => (<svg {...base(p)}><path d="M9.5 14.5 14.5 9.5"/><path d="M11 6.5 13 4.4a3.6 3.6 0 0 1 5.1 5.1L16 11.6"/><path d="M13 17.5 11 19.6a3.6 3.6 0 0 1-5.1-5.1L8 12.4"/></svg>);
export const ImageIcon = (p) => (<svg {...base(p)}><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="m21 16-5.5-5.5L4 21"/></svg>);
export const ListIcon = (p) => (<svg {...base(p)}><path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/></svg>);
export const NumListIcon = (p) => (<svg {...base(p)}><path d="M9 6h11M9 12h11M9 18h11"/><text x="1.5" y="7.5" fontSize="5" stroke="none" fill="currentColor">1</text><text x="1.5" y="13.5" fontSize="5" stroke="none" fill="currentColor">2</text><text x="1.5" y="19.5" fontSize="5" stroke="none" fill="currentColor">3</text></svg>);
export const CheckIcon = (p) => (<svg {...base(p)}><path d="m5 12 4 4 10-10"/></svg>);
export const ChevronDown = (p) => (<svg {...base(p)}><path d="m6 9 6 6 6-6"/></svg>);
export const XIcon = (p) => (<svg {...base(p)}><path d="M18 6 6 18M6 6l12 12"/></svg>);
export const MailIcon = (p) => (<svg {...base(p)}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></svg>);
