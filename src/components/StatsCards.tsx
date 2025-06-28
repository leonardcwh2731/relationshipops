import React from 'react';
import { Users, TrendingUp, Building, CheckCircle } from 'lucide-react';

interface StatsCardsProps {
  totalContacts: number;
  totalGroups: number;
  leadsAbove80: number;
  readyToSendContacts: number;
}

export function StatsCards({ totalContacts, totalGroups, leadsAbove80, readyToSendContacts }: StatsCardsProps) {
  const stats = [
    {
      name: 'Account Groups',
      value: totalGroups.toLocaleString(),
      icon: Building,
      color: 'bg-black',
      bgColor: 'bg-black',
      textColor: 'text-white'
    },
    {
      name: 'Total Contacts Count',
      value: totalContacts.toLocaleString(),
      icon: Users,
      color: 'bg-black',
      bgColor: 'bg-black',
      textColor: 'text-white'
    },
    {
      name: 'Leads Above 80',
      value: leadsAbove80.toString(),
      icon: TrendingUp,
      color: 'bg-black',
      bgColor: 'bg-black',
      textColor: 'text-white'
    },
    {
      name: 'Ready Contacts',
      value: readyToSendContacts.toString(),
      icon: CheckCircle,
      color: 'bg-black',
      bgColor: 'bg-black',
      textColor: 'text-white'
    }
  ];

  return (
    <div className="flex space-x-2 mb-8" style={{ flexWrap: 'nowrap' }}>
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div key={stat.name} className={`${stat.bgColor} rounded-lg p-3 border border-gray-200 flex-1 min-w-0`} style={{ maxWidth: '25%' }}>
            <div className="flex items-center">
              <div className={`${stat.color} rounded-lg p-2`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <div className="ml-2 min-w-0 flex-1">
                <p className={`text-xs font-medium ${stat.textColor} whitespace-nowrap text-ellipsis overflow-hidden`}>{stat.name}</p>
                <p className={`text-lg font-bold ${stat.textColor}`}>{stat.value}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}