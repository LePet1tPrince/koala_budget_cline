import { Fragment, useEffect, useState } from 'react';
import {
  allocateRemaining,
  getSavingGoalsReport,
  updateSavingGoalBalance,
  updateSavingGoalTarget
} from '../../services/reportService';

import { getAccounts } from '../../services/accountService';
import { ReportsStyles as styles } from '../../styles/modules';

const SavingGoalsReport = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingField, setEditingField] = useState({});
  const [tempValues, setTempValues] = useState({});
  const [targetValues, setTargetValues] = useState({});
  const [balanceValues, setBalanceValues] = useState({});

  // Load data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch saving goals report data
        const reportData = await getSavingGoalsReport();
        setData(reportData);

        // Initialize values with current target and balance values
        const initialTargetValues = {};
        const initialBalanceValues = {};
        reportData.saving_goals.forEach(goal => {
          initialTargetValues[goal.id] = goal.target;
          initialBalanceValues[goal.id] = goal.balance;
        });
        setTargetValues(initialTargetValues);
        setBalanceValues(initialBalanceValues);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Start editing a field
  const startEditing = (goalId, field) => {
    setEditingField({ goalId, field });
    setTempValues({
      ...tempValues,
      [goalId]: {
        ...tempValues[goalId],
        [field]: field === 'target' ? targetValues[goalId] : balanceValues[goalId]
      }
    });
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingField({});
  };

  // Handle input change
  const handleInputChange = (goalId, field, value) => {
    const numValue = parseFloat(value) || 0;
    setTempValues({
      ...tempValues,
      [goalId]: {
        ...tempValues[goalId],
        [field]: numValue
      }
    });
  };

  // Save field value
  const saveFieldValue = async (goalId, field) => {
    try {
      setEditingField({});

      const newValue = tempValues[goalId][field];

      if (field === 'target') {
        // Update target value
        await updateSavingGoalTarget(goalId, newValue);
        setTargetValues({ ...targetValues, [goalId]: newValue });
      } else if (field === 'balance') {
        // Update balance value
        await updateSavingGoalBalance(goalId, newValue);
        setBalanceValues({ ...balanceValues, [goalId]: newValue });

        // Refresh data to update left to allocate
        const reportData = await getSavingGoalsReport();
        setData(reportData);

        // Update all values
        const updatedTargetValues = {};
        const updatedBalanceValues = {};
        reportData.saving_goals.forEach(goal => {
          updatedTargetValues[goal.id] = goal.target;
          updatedBalanceValues[goal.id] = goal.balance;
        });
        setTargetValues(updatedTargetValues);
        setBalanceValues(updatedBalanceValues);
      }
    } catch (error) {
      console.error(`Error saving ${field}:`, error);
      setError(`Failed to save ${field}. Please try again.`);
    }
  };

  // Handle allocate all button click
  const handleAllocateAll = async (goalId) => {
    if (data.left_to_allocate <= 0) {
      return; // Nothing to allocate
    }

    try {
      setLoading(true);

      // Call the API to allocate the remaining funds
      await allocateRemaining(goalId, data.left_to_allocate);

      // Refresh data
      const reportData = await getSavingGoalsReport();
      setData(reportData);

      // Update values with new values
      const updatedTargetValues = {};
      const updatedBalanceValues = {};
      reportData.saving_goals.forEach(goal => {
        updatedTargetValues[goal.id] = goal.target;
        updatedBalanceValues[goal.id] = goal.balance;
      });
      setTargetValues(updatedTargetValues);
      setBalanceValues(updatedBalanceValues);

      setLoading(false);
    } catch (error) {
      console.error('Error allocating remaining funds:', error);
      setError('Failed to allocate remaining funds. Please try again.');
      setLoading(false);
    }
  };

  // Calculate progress percentage
  const calculateProgress = (goalId) => {
    const balance = balanceValues[goalId] || 0;
    const target = targetValues[goalId] || 0;
    if (target <= 0) return 0;
    return Math.min(100, (balance / target) * 100);
  };

  if (loading) {
    return <p>Loading saving goals data...</p>;
  }

  if (error) {
    return <p className="error">{error}</p>;
  }

  if (!data) {
    return <p>No data available.</p>;
  }

  return (
    <div>
      <h2>Saving Goals</h2>
      <p>
        This report shows your net worth and how it's allocated to your saving goals.
        You can adjust the target amount for each goal to plan your financial future.
      </p>


      {/* Net Worth Card */}
      <div className={styles.netWorthCard}>
        <h3>Net Worth</h3>
        <p className={styles.netWorthAmount}>{formatCurrency(data.net_worth)}</p>
        <div className={`${styles.leftToAllocate} ${data.left_to_allocate >= 0 ? styles.leftToAllocatePositive : styles.leftToAllocateNegative}`}>
          Left to Assign: {formatCurrency(data.left_to_allocate)}
        </div>
      </div>


      {/* Saving Goals */}
      <h3>Saving Goals</h3>
      <div className={styles.savingGoalsContainer}>
        {data.saving_goals.map(goal => (
          <div key={goal.id} className={styles.savingGoalCard}>
            <h4>{goal.name}</h4>
            <div className={styles.progressContainer}>
              <div
                className={styles.progressBar}
                style={{ width: `${calculateProgress(goal.id)}%` }}
              ></div>
            </div>
            <div className={styles.savingGoalDetails}>
              {/* Current Value Field */}
              <div className={styles.currentValueContainer}>
                {editingField.goalId === goal.id && editingField.field === 'balance' ? (
                  <div className={styles.inputContainer}>
                    <label>Current: $</label>
                    <input
                      type="number"
                      value={tempValues[goal.id]?.balance || 0}
                      onChange={(e) => handleInputChange(goal.id, 'balance', e.target.value)}
                      min="0"
                      step="100"
                      className={styles.valueInput}
                      autoFocus
                    />
                    <span
                      className={styles.saveIcon}
                      onClick={() => saveFieldValue(goal.id, 'balance')}
                    >
                      ✅
                    </span>
                    <span
                      className={styles.cancelIcon}
                      onClick={cancelEditing}
                    >
                      ❌
                    </span>
                  </div>
                ) : (
                  <div className={styles.fieldContainer}>
                    <span className={styles.fieldLabel}>Current:</span>
                    <span className={styles.fieldValue}>{formatCurrency(goal.balance)}</span>
                    <span
                      className={styles.editIcon}
                      onClick={() => startEditing(goal.id, 'balance')}
                    >
                      ✏️
                    </span>
                  </div>
                )}
                <button
                  className={styles.allocateButton}
                  onClick={() => handleAllocateAll(goal.id)}
                  disabled={data.left_to_allocate <= 0}
                >
                  Allocate All
                </button>
              </div>

              {/* Target Value Field */}
              {editingField.goalId === goal.id && editingField.field === 'target' ? (
                <div className={styles.inputContainer}>
                  <label>Target: $</label>
                  <input
                    type="number"
                    value={tempValues[goal.id]?.target || 0}
                    onChange={(e) => handleInputChange(goal.id, 'target', e.target.value)}
                    min="0"
                    step="100"
                    className={styles.valueInput}
                    autoFocus
                  />
                  <span
                    className={styles.saveIcon}
                    onClick={() => saveFieldValue(goal.id, 'target')}
                  >
                    ✅
                  </span>
                  <span
                    className={styles.cancelIcon}
                    onClick={cancelEditing}
                  >
                    ❌
                  </span>
                </div>
              ) : (
                <div className={styles.fieldContainer}>
                  <span className={styles.fieldLabel}>Target:</span>
                  <span className={styles.fieldValue}>{formatCurrency(goal.target)}</span>
                  <span
                    className={styles.editIcon}
                    onClick={() => startEditing(goal.id, 'target')}
                  >
                    ✏️
                  </span>
                </div>
              )}

              <p>
                {calculateProgress(goal.id).toFixed(0)}% funded
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SavingGoalsReport;
