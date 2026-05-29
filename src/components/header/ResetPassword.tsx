import { useState } from "react";
import { url } from "../../baseUrl";
import { Button } from "@mui/material";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import { toast } from "react-toastify";

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{6}$/;

function ResetPassword() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("Password Changed!");

    // Frontend validation
    if (!passwordRegex.test(newPassword)) {
      return setMessage("Password does not meet requirements");
    }

    if (newPassword !== confirmPassword) {
      return setMessage("Passwords do not match");
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${url}/auth/reset-password`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-type": "application/json",
        },
        body: JSON.stringify({
          newPassword: newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to reset password");
        toast.error(data.message || "Failed to reset password");
      }
      if (!response.ok) {
        toast.error(data.message || "Failed to reset password");
      }

      toast("Password Changed");
      setMessage(data.message);
    } catch (error) {
      setMessage(error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="reset-password w-[400px] m-auto border border-b-gray-300 p-6 my-4 rounded dark:border-gray-600">
        <div className="">
          <h1 className="text-2xl text-center font-semibold py-6 dark:text-white">
            Reset Password
          </h1>
          <form>
            <div className="my-3">
              <Label>New Password</Label>
              <Input
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div>
              <Label>Confirm Password</Label>
              <Input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            {/* {message && <p>{message}</p>} */}
          </form>
          <div className="my-5">
            <Button
              type="submit"
              disabled={loading}
              variant="contained"
              onClick={handleSubmit}
              className="dark:bg-gray-700"
            >
              {loading ? "Updating..." : "Reset Password"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
