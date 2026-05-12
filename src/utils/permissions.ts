export const requiredPermissions = (requiedpermission: string) => {
    const permissions = localStorage.getItem("permissions");

    return permissions?.includes(requiedpermission);
  };