export interface NavItem {
  href:  string;
  label: string;
  icon:  string;
}

export const NAV_CONFIG: Record<string, NavItem[]> = {
  SUPER_ADMIN: [
    { href: "/super-admin",        label: "Dashboard", icon: "LayoutDashboard" },
    { href: "/super-admin/admins", label: "Admins",    icon: "Users"           },
    { href: "/super-admin/users",  label: "Users",     icon: "UsersRound"      },
    { href: "/super-admin/analytics", label: "Analytics", icon: "BarChart"     },
    { href: "/super-admin/audit",  label: "Audit Log", icon: "ScrollText"      },
    { href: "/super-admin/system", label: "System",    icon: "Settings"        },
  ],
  ADMIN: [
    { href: "/admin",           label: "Dashboard", icon: "LayoutDashboard" },
    { href: "/admin/tenants",   label: "Tenants",   icon: "Building2"       },
    { href: "/admin/staff",     label: "Staff Members", icon: "Users"       },
    { href: "/admin/analytics", label: "Analytics", icon: "BarChart"        },
    { href: "/admin/activity",  label: "Activity Log",  icon: "Activity"    },
    { href: "/admin/plans",     label: "Plans",     icon: "ScrollText"      },
    { href: "/admin/support",   label: "Helpdesk",  icon: "UserCircle"      },
    { href: "/admin/settings",  label: "Settings",  icon: "Settings"        },
  ],
  ACCOUNT_MANAGER: [
    { href: "/staff", label: "Tenants", icon: "Building2" },
  ],
  MANAGER: [
    { href: "/manager",           label: "Dashboard",  icon: "LayoutDashboard" },
    { href: "/manager/operations",label: "Sites & Ops", icon: "FolderKanban"    },
    { href: "/manager/users",     label: "Staff & Team", icon: "Users"           },
    { href: "/manager/analytics", label: "Analytics",  icon: "BarChart"        },
    { href: "/manager/audit",     label: "Audit Log",  icon: "ScrollText"      },
    { href: "/manager/settings",  label: "Settings",   icon: "Settings"        },
    { href: "/manager/support",   label: "Support",    icon: "UserCircle"      },
  ],
  SITE_MANAGER: [
    { href: "/site-manager",            label: "Dashboard",   icon: "LayoutDashboard" },
    { href: "/site-manager/officers",   label: "Personnel",   icon: "Users"           },
    { href: "/site-manager/operations", label: "Operations",  icon: "FolderKanban"    },
    { href: "/site-manager/analytics",  label: "Analytics",   icon: "BarChart"        },
    { href: "/site-manager/support",    label: "Support",     icon: "LifeBuoy"        },
  ],
  GUARD: [
    { href: "/guard", label: "Dashboard", icon: "LayoutDashboard" },
    { href: "/guard/attendance", label: "Attendance", icon: "ClipboardCheck" },
    { href: "/guard/shifts", label: "My Shifts", icon: "Calendar" },
    { href: "/guard/visitors", label: "Visitors", icon: "Contact" },
    { href: "/guard/compliance", label: "Occurrence Book", icon: "CheckCircle2" },
  ],
};
