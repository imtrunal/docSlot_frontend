import { useEffect, useState } from "react";
import Button from "../ui/button/Button";
// import { Button } from "@mui/material";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import { Modal } from "../ui/modal";
import { useModal } from "../../hooks/useModal";
import Card from "@mui/material/Card";
import Table from "@mui/material/Table";
// import { Table } from "../ui/table";
import TableRow from "@mui/material/TableRow";
import TableBody from "@mui/material/TableBody";
import TableHead from "@mui/material/TableHead";
// import { TableHeader } from "../ui/table";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
// import TablePagination from "@mui/material/TablePagination";
import { url } from "../../baseUrl";
import { TrashBinIcon, PencilIcon } from "../../icons";
import { toast } from "react-toastify";
import { requiredPermissions } from "../../utils/permissions";
import { TablePagination } from "../ui/table/TablePagination";
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";


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

// const STORAGE_KEY = "users_table_data";

export default function UserMetaCard() {
  const { isOpen, openModal, closeModal } = useModal();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const [mode, setMode] = useState<"add" | "view" | "edit">("add");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const [users, setUsers] = useState<UserMeta[]>([]);
  // const [user, setUser] = useState({});
  const [userRole, setUserRole] = useState<UserRole[]>([]);
  const [clinics, setClinics] = useState<Clinics[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const clinicId = localStorage.getItem("clinicId");
  const role = localStorage.getItem("role");

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

    if(role === "SUPER ADMIN" || role === "ADMIN"){
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

  // --------------------
  // SAVE / UPDATE
  // --------------------

  // const handleSave = async () => {
  //   const token = localStorage.getItem("token");
  //   if (!token) return;

  //   if (role === "SUPER_ADMIN" && !formData.clinicId) {
  //     alert("Please select a clinic");
  //     return;
  //   }
  //   // const { clinicId: _removed, ...restFormData } = formData;

  //   const payload = {
  //     ...formData,
  //     clinicId:
  //       role === "SUPER_ADMIN"
  //         ? formData.clinicId // dropdown value
  //         : clinicId, // token value
  //   };

  //   if (mode === "add") {
  //     const res = await fetch(`${url}/users/add`, {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //         Authorization: `Bearer ${token}`,
  //       },
  //       // body: JSON.stringify({ ...formData, clinicId }),
  //       body: JSON.stringify(payload),
  //     });

  //     const response = await res.json();


  //     if (response?.data) {
  //       alert("hello");
  //       const newUser = {
  //         id: response.data._id,
  //         clinicId: response.data?.clinicId,
  //         name: response.data.name,
  //         mobile: response.data.mobile,
  //         password: response.data.password,
  //         roleId: response.data.roleId,
  //         isActive: response.data.isActive,
  //         createdAt: response.data.createdAt,
  //       };


  //       // ✅ ADD AT TOP + GO TO FIRST PAGE
  //       setUsers((prev) => [newUser, ...prev]);
  //       setPage(0);
  //     }
  //   }
  //   closeModal();
  //   fetchUsers();
  // };

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



  // const handleDelete = async (userId: string) => {
  //   if (!confirm("Delete this user?")) return;

  //   const token = localStorage.getItem("token");
  //   if (!token) return;

  //   await fetch(`${url}/users/${userId}`, {
  //     method: "DELETE",
  //     headers: { Authorization: `Bearer ${token}` },
  //   });

  //   setUsers((prev) => prev.filter((u) => u.id !== userId));
  // };

  //pagination

  // const handleChangePage = useCallback((_e: unknown, newPage: number) => {
  //   setPage(newPage);
  // }, []);

  // const handleChangeRowsPerPage = useCallback(
  //   (e: React.ChangeEvent<HTMLInputElement>) => {
  //     setRowsPerPage(parseInt(e.target.value, 10));
  //     setPage(0);
  //   },
  //   [],
  // );

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


      // if (!res.ok) {
      //   const err = await res.text();
      //   console.error("Backend error:", err);
      //   toast.error("Failed to update status");
      //   return;
      // }

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
    <div className="py-5 sameCSS px-0 md:pl-5   ml-0 md:ml-[260px] lg:ml-0 sm:ml-[100px] xs:ml-[100px] transition-all duration-300">
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

      <Card>
        <TableContainer>
          <Table className="dark:bg-gray-900">
            <TableHead>
              <TableRow>
                {/* <TableCell>Clinic ID</TableCell> */}
                <TableCell className="dark:text-gray-400">Name</TableCell>
                <TableCell className="dark:text-gray-400">Mobile</TableCell>
                {/* <TableCell>Password Hash</TableCell> */}
                <TableCell className="dark:text-gray-400">Role</TableCell>
                {requiredPermissions("user:status_change") && (
                  <TableCell className="dark:text-gray-400">Status</TableCell>
                )}
                <TableCell className="dark:text-gray-400" align="center">Actions</TableCell>
              </TableRow>
            </TableHead>

            <TableBody >
              {filteredUsers
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((user) => (

                  <TableRow key={user.id}>
                    {/* <TableCell>{user.clinicId}</TableCell> */}
                    <TableCell className="dark:text-gray-400">{user.name}</TableCell>
                    <TableCell className="dark:text-gray-400">{user.mobile}</TableCell>
                    {/* <TableCell>{user.passwordHash}</TableCell> */}
                    <TableCell className="dark:text-gray-400">{user.roleId.name}</TableCell>
                    {requiredPermissions("user:status_change") && (
                      <TableCell className="dark:text-gray-400">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={user.isActive}
                            onChange={(e) =>
                              updateUserStatus(user, e.target.checked)
                            }
                          />
                          <div className="w-11 relative h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:bg-green-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                        </label>
                      </TableCell>
                    )}
                    <TableCell className="dark:text-gray-400" align="center">
                      <div className="flex justify-center items-center gap-2">
                        {requiredPermissions("user:view") && (
                          <RemoveRedEyeIcon
                            className="text-2xl cursor-pointer"
                            onClick={() => handleView(user.id)}
                          />
                        )}

                        {requiredPermissions("user:update") && (
                          <PencilIcon
                            className="text-2xl cursor-pointer"
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
                          />
                        )}

                        {requiredPermissions("user:delete") && (
                          <TrashBinIcon
                            className="text-2xl cursor-pointer"
                            onClick={() => handleDelete(user.id)}
                          />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}

              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" className="dark:text-gray-400">
                    No Users found
                  </TableCell>
                </TableRow>
              )}

              {/* <TableRow>
                <TableCell colSpan={6} align="center">
                  {!isOpen && (
                    <div className={isOpen ? "modal-open" : ""}>
                      <TablePagination
                        component="div"
                        count={users.length}
                        page={page}
                        rowsPerPage={rowsPerPage}
                        rowsPerPageOptions={[5, 10, 25]}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                        sx={{position:"relative", zIndex:"0"}}
                      />
                    </div>
                  )}
                  <p>hello</p>
                </TableCell>
              </TableRow> */}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          totalItems={users.length}
          currentPage={page + 1}
          rowsPerPage={rowsPerPage}
          onPageChange={(p) => setPage(p - 1)}
          onRowsPerPageChange={(size) => {
            setRowsPerPage(size);
            setPage(0);
          }}
        />
      </Card>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[600px] m-4">
        <div className="bg-white rounded-2xl p-6 dark:bg-gray-900">
          <h3 className="mb-4 font-semibold dark:text-white">
            {mode === "add"
              ? "New User"
              : mode === "edit"
                ? "Edit User"
                : "View User"}
          </h3>
          {/* 🔹 VIEW MODE → CARD */}
          {mode === "view" ? (
            <div className="space-y-4 text-gray-800 dark:text-white/90">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-semibold">Name:</p>
                  <p className="text-blue-600 dark:text-gray-400">{formData.name}</p>
                </div>

                <div>
                  <p className="font-semibold">Mobile:</p>
                  <p className="text-blue-600 dark:text-gray-400">{formData.mobile}</p>
                </div>
                {/* <div>
                  <p className="font-semibold">Login Number:</p>
                  <p className="text-blue-600 dark:text-gray-400">{formData}</p>
                </div> */}
                <div>
                  <p className="font-semibold">Role:</p>
                  <p className="text-blue-600 dark:text-gray-400">{formData.roleId}</p>
                </div>

                {role === "SUPER ADMIN" && (
                  <div>
                    <p className="font-semibold">Clinic Name:</p>
                    <p className="text-blue-600 dark:text-gray-400">{formData.clinicId}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* 🔹 ADD / EDIT MODE → SAME FORM (UNCHANGED) */
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label>Name</Label>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>

              <div>
                <Label>Mobile</Label>
                <Input
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  maxLength={10}
                />
              </div>

              <div>
                { ((mode == "edit"  && role === "SUPER ADMIN")  || mode == "add" )&& (

                  <div>
                    <Label>Password</Label>
                    <Input
                      type="password"
                      name="password"
                      // value={formData.password}
                      placeholder="Add New password"
                      onChange={handleChange}
                    />
                  </div>
                )}
              </div>

              {requiredPermissions("roles:list") && (
                <div>
                  <Label>Role</Label>
                  <select
                    name="roleId"
                    value={formData.roleId}
                    onChange={(e) =>
                      setFormData({ ...formData, roleId: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-300 p-2 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="">Select Role</option>
                    {userRole.map((role) => (
                      <option key={role?._id} value={role?._id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {requiredPermissions("clinic:list") && (
                <div>
                  {role === "SUPER ADMIN" && (
                    <div>
                      <Label>Clinic</Label>
                      <select
                        name="clinicId"
                        value={formData.clinicId}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            clinicId: String(e.target.value),
                          })
                        }
                        className="w-full rounded-lg border border-gray-300 p-2 dark:bg-gray-800 dark:text-white"
                      >
                        <option value="">Select Clinics</option>
                        {clinics.map((clinicId) => (
                          <option key={clinicId._id} value={clinicId._id}>
                            {clinicId.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={closeModal}>
              Close
            </Button>
            {mode == "add" && <Button onClick={handleSave}>Save</Button>}
            {mode == "edit" && (
              <Button onClick={() => handleEdit()}>Save</Button>
            )}
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
