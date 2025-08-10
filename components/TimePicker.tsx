import React, { useState, useEffect, useMemo } from 'react';

interface TimePickerProps {
  value: string; // "HH:mm"
  onChange: (value: string) => void;
  className?: string;
}

const SelectBox: React.FC<{
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: string[];
  'aria-label': string;
}> = ({ value, onChange, options, 'aria-label': ariaLabel }) => (
  <select
    value={value}
    onChange={onChange}
    aria-label={ariaLabel}
    className="bg-transparent appearance-none text-center font-semibold text-lg focus:outline-none w-full cursor-pointer"
  >
    {options.map((opt) => (
      <option key={opt} value={opt}>
        {opt}
      </option>
    ))}
  </select>
);

export const TimePicker: React.FC<TimePickerProps> = ({ value, onChange, className }) => {
  const [hour, setHour] = useState('10'); // 1-12
  const [minute, setMinute] = useState('00'); // 00-59
  const [period, setPeriod] = useState('AM'); // AM/PM

  useEffect(() => {
    if (value && /^\d{2}:\d{2}$/.test(value)) {
      const [h, m] = value.split(':');
      const h24 = parseInt(h, 10);
      let h12 = h24 % 12;
      if (h12 === 0) h12 = 12;
      const p = h24 >= 12 ? 'PM' : 'AM';
      setHour(String(h12));
      setMinute(m);
      setPeriod(p);
    }
  }, [value]);

  useEffect(() => {
    if (!hour || !minute || !period) return;
    let h24 = parseInt(hour, 10);
    if (period === 'PM' && h24 < 12) {
      h24 += 12;
    }
    if (period === 'AM' && h24 === 12) {
      h24 = 0;
    }
    const newValue = `${String(h24).padStart(2, '0')}:${minute}`;
    if (newValue !== value) {
      onChange(newValue);
    }
  }, [hour, minute, period, value, onChange]);

  const hourOptions = useMemo(() => Array.from({ length: 12 }, (_, i) => String(i + 1)), []);
  const minuteOptions = useMemo(() => Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')), []);

  return (
    <div className={`flex items-center justify-between w-full h-full ${className}`}>
      <div className="flex-1">
        <SelectBox value={hour} onChange={(e) => setHour(e.target.value)} options={hourOptions} aria-label="Hour" />
      </div>
      <span className="text-lg font-bold mx-1 select-none">:</span>
      <div className="flex-1">
        <SelectBox value={minute} onChange={(e) => setMinute(e.target.value)} options={minuteOptions} aria-label="Minute" />
      </div>
      <div className="ml-2">
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          aria-label="Period"
          className="bg-transparent appearance-none text-center font-semibold text-lg focus:outline-none cursor-pointer"
        >
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>
    </div>
  );
};
