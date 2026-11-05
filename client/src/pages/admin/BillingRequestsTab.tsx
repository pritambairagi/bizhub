import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/services/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';
import { Check, X, ShieldAlert, CreditCard, Clock, Calendar, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function BillingRequestsTab() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [modalAction, setModalAction] = useState<'approve' | 'reject' | null>(null);

  const { data: requestsData, isLoading, refetch } = useQuery({
    queryKey: ['admin-billing-requests'],
    queryFn: () => adminApi.getBillingRequests().then(r => r.data.data),
  });

  const handleActionMutation = useMutation({
    mutationFn: ({ id, action, notes }: { id: string; action: string; notes?: string }) =>
      adminApi.handleBillingRequest(id, { action, notes }),
    onSuccess: (res) => {
      toast.success(res.data.message || 'Billing request processed successfully!');
      setSelectedRequest(null);
      setActionNotes('');
      setModalAction(null);
      qc.invalidateQueries({ queryKey: ['admin-billing-requests'] });
      qc.invalidateQueries({ queryKey: ['admin-stats-badge'] });
      refetch();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to process request');
    },
  });

  const requests = requestsData || [];
  const filteredRequests = requests.filter((r: any) => {
    if (filter === 'all') return true;
    return r.status === filter;
  });

  return (
    <div className="space-y-6">
      {/* Filters & Header Card */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Subscription Upgrades</h2>
          <p className="text-xs text-slate-500 mt-0.5">Verify user transaction proofs and authorize plan upgrades</p>
        </div>
        <div className="flex gap-1.5 overflow-x-auto">
          {(['all', 'pending', 'approved', 'rejected'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
                filter === tab
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 p-12 text-center">
          <ShieldAlert className="h-10 w-10 text-slate-400 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800">No requests found</h3>
          <p className="text-xs text-slate-500 mt-1">There are no billing upgrade requests matching this filter.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-black tracking-wider border-b">
              <tr>
                <th className="px-6 py-4">Business Info</th>
                <th className="px-6 py-4">Requested Plan</th>
                <th className="px-6 py-4">Amount Paid</th>
                <th className="px-6 py-4">Transaction Details</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Submitted At</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRequests.map((r: any) => (
                <tr key={r._id} className="hover:bg-slate-55/20 transition-all">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">{r.businessId?.name || 'Unknown Business'}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{r.businessId?.contact?.phone || 'No Phone'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-indigo-50 text-indigo-700 border border-indigo-100">
                      <CreditCard className="h-3 w-3" /> {r.requestedPlan} Plan
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900">
                    ৳{r.amount}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded bg-slate-900 text-[10px] font-black text-white uppercase tracking-wider">{r.paymentMethod}</span>
                      <span className="font-mono text-xs font-semibold text-slate-700">{r.transactionId}</span>
                    </div>
                    {r.notes && <p className="text-[11px] text-slate-400 mt-1 italic">Note: "{r.notes}"</p>}
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border capitalize",
                      r.status === 'approved' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                      r.status === 'rejected' ? "bg-red-55 text-red-700 border-red-100" :
                      "bg-amber-50 text-amber-75 border-amber-100"
                    )}>
                      {r.status === 'approved' && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
                      {r.status === 'rejected' && <XCircle className="h-3.5 w-3.5 text-red-600" />}
                      {r.status === 'pending' && <Clock className="h-3.5 w-3.5 text-amber-600" />}
                      {r.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(r.createdAt).toLocaleDateString('en-GB')}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {r.status === 'pending' ? (
                      <div className="flex justify-end gap-1.5">
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-8 px-2.5"
                          onClick={() => {
                            setSelectedRequest(r);
                            setModalAction('approve');
                          }}
                        >
                          <Check className="h-3.5 w-3.5 mr-1" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          className="bg-red-600 hover:bg-red-700 text-white font-bold h-8 px-2.5"
                          onClick={() => {
                            setSelectedRequest(r);
                            setModalAction('reject');
                          }}
                        >
                          <X className="h-3.5 w-3.5 mr-1" /> Reject
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">Processed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Action Approval/Rejection Modal */}
      {selectedRequest && modalAction && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full shadow-xl overflow-hidden border border-slate-100">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 capitalize">
                {modalAction} Upgrade Request
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                For business: <span className="font-bold text-slate-800">{selectedRequest.businessId?.name}</span>
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div className="text-sm space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-500">Requested Package:</span>
                  <span className="font-bold text-slate-900 capitalize">{selectedRequest.requestedPlan} Plan</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Amount &amp; Method:</span>
                  <span className="font-bold text-slate-900">৳{selectedRequest.amount} via {selectedRequest.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Transaction ID:</span>
                  <span className="font-mono font-bold text-slate-900">{selectedRequest.transactionId}</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Action Notes / Reason</label>
                <Input
                  placeholder="e.g. Bkash verified successfully or Incorrect txn ID..."
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
              <Button
                variant="outline"
                className="flex-1 bg-white border-slate-200 text-slate-600"
                onClick={() => {
                  setSelectedRequest(null);
                  setModalAction(null);
                  setActionNotes('');
                }}
              >
                Cancel
              </Button>
              <Button
                className={cn(
                  "flex-1 text-white font-bold",
                  modalAction === 'approve' ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"
                )}
                disabled={handleActionMutation.isPending}
                onClick={() => {
                  handleActionMutation.mutate({
                    id: selectedRequest._id,
                    action: modalAction,
                    notes: actionNotes,
                  });
                }}
              >
                Confirm {modalAction}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
