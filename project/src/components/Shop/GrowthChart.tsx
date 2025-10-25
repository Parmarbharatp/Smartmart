import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ComposedChart
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  IndianRupee, 
  ShoppingBag, 
  Package, 
  Users, 
  Target,
  Award,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
  LineChart as LineChartIcon,
  Activity
} from 'lucide-react';
import { apiService } from '../../services/api';

interface GrowthChartProps {
  shopId?: string;
}

interface ChartData {
  period: string;
  revenue: number;
  orders: number;
  delivered: number;
  pending: number;
  customers?: number;
  growth?: number;
}

interface StatusData {
  name: string;
  value: number;
  color: string;
}

const GrowthChart: React.FC<GrowthChartProps> = ({ shopId }) => {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [statusData, setStatusData] = useState<StatusData[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [chartType, setChartType] = useState<'line' | 'area' | 'bar'>('area');
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalDelivered: 0,
    totalPending: 0,
    growthRate: 0,
    avgOrderValue: 0
  });

  const colors = {
    revenue: '#10B981',
    orders: '#3B82F6',
    delivered: '#059669',
    pending: '#F59E0B',
    cancelled: '#EF4444'
  };

  const statusColors = [
    '#10B981', // delivered
    '#F59E0B', // pending
    '#3B82F6', // confirmed
    '#8B5CF6', // shipped
    '#EF4444', // cancelled
    '#6B7280'  // refunded
  ];

  useEffect(() => {
    loadChartData();
  }, [period, shopId]);

  const loadChartData = async () => {
    try {
      setLoading(true);
      
      // Load time series data
      const timeSeries = await apiService.getOrderTimeSeries({ period });
      const series = timeSeries?.series || [];
      
      // Transform data for charts
      const transformedData: ChartData[] = series.map((item: any, index: number) => {
        const periodLabel = getPeriodLabel(item._id, period);
        const prevItem = index > 0 ? series[index - 1] : null;
        const growth = prevItem ? ((item.revenue - prevItem.revenue) / prevItem.revenue) * 100 : 0;
        
        return {
          period: periodLabel,
          revenue: item.revenue || 0,
          orders: item.orders || 0,
          delivered: item.delivered || 0,
          pending: item.pending || 0,
          growth: Math.round(growth * 100) / 100
        };
      });

      setChartData(transformedData);

      // Load summary stats for metrics
      const stats = await apiService.getOrderStatsSummary({});
      if (stats) {
        const totalRevenue = stats.totalRevenue || 0;
        const totalOrders = stats.totalOrders || 0;
        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        
        // Calculate growth rate (compare with previous period)
        const currentPeriod = transformedData[transformedData.length - 1];
        const previousPeriod = transformedData[transformedData.length - 2];
        const growthRate = previousPeriod && currentPeriod ? 
          ((currentPeriod.revenue - previousPeriod.revenue) / previousPeriod.revenue) * 100 : 0;

        setMetrics({
          totalRevenue,
          totalOrders,
          totalDelivered: stats.deliveredCount || 0,
          totalPending: stats.pendingCount || 0,
          growthRate: Math.round(growthRate * 100) / 100,
          avgOrderValue: Math.round(avgOrderValue * 100) / 100
        });

        // Create status distribution data
        const statusDistribution: StatusData[] = [
          { name: 'Delivered', value: stats.deliveredCount || 0, color: colors.delivered },
          { name: 'Pending', value: stats.pendingCount || 0, color: colors.pending },
          { name: 'Confirmed', value: stats.confirmedCount || 0, color: '#3B82F6' },
          { name: 'Shipped', value: stats.shippedCount || 0, color: '#8B5CF6' },
          { name: 'Cancelled', value: stats.cancelledCount || 0, color: colors.cancelled },
          { name: 'Refunded', value: stats.refundedCount || 0, color: '#6B7280' }
        ].filter(item => item.value > 0);

        setStatusData(statusDistribution);
      }
    } catch (error) {
      console.error('Failed to load chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPeriodLabel = (id: any, periodType: string): string => {
    if (!id) return 'Unknown';
    
    switch (periodType) {
      case 'year':
        return `${id.year}`;
      case 'month':
        return `${id.month}/${id.year}`;
      case 'week':
        return `W${id.isoWeek}/${id.year}`;
      default:
        return 'Unknown';
    }
  };

  const formatCurrency = (value: number) => `₹${value.toLocaleString()}`;
  const formatNumber = (value: number) => value.toLocaleString();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg max-w-xs">
          <p className="font-semibold text-gray-900 mb-3 text-center">{label}</p>
          <div className="space-y-2">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2" 
                    style={{ backgroundColor: entry.color }}
                  ></div>
                  <span className="text-sm font-medium text-gray-700">{entry.name}:</span>
                </div>
                <span className="text-sm font-bold text-gray-900">
                  {entry.name === 'Revenue' ? formatCurrency(entry.value) : formatNumber(entry.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  const getInsights = () => {
    const insights = [];
    
    // Revenue growth insight
    if (metrics.growthRate > 0) {
      insights.push({
        type: 'success',
        icon: TrendingUp,
        title: 'Revenue Growing!',
        message: `Your revenue increased by ${metrics.growthRate.toFixed(1)}% compared to the previous period.`,
        color: 'green'
      });
    } else if (metrics.growthRate < 0) {
      insights.push({
        type: 'warning',
        icon: TrendingDown,
        title: 'Revenue Declining',
        message: `Your revenue decreased by ${Math.abs(metrics.growthRate).toFixed(1)}% compared to the previous period.`,
        color: 'red'
      });
    }

    // Order completion rate insight
    const completionRate = metrics.totalOrders > 0 ? (metrics.totalDelivered / metrics.totalOrders) * 100 : 0;
    if (completionRate >= 80) {
      insights.push({
        type: 'success',
        icon: CheckCircle,
        title: 'Excellent Delivery Rate!',
        message: `${completionRate.toFixed(1)}% of your orders are successfully delivered.`,
        color: 'green'
      });
    } else if (completionRate < 60) {
      insights.push({
        type: 'warning',
        icon: AlertCircle,
        title: 'Low Delivery Rate',
        message: `Only ${completionRate.toFixed(1)}% of orders are delivered. Consider improving your delivery process.`,
        color: 'orange'
      });
    }

    // Average order value insight
    if (metrics.avgOrderValue > 0) {
      insights.push({
        type: 'info',
        icon: Target,
        title: 'Average Order Value',
        message: `Your customers spend an average of ${formatCurrency(metrics.avgOrderValue)} per order.`,
        color: 'blue'
      });
    }

    return insights;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Total Revenue</p>
              <p className="text-2xl font-bold">{formatCurrency(metrics.totalRevenue)}</p>
            </div>
            <IndianRupee className="h-8 w-8 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Orders</p>
              <p className="text-2xl font-bold">{formatNumber(metrics.totalOrders)}</p>
            </div>
            <ShoppingBag className="h-8 w-8 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Avg Order Value</p>
              <p className="text-2xl font-bold">{formatCurrency(metrics.avgOrderValue)}</p>
            </div>
            <Package className="h-8 w-8 text-purple-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm">Delivered Orders</p>
              <p className="text-2xl font-bold">{formatNumber(metrics.totalDelivered)}</p>
            </div>
            <Package className="h-8 w-8 text-emerald-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-sm">Pending Orders</p>
              <p className="text-2xl font-bold">{formatNumber(metrics.totalPending)}</p>
            </div>
            <ShoppingBag className="h-8 w-8 text-amber-200" />
          </div>
        </div>

        <div className={`rounded-lg p-4 text-white ${metrics.growthRate >= 0 ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-red-500 to-red-600'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${metrics.growthRate >= 0 ? 'text-green-100' : 'text-red-100'}`}>Growth Rate</p>
              <p className="text-2xl font-bold">{metrics.growthRate >= 0 ? '+' : ''}{metrics.growthRate.toFixed(1)}%</p>
            </div>
            {metrics.growthRate >= 0 ? (
              <TrendingUp className="h-8 w-8 text-green-200" />
            ) : (
              <TrendingDown className="h-8 w-8 text-red-200" />
            )}
          </div>
        </div>
      </div>

      {/* Chart Controls */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Business Growth Analytics</h3>
            <p className="text-sm text-gray-600">Track your shop's performance and growth trends</p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Period Selection */}
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <label className="text-sm font-medium text-gray-700">Time Period:</label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as 'week' | 'month' | 'year')}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="week">📅 Weekly View</option>
                <option value="month">📊 Monthly View</option>
                <option value="year">📈 Yearly View</option>
              </select>
            </div>

            {/* Chart Type Selection */}
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-gray-500" />
              <label className="text-sm font-medium text-gray-700">Chart Style:</label>
              <select
                value={chartType}
                onChange={(e) => setChartType(e.target.value as 'line' | 'area' | 'bar')}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="area">📊 Area Chart</option>
                <option value="line">📈 Line Chart</option>
                <option value="bar">📊 Bar Chart</option>
              </select>
            </div>
          </div>
        </div>

        {/* Quick Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(metrics.totalRevenue)}</div>
            <div className="text-xs text-blue-700">Total Revenue</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{formatNumber(metrics.totalOrders)}</div>
            <div className="text-xs text-green-700">Total Orders</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{formatCurrency(metrics.avgOrderValue)}</div>
            <div className="text-xs text-purple-700">Avg Order Value</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${metrics.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {metrics.growthRate >= 0 ? '+' : ''}{metrics.growthRate.toFixed(1)}%
            </div>
            <div className={`text-xs ${metrics.growthRate >= 0 ? 'text-green-700' : 'text-red-700'}`}>Growth Rate</div>
          </div>
        </div>
      </div>

      {/* Main Growth Chart */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xl font-bold text-gray-900">📈 Revenue & Orders Trend</h4>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                <span>Revenue</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                <span>Orders</span>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-600">Visualize your business performance and identify growth patterns</p>
        </div>
        
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'area' ? (
              <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={colors.revenue} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={colors.revenue} stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={colors.orders} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={colors.orders} stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="period" 
                  stroke="#666"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#666' }}
                />
                <YAxis 
                  yAxisId="revenue"
                  orientation="left"
                  stroke="#666"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatCurrency}
                  tick={{ fill: '#666' }}
                />
                <YAxis 
                  yAxisId="orders"
                  orientation="right"
                  stroke="#666"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#666' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area
                  yAxisId="revenue"
                  type="monotone"
                  dataKey="revenue"
                  stroke={colors.revenue}
                  fill="url(#revenueGradient)"
                  strokeWidth={3}
                  name="Revenue (₹)"
                />
                <Area
                  yAxisId="orders"
                  type="monotone"
                  dataKey="orders"
                  stroke={colors.orders}
                  fill="url(#ordersGradient)"
                  strokeWidth={3}
                  name="Orders Count"
                />
              </AreaChart>
            ) : chartType === 'line' ? (
              <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="period" 
                  stroke="#666"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#666' }}
                />
                <YAxis 
                  yAxisId="revenue"
                  orientation="left"
                  stroke="#666"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatCurrency}
                  tick={{ fill: '#666' }}
                />
                <YAxis 
                  yAxisId="orders"
                  orientation="right"
                  stroke="#666"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#666' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  yAxisId="revenue"
                  type="monotone"
                  dataKey="revenue"
                  stroke={colors.revenue}
                  strokeWidth={4}
                  dot={{ fill: colors.revenue, strokeWidth: 2, r: 6 }}
                  activeDot={{ r: 8, stroke: colors.revenue, strokeWidth: 2 }}
                  name="Revenue (₹)"
                />
                <Line
                  yAxisId="orders"
                  type="monotone"
                  dataKey="orders"
                  stroke={colors.orders}
                  strokeWidth={4}
                  dot={{ fill: colors.orders, strokeWidth: 2, r: 6 }}
                  activeDot={{ r: 8, stroke: colors.orders, strokeWidth: 2 }}
                  name="Orders Count"
                />
              </LineChart>
            ) : (
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="period" 
                  stroke="#666"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#666' }}
                />
                <YAxis 
                  yAxisId="revenue"
                  orientation="left"
                  stroke="#666"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatCurrency}
                  tick={{ fill: '#666' }}
                />
                <YAxis 
                  yAxisId="orders"
                  orientation="right"
                  stroke="#666"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#666' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar
                  yAxisId="revenue"
                  dataKey="revenue"
                  fill={colors.revenue}
                  name="Revenue (₹)"
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  yAxisId="orders"
                  dataKey="orders"
                  fill={colors.orders}
                  name="Orders Count"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Chart Insights */}
        {chartData.length > 1 && (
          <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg">
            <h5 className="font-semibold text-gray-900 mb-3">📊 Quick Insights</h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">
                  {chartData.length > 0 ? formatCurrency(Math.max(...chartData.map(d => d.revenue))) : '₹0'}
                </div>
                <div className="text-gray-600">Peak Revenue</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">
                  {chartData.length > 0 ? Math.max(...chartData.map(d => d.orders)) : 0}
                </div>
                <div className="text-gray-600">Peak Orders</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-purple-600">
                  {chartData.length > 0 ? formatCurrency(chartData.reduce((sum, d) => sum + d.revenue, 0) / chartData.length) : '₹0'}
                </div>
                <div className="text-gray-600">Avg Revenue</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Order Status Distribution */}
      {statusData.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="mb-4">
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Order Status Distribution</h4>
            <p className="text-sm text-gray-600">Current breakdown of your orders</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatNumber(value as number)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="space-y-3">
              {statusData.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div 
                      className="w-4 h-4 rounded-full mr-3" 
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="font-medium text-gray-900">{item.name}</span>
                  </div>
                  <span className="text-lg font-bold text-gray-900">{formatNumber(item.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Smart Insights & Recommendations */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h4 className="text-xl font-bold text-gray-900 mb-6">🎯 Smart Insights & Recommendations</h4>
        
        {/* Dynamic Insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {getInsights().map((insight, index) => {
            const IconComponent = insight.icon;
            return (
              <div key={index} className={`p-4 rounded-lg border-l-4 ${
                insight.color === 'green' ? 'bg-green-50 border-green-500' :
                insight.color === 'red' ? 'bg-red-50 border-red-500' :
                insight.color === 'orange' ? 'bg-orange-50 border-orange-500' :
                'bg-blue-50 border-blue-500'
              }`}>
                <div className="flex items-start">
                  <IconComponent className={`h-6 w-6 mr-3 mt-1 ${
                    insight.color === 'green' ? 'text-green-600' :
                    insight.color === 'red' ? 'text-red-600' :
                    insight.color === 'orange' ? 'text-orange-600' :
                    'text-blue-600'
                  }`} />
                  <div>
                    <h5 className={`font-semibold mb-2 ${
                      insight.color === 'green' ? 'text-green-900' :
                      insight.color === 'red' ? 'text-red-900' :
                      insight.color === 'orange' ? 'text-orange-900' :
                      'text-blue-900'
                    }`}>{insight.title}</h5>
                    <p className={`text-sm ${
                      insight.color === 'green' ? 'text-green-700' :
                      insight.color === 'red' ? 'text-red-700' :
                      insight.color === 'orange' ? 'text-orange-700' :
                      'text-blue-700'
                    }`}>{insight.message}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg text-center">
            <div className="flex items-center justify-center mb-2">
              <CheckCircle className="h-6 w-6 text-blue-600 mr-2" />
              <h5 className="font-semibold text-blue-900">Delivery Success Rate</h5>
            </div>
            <p className="text-3xl font-bold text-blue-600">
              {metrics.totalOrders > 0 ? ((metrics.totalDelivered / metrics.totalOrders) * 100).toFixed(1) : 0}%
            </p>
            <p className="text-sm text-blue-700">Orders successfully delivered</p>
          </div>
          
          <div className={`p-4 rounded-lg text-center ${
            metrics.growthRate >= 0 
              ? 'bg-gradient-to-r from-green-50 to-green-100' 
              : 'bg-gradient-to-r from-red-50 to-red-100'
          }`}>
            <div className="flex items-center justify-center mb-2">
              {metrics.growthRate >= 0 ? (
                <TrendingUp className="h-6 w-6 text-green-600 mr-2" />
              ) : (
                <TrendingDown className="h-6 w-6 text-red-600 mr-2" />
              )}
              <h5 className={`font-semibold ${
                metrics.growthRate >= 0 ? 'text-green-900' : 'text-red-900'
              }`}>Revenue Growth</h5>
            </div>
            <p className={`text-3xl font-bold ${
              metrics.growthRate >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {metrics.growthRate >= 0 ? '+' : ''}{metrics.growthRate.toFixed(1)}%
            </p>
            <p className={`text-sm ${
              metrics.growthRate >= 0 ? 'text-green-700' : 'text-red-700'
            }`}>Compared to previous period</p>
          </div>

          <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg text-center">
            <div className="flex items-center justify-center mb-2">
              <Target className="h-6 w-6 text-purple-600 mr-2" />
              <h5 className="font-semibold text-purple-900">Average Order Value</h5>
            </div>
            <p className="text-3xl font-bold text-purple-600">
              {formatCurrency(metrics.avgOrderValue)}
            </p>
            <p className="text-sm text-purple-700">Per customer order</p>
          </div>
        </div>

        {/* Actionable Recommendations */}
        <div className="mt-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
          <h5 className="font-semibold text-orange-900 mb-3 flex items-center">
            <Award className="h-5 w-5 mr-2" />
            💡 Actionable Recommendations
          </h5>
          <div className="space-y-2 text-sm text-orange-800">
            {metrics.growthRate < 0 && (
              <p>• <strong>Boost Sales:</strong> Consider running promotions or discounts to increase revenue</p>
            )}
            {metrics.totalPending > metrics.totalDelivered && (
              <p>• <strong>Improve Delivery:</strong> Focus on faster order processing and delivery</p>
            )}
            {metrics.avgOrderValue < 1000 && (
              <p>• <strong>Increase AOV:</strong> Bundle products or offer upsells to increase order value</p>
            )}
            {metrics.totalOrders === 0 && (
              <p>• <strong>Get Started:</strong> Add more products and promote your shop to get your first orders</p>
            )}
            {metrics.growthRate > 10 && (
              <p>• <strong>Great Job!</strong> Your business is growing well. Consider expanding your product range</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GrowthChart;
