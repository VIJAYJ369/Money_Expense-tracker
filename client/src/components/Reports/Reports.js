import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { reportAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import './Reports.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler);

const COLORS = ['#6366f1','#00e5a0','#ff4d6d','#fbbf24','#22d3ee','#a855f7','#f97316','#14b8a6','#ec4899','#84cc16'];

const baseOpts = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { labels: { color: '#8888aa', font: { family: "'DM Sans'" } } },
    tooltip: { backgroundColor: '#1a1a27', borderColor: '#2a2a3d', borderWidth: 1, titleColor: '#f0f0ff', bodyColor: '#8888aa' },
  },
  scales: {
    x: { grid: { color: '#1e1e2d' }, ticks: { color: '#555570' } },
    y: { grid: { color: '#1e1e2d' }, ticks: { color: '#555570' } },
  },
};
const noScales = { ...baseOpts, scales: undefined };

const Reports = () => {
  const { user } = useAuth();
  const currency = user?.currency || 'USD';
  const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n);

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [catType, setCatType] = useState('expense');

  const [monthly, setMonthly] = useState([]);
  const [catBreakdown, setCatBreakdown] = useState({ breakdown: [], total: 0 });
  const [dailyTrend, setDailyTrend] = useState([]);
  const [balanceHistory, setBalanceHistory] = useState([]);
  const [topExpenses, setTopExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [m, c, d, b, t] = await Promise.all([
          reportAPI.getMonthly({ year }),
          reportAPI.getCategoryBreakdown({ type: catType, month, year }),
          reportAPI.getDailyTrend({ month, year }),
          reportAPI.getBalanceHistory({ months: 6 }),
          reportAPI.getTopExpenses({ month, year, limit: 5 }),
        ]);
        setMonthly(m.data);
        setCatBreakdown(c.data);
        setDailyTrend(d.data);
        setBalanceHistory(b.data);
        setTopExpenses(t.data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, [month, year, catType]);

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: new Date(2000, i, 1).toLocaleString('default', { month: 'long' }),
  }));

  const annualIncome = monthly.reduce((s, m) => s + m.income, 0);
  const annualExpense = monthly.reduce((s, m) => s + m.expense, 0);
  const annualBalance = annualIncome - annualExpense;

  const monthlyBarData = {
    labels: monthly.map(m => m.monthName),
    datasets: [
      { label: 'Income', data: monthly.map(m => m.income), backgroundColor: 'rgba(0,229,160,0.8)', borderRadius: 6 },
      { label: 'Expense', data: monthly.map(m => m.expense), backgroundColor: 'rgba(255,77,109,0.8)', borderRadius: 6 },
    ],
  };

  const catPieData = {
    labels: catBreakdown.breakdown.slice(0, 8).map(c => c.category),
    datasets: [{
      data: catBreakdown.breakdown.slice(0, 8).map(c => c.total),
      backgroundColor: COLORS,
      borderColor: '#12121a',
      borderWidth: 3,
    }],
  };

  const dailyLineData = {
    labels: dailyTrend.map(d => d.day),
    datasets: [
      { label: 'Income', data: dailyTrend.map(d => d.income), borderColor: '#00e5a0', backgroundColor: 'rgba(0,229,160,0.1)', fill: true, tension: 0.3 },
      { label: 'Expense', data: dailyTrend.map(d => d.expense), borderColor: '#ff4d6d', backgroundColor: 'rgba(255,77,109,0.1)', fill: true, tension: 0.3 },
    ],
  };

  const balanceLineData = {
    labels: balanceHistory.map(b => `${b.month} ${b.year}`),
    datasets: [{
      label: 'Net Balance',
      data: balanceHistory.map(b => b.balance),
      borderColor: '#6366f1',
      backgroundColor: 'rgba(99,102,241,0.15)',
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#6366f1',
      pointRadius: 5,
    }],
  };

  if (loading) return <div className="loading-container"><div className="spinner" /></div>;

  return (
    <div className="reports page-fade-in">
      <div className="reports-header">
        <div>
          <h1 className="reports-title font-display">Reports</h1>
          <p className="text-secondary">Detailed financial analytics</p>
        </div>
        <div className="reports-controls">
          <select className="form-select" value={month} onChange={e => setMonth(Number(e.target.value))}>
            {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          <select className="form-select" value={year} onChange={e => setYear(Number(e.target.value))}>
            {[2022, 2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Annual summary */}
      <div className="annual-strip">
        <div className="annual-item">
          <p className="annual-label">Annual Income</p>
          <p className="annual-value text-income">{fmt(annualIncome)}</p>
        </div>
        <div className="annual-divider" />
        <div className="annual-item">
          <p className="annual-label">Annual Expenses</p>
          <p className="annual-value text-expense">{fmt(annualExpense)}</p>
        </div>
        <div className="annual-divider" />
        <div className="annual-item">
          <p className="annual-label">Annual Balance</p>
          <p className={`annual-value ${annualBalance >= 0 ? 'text-income' : 'text-expense'}`}>{fmt(annualBalance)}</p>
        </div>
        <div className="annual-divider" />
        <div className="annual-item">
          <p className="annual-label">Savings Rate</p>
          <p className="annual-value">{annualIncome > 0 ? `${((Math.max(0, annualBalance) / annualIncome) * 100).toFixed(1)}%` : '—'}</p>
        </div>
      </div>

      {/* Monthly bar */}
      <div className="card report-card">
        <h3 className="chart-title font-display">Monthly Income vs Expenses — {year}</h3>
        <div style={{ height: 280 }}>
          <Bar data={monthlyBarData} options={baseOpts} />
        </div>
      </div>

      <div className="report-row">
        {/* Category breakdown */}
        <div className="card report-card">
          <div className="report-card-header">
            <h3 className="chart-title font-display">Category Breakdown</h3>
            <div className="toggle-type">
              <button className={`toggle-btn ${catType === 'expense' ? 'toggle-active' : ''}`} onClick={() => setCatType('expense')}>Expense</button>
              <button className={`toggle-btn ${catType === 'income' ? 'toggle-active' : ''}`} onClick={() => setCatType('income')}>Income</button>
            </div>
          </div>
          {catBreakdown.breakdown.length > 0 ? (
            <>
              <div style={{ height: 260 }}>
                <Pie data={catPieData} options={noScales} />
              </div>
              <div className="cat-breakdown-list">
                {catBreakdown.breakdown.map((c, i) => (
                  <div key={c.category} className="cat-breakdown-item">
                    <span className="cat-dot" style={{ background: COLORS[i] }} />
                    <span className="cat-name">{c.category}</span>
                    <span className="cat-total">{fmt(c.total)}</span>
                    <div className="cat-bar-wrap">
                      <div className="cat-bar" style={{ width: `${c.percentage}%`, background: COLORS[i] }} />
                    </div>
                    <span className="cat-pct">{c.percentage}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : <div className="empty-chart">No data for selected period</div>}
        </div>

        {/* Top expenses */}
        <div className="card report-card">
          <h3 className="chart-title font-display">Top Expenses This Month</h3>
          {topExpenses.length === 0 ? (
            <div className="empty-chart">No expenses this month</div>
          ) : (
            <div className="top-expense-list">
              {topExpenses.map((tx, i) => (
                <div key={tx._id} className="top-expense-item">
                  <span className="top-rank">#{i + 1}</span>
                  <div className="top-info">
                    <p className="top-category">{tx.category}</p>
                    <p className="top-desc">{tx.description || '—'}</p>
                    <p className="top-date">{new Date(tx.date).toLocaleDateString()}</p>
                  </div>
                  <span className="top-amount text-expense">−{fmt(tx.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Daily trend */}
      <div className="card report-card">
        <h3 className="chart-title font-display">Daily Trend — {months[month - 1]?.label} {year}</h3>
        <div style={{ height: 260 }}>
          <Line data={dailyLineData} options={baseOpts} />
        </div>
      </div>

      {/* Balance history */}
      <div className="card report-card">
        <h3 className="chart-title font-display">6-Month Balance History</h3>
        <div style={{ height: 260 }}>
          <Line data={balanceLineData} options={baseOpts} />
        </div>
      </div>
    </div>
  );
};

export default Reports;
