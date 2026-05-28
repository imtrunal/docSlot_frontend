// import PageBreadcrumb from "../components/common/PageBreadCrumb";
import UserMetaCard from "../components/UserProfile/UserMetaCard";
// import UserInfoCard from "../components/UserProfile/UserInfoCard";
// import UserAddressCard from "../components/UserProfile/UserAddressCard";
import PageMeta from "../components/common/PageMeta";

export default function UserProfiles() {
  return (
    <>
      <PageMeta
        title="React.js Profile Dashboard | DocSlot - Next.js Admin Dashboard Template"
        description="This is React.js Profile Dashboard page for DocSlot - React.js Tailwind CSS Admin Dashboard Template"
      />
        <div className="space-y-6">
          <UserMetaCard />
          {/* <UserInfoCard /> */}
          {/* <UserAddressCard /> */}
        </div>
    </>
  );
}
