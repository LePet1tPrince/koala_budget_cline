import { useEffect, useRef, useState } from 'react';

import { DateRangePickerStyles as styles } from '../../styles/modules';

const DateRangePicker = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onApply
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(startDate);
  const [tempEndDate, setTempEndDate] = useState(endDate);
  const [activeRange, setActiveRange] = useState('');
  const dropdownRef = useRef(null);

  // Format date for display (e.g., "Jan 1, 2024")
  const formatDisplayDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Format date for input value (YYYY-MM-DD)
  const formatInputDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  // Get display text for the date range
  const getDisplayText = () => {
    if (!startDate && !endDate) {
      return 'Select date range';
    }

    if (startDate && endDate) {
      return `${formatDisplayDate(startDate)} – ${formatDisplayDate(endDate)}`;
    }

    if (startDate) {
      return `From ${formatDisplayDate(startDate)}`;
    }

    return `Until ${formatDisplayDate(endDate)}`;
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Update temp dates when props change
  useEffect(() => {
    setTempStartDate(startDate);
    setTempEndDate(endDate);
  }, [startDate, endDate]);

  // Toggle dropdown
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      // Reset temp dates when opening
      setTempStartDate(startDate);
      setTempEndDate(endDate);
    }
  };

  // Clear all dates
  const handleClearAll = () => {
    setTempStartDate('');
    setTempEndDate('');
    setActiveRange('');
  };

  // Clear start date
  const handleClearStartDate = () => {
    setTempStartDate('');
    setActiveRange('');
  };

  // Clear end date
  const handleClearEndDate = () => {
    setTempEndDate('');
    setActiveRange('');
  };

  // Apply the selected date range
  const handleApply = () => {
    onApply(tempStartDate, tempEndDate);
    setIsOpen(false);
  };

  // Cancel and close dropdown
  const handleCancel = () => {
    setTempStartDate(startDate);
    setTempEndDate(endDate);
    setIsOpen(false);
  };

  // Handle start date change
  const handleStartDateChange = (e) => {
    setTempStartDate(e.target.value);
    setActiveRange('');
  };

  // Handle end date change
  const handleEndDateChange = (e) => {
    setTempEndDate(e.target.value);
    setActiveRange('');
  };

  // Set date range to last 7 days
  const handleLast7Days = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 6); // 7 days including today

    setTempStartDate(start.toISOString().split('T')[0]);
    setTempEndDate(end.toISOString().split('T')[0]);
    setActiveRange('last7days');
  };

  // Set date range to last 30 days
  const handleLast30Days = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 29); // 30 days including today

    setTempStartDate(start.toISOString().split('T')[0]);
    setTempEndDate(end.toISOString().split('T')[0]);
    setActiveRange('last30days');
  };

  // Set date range to this month
  const handleThisMonth = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date();

    setTempStartDate(start.toISOString().split('T')[0]);
    setTempEndDate(end.toISOString().split('T')[0]);
    setActiveRange('thisMonth');
  };

  // Set date range to last month
  const handleLastMonth = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);

    setTempStartDate(start.toISOString().split('T')[0]);
    setTempEndDate(end.toISOString().split('T')[0]);
    setActiveRange('lastMonth');
  };

  // Set date range to this year
  const handleThisYear = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const end = new Date();

    setTempStartDate(start.toISOString().split('T')[0]);
    setTempEndDate(end.toISOString().split('T')[0]);
    setActiveRange('thisYear');
  };

  // Set date range to last year
  const handleLastYear = () => {
    const now = new Date();
    const start = new Date(now.getFullYear() - 1, 0, 1);
    const end = new Date(now.getFullYear() - 1, 11, 31);

    setTempStartDate(start.toISOString().split('T')[0]);
    setTempEndDate(end.toISOString().split('T')[0]);
    setActiveRange('lastYear');
  };

  return (
    <div className={styles.container} ref={dropdownRef}>
      {/* Date Range Display */}
      <div className={styles.dateRangeDisplay} onClick={toggleDropdown}>
        <span>{getDisplayText()}</span>
        <button
          className={styles.clearButton}
          onClick={(e) => {
            e.stopPropagation();
            handleClearAll();
            onApply('', '');
          }}
        >
          Clear
        </button>
      </div>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className={styles.dropdown}>
          {/* Header */}
          <div className={styles.dropdownHeader}>
            <span>Date Range</span>
            <span className={styles.dateRangeText}>
              {tempStartDate && tempEndDate
                ? `${formatDisplayDate(tempStartDate)} – ${formatDisplayDate(tempEndDate)}`
                : 'Select dates'}
            </span>
          </div>

          {/* Content */}
          <div className={styles.dropdownContent}>
            {/* Preset Ranges */}
            <div className={styles.presetRanges}>
              <div className={styles.rangeLabel}>Range</div>
              <button
                className={`${styles.rangeButton} ${activeRange === 'last7days' ? styles.activeRange : ''}`}
                onClick={handleLast7Days}
              >
                Last 7 days
              </button>
              <button
                className={`${styles.rangeButton} ${activeRange === 'last30days' ? styles.activeRange : ''}`}
                onClick={handleLast30Days}
              >
                Last 30 days
              </button>
              <button
                className={`${styles.rangeButton} ${activeRange === 'thisMonth' ? styles.activeRange : ''}`}
                onClick={handleThisMonth}
              >
                This month
              </button>
              <button
                className={`${styles.rangeButton} ${activeRange === 'lastMonth' ? styles.activeRange : ''}`}
                onClick={handleLastMonth}
              >
                Last month
              </button>
              <button
                className={`${styles.rangeButton} ${activeRange === 'thisYear' ? styles.activeRange : ''}`}
                onClick={handleThisYear}
              >
                This year
              </button>
              <button
                className={`${styles.rangeButton} ${activeRange === 'lastYear' ? styles.activeRange : ''}`}
                onClick={handleLastYear}
              >
                Last year
              </button>
            </div>

            {/* Date Inputs */}
            <div className={styles.dateInputs}>
              {/* Start Date */}
              <div className={styles.dateInputGroup}>
                <label>Start date</label>
                <div className={styles.dateInputWrapper}>
                  <input
                    type="date"
                    value={formatInputDate(tempStartDate)}
                    onChange={handleStartDateChange}
                    className={styles.dateInput}
                  />
                  <button
                    className={styles.clearInputButton}
                    onClick={handleClearStartDate}
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* End Date */}
              <div className={styles.dateInputGroup}>
                <label>End date</label>
                <div className={styles.dateInputWrapper}>
                  <input
                    type="date"
                    value={formatInputDate(tempEndDate)}
                    onChange={handleEndDateChange}
                    className={styles.dateInput}
                  />
                  <button
                    className={styles.clearInputButton}
                    onClick={handleClearEndDate}
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className={styles.dropdownFooter}>
            <button
              className={styles.cancelButton}
              onClick={handleCancel}
            >
              Cancel
            </button>
            <button
              className={styles.applyButton}
              onClick={handleApply}
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;
