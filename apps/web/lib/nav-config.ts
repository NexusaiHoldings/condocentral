export const NAV_CONFIG = {
  primary: [
    { title: "Home", href: "/" },
    { title: "Resident Portal", href: "/portal" },
  ],
  groups: [
    {
      title: "Finances",
      items: [
        { title: "Dues", href: "/finances/dues" },
        { title: "Ledger", href: "/finances/ledger" },
      ],
    },
    {
      title: "Community",
      items: [
        { title: "Announcements", href: "/communications/announcements" },
        { title: "Documents", href: "/documents" },
      ],
    },
    {
      title: "Compliance",
      items: [
        { title: "Violations", href: "/violations" },
        { title: "Compliance", href: "/compliance" },
      ],
    },
    {
      title: "Governance",
      items: [{ title: "Votes", href: "/votes" }],
    },
  ],
} as const;
