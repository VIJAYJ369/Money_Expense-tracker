import React, { useState, useEffect, useCallback } from 'react';
import { transactionAPI, categoryAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import TransactionModal from './TransactionModal';
import './Transactions.css';

const Transactions = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTx, setEditTx] = useState(null);
  const [filters, setFilters] = useState({ type: '', category: '', startDate: '', endDate: '', search: '' });
  const [page, setPage] = useState(1);

  const currency = user?.currency || 'USD';
  const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n);

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = { ...filters, page, limit: 15, sortBy: 'date', sortOrder: 'desc' };
      Object.keys(params).forEach(k => !params[k] && delete params[k]);
      const res = await transactionAPI.getAll(params);
      setTransactions(res.data.transactions);
      setPagination(res.data.pagination);
    } catch (e) {
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    loadTransactions();
    categoryAPI.getAll().then(res => setCategories(res.data)).catch(() => {});
  }, [loadTransactions]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this transaction?')) return;
    try {
      await transactionAPI.delete(id);
      toast.success('Transaction deleted');
      loadTransactions();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleSave = () => {
    setModalOpen(false);
    setEditTx(null);
    loadTransactions();
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({ type: '', category: '', startDate: '', endDate: '', search: '' });
    setPage(1);
  };

  const uniqueCategories = [...new Set(categories.map(c => c.name))];

  return (
    <div className="transactions page-fade-in">
      <div className="tx-header">
        <div>
          <h1 className="tx-title font-display">Transactions</h1>
          <p className="tx-sub">{pagination.total || 0} total records</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditTx(null); setModalOpen(true); }}>
          + Add Transaction
        </button>
      </div>

      {/* Filters */}
      <div className="card filters-card">
        <div className="filters-grid">
          <div className="form-group">
            <label className="form-label">Search</label>
            <input className="form-input" name="search" placeholder="Description or category..."
              value={filters.search} onChange={handleFilterChange} />
          </div>
          <div className="form-group">
            <label className="form-label">Type</label>
            <select className="form-select" name="type" value={filters.type} onChange={handleFilterChange}>
              <option value="">All</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Category</label>
            <select className="form-select" name="category" value={filters.category} onChange={handleFilterChange}>
              <option value="">All Categories</option>
              {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">From Date</label>
            <input className="form-input" type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} />
          </div>
          <div className="form-group">
            <label className="form-label">To Date</label>
            <input className="form-input" type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} />
          </div>
          <div className="form-group" style={{ justifyContent: 'flex-end' }}>
            <label className="form-label">&nbsp;</label>
            <button className="btn btn-ghost" onClick={clearFilters}>Clear Filters</button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card tx-table-card">
        {loading ? (
          <div className="loading-container"><div className="spinner" /></div>
        ) : transactions.length === 0 ? (
          <div className="tx-empty">
            <p style={{ fontSize: 48 }}>📭</p>
            <p>No transactions found</p>
            <button className="btn btn-primary" onClick={() => setModalOpen(true)}>Add your first transaction</button>
          </div>
        ) : (
          <>
            <div className="tx-table-wrap">
              <table className="tx-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Method</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(tx => (
                    <tr key={tx._id} className="tx-row">
                      <td className="tx-date">{new Date(tx.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                      <td>
                        <span className="tx-category-badge">{tx.category}</span>
                      </td>
                      <td className="tx-desc">{tx.description || '—'}</td>
                      <td className="tx-method">{tx.paymentMethod?.replace('_', ' ') || '—'}</td>
                      <td><span className={`badge badge-${tx.type}`}>{tx.type}</span></td>
                      <td className={`tx-amount ${tx.type === 'income' ? 'text-income' : 'text-expense'}`}>
                        {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount)}
                      </td>
                      <td className="tx-actions">
                        <button className="btn btn-ghost btn-sm" onClick={() => { setEditTx(tx); setModalOpen(true); }}>✏️</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(tx._id)}>🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="pagination">
                <button className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                <span className="page-info">Page {page} of {pagination.pages}</span>
                <button className="btn btn-ghost btn-sm" disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)}>Next →</button>
              </div>
            )}
          </>
        )}
      </div>

      {modalOpen && (
        <TransactionModal
          transaction={editTx}
          categories={categories}
          onClose={() => { setModalOpen(false); setEditTx(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default Transactions;
