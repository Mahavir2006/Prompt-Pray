import { createContext, useContext, useState, useCallback } from 'react';

const FilterContext = createContext(null);

export const useFilters = () => {
    const ctx = useContext(FilterContext);
    if (!ctx) throw new Error('useFilters must be used within FilterProvider');
    return ctx;
};

// Get default date range (last 24 hours)
function getDefaultRange() {
    const end = new Date();
    const start = new Date(end.getTime() - 24 * 3600000);
    return {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        label: 'Last 24 hours',
    };
}

const DATE_RANGES = [
    { label: 'Last 1 hour', hours: 1 },
    { label: 'Last 6 hours', hours: 6 },
    { label: 'Last 24 hours', hours: 24 },
    { label: 'Last 7 days', hours: 168 },
    { label: 'Last 30 days', hours: 720 },
];

export function FilterProvider({ children }) {
    const defaultRange = getDefaultRange();
    const [dateRange, setDateRange] = useState(defaultRange);
    const [environment, setEnvironment] = useState('all');

    const updateDateRange = useCallback((label) => {
        const preset = DATE_RANGES.find(r => r.label === label);
        if (preset) {
            const end = new Date();
            const start = new Date(end.getTime() - preset.hours * 3600000);
            setDateRange({ startDate: start.toISOString(), endDate: end.toISOString(), label });
        }
    }, []);

    const updateEnvironment = useCallback((env) => {
        setEnvironment(env);
    }, []);

    return (
        <FilterContext.Provider value={{
            dateRange,
            environment,
            dateRangeOptions: DATE_RANGES,
            updateDateRange,
            updateEnvironment,
        }}>
            {children}
        </FilterContext.Provider>
    );
}
