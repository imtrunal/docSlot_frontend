import { useEffect, useState } from "react";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import { useModal } from "../../hooks/useModal";
import { url } from "../../baseUrl";
import { toast } from "react-toastify";
import { requiredPermissions } from "../../utils/permissions";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { Modal } from "../ui/modal";


// --------------------
// Types
// --------------------
type UserMeta = {
  id: string;
  clinicId: string;
  name: string;
  mobile: string;
  password: string;
  roleId: string;
  isActive: boolean;
  createdAt: string;
};

type UserRole = {
  _id: string;
  name: string;
};

type Clinics = {
  _id: string;
  // userId: number;
  name: string;
};


export default function UserMetaCard() {
  const { isOpen, openModal, closeModal } = useModal();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [mode, setMode] = useState<"add" | "view" | "edit">("add");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const [users, setUsers] = useState<UserMeta[]>([]);
  // const [user, setUser] = useState({});
  const [userRole, setUserRole] = useState<UserRole[]>([]);
  const [clinics, setClinics] = useState<Clinics[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const clinicId = localStorage.getItem("clinicId");
  const role = localStorage.getItem("role");
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    clinicId: clinicId || "",
    name: "",
    mobile: "",
    password: "",
    roleId: "",
  });

  const fetchUsers = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      setLoading(true);
      const res = await fetch(`${url}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const response = await res.json();
      if (!res.ok) {
        toast.error(response.errorMessage || 'Failed to fetch user');
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mappedUsers: UserMeta[] = response.data.map((user: any) => ({
        id: user._id,
        clinicId: user.clinicId,
        name: user.name,
        mobile: user.mobile || user.loginNumber,
        password: user.password,
        roleId: user.roleId,
        isActive: user.isActive,
        createdAt: user.createdAt,
      }));

      mappedUsers.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      setUsers(mappedUsers);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchUsers();
  }, []);

  // --------------------
  // FETCH ROLES (UNCHANGED)
  // --------------------
  useEffect(() => {
    const fetchRoles = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`${url}/admin/roles`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const response = await res.json();
      if (!res.ok) {
        toast.error(response.errorMessage || 'Failed to fetch roles');
        return;
      }

      setUserRole(response.data || []);
    };

    if (role === "SUPER ADMIN" || role === "ADMIN") {
      fetchRoles();
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  //fetch clinics
  useEffect(() => {
    const fetchclinics = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`${url}/admin/clinics`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const response = await res.json();
      if (!res.ok) {
        toast.error(response.errorMessage || 'Failed to fetch clinics');
        return;
      }

      setClinics(response.data || []);
    };

    if (role === "SUPER ADMIN") {
      fetchclinics();
    }
  }, []);

  const handleSave = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    // ✅ FIXED ROLE CHECK
    const isSuperAdmin = role === "SUPER_ADMIN" || role === "SUPER ADMIN";

    if (isSuperAdmin && !formData.clinicId) {
      toast.error("Please select a clinic");
      return;
    }

    const payload = {
      ...formData,
      clinicId: isSuperAdmin ? formData.clinicId : clinicId,
    };

    try {
      if (mode === "add") {
        const res = await fetch(`${url}/users/add`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        const response = await res.json();

        if (!res.ok) {
          toast.error(response?.errorMessage || "Failed to add user");
          return;
        }

        if (response?.data) {
          const newUser = {
            id: response.data._id,
            clinicId: response.data.clinicId,
            name: response.data.name,
            mobile: response.data.mobile,
            roleId: response.data.roleId,
            password: response.data.password,
            isActive: response.data.isActive,
            createdAt: response.data.createdAt,
          };

          // ✅ ADD NEW USER ON TOP
          setUsers((prev) => [newUser, ...prev]);
          setPage(0);
        }

        toast.success("User Added successfully");
        closeModal();
        fetchUsers();
      }
    } catch (err) {
      console.error("Add user error:", err);
      toast.error("Something went wrong");
    }
  };

  // --------------------
  // VIEW (CARD-LIKE FORM)
  // --------------------
  const handleView = async (userId: string) => {
    setMode("view");
    // setSelectedUserId(user.id);

    const token = localStorage.getItem("token");
    if (!token) return;

    const response = await fetch(`${url}/users/${userId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const res = await response.json();
    if (!response.ok) {
      toast.error(res.errorMessage || 'Failed to fetch view user');
      return;
    }
    setFormData({
      clinicId: res.data?.clinicId?.name,
      name: res.data.name,
      mobile: res.data.mobile,
      password: "",
      roleId: res.data.roleId.name,
    });

    fetchUsers();
    openModal();
  };

  // --------------------
  // EDIT
  // --------------------
  const handleEdit = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    let data;
    const { password, ...rest } = formData;

    if (password !== "") {
      data = formData;
    } else {
      data = rest;
    }

    const res = await fetch(`${url}/users/${selectedUserId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    const response = await res.json()
    if (!res.ok) {
      toast.error(response.errorMessage || "Failed to update user")
      return;
    }

    toast.success("User edited successfully");
    // setUsers((prev) =>
    //   prev.map((u) => (u.id === selectedUserId ? { ...u, ...formData } : u))
    // );
    fetchUsers();

    closeModal();
  };

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);

  const handleDelete = (userId: string) => {
    setDeleteUserId(userId);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteUserId) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(`${url}/users/${deleteUserId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const response = await res.json();
      if (!res.ok) {
        toast.error(response.errorMessage || 'Failed to delete user');
        return;
      }

      setUsers((prev) => prev.filter((u) => u.id !== deleteUserId));
      toast.success("User deleted successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete user");
    } finally {
      setConfirmOpen(false);
      setDeleteUserId(null);
    }
  };
  //search
  const filteredUsers = users.filter(
    (users) =>
      users.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      users.mobile.includes(searchTerm),
  );


  //status update
  const updateUserStatus = async (
    user: UserMeta,
    desiredStatus: true | false,
  ) => {
    if (!user.id) {
      toast.error("Clinic ID missing");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login again");
      return;
    }

    try {
      const res = await fetch(`${url}/users/${user.id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          isActive: desiredStatus === true,
        }),
      });

      const response = await res.json();

      if (!res.ok) {
        toast.error(response.errorMessage || 'Failed to update status');
        return;
      }

      //  Backend is the source of truth
      const isActive = response?.data?.isActive ?? response?.isActive;

      setUsers((prev) =>
        prev.map((c) => (c.id === user.id ? { ...c, isActive: isActive } : c)),
      );

      toast.success(`user ${isActive ? "Activeted" : "Inactiveted"}`);
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
    }
  };

  useEffect(() => {
    setPage(0);
  }, [searchTerm]);

  useEffect(() => {
    const maxPage = Math.max(
      0,
      Math.ceil(filteredUsers.length / rowsPerPage) - 1,
    );

    if (page > maxPage) {
      setPage(maxPage);
    }
  }, [filteredUsers.length, rowsPerPage, page]);

  return (
    <div>
      <div className="flex users items-center justify-between mb-6 ">
        <h2 className="text-2xl font-semibold dark:text-white">Users</h2>

        {requiredPermissions("user:create") && (
          <Button
            className="dark:bg-gray-700"
            size="sm"
            onClick={() => {
              setMode("add");
              openModal();
              setFormData({
                clinicId: "",
                name: "",
                mobile: "",
                password: "",
                roleId: "",
              });
            }}
          >
            + New User
          </Button>
        )}
      </div>

      {/* search  */}
      <div className="relative mb-3 max-w-[600px] min-w-[200px]">
        <button className="absolute -translate-y-1/2 left-4 top-1/2">
          <svg
            className="fill-gray-500 dark:fill-gray-400"
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M3.04175 9.37363C3.04175 5.87693 5.87711 3.04199 9.37508 3.04199C12.8731 3.04199 15.7084 5.87693 15.7084 9.37363C15.7084 12.8703 12.8731 15.7053 9.37508 15.7053C5.87711 15.7053 3.04175 12.8703 3.04175 9.37363ZM9.37508 1.54199C5.04902 1.54199 1.54175 5.04817 1.54175 9.37363C1.54175 13.6991 5.04902 17.2053 9.37508 17.2053C11.2674 17.2053 13.003 16.5344 14.357 15.4176L17.177 18.238C17.4699 18.5309 17.9448 18.5309 18.2377 18.238C18.5306 17.9451 18.5306 17.4703 18.2377 17.1774L15.418 14.3573C16.5365 13.0033 17.2084 11.2669 17.2084 9.37363C17.2084 5.04817 13.7011 1.54199 9.37508 1.54199Z"
              fill=""
            />
          </svg>
        </button>
        <input
          placeholder="Search Users.."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-200 bg-transparent py-2.5 pl-12 pr-14 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:bg-white/[0.03] dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 xl:w-[430px]"
        />
      </div>

      <div className="rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: "#465FFF" }}>
                <th className="text-left px-5 py-4 text-xs font-semibold uppercase tracking-widest text-white/80 w-[30%]">
                  Name
                </th>
                <th className="text-left px-5 py-4 text-xs font-semibold uppercase tracking-widest text-white/80 w-[20%]">
                  Mobile
                </th>
                <th className="text-left px-5 py-4 text-xs font-semibold uppercase tracking-widest text-white/80 w-[18%]">
                  Role
                </th>
                {requiredPermissions("user:status_change") && (
                  <th className="text-left px-5 py-4 text-xs font-semibold uppercase tracking-widest text-white/80 w-[14%]">
                    Status
                  </th>
                )}
                <th className="text-center px-5 py-4 text-xs font-semibold uppercase tracking-widest text-white/80 w-[18%]">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                [...Array(5)].map((_, index) => (
                  <tr key={index}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3 animate-pulse">
                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700" />
                        <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-700" />
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
                    </td>

                    <td className="px-5 py-4">
                      <div className="h-6 w-20 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
                    </td>

                    {requiredPermissions("user:status_change") && (
                      <td className="px-5 py-4">
                        <div className="h-5 w-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
                      </td>
                    )}

                    <td className="px-5 py-4">
                      <div className="flex justify-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" />
                        <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" />
                        <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={requiredPermissions("user:status_change") ? 5 : 4} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center mb-1" style={{ background: "#eef0ff" }}>
                        <svg className="w-6 h-6" style={{ color: "#465FFF" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87m6-4a4 4 0 11-8 0 4 4 0 018 0zm6 4a4 4 0 10-5-3.87" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No users found</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((user) => (
                    <tr key={user.id} className="group hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-150">

                      {/* Name */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                            style={{ background: "#eef0ff", color: "#465FFF" }}
                          >
                            {user.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {user.name}
                          </span>
                        </div>
                      </td>

                      {/* Mobile */}
                      <td className="px-5 py-3.5">
                        <span className="text-sm text-gray-600 dark:text-gray-400">{user.mobile}</span>
                      </td>

                      {/* Role */}
                      <td className="px-5 py-3.5">
                        <span
                          className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
                          style={{ background: "#eef0ff", color: "#465FFF" }}
                        >
                          {user.roleId.name}
                        </span>
                      </td>

                      {/* Status */}
                      {requiredPermissions("user:status_change") && (
                        <td className="px-5 py-3.5">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={user.isActive}
                              onChange={(e) => updateUserStatus(user, e.target.checked)}
                            />
                            <div className="w-10 h-5 bg-gray-200 dark:bg-gray-700 rounded-full peer
                        peer-checked:bg-emerald-500
                        after:content-[''] after:absolute after:top-[2px] after:left-[2px]
                        after:bg-white after:rounded-full after:h-4 after:w-4
                        after:transition-all peer-checked:after:translate-x-5
                        transition-colors duration-200" />
                          </label>
                        </td>
                      )}

                      {/* Actions */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-center gap-1">
                          {requiredPermissions("user:view") && (
                            <button
                              onClick={() => handleView(user.id)}
                              title="View"
                              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150
                          text-gray-400 hover:text-[#465FFF] hover:bg-[#eef0ff]
                          dark:text-gray-500 dark:hover:text-[#7B91FF] dark:hover:bg-[#465FFF]/10"
                            >
                              <svg className="w-[15px] h-[15px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                          )}

                          {requiredPermissions("user:update") && (
                            <button
                              onClick={() => {
                                setFormData({
                                  clinicId: user?.clinicId?._id,
                                  name: user.name,
                                  password: "",
                                  mobile: user.mobile,
                                  roleId: user.roleId._id,
                                });
                                setSelectedUserId(user.id);
                                setMode("edit");
                                openModal();
                              }}
                              title="Edit"
                              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150
                          text-gray-400 hover:text-amber-600 hover:bg-amber-50
                          dark:text-gray-500 dark:hover:text-amber-400 dark:hover:bg-amber-500/10"
                            >
                              <svg className="w-[15px] h-[15px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                          )}

                          {requiredPermissions("user:delete") && (
                            <button
                              onClick={() => handleDelete(user.id)}
                              title="Delete"
                              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150
                          text-gray-400 hover:text-red-500 hover:bg-red-50
                          dark:text-gray-500 dark:hover:text-red-400 dark:hover:bg-red-500/10"
                            >
                              <svg className="w-[15px] h-[15px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-3.5 border-t border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/30">

          {/* Left: rows per page */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">Rows per page</span>
            <div className="flex items-center rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800">
              {[10, 20, 30, 50].map((n) => (
                <button
                  key={n}
                  onClick={() => { setRowsPerPage(n); setPage(0); }}
                  className={`px-3 py-1.5 text-xs font-medium transition-all duration-150 border-r border-gray-200 dark:border-gray-700 last:border-r-0
              ${rowsPerPage === n
                      ? "text-white"
                      : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                  style={rowsPerPage === n ? { background: "#465FFF" } : {}}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Right: page info + arrows */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
              <span className="font-semibold text-gray-700 dark:text-gray-200">
                {page * rowsPerPage + 1}–{Math.min((page + 1) * rowsPerPage, filteredUsers.length)}
              </span>
              {" "}of{" "}
              <span className="font-semibold text-gray-700 dark:text-gray-200">{filteredUsers.length}</span>
            </span>

            <div className="flex items-center gap-1">
              {/* First */}
              <button
                onClick={() => setPage(0)}
                disabled={page === 0}
                title="First page"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 dark:text-gray-500
            hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200
            disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7M18 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Prev */}
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                title="Previous page"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 dark:text-gray-500
            hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200
            disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Page number pills */}
              {(() => {
                const totalPages = Math.ceil(filteredUsers.length / rowsPerPage);
                const delta = 1;
                const pages: (number | "...")[] = [];
                for (let i = 0; i < totalPages; i++) {
                  if (i === 0 || i === totalPages - 1 || (i >= page - delta && i <= page + delta)) {
                    pages.push(i);
                  } else if (pages[pages.length - 1] !== "...") {
                    pages.push("...");
                  }
                }
                return pages.map((p, i) =>
                  p === "..." ? (
                    <span key={`dot-${i}`} className="w-7 h-7 flex items-center justify-center text-xs text-gray-400">
                      ···
                    </span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p as number)}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-medium transition-all duration-150
                  ${page === p
                          ? "text-white shadow-sm"
                          : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200"
                        }`}
                      style={page === p ? { background: "#465FFF" } : {}}
                    >
                      {(p as number) + 1}
                    </button>
                  )
                );
              })()}

              {/* Next */}
              <button
                onClick={() => setPage((p) => Math.min(Math.ceil(filteredUsers.length / rowsPerPage) - 1, p + 1))}
                disabled={page >= Math.ceil(filteredUsers.length / rowsPerPage) - 1}
                title="Next page"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 dark:text-gray-500
            hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200
            disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Last */}
              <button
                onClick={() => setPage(Math.ceil(filteredUsers.length / rowsPerPage) - 1)}
                disabled={page >= Math.ceil(filteredUsers.length / rowsPerPage) - 1}
                title="Last page"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 dark:text-gray-500
            hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200
            disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M6 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[520px]">
        <div className="dark:bg-gray-900">

          {/* ── Header ── */}
          <div
            className="flex items-center gap-4 px-6 py-5"
            style={{ background: "#465FFF" }}
          >
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center text-white font-semibold text-base flex-shrink-0"
              style={{ background: "rgba(255,255,255,0.2)" }}
            >
              {mode === "add" ? "+" : formData.name?.charAt(0)?.toUpperCase() ?? "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-base m-0">
                {mode === "add" ? "New User" : mode === "edit" ? "Edit User" : formData.name}
              </p>
              <p className="text-white/60 text-xs mt-0.5 m-0">
                {mode === "add" ? "Fill in the details below" : mode === "edit" ? "Update user information" : "User profile"}
              </p>
            </div>
          </div>

          {/* ── Body ── */}
          <div className="p-6">

            {/* VIEW MODE */}
            {mode === "view" ? (
              <div className="grid grid-cols-2 gap-px bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800">
                {[
                  { label: "Name", icon: "ti-user", value: formData.name },
                  { label: "Mobile", icon: "ti-phone", value: formData.mobile },
                  { label: "Role", icon: "ti-shield", value: formData.roleId, badge: true },
                  ...(role === "SUPER ADMIN"
                    ? [{ label: "Clinic", icon: "ti-building", value: formData.clinicId }]
                    : []),
                ].map((field) => (
                  <div
                    key={field.label}
                    className="bg-white dark:bg-gray-900 px-5 py-4"
                  >
                    <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2 m-0">
                      <i className={`ti ${field.icon}`} style={{ fontSize: 12, color: "#465FFF" }} />
                      {field.label}
                    </p>
                    {field.badge ? (
                      <span
                        className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{ background: "#eef0ff", color: "#465FFF" }}
                      >
                        {field.value}
                      </span>
                    ) : (
                      <p className="text-sm font-medium text-gray-900 dark:text-white m-0">
                        {field.value || "—"}
                      </p>
                    )}
                  </div>
                ))}
              </div>

            ) : (
              /* ADD / EDIT MODE */
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <Input name="name" value={formData.name} onChange={handleChange} placeholder="Enter Name" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                    Mobile <span className="text-red-500">*</span>
                  </label>
                  <Input name="mobile" value={formData.mobile} onChange={handleChange} maxLength={10} placeholder="Enter Mobile" />
                </div>

                {((mode === "edit" && role === "SUPER ADMIN") || mode === "add") && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="password"
                      name="password"
                      placeholder="Enter new password"
                      onChange={handleChange}
                    />
                  </div>
                )}

                {requiredPermissions("roles:list") && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                      Role <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="roleId"
                      value={formData.roleId}
                      onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                      className="w-full rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2.5 text-sm bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2"
                      style={{ focusRingColor: "#465FFF" } as React.CSSProperties}
                    >
                      <option value="">Select Role</option>
                      {userRole.map((r) => (
                        <option key={r._id} value={r._id}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {requiredPermissions("clinic:list") && role === "SUPER ADMIN" && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                      Clinic <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="clinicId"
                      value={formData.clinicId}
                      onChange={(e) => setFormData({ ...formData, clinicId: String(e.target.value) })}
                      className="w-full rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2.5 text-sm bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2"
                    >
                      <option value="">Select Clinic</option>
                      {clinics.map((c) => (
                        <option key={c._id} value={c._id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* ── Footer ── */}
            <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-gray-100 dark:border-gray-800">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                Close
              </button>
              {mode === "add" && (
                <button
                  onClick={handleSave}
                  className="px-5 py-2 text-sm font-semibold rounded-lg text-white transition hover:opacity-90"
                  style={{ background: "#465FFF" }}
                >
                  Save User
                </button>
              )}
              {mode === "edit" && (
                <button
                  onClick={() => handleEdit()}
                  className="px-5 py-2 text-sm font-semibold rounded-lg text-white transition hover:opacity-90"
                  style={{ background: "#465FFF" }}
                >
                  Save Changes
                </button>
              )}
            </div>
          </div>
        </div>
      </Modal>

      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}

      >
        <div className="dark:bg-gray-800 dark:text-white">
          <DialogTitle>Delete User</DialogTitle>

          <DialogContent>
            Are you sure you want to delete this user?
          </DialogContent>

          <DialogActions>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
            >
              Cancel
            </Button>

            <Button onClick={confirmDelete}>
              Yes, Delete
            </Button>
          </DialogActions>
        </div>
      </Dialog>

    </div>
  );
}
