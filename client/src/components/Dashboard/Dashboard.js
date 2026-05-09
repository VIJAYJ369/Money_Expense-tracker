import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { transactionAPI, reportAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import './Dashboard.css';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler
);

const CHART_COLORS = ['#6366f1','#00e5a0','#ff4d6d','#fbbf24','#22d3ee','#a855f7','#f97316','#14b8a6','#ec4899','#84cc16'];

const chartDefaults = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { labels: { color: '#8888aa', font: { family: "'DM Sans'" } } },
    tooltip: {
      backgroundColor: '#1a1a27',
      borderColor: '#2a2a3d',
      borderWidth: 1,
      titleColor: '#f0f0ff',
      bodyColor: '#8888aa',
    }
  },
  scales: {
    x: { grid: { color: '#1e1e2d' }, ticks: { color: '#555570' } },
    y: { grid: { color: '#1e1e2d' }, ticks: { color: '#555570' } },
  }
};

const StatCard = ({ label, value, sub, gradient, icon }) => (
  <div className="stat-card" style={{ '--card-gradient': gradient }}>
    <div className="stat-icon">{icon}</div>
    <div className="stat-body">
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}</p>
      {sub && <p className="stat-sub">{sub}</p>}
    </div>
    <div className="stat-glow" />
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ income: 0, expense: 0, balance: 0, incomeCount: 0, expenseCount: 0 });
  const [monthlyData, setMonthlyData] = useState([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState({ breakdown: [], total: 0 });
  const [recentTx, setRecentTx] = useState([]);
  const [loading, setLoading] = useState(true);

  const currency = user?.currency || 'USD';
  const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n);
  const now = new Date();

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, monthlyRes, catRes, txRes] = await Promise.all([
          transactionAPI.getStats({ month: now.getMonth() + 1, year: now.getFullYear() }),
          reportAPI.getMonthly({ year: now.getFullYear() }),
          reportAPI.getCategoryBreakdown({ type: 'expense', month: now.getMonth() + 1, year: now.getFullYear() }),
          transactionAPI.getAll({ limit: 5, sortBy: 'date', sortOrder: 'desc' }),
        ]);
        setStats(statsRes.data);
        setMonthlyData(monthlyRes.data);
        setCategoryBreakdown(catRes.data);
        setRecentTx(txRes.data.transactions);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const barData = {
    labels: monthlyData.map(m => m.monthName),
    datasets: [
      {
        label: 'Income',
        data: monthlyData.map(m => m.income),
        backgroundColor: 'rgba(0,229,160,0.75)',
        borderRadius: 6,
      },
      {
        label: 'Expenses',
        data: monthlyData.map(m => m.expense),
        backgroundColor: 'rgba(255,77,109,0.75)',
        borderRadius: 6,
      },
    ],
  };

  const doughnutData = {
    labels: categoryBreakdown.breakdown.slice(0, 8).map(c => c.category),
    datasets: [{
      data: categoryBreakdown.breakdown.slice(0, 8).map(c => c.total),
      backgroundColor: CHART_COLORS,
      borderColor: '#12121a',
      borderWidth: 3,
      hoverOffset: 8,
    }],
  };

  const balanceData = {
    labels: monthlyData.map(m => m.monthName),
    datasets: [{
      label: 'Balance',
      data: monthlyData.map(m => m.balance),
      borderColor: '#6366f1',
      backgroundColor: 'rgba(99,102,241,0.1)',
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#6366f1',
      pointRadius: 4,
    }],
  };

  if (loading) return <div className="loading-container"><div className="spinner" /></div>;

  return (
    <div className="dashboard page-fade-in">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title font-display">
            Good {now.getHours() < 12 ? 'morning' : now.getHours() < 18 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="dashboard-sub">{now.toLocaleString('default', { month: 'long', year: 'numeric' })} overview</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="stat-grid">
        <StatCard label="Total Income" value={fmt(stats.income)} sub={`${stats.incomeCount} transactions`}
          gradient="linear-gradient(135deg,rgba(0,229,160,0.15),rgba(6,182,212,0.08))" icon="📈" />
        <StatCard label="Total Expenses" value={fmt(stats.expense)} sub={`${stats.expenseCount} transactions`}
          gradient="linear-gradient(135deg,rgba(255,77,109,0.15),rgba(249,115,22,0.08))" icon="📉" />
        <StatCard label="Net Balance" value={fmt(stats.balance)} sub={stats.balance >= 0 ? '✓ In the green' : '⚠ Overspent'}
          gradient="linear-gradient(135deg,rgba(99,102,241,0.15),rgba(168,85,247,0.08))" icon="⚖️" />
        <StatCard label="Savings Rate"
          value={stats.income > 0 ? `${Math.max(0, ((stats.balance / stats.income) * 100)).toFixed(1)}%` : '—'}
          sub="of income saved"
          gradient="linear-gradient(135deg,rgba(251,191,36,0.15),rgba(234,179,8,0.08))" icon="🎯" />
      </div>

      {/* Charts Row 1 */}
      <div className="chart-row">
        <div className="card chart-card chart-wide">
          <h3 className="chart-title font-display">Income vs Expenses — {now.getFullYear()}</h3>
          <div className="chart-wrap">
            <Bar data={barData} options={chartDefaults} />
          </div>
        </div>

        <div className="card chart-card">
          <h3 className="chart-title font-display">Spending by Category</h3>
          {categoryBreakdown.breakdown.length > 0 ? (
            <div className="chart-wrap" style={{ height: 240 }}>
              <Doughnut data={doughnutData} options={{ ...chartDefaults, scales: undefined, cutout: '65%' }} />
            </div>
          ) : (
            <div className="empty-chart">No expense data this month</div>
          )}
          <div className="cat-legend">
            {categoryBreakdown.breakdown.slice(0, 5).map((c, i) => (
              <div key={c.category} className="cat-item">
                <span className="cat-dot" style={{ background: CHART_COLORS[i] }} />
                <span className="cat-name">{c.category}</span>
                <span className="cat-pct">{c.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="chart-row">
        <div className="card chart-card chart-wide">
          <h3 className="chart-title font-display">Balance Trend</h3>
          <div className="chart-wrap">
            <Line data={balanceData} options={chartDefaults} />
          </div>
        </div>

        <div className="card chart-card">
          <h3 className="chart-title font-display">Recent Transactions</h3>
          {recentTx.length === 0 ? (
            <div className="empty-chart">No transactions yet</div>
          ) : (
            <div className="recent-list">
              {recentTx.map(tx => (
                <div key={tx._id} className="recent-item">
                  <div className="recent-info">
                    <p className="recent-category">{tx.category}</p>
                    <p className="recent-desc">{tx.description || tx.category}</p>
                    <p className="recent-date">{new Date(tx.date).toLocaleDateString()}</p>
                  </div>
                  <span className={`recent-amount ${tx.type === 'income' ? 'text-income' : 'text-expense'}`}>
                    {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
