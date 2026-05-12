import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";
import Button from "../ui/button/Button";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {url} from "../../baseUrl";

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);

  const [phone, setPhone] = useState("9000000001");
  const [password, setPassword] = useState("Super1");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phone) {
      toast.error("Phone number is required");
      return;
    }

    if (!password) {
      toast.error("Password is required");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    try {
      setLoading(true);

      /* -------------------------------
         1️⃣ TRY SUPERADMIN LOGIN FIRST
      -------------------------------- */
      const response = await fetch(`${url}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobile: phone,
          password: password,
        }),
      });

      const data = await response.json();
      const token = data?.data?.accessTokenHash;
      const role = data?.data?.role; 
      const clinicid = data?.data?.user?.clinicId?._id;
      const UserName = data?.data?.user?.name;
      const clinicName = data?.data?.user?.clinicId?.name;
      const permissions = data?.data?.permissions;
  

      if (!response.ok || !token || !role) {
        toast.error("Invalid login credentials");
        return;
      }

      /* -------------------------------
         3️⃣ SAVE SESSION
      -------------------------------- */
      localStorage.setItem("token", token);
      localStorage.setItem("role", role);
      localStorage.setItem("clinicId", clinicid);
      localStorage.setItem("UserName", UserName);
      localStorage.setItem("clinicName", clinicName);
      localStorage.setItem("sessionActive", "true");
      localStorage.setItem("permissions",JSON.stringify(permissions));

      toast.success("Login successful");
      

      /* -------------------------------
         4️⃣ ROLE BASED REDIRECTION
      -------------------------------- */
      
      setTimeout(() => {
        if (role === "SUPER ADMIN") {
          
          navigate("/dashboard", { replace: true });
        } else if (role !== "SUPER ADMIN") {
          
          navigate("/clinic-dashboard", { replace: true });
        } else {
          toast.error("Unauthorized role");
        }
      }, 200);

    } catch (error) {
      console.error(error);
      toast.error("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Sign In
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your phone number and password
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <Label>Phone number *</Label>
                <Input
                  placeholder="+91"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  maxLength={10}
                />
              </div>

              <div>
                <Label>Password *</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <span
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute z-10 cursor-pointer right-4 top-1/2 -translate-y-1/2"
                  >
                    {showPassword ? (
                      <EyeIcon className="w-5 h-5 text-gray-500" />
                    ) : (
                      <EyeCloseIcon className="w-5 h-5 text-gray-500" />
                    )}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                {/* <div className="flex items-center gap-3">
                  <Checkbox checked={isChecked} onChange={setIsChecked} />
                  <span className="text-sm">Keep me logged in</span>
                </div> */}
                <Link to="#" className="text-sm text-brand-500">
                  Forgot password?
                </Link>
              </div>

              <Button className="w-full" size="sm" disabled={loading}>
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
