import React from 'react';
import { Users, Filter, TrendingUp } from 'lucide-react';

interface StatsCardsProps {
  totalContacts: number;
  filteredContacts: number;
  selectedEmail: string;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ 
  totalContacts, 
  filteredContacts, 
  selectedEmail 
}) => {
  const stats = [
    {
      title: 'Total Contacts',
      value: totalContacts.toLocaleString(),
      icon: Users,
      color: 'bg-blue-500',
      description: 'All contacts in database'
    },
    {
      title: selectedEmail === 'all' ? 'All Account Contacts' : 'Account Contacts',
      value: filteredContacts.toLocaleString(),
      icon: Filter,
      color: 'bg-green-500',
      description: selectedEmail === 'all' 
        ? 'Total contacts across all accounts' 
        : `Contacts for ${selectedEmail}`
    },
    {
      title: 'Growth Rate',
      value: '12.5%',
      icon: TrendingUp,
      color: 'bg-purple-500',
      description: 'Monthly contact growth'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {stats.map((stat, index) => (
        <div key={index} className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className={`${stat.color} rounded-full p-3`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-4 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {stat.title}
                  </dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </dd>
                  <dd className="text-sm text-gray-600 mt-1">
                    {stat.description}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};