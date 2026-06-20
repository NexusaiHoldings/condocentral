export type NavLink = {
  label: string;
  href: string;
};

export type NavGroup = {
  label: string;
  links: NavLink[];
};

export type NavConfig = {
  logoHref: string;
  primary: NavLink[];
  groups: NavGroup[];
};

export const NAV_CONFIG: NavConfig = {
  logoHref: "/",
  primary: [
    { label: "Home", href: "/" },
    { label: "Documents", href: "/documents" },
    { label: "Resident Portal", href: "/portal" },
    { label: "Compliance", href: "/compliance" },
    { label: "Votes", href: "/votes" },
  ],
  groups: [
    {
      label: "Finances",
      links: [
        { label: "Dues", href: "/finances/dues" },
        { label: "Ledger", href: "/finances/ledger" },
      ],
    },
    {
      label: "Communications",
      links: [
        { label: "Announcements", href: "/communications/announcements" },
      ],
    },
    {
      label: "Compliance & Enforcement",
      links: [
        { label: "Violations", href: "/violations" },
        { label: "Compliance", href: "/compliance" },
      ],
    },
    {
      label: "Resident Experience",
      links: [{ label: "Portal Home", href: "/portal" }],
    },
    {
      label: "Governance",
      links: [{ label: "Votes", href: "/votes" }],
    },
  ],
};
