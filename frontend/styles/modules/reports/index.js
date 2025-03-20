import ChartStyles from './Chart.module.css';
import CommonStyles from './Common.module.css';
import FlowStyles from './Flow.module.css';
import SavingGoalsStyles from './SavingGoals.module.css';

// Export all styles as a single object
export const ReportsStyles = {
  ...CommonStyles,
  ...FlowStyles,
  ...SavingGoalsStyles,
  ...ChartStyles
};

// Export individual style modules for more granular imports
export {
  CommonStyles,
  FlowStyles,
  SavingGoalsStyles,
  ChartStyles
};
