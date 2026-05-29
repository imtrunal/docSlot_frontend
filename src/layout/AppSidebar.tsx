import { useCallback, useRef, useState } from "react";
import { Link, useLocation } from "react-router";

import {
  MdDashboard,
  MdCalendarMonth,
  MdPeople,
  MdLocalHospital,
  MdKeyboardArrowDown,
} from "react-icons/md";
import { MdEventNote } from "react-icons/md";

import { FaChartPie } from "react-icons/fa";
import { FiBox, FiLogIn } from "react-icons/fi";

import { useSidebar } from "../context/SidebarContext";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

const navItems: NavItem[] = [
  {
    icon: <MdDashboard size={20} />,
    name: "Dashboard",
  },
  {
    icon: <MdCalendarMonth size={20} />,
    name: "Calendar",
    path: "calendar",
  },
  {
    icon: <MdPeople size={20} />,
    name: "Users",
    path: "users",
  },
  {
    icon: <MdEventNote size={20} />,
    name: "Appointment",
  },
  {
    icon: <MdLocalHospital size={20} />,
    name: "Clinics",
    path: "clinics",
  },
];

const othersItems: NavItem[] = [
  {
    icon: <FaChartPie size={18} />,
    name: "Charts",
    subItems: [
      { name: "Line Chart", path: "line-chart" },
      { name: "Bar Chart", path: "bar-chart" },
    ],
  },
  {
    icon: <FiBox size={18} />,
    name: "UI Elements",
    subItems: [
      { name: "Alerts", path: "alerts" },
      { name: "Avatar", path: "avatars" },
      { name: "Badge", path: "badge" },
      { name: "Buttons", path: "buttons" },
      { name: "Images", path: "images" },
      { name: "Videos", path: "videos" },
    ],
  },
  {
    icon: <FiLogIn size={18} />,
    name: "Authentication",
    subItems: [{ name: "Sign In", path: "signin" }],
  },
];

const AppSidebar: React.FC = () => {
  const {
    isExpanded,
    isMobileOpen,
    isHovered,
    setIsHovered,
    setIsMobileOpen,
  } = useSidebar();
  const location = useLocation();

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);

  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = useCallback(
    (path: string) => location.pathname.includes(path),
    [location.pathname]
  );

  const role = localStorage.getItem("role");

  const getDashboardPath = () => {
    const role = localStorage.getItem("role");
    if (role !== "SUPER ADMIN") {
      return "clinic-dashboard";
    }
    return "dashboard";
  };

  const getClinicAppointmentPath = () => {
    const role = localStorage.getItem("role");
    if (role !== "SUPER ADMIN") {
      return "clinicAppointment";
    }
    return "appointment";
  };

  const filteredNavItems = navItems.filter((item) => {
    if (item.name === "Clinics" && role !== "SUPER ADMIN") {
      return false;
    }
    if (item.name === "Users" && role === "RECEPTIONIST") {
      return false;
    }
    return true;
  });

  const collapsed = !isExpanded && !isHovered && !isMobileOpen;

  const renderMenuItems = (items: NavItem[], menuType: "main" | "others") => (
    <ul className="flex flex-col gap-1">
      {items.map((nav, index) => {
        const isItemActive =
          nav.name === "Dashboard"
            ? isActive("dashboard") || isActive("clinic-dashboard")
            : nav.name === "Appointment"
              ? isActive("appointment") || isActive("clinicAppointment")
              : nav.path
                ? isActive(nav.path)
                : false;

        const linkTo =
          nav.name === "Dashboard"
            ? getDashboardPath()
            : nav.name === "Appointment"
              ? getClinicAppointmentPath()
              : nav.path || "#";

        const baseItemClass = `
          relative flex items-center gap-3 px-3 py-2.5 rounded-xl
          transition-all duration-200 group cursor-pointer select-none
          ${isItemActive
            ? "bg-[#465FFF] text-white shadow-[0_4px_14px_rgba(70,95,255,0.35)]"
            : "text-gray-500 dark:text-gray-400 hover:bg-[#465FFF]/8 hover:text-[#465FFF] dark:hover:text-[#7B91FF]"
          }
        `;

        return (
          <li key={nav.name}>
            {/* Active left indicator bar */}
            <div className="relative">
              {isItemActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#2D46E8] rounded-r-full -ml-5 opacity-0 lg:opacity-100 transition-opacity" />
              )}

              {nav.name === "Dashboard" || nav.name === "Appointment" ? (
                <Link to={linkTo} className={baseItemClass}>
                  <span
                    className={`flex-shrink-0 w-5 h-5 ${isItemActive
                      ? "text-white"
                      : ""
                      }`}
                  >
                    {nav.icon}
                  </span>
                  {!collapsed && (
                    <span className="text-sm font-medium tracking-wide whitespace-nowrap">
                      {nav.name}
                    </span>
                  )}
                  {!collapsed && isItemActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/70" />
                  )}
                </Link>
              ) : nav.subItems ? (
                <>
                  <button
                    onClick={() =>
                      setOpenSubmenu(
                        openSubmenu?.index === index && openSubmenu?.type === menuType
                          ? null
                          : { type: menuType, index }
                      )
                    }
                    className={`w-full ${baseItemClass}`}
                  >
                    <span className={`flex-shrink-0 w-5 h-5 ${isItemActive ? "text-white" : ""}`}>
                      {nav.icon}
                    </span>
                    {!collapsed && (
                      <>
                        <span className="text-sm font-medium tracking-wide whitespace-nowrap">
                          {nav.name}
                        </span>
                        <MdKeyboardArrowDown
                          className={`ml-auto w-4 h-4 transition-transform duration-200 ${openSubmenu?.index === index && openSubmenu?.type === menuType
                            ? "rotate-180"
                            : ""
                            }`}
                        />
                      </>
                    )}
                  </button>

                  {!collapsed && (
                    <div
                      ref={(el) => {
                        subMenuRefs.current[`${menuType}-${index}`] = el;
                      }}
                      className="overflow-hidden transition-all duration-300"
                      style={{
                        height:
                          openSubmenu?.index === index && openSubmenu?.type === menuType
                            ? subMenuRefs.current[`${menuType}-${index}`]?.scrollHeight
                            : 0,
                      }}
                    >
                      <ul className="mt-1 ml-4 pl-4 border-l-2 border-[#465FFF]/20 space-y-0.5 py-1">
                        {nav.subItems.map((sub) => (
                          <li key={sub.name}>
                            <Link
                              to={sub.path}
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-150 ${isActive(sub.path)
                                ? "text-[#465FFF] font-semibold bg-[#465FFF]/8"
                                : "text-gray-500 dark:text-gray-400 hover:text-[#465FFF] hover:bg-[#465FFF]/5"
                                }`}
                            >
                              {isActive(sub.path) && (
                                <span className="w-1.5 h-1.5 rounded-full bg-[#465FFF] flex-shrink-0" />
                              )}
                              {sub.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                nav.path && (
                  <Link to={nav.path} className={baseItemClass}>
                    <span className={`flex-shrink-0 w-5 h-5 ${isItemActive ? "text-white" : ""}`}>
                      {nav.icon}
                    </span>
                    {!collapsed && (
                      <span className="text-sm font-medium tracking-wide whitespace-nowrap">
                        {nav.name}
                      </span>
                    )}
                    {!collapsed && isItemActive && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/70" />
                    )}
                  </Link>
                )
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );

  return (
    <aside
      className={`
        fixed mt-16 flex flex-col lg:mt-0 top-0 left-0 z-99 h-screen
        bg-white dark:bg-gray-900
        border-r border-gray-100 dark:border-gray-800
        transition-all duration-300 ease-in-out
        ${isMobileOpen ? "translate-x-0" : "max-[991px]:-translate-x-full"}
        ${isExpanded || isHovered ? "lg:w-[272px]" : "lg:w-[80px]"}
        w-[272px]
      `}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Subtle top accent line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#465FFF] via-[#7B91FF] to-transparent" />

      {/* Logo area */}
      <div
        className={`h-16 flex items-center border-b border-gray-100 dark:border-gray-800 px-5 flex-shrink-0 ${collapsed ? "justify-center" : "justify-start"
          }`}
      >
        <Link to="/TailAdmin/" className="flex items-center">
          {!collapsed ? (
            <>
              <img
                className="dark:hidden"
                src="images/logo/DS-logo-light-1.png"
                alt="Logo"
                width={140}
                height={36}
              />
              <img
                className="hidden dark:block"
                src="images/logo/DS-logo-dark-1.png"
                alt="Logo"
                width={140}
                height={36}
              />
            </>
          ) : (
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-[0_4px_12px_rgba(70,95,255,0.4)]">
              <img
                src="./images/logo/DocSlot.png"
                alt="Logo"
                width={22}
                height={22}
              />
            </div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-5 px-3">
        {/* Section label */}
        {!collapsed && (
          <p className="px-3 mb-3 text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
            Main Menu
          </p>
        )}
        {renderMenuItems(filteredNavItems, "main")}
      </nav>

      {/* Bottom user hint / version tag */}
      {!collapsed && (
        <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-800 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)]" />
            <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
              System Online
            </span>
          </div>
        </div>
      )}
    </aside>
  );
};

export default AppSidebar;
