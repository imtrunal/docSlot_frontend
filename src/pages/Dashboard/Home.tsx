// import EcommerceMetrics from "../../components/ecommerce/EcommerceMetrics";
// import MonthlySalesChart from "../../components/ecommerce/MonthlySalesChart";
// import StatisticsChart from "../../components/ecommerce/StatisticsChart";
// // import MonthlyTarget from "../../components/ecommerce/MonthlyTarget";
// import RecentOrders from "../../components/ecommerce/RecentOrders";
// import DemographicCard from "../../components/ecommerce/DemographicCard";
// import PageMeta from "../../components/common/PageMeta";

// export default function Home() {
//   return (
//     <>
//       <PageMeta
//         title="React.js Ecommerce Dashboard | DocSlot - React.js Admin Dashboard Template"
//         description="This is React.js Ecommerce Dashboard page for DocSlot - React.js Tailwind CSS Admin Dashboard Template"
//       />
//       <div className="grid grid-cols-12 ">
//         <div className="col-span-12 space-y-6 xl:col-span-7">
//           <EcommerceMetrics />

//           <MonthlySalesChart />
//         </div>

//         {/* <div className="col-span-12 xl:col-span-5">
//           <MonthlyTarget />
//         </div> */}

//         <div className="col-span-12">
//           <StatisticsChart />
//         </div>

//         <div className="col-span-12 xl:col-span-5">
//           <DemographicCard />
//         </div>

//         <div className="col-span-12 xl:col-span-7">
//           <RecentOrders />
//         </div>
//       </div>
//     </>
//   );
// }
import EcommerceMetrics from "../../components/ecommerce/EcommerceMetrics";
import PageMeta from "../../components/common/PageMeta";

export default function Home() {
  return (
    <>
      <PageMeta
        title="React.js Ecommerce Dashboard | DocSlot"
        description="Dashboard page"
      />

      <div className="grid grid-cols-12 gap-6">
        
        {/* FULL WIDTH */}
        <div className="col-span-12 space-y-6">
          <EcommerceMetrics />
        </div>
      </div>
    </>
  );
}
