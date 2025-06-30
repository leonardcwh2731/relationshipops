import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, User } from 'lucide-react';

interface DropdownOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface CustomDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  className?: string;
}

export const CustomDropdown: React.FC<CustomDropdownProps> = ({
  value,
  onChange,
  options,
  placeholder = "All Account Emails",
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const selectedOption = options.find(option => option.value === value);
  const displayLabel = value === 'all' ? placeholder : selectedOption?.label || placeholder;

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Dropdown Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 text-left bg-white border border-gray-300 rounded-lg shadow-sm hover:border-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 flex items-center justify-between"
      >
        <div className="flex items-center flex-1 min-w-0 pr-2">
          <User className="mr-3 text-gray-500 flex-shrink-0 w-5 h-5" />
          <span className="text-sm font-medium text-gray-900 overflow-hidden text-ellipsis whitespace-nowrap">
            {displayLabel}
          </span>
        </div>
        <ChevronDown 
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 flex-shrink-0 ml-2 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden max-h-60 overflow-y-auto">
          <div className="py-1">
            {/* All Account Emails Option */}
            <button
              onClick={() => handleSelect('all')}
              className={`w-full px-4 py-3 text-left transition-colors duration-150 flex items-center ${
                value === 'all' ? 'bg-blue-50 text-blue-900' : 'hover:bg-gray-50 text-gray-900'
              }`}
            >
              <User className="mr-3 text-gray-500 w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">
                All Account Emails
              </span>
            </button>

            {/* Individual Email Options */}
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={`w-full px-4 py-3 text-left transition-colors duration-150 flex items-center ${
                  value === option.value ? 'bg-blue-50 text-blue-900' : 'hover:bg-gray-50 text-gray-900'
                }`}
                title={option.value}
              >
                <User className="mr-3 text-gray-500 w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium block w-full overflow-hidden text-ellipsis whitespace-nowrap">
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};