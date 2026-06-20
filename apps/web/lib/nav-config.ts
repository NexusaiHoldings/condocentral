export const NAV_CONFIG = {
  primary: [
    { label: "Portal", href: "/portal" },
    { label: "Violations", href: "/violations" },
    { label: "Compliance", href: "/compliance" },
    { label: "Votes", href: "/votes" },
    { label: "Documents", href: "/documents" },
  ],
  groups: [
    {
      label: "Finances",
      items: [
        { label: "Dues", href: "/finances/dues" },
        { label: "Ledger", href: "/finances/ledger" },
      ],
    },
    {
      label: "Communications",
      items: [
        { label: "Announcements", href: "/communications/announcements" },
      ],
    },
  ],
};
