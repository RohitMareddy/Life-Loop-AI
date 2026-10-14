import React, { useState } from 'react';
import {
  Truck,
  CheckCircle2,
  Clock,
  Calendar,
  MapPin,
  ShieldCheck,
  FileCheck,
  AlertTriangle,
  Plus,
  Eye,
  Check,
  X,
  PackageCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DistributionRecord, DistributionStatus } from '../../types';
import { ProvenanceBadge } from '../ProvenanceBadge';

export const DistributionView: React.FC = () => {
  const { distributions, updateDistributionStatus, recordPartialDelivery, searchQuery } = useApp();

  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [activeModalDist, setActiveModalDist] = useState<DistributionRecord | null>(null);
  const [modalMode, setModalMode] = useState<'schedule' | 'deliver' | 'verify' | 'partial' | null>(
    null
  );

  // Modal Inputs
  const [scheduledDateInput, setScheduledDateInput] = useState('');
  const [evidenceInput, setEvidenceInput] = useState('');
  const [deliveryNotesInput, setDeliveryNotesInput] = useState('');
  const [partialQtyInput, setPartialQtyInput] = useState<number>(0);

  const filteredDistributions = distributions.filter((d) => {
    if (selectedStatus !== 'all' && d.status !== selectedStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        d.resourceTitle.toLowerCase().includes(q) ||
        d.recipientName.toLowerCase().includes(q) ||
        d.destination.toLowerCase().includes(q) ||
        d.coordinator.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const handleOpenActionModal = (
    dist: DistributionRecord,
    mode: 'schedule' | 'deliver' | 'verify' | 'partial'
  ) => {
    setActiveModalDist(dist);
    setModalMode(mode);
    setScheduledDateInput(dist.scheduledDate || new Date().toISOString().split('T')[0]);
    setEvidenceInput(dist.confirmationEvidence || '');
    setDeliveryNotesInput(dist.notes || '');
    setPartialQtyInput(dist.quantity);
  };

  const handleConfirmModalAction = () => {
    if (!activeModalDist || !modalMode) return;

    if (modalMode === 'schedule') {
      updateDistributionStatus(
        activeModalDist.id,
        'scheduled',
        deliveryNotesInput || 'Delivery pickup scheduled with recipient coordinator.',
        undefined
      );
    } else if (modalMode === 'deliver') {
      updateDistributionStatus(
        activeModalDist.id,
        'delivered',
        deliveryNotesInput || 'Physical drop-off completed. Signed intake receipt pending.',
        evidenceInput || 'Physical dropoff confirmed by driver log.'
      );
    } else if (modalMode === 'verify') {
      updateDistributionStatus(
        activeModalDist.id,
        'verified',
        deliveryNotesInput || 'Independently verified and cross-checked against intake slip.',
        evidenceInput || 'Signed intake receipt verified by lead coordinator.'
      );
    } else if (modalMode === 'partial') {
      recordPartialDelivery(
        activeModalDist.id,
        partialQtyInput,
        deliveryNotesInput || `Partial hand-off recorded (${partialQtyInput} items).`
      );
    }

    setActiveModalDist(null);
    setModalMode(null);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E7EB]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono uppercase tracking-wider text-[#176B4D] font-medium bg-[#EEF5F1] px-2 py-0.5 rounded">
              Logistics & Verification
            </span>
            <span className="text-xs text-[#66736A]">· Physical Hand-Off Workflow</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#17231D]">Distribution Planner</h1>
          <p className="text-sm text-[#66736A]">
            Coordinate pickup schedules, track transit status, handle partial shipments, and attach
            verified intake receipts.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-3 rounded-xl border border-[#E5E7EB]">
        {[
          { id: 'all', label: 'All Distributions' },
          { id: 'awaiting_scheduling', label: 'Awaiting Scheduling' },
          { id: 'scheduled', label: 'Scheduled' },
          { id: 'delivered', label: 'Delivered (Unverified)' },
          { id: 'verified', label: 'Verified Complete' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedStatus(tab.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
              selectedStatus === tab.id
                ? 'bg-[#176B4D] text-white shadow-2xs font-semibold'
                : 'text-[#47544C] hover:bg-[#F3F5F1]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Distributions List */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FBFBFA] border-b border-[#E5E7EB] text-[#66736A] font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Distribution Ref</th>
                <th className="py-3 px-4">Resource & Quantity</th>
                <th className="py-3 px-4">Recipient & Destination</th>
                <th className="py-3 px-4">Scheduled Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Evidence</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F6]">
              {filteredDistributions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-[#66736A]">
                    No distribution records match the active filter.
                  </td>
                </tr>
              ) : (
                filteredDistributions.map((dist) => {
                  const isVerified = dist.status === 'verified';
                  const isDelivered = dist.status === 'delivered';
                  const isScheduled = dist.status === 'scheduled';

                  return (
                    <tr key={dist.id} className="hover:bg-[#F9FAF8] transition-colors">
                      <td className="py-3.5 px-4 font-mono text-[#8A958E] tabular-nums">
                        <span className="font-bold text-[#17231D] block">{dist.id}</span>
                        <span className="text-[10px]">{dist.deliveryMethod.replace(/_/g, ' ')}</span>
                      </td>

                      <td className="py-3.5 px-4 font-medium text-[#17231D]">
                        <span className="font-semibold block">{dist.resourceTitle}</span>
                        <span className="font-mono text-[#176B4D] tabular-nums font-bold">
                          {dist.quantity} {dist.unit}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-[#3D4A41]">
                        <span className="font-medium text-[#17231D] block">
                          {dist.recipientName}
                        </span>
                        <span className="text-[11px] text-[#8A958E] block truncate max-w-xs">
                          {dist.destination}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono tabular-nums text-[#47544C]">
                        {dist.scheduledDate || 'Not scheduled'}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-mono uppercase font-semibold px-2 py-0.5 rounded ${
                            isVerified
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : isDelivered
                              ? 'bg-teal-50 text-teal-800 border border-teal-200'
                              : isScheduled
                              ? 'bg-sky-50 text-sky-800 border border-sky-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {dist.status.replace(/_/g, ' ')}
                        </span>
                        {dist.discrepancies && (
                          <span className="text-[10px] text-amber-700 block mt-0.5 font-sans">
                            {dist.discrepancies}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-[#66736A]">
                        {dist.confirmationEvidence ? (
                          <div className="flex items-center gap-1 text-emerald-700 font-medium">
                            <FileCheck className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate max-w-[140px] block" title={dist.confirmationEvidence}>
                              {dist.confirmationEvidence}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[#8A958E] italic text-[11px]">Pending receipt</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {dist.status === 'awaiting_scheduling' && (
                            <button
                              onClick={() => handleOpenActionModal(dist, 'schedule')}
                              aria-label={`Schedule pickup or delivery for ${dist.resourceTitle}`}
                              className="px-2.5 py-1 text-xs font-bold text-[#176B4D] bg-[#F0F6F2] hover:bg-[#E2EDE5] rounded border border-[#D1E3D7] focus-visible:ring-2 focus-visible:ring-[#176B4D] focus-visible:outline-none"
                            >
                              Schedule
                            </button>
                          )}

                          {dist.status === 'scheduled' && (
                            <>
                              <button
                                onClick={() => handleOpenActionModal(dist, 'deliver')}
                                aria-label={`Record delivery completed for ${dist.resourceTitle}`}
                                className="px-2.5 py-1 text-xs font-bold text-white bg-[#176B4D] hover:bg-[#104A36] rounded focus-visible:ring-2 focus-visible:ring-[#176B4D] focus-visible:outline-none"
                              >
                                Record Drop-off
                              </button>
                              <button
                                onClick={() => handleOpenActionModal(dist, 'partial')}
                                aria-label={`Record partial delivery for ${dist.resourceTitle}`}
                                className="px-2 py-1 text-xs font-semibold text-[#47544C] hover:bg-[#EEF1EB] rounded focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:outline-none"
                                title="Record Partial Delivery shortfall"
                              >
                                Partial
                              </button>
                            </>
                          )}

                          {dist.status === 'delivered' && (
                            <button
                              onClick={() => handleOpenActionModal(dist, 'verify')}
                              aria-label={`Verify signed receipt for ${dist.resourceTitle}`}
                              className="px-2.5 py-1 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-300 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
                            >
                              Verify Receipt
                            </button>
                          )}

                          {isVerified && (
                            <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1 justify-end">
                              <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>Closed</span>
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Dialog Modal */}
      {modalMode && activeModalDist && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="dist-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-xs p-4"
          onKeyDown={(e) => e.key === 'Escape' && setModalMode(null)}
        >
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-[#E5E7EB] p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
              <div>
                <span className="text-[11px] font-mono uppercase text-[#176B4D] font-bold">
                  {modalMode.toUpperCase()} WORKFLOW
                </span>
                <h3 id="dist-modal-title" className="text-base font-bold text-[#17231D] mt-0.5">
                  {activeModalDist.resourceTitle}
                </h3>
              </div>
              <button
                onClick={() => setModalMode(null)}
                aria-label="Close distribution dialog"
                className="text-[#8A958E] hover:text-[#17231D] p-1 rounded focus-visible:ring-2 focus-visible:ring-[#176B4D] focus-visible:outline-none"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-3 text-[#3D4A41]">
              <p>
                Recipient: <strong>{activeModalDist.recipientName}</strong> (
                {activeModalDist.quantity} {activeModalDist.unit})
              </p>

              {modalMode === 'schedule' && (
                <div className="space-y-1">
                  <label htmlFor="dist-target-date" className="font-semibold text-[#17231D]">Target Delivery Date</label>
                  <input
                    id="dist-target-date"
                    type="date"
                    value={scheduledDateInput}
                    onChange={(e) => setScheduledDateInput(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F7F8F4] border border-[#E5E7EB] rounded-lg text-[#17231D] focus-visible:ring-2 focus-visible:ring-[#176B4D]"
                  />
                </div>
              )}

              {modalMode === 'partial' && (
                <div className="space-y-1">
                  <label htmlFor="dist-partial-input" className="font-semibold text-[#17231D]">
                    Actual Delivered Quantity (Remainder returned to inventory)
                  </label>
                  <input
                    id="dist-partial-input"
                    type="number"
                    min="1"
                    max={activeModalDist.quantity}
                    value={partialQtyInput}
                    onChange={(e) => setPartialQtyInput(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#F7F8F4] border border-[#E5E7EB] rounded-lg font-mono tabular-nums text-[#17231D] focus-visible:ring-2 focus-visible:ring-[#176B4D]"
                  />
                </div>
              )}

              {(modalMode === 'deliver' || modalMode === 'verify') && (
                <div className="space-y-1">
                  <label htmlFor="dist-evidence" className="font-semibold text-[#17231D]">Confirmation Slip / Evidence</label>
                  <input
                    id="dist-evidence"
                    type="text"
                    value={evidenceInput}
                    onChange={(e) => setEvidenceInput(e.target.value)}
                    placeholder="e.g. Stamped intake slip #LC-884 signed by Principal"
                    className="w-full px-3 py-2 bg-[#F7F8F4] border border-[#E5E7EB] rounded-lg text-[#17231D] focus-visible:ring-2 focus-visible:ring-[#176B4D]"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label htmlFor="dist-notes" className="font-semibold text-[#17231D]">Coordinator Notes</label>
                <textarea
                  id="dist-notes"
                  rows={2}
                  value={deliveryNotesInput}
                  onChange={(e) => setDeliveryNotesInput(e.target.value)}
                  placeholder="Dropoff details, recipient condition sign-off, or driver notes"
                  className="w-full px-3 py-2 bg-[#F7F8F4] border border-[#E5E7EB] rounded-lg text-[#17231D] focus-visible:ring-2 focus-visible:ring-[#176B4D]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E7EB]">
              <button
                onClick={() => setModalMode(null)}
                className="px-3.5 py-2 text-xs font-semibold text-[#47544C] hover:bg-[#F3F5F1] rounded-lg focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:outline-none"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmModalAction}
                className="px-4 py-2 text-xs font-bold text-white bg-[#176B4D] hover:bg-[#104A36] rounded-lg shadow-xs focus-visible:ring-2 focus-visible:ring-[#176B4D] focus-visible:outline-none"
              >
                Confirm {modalMode}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
