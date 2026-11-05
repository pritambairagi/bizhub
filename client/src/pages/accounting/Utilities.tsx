import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { businessApi } from '@/services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Trash2, X, Loader2, DollarSign, Wallet, ArrowUpRight, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const CATEGORIES = [
  { value: 'bill', label: 'Bill' },
  { value: 'fee', label: 'Fee' },
  { value: 'investment', label: 'Investment' },
  { value: 'cost', label: 'Cost' },
  { value: 'other', label: 'Other' },
];

export default function Utilities() {
  const [showModal, setShowModal] = useState(false);
  const [filterCategory, setFilterCategory] = useState('');
  const [formData, setFormData] = useState({ title: '', category: 'cost', amount: '', note: '' });

  const queryClient = useQueryClient();

  const { data: expensesData, isLoading } = useQuery({
    queryKey: ['expenses', filterCategory],
    queryFn: () => businessApi.getExpenses({ category: filterCategory }),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => businessApi.createExpense(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Expense added successfully');
      setShowModal(false);
      setFormData({ title: '', category: 'cost', amount: '', note: '' });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add expense');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => businessApi.deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Expense removed');
    },
  });

  const expenses = expensesData?.data?.data || [];

  const stats = {
    total: expenses.reduce((acc: number, curr: any) => acc + curr.amount, 0),
    today: expenses.filter((e: any) => new Date(e.date).toDateString() === new Date().toDateString()).reduce((acc: number, curr: any) => acc + curr.amount, 0),
  };

  function handleSubmit() {
    if (!formData.title || !formData.amount) {
      toast.error('Please fill in title and amount');
      return;
    }
    createMutation.mutate({ ...formData, amount: Number(formData.amount) });
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>
            Utilities & Expenses
          </h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            Manage your daily, weekly, and monthly bills and costs.
          </p>
        </div>
        <Button onClick={() => setShowModal(true)} className="gap-2 shadow-lg">
          <Plus className="h-4 w-4" /> Add Expense
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-primary/10 border-none shadow-none">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-sm font-semibold text-primary">Total Expenses</h3>
            </div>
            <p className="text-3xl font-bold text-primary">৳{stats.total.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="bg-orange-500/10 border-none shadow-none">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                <ArrowUpRight className="h-5 w-5 text-orange-600" />
              </div>
              <h3 className="text-sm font-semibold text-orange-600">Today's Cost</h3>
            </div>
            <p className="text-3xl font-bold text-orange-600">৳{stats.today.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b flex items-center gap-4">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <select
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm min-w-[200px]"
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-6 py-4 font-semibold">Date</th>
                  <th className="px-6 py-4 font-semibold">Title</th>
                  <th className="px-6 py-4 font-semibold">Category</th>
                  <th className="px-6 py-4 font-semibold">Note</th>
                  <th className="px-6 py-4 font-semibold">Amount</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    </td>
                  </tr>
                ) : expenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                      No expenses found
                    </td>
                  </tr>
                ) : (
                  expenses.map((expense: any) => (
                    <tr key={expense._id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">{format(new Date(expense.date), 'PP')}</td>
                      <td className="px-6 py-4 font-medium">{expense.title}</td>
                      <td className="px-6 py-4 capitalize">{expense.category}</td>
                      <td className="px-6 py-4 text-muted-foreground">{expense.note || '-'}</td>
                      <td className="px-6 py-4 font-semibold">৳{expense.amount.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="ghost" size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => {
                            if (confirm('Delete this expense?')) deleteMutation.mutate(expense._id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {showModal && (
        <div className="modal-overlay z-50 fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
          <div className="modal-content w-full max-w-md bg-card rounded-xl shadow-2xl border border-border">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="font-bold text-lg">Add Expense</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Title *</label>
                <Input
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Internet Bill"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Category</label>
                  <select
                    className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm"
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                  >
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Amount *</label>
                  <Input
                    type="number"
                    value={formData.amount}
                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Note</label>
                <Input
                  value={formData.note}
                  onChange={e => setFormData({ ...formData, note: e.target.value })}
                  placeholder="Optional note"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button
                className="flex-1"
                onClick={handleSubmit}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Expense'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
