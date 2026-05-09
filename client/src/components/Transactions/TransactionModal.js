import React, { useState } from 'react';
import { transactionAPI } from '../../utils/api';
import toast from 'react-hot-toast';

const PAYMENT_METHODS = ['cash', 'card', 'bank_transfer', 'upi', 'other'];

const TransactionModal = ({ transaction, categories, onClose, onSave }) => {
  const isEdit = !!transaction;
  const [form, setForm] = useState({
    type: transaction?.type || 'expense',
    amount: transaction?.amount || '',
    category: transaction?.category || '',
    description: transaction?.description || '',
    date: transaction?.date ? new Date(transaction.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    paymentMethod: transaction?.paymentMethod || 'other',
    isRecurring: transaction?.isRecurring || false,
  });
  const [loading, setLoading] = useState(false);

  const filteredCats = categories.filter(c => c.type === form.type || c.type === 'both');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || parseFloat(form.amount) <= 0) return toast.error('Enter a valid amount');
    if (!form.category) return toast.error('Select a category');

    setLoading(true);
    try {
      if (isEdit) {
        await transactionAPI.update(transaction._id, { ...form, amount: parseFloat(form.amount) });
        toast.success('Transaction updated!');
      } else {
        await transactionAPI.create({ ...form, amount: parseFloat(form.amount) });
        toast.success('Transaction added!');
      }
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">{isEdit ? 'Edit Transaction' : 'Add Transaction'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Type toggle */}
          <div className="type-toggle">
            <button type="button"
              className={`type-btn ${form.type === 'expense' ? 'type-btn-expense' : ''}`}
              onClick={() => setForm(f => ({ ...f, type: 'expense', category: '' }))}>
              📉 Expense
            </button>
            <button type="button"
              className={`type-btn ${form.type === 'income' ? 'type-btn-income' : ''}`}
              onClick={() => setForm(f => ({ ...f, type: 'income', category: '' }))}>
              📈 Income
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Amount</label>
              <input className="form-input" type="number" name="amount" min="0.01" step="0.01"
                placeholder="0.00" value={form.amount} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Date</label>
              <input className="form-input" type="date" name="date" value={form.date} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Category</label>
            <select className="form-select" name="category" value={form.category} onChange={handleChange} required>
              <option value="">Select category...</option>
              {filteredCats.map(c => <option key={c._id} value={c.name}>{c.icon} {c.name}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Description (optional)</label>
            <input className="form-input" name="description" placeholder="What was this for?"
              value={form.description} onChange={handleChange} maxLength={200} />
          </div>

          <div className="form-group">
            <label className="form-label">Payment Method</label>
            <select className="form-select" name="paymentMethod" value={form.paymentMethod} onChange={handleChange}>
              {PAYMENT_METHODS.map(m => (
                <option key={m} value={m}>{m.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
              ))}
            </select>
          </div>

          <label className="recurring-check">
            <input type="checkbox" name="isRecurring" checked={form.isRecurring} onChange={handleChange} />
            <span>Mark as recurring</span>
          </label>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : isEdit ? 'Update' : 'Add Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionModal;
