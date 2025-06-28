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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div key={stat.name} className={`${stat.bgColor} rounded-lg p-6 border border-gray-200`}>
            <div className="flex items-center">
              <div className={`${stat.color} rounded-lg p-3`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className={`text-sm font-medium ${stat.textColor}`}>{stat.name}</p>
                <p className={`text-2xl font-bold ${stat.textColor}`}>{stat.value}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}