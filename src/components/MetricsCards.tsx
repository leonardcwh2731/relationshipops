import React from 'react';

interface MetricsCardsProps {
  accountGroups: number;
  totalContacts: number;
  leadsAbove80: number;
  readyContacts: number;
}

export const MetricsCards: React.FC<MetricsCardsProps> = ({
  accountGroups,
  totalContacts,
  leadsAbove80,
  readyContacts
}) => {
  const metrics = [
    {
      value: accountGroups.toString(),
      label: 'Account Groups'
    },
    {
      value: totalContacts.toLocaleString(),
      label: 'Total Contacts'
    },
    {
      value: leadsAbove80.toString(),
      label: 'Leads Above 80'
    },
    {
      value: readyContacts.toString(),
      label: 'Ready Contacts'
    }
  ];

  return (
    <div className="px-8 py-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <div key={index} className="bg-black text-white p-6 rounded-2xl">
            <div className="text-4xl font-bold mb-2">{metric.value}</div>
            <div className="text-gray-300 text-sm font-medium">{metric.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};