import React from 'react';

const ProductMappingTable = ({ mapping }) => {
  const getCloudVpsProductName = (id) => {
    const names = {
      '1': 'VPS Basic',
      '2': 'VPS Pro', 
      '3': 'VPS Premium',
      '4': 'VPS Enterprise'
    };
    return names[id] || `Product ${id}`;
  };

  const getHostBillProductName = (id) => {
    const names = {
      '5': 'VPS Start',
      '10': 'VPS Profi',
      '11': 'VPS Premium',
      '12': 'VPS Enterprise'
    };
    return names[id] || `Product ${id}`;
  };

  if (!mapping?.mappings || Object.keys(mapping.mappings).length === 0) {
    return null;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm mb-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-5 h-5 rounded bg-gray-100 flex items-center justify-center">
          <span className="text-xs">🔗</span>
        </div>
        <h3 className="text-base font-semibold text-gray-900">Product Mapping Details</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-200 rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                Cloud VPS ID
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                Cloud VPS Name
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                HostBill ID
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                HostBill Name
              </th>
              <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(mapping.mappings).map(([cloudVpsId, hostbillId], index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-3 py-2 text-xs text-gray-900 border-b border-gray-100">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                    {cloudVpsId}
                  </span>
                </td>
                <td className="px-3 py-2 text-xs text-gray-900 border-b border-gray-100">
                  {getCloudVpsProductName(cloudVpsId)}
                </td>
                <td className="px-3 py-2 text-xs text-gray-900 border-b border-gray-100">
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                    {hostbillId}
                  </span>
                </td>
                <td className="px-3 py-2 text-xs text-gray-900 border-b border-gray-100">
                  {getHostBillProductName(hostbillId)}
                </td>
                <td className="px-3 py-2 text-center border-b border-gray-100">
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium inline-flex items-center gap-1">
                    ✅ Active
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductMappingTable;
