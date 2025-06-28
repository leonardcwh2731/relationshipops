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
      name: 'Groups',
      value: totalGroups.toLocaleString(),
      icon: Building,
      color: 'bg-black',
      bgColor: 'bg-black',
      textColor: 'text-white'
    },
    {
      name: 'Contacts',
      value: totalContacts.toLocaleString(),
      icon: Users,
      color: 'bg-black',
      bgColor: 'bg-black',
      textColor: 'text-white'
    },
    {
      name: '80+ Leads',
      value: leadsAbove80.toString(),
      icon: TrendingUp,
      color: 'bg-black',
      bgColor: 'bg-black',
      textColor: 'text-white'
    },
    {
      name: 'Ready',
      value: readyToSendContacts.toString(),
      icon: CheckCircle,
      color: 'bg-black',
      bgColor: 'bg-black',
      textColor: 'text-white'
    }
  ];

  return (
    <div className="flex space-x-3 mb-8 overflow-x-auto">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div key={stat.name} className={`${stat.bgColor} rounded-lg p-4 border border-gray-200 min-w-0 flex-1`}>
            <div className="flex items-center">
              <div className={`${stat.color} rounded-lg p-2`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="ml-3 min-w-0">
                <p className={`text-xs font-medium ${stat.textColor} whitespace-nowrap`}>{stat.name}</p>
                <p className={`text-xl font-bold ${stat.textColor}`}>{stat.value}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}