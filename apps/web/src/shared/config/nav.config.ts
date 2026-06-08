export interface NavItem {
  href:  string;
  label: string;
  icon:  string;
}

export const NAV_CONFIG: Record<string, NavItem[]> = {
  SUPER_ADMIN: [
    { href: "/super-admin",        label: "Overview", icon: "LayoutDashboard" },
    { href: "/super-admin/admins", label: "Admins",   icon: "Users"           },
    { href: "/super-admin/audit",  label: "Audit Log", icon: "ScrollText"     },
    { href: "/super-admin/system", label: "System",   icon: "Settings"        },
  ],
  ADMIN: [
    { href: "/admin",           label: "Overview",  icon: "LayoutDashboard" },
    { href: "/admin/activity",  label: "Activity Log",  icon: "Activity"        },
    { href: "/admin/plans",     label: "Plans",     icon: "ScrollText"      },
    { href: "/admin/support",   label: "Helpdesk",  icon: "UserCircle"      },
    { href: "/admin/settings",  label: "Settings",  icon: "Settings"        },
  ],
  MANAGER: [
    { href: "/manager",           label: "Overview",   icon: "LayoutDashboard" },
    { href: "/manager/sites",     label: "Sites",      icon: "MapPin"          },
    { href: "/manager/users",     label: "Personnel",  icon: "Users"           },
    { href: "/manager/shifts",    label: "Shifts",     icon: "Calendar"        },
    { href: "/manager/visitors",  label: "Visitors",   icon: "Contact"         },
    { href: "/manager/incidents", label: "Incidents",  icon: "ShieldAlert"     },
    { href: "/manager/reports",   label: "Reports",    icon: "BarChart"        },
    { href: "/manager/audit",     label: "Audit Log",  icon: "ScrollText"      },
    { href: "/manager/settings",  label: "Settings",   icon: "Settings"        },
    { href: "/manager/support",   label: "Support",    icon: "UserCircle"      },
  ],
  SITE_MANAGER: [
    { href: "/site-manager",      label: "My Site",    icon: "MapPin"          },
    { href: "/manager/settings",  label: "Settings",   icon: "Settings"        },
  ],
  USER: [
    { href: "/user", label: "Dashboard", icon: "LayoutDashboard" },
  ],
};
