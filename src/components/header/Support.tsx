import React from "react";

const Support = () => {
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Support & Help</h1>

      {/* Quick Help */}
      <div className="mb-6">
        <h2 className="text-lg font-medium mb-2">Quick Help</h2>
        <ul className="list-disc list-inside text-gray-700 space-y-1">
          <li>How to book an appointment</li>
          <li>Reschedule or cancel appointments</li>
          <li>Payment or refund issues</li>
          <li>Doctor availability problems</li>
        </ul>
      </div>

      {/* Contact Support */}
      <div className="mb-6">
        <h2 className="text-lg font-medium mb-2">Contact Support</h2>
        <p className="text-gray-700">📧 Email: support@cliniccare.com</p>
        <p className="text-gray-700">📞 Phone: +91 98765 43210</p>
      </div>

      {/* Support Hours */}
      <div className="mb-6">
        <h2 className="text-lg font-medium mb-2">Support Hours</h2>
        <p className="text-gray-700">Monday – Saturday, 9:00 AM – 7:00 PM</p>
      </div>

      {/* Emergency Notice */}
      <div className="bg-red-50 border border-red-200 p-4 rounded">
        <p className="text-red-700 text-sm">
          🚨 <strong>Emergency Notice:</strong> For medical emergencies, please
          contact your nearest hospital immediately. This platform does not
          provide emergency services.
        </p>
      </div>
    </div>
  );
};

export default Support;
