export type NavLink = {
  title: string;
  href: string;
};

export type NavGroup = {
  title: string;
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
    { title: "Home", href: "/" },
    { title: "Documents", href: "/documents" },
    { title: "Resident Portal", href: "/portal" },
    { title: "Compliance", href: "/compliance" },
    { title: "Votes", href: "/votes" },
  ],
  groups: [
    {
      title: "Finances",
      links: [
        { title: "Dues", href: "/finances/dues" },
        { title: "Ledger", href: "/finances/ledger" },
      ],
    },
    {
      title: "Communications",
      links: [
        { title: "Announcements", href: "/communications/announcements" },
      ],
    },
    {
      title: "Compliance & Enforcement",
      links: [
        { title: "Violations", href: "/violations" },
        { title: "Compliance", href: "/compliance" },
      ],
    },
    {
      title: "Resident Experience",
      links: [{ title: "Portal Home", href: "/portal" }],
    },
    {
      title: "Governance",
      links: [{ title: "Votes", href: "/votes" }],
    },
  ],
};
