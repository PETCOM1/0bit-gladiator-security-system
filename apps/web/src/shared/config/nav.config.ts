export interface NavItem {
  href:  string;
  label: string;
  icon:  string;
}

export const NAV_CONFIG: Record<string, NavItem[]> = {
  SUPER_ADMIN: [
    { href: "/super-admin",        label: "Dashboard", icon: "LayoutDashboard" },
    { href: "/super-admin/admins", label: "Admins",    icon: "Users"           },
    { href: "/super-admin/analytics", label: "Analytics", icon: "BarChart"     },
    { href: "/super-admin/audit",  label: "Audit Log", icon: "ScrollText"      },
    { href: "/super-admin/system", label: "System",    icon: "Settings"        },
  ],
  ADMIN: [
    { href: "/admin",           label: "Dashboard", icon: "LayoutDashboard" },
    { href: "/admin/tenants",   label: "Tenants",   icon: "Building2"       },
    { href: "/admin/analytics", label: "Analytics", icon: "BarChart"        },
    { href: "/admin/activity",  label: "Activity Log",  icon: "Activity"    },
    { href: "/admin/plans",     label: "Plans",     icon: "ScrollText"      },
    { href: "/admin/support",   label: "Helpdesk",  icon: "UserCircle"      },
    { href: "/admin/settings",  label: "Settings",  icon: "Settings"        },
  ],
  MANAGER: [
    { href: "/manager",           label: "Dashboard",  icon: "LayoutDashboard" },
    { href: "/manager/sites",     label: "Sites",      icon: "MapPin"          },
    { href: "/manager/operations",label: "Operations",  icon: "FolderKanban"    },
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
  USER: [
    { href: "/user", label: "Dashboard", icon: "LayoutDashboard" },
    { href: "/user/attendance", label: "Attendance", icon: "ClipboardCheck" },
    { href: "/user/shifts", label: "My Shifts", icon: "Calendar" },
    { href: "/user/visitors", label: "Visitors", icon: "Contact" },
    { href: "/user/compliance", label: "Occurrence Book", icon: "CheckCircle2" },
  ],
};
