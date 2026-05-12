import { useCallback, useRef, useState } from "react";
import { Link, useLocation } from "react-router";

import {
  BoxCubeIcon,
  CalenderIcon,
  ChevronDownIcon,
  GridIcon,
  ListIcon,
  PageIcon,
  PieChartIcon,
  PlugInIcon,
  TableIcon,
  UserCircleIcon,
  AppointmentIcon,
  ClinicIcon,
} from "../icons";

import { useSidebar } from "../context/SidebarContext";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

const navItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Dashboard",
  },
  {
    icon: <CalenderIcon />,
    name: "Calendar",
    path: "calendar",
  },
  {
    icon: <UserCircleIcon />,
    name: "Users",
    path: "users",
  },
  {
    icon: <AppointmentIcon />,
    name: "Appointment",
    // path: "appointment",
  },
  {
    icon: <ClinicIcon />,
    name: "Clinics",
    path: "clinics",
  },
  // {
  //   name: "Forms",
  //   icon: <ListIcon />,
  //   subItems: [{ name: "Form Elements", path: "form-elements" }],
  // },
  // {
  //   name: "Tables",
  //   icon: <TableIcon />,
  //   subItems: [{ name: "Basic Tables", path: "basic-tables" }],
  // },
  // {
  //   name: "Pages",
  //   icon: <PageIcon />,
  //   subItems: [
  //     { name: "Blank Page", path: "blank" },
  //     { name: "404 Error", path: "error-404" },
  //   ],
  // },
];

const othersItems: NavItem[] = [
  {
    icon: <PieChartIcon />,
    name: "Charts",
    subItems: [
      { name: "Line Chart", path: "line-chart" },
      { name: "Bar Chart", path: "bar-chart" },
    ],
  },
  {
    icon: <BoxCubeIcon />,
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
    icon: <PlugInIcon />,
    name: "Authentication",
    subItems: [{ name: "Sign In", path: "signin" }],
  },
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);

  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});
  // const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});

  const isActive = useCallback(
    (path: string) => location.pathname.includes(path),
    [location.pathname]
  );

  const role = localStorage.getItem("role"); // "SUPER_ADMIN" | "ADMIN"

  // ✅ ROLE BASED DASHBOARD PATH
  // const getDashboardPath = () => {
  //   const storedUser = localStorage.getItem("role");

  //   // case 1: user stored as plain string
  //   if (storedUser === "ADMIN") {
  //     return "clinic-dashboard"; // relative path (IMPORTANT)
  //   }
  //   // default (ADMIN)
  //   return "dashboard";
  // };
  const getDashboardPath = () => {
    const role = localStorage.getItem("role");
    if (role !== "SUPER ADMIN") {
      return "clinic-dashboard";
    }

    // SUPER_ADMIN / ADMIN
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

    if(item.name === "Users" && role === "RECEPTIONIST"){
      return false;
    }

    return true;
  });

  const renderMenuItems = (items: NavItem[], menuType: "main" | "others") => (
    <ul className="flex flex-col gap-4">
      {items.map((nav, index) => (
        <li key={nav.name}>
          {nav.name === "Dashboard" ? (
            <Link
              to={getDashboardPath()}
              className={`menu-item group ${
                isActive("dashboard") || isActive("clinic-dashboard")
                  ? "menu-item-active"
                  : "menu-item-inactive"
              }`}
            >
              <span className="menu-item-icon-size menu-item-icon-inactive">
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className="menu-item-text">{nav.name}</span>
              )}
            </Link>
          ) : nav.name === "Appointment" ? (
            <Link
              to={getClinicAppointmentPath()}
              className={`menu-item group ${
                isActive("appointment") || isActive("clinicAppointment")
                  ? "menu-item-active"
                  : "menu-item-inactive"
              }`}
            >
              <span className="menu-item-icon-size menu-item-icon-inactive">
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className="menu-item-text">{nav.name}</span>
              )}
            </Link>
          ) : nav.subItems ? (
            <button
              onClick={() =>
                setOpenSubmenu(
                  openSubmenu?.index === index
                    ? null
                    : { type: menuType, index }
                )
              }
              className="menu-item menu-item-inactive group cursor-pointer"
            >
              <span className="menu-item-icon-size menu-item-icon-inactive">
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <>
                  <span className="menu-item-text">{nav.name}</span>
                  <ChevronDownIcon
                    className={`ml-auto w-5 h-5 transition-transform ${
                      openSubmenu?.index === index ? "rotate-180" : ""
                    }`}
                  />
                </>
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                to={nav.path}
                className={`menu-item group ${
                  isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                }`}
              >
                <span className="menu-item-icon-size menu-item-icon-inactive">
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text">{nav.name}</span>
                )}
              </Link>
            )
          )}

          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.index === index
                    ? subMenuRefs.current[`${menuType}-${index}`]?.scrollHeight
                    : 0,
              }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems.map((sub) => (
                  <li key={sub.name}>
                    <Link
                      to={sub.path}
                      className={`menu-dropdown-item ${
                        isActive(sub.path)
                          ? "menu-dropdown-item-active"
                          : "menu-dropdown-item-inactive"
                      }`}
                    >
                      {sub.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 z-99 h-screen w-[260px] transition-all duration-300 border-r
        ${isExpanded || isMobileOpen || isHovered ? "w-[290px]" : "w-[90px]"}`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-8 flex ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link to="/TailAdmin/">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <img
                className="dark:hidden"
                src="images/logo/logo.svg"
                alt="Logo"
                width={150}
                height={40}
              />
              <img
                className="hidden dark:block"
                src="./images/logo/logo-dark.svg"
                alt="Logo"
                width={150}
                height={40}
              />
            </>
          ) : (
            <img
              src="./images/logo/logo-icon.svg"
              alt="Logo"
              width={32}
              height={32}
            />
          )}
        </Link>
      </div>

      <nav className="flex flex-col gap-6">
        {renderMenuItems(filteredNavItems, "main")}
        {/* {renderMenuItems(navItems, "main")} */}
        {/* {renderMenuItems(othersItems, "others")} */}
      </nav>
    </aside>
  );
};

export default AppSidebar;
