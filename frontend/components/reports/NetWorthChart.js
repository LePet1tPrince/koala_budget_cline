import { useEffect, useState } from 'react';

import dynamic from 'next/dynamic';
import { getNetWorthHistory } from '../../services/reportService';
import { ChartStyles as styles } from '../../styles/modules/reports';

// Dynamically import Plotly to avoid SSR issues
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

const NetWorthChart = ({ months = 12 }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Calculate date range (last X months)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - months);

        // Format dates for API
        const formattedStartDate = startDate.toISOString().split('T')[0];
        const formattedEndDate = endDate.toISOString().split('T')[0];

        // Fetch data
        const historyData = await getNetWorthHistory(
          formattedStartDate,
          formattedEndDate
        );

        setData(historyData);
      } catch (error) {
        console.error('Error fetching net worth history:', error);
        setError('Failed to load net worth history. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [months]);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format date for display (e.g., "Jan 1, 2024")
  const formatDisplayDate = (dateString) => {
    if (!dateString) return '';
    // Parse the date string and ensure it's interpreted in local timezone
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month is 0-indexed in JS Date
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Render loading/error states or the chart
  if (loading) return <p>Loading chart data...</p>;
  if (error) return <p className="error">{error}</p>;
  if (!data || data.length === 0) return <p>No data available.</p>;

  return (
    <div className={styles.chartContainer}>
      <Plot
        data={[
          {
            x: data.map(point => point.date),
            y: data.map(point => point.net_worth),
            type: 'scatter',
            mode: 'lines+markers',
            marker: {color: '#2E83B7'},
            line: {shape: 'spline', smoothing: 1.3, width: 3},
            name: 'Net Worth'
          }
        ]}
        layout={{
          xaxis: {
            showgrid: false,
            tickformat: '%b %Y',
            tickangle: -45,
            showticklabels: true,
            showline: false,
            zeroline: false
          },
          yaxis: {
            showgrid: true,
            tickformat: '$,.0f',
            showticklabels: true,
            showline: false,
            zeroline: false
          },
          autosize: true,
          height: 300,
          margin: {l: 60, r: 10, t: 10, b: 60},
          paper_bgcolor: 'rgba(0,0,0,0)',
          plot_bgcolor: 'rgba(0,0,0,0)',
          hovermode: 'closest',
          hoverlabel: {
            bgcolor: '#FFF',
            font: {size: 12, color: '#333'},
            bordercolor: '#2E83B7'
          },
          showlegend: false
        }}
        config={{
          responsive: true,
          displayModeBar: false
        }}
        style={{width: '100%'}}
      />
    </div>
  );
};

export default NetWorthChart;
