import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { format } from 'date-fns';

interface PerformanceChartProps {
  data: Array<{
    timestamp: string;
    nav: number;
    roi_percent: number;
  }>;
  height?: number;
}

export function PerformanceChart({ data, height = 300 }: PerformanceChartProps) {
  const chartData = data.map((point) => ({
    date: new Date(point.timestamp),
    value: point.nav,
    roi: point.roi_percent,
  }));

  // Determine if overall trend is positive
  const isPositive = chartData.length > 0 && 
    chartData[chartData.length - 1].value >= chartData[0].value;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart
        data={chartData}
        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor={isPositive ? '#10b981' : '#ef4444'}
              stopOpacity={0.3}
            />
            <stop
              offset="95%"
              stopColor={isPositive ? '#10b981' : '#ef4444'}
              stopOpacity={0}
            />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
        <XAxis
          dataKey="date"
          tickFormatter={(date) => format(date, 'MMM d')}
          stroke="#9ca3af"
          fontSize={12}
        />
        <YAxis
          stroke="#9ca3af"
          fontSize={12}
          tickFormatter={(value) => `$${value.toFixed(0)}`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            border: 'none',
            borderRadius: '0.75rem',
            padding: '12px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
          }}
          labelStyle={{ color: '#fff', fontWeight: 'bold', marginBottom: '8px' }}
          itemStyle={{ color: '#fff' }}
          labelFormatter={(date) => format(date, 'MMM d, yyyy HH:mm')}
          formatter={(value: number, name: string) => {
            if (name === 'value') return [`$${value.toFixed(2)}`, 'NAV'];
            if (name === 'roi') return [`${value.toFixed(2)}%`, 'ROI'];
            return [value, name];
          }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={isPositive ? '#10b981' : '#ef4444'}
          strokeWidth={3}
          fill="url(#colorValue)"
          animationDuration={1000}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
