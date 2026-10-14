import React, { useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  Clock,
  AlertTriangle,
  CheckCircle2,
  X,
  Eye,
  GitCompare,
  Building2,
  Calendar,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  CommunityRequest,
  ResourceCategory,
  ResourceCondition,
  RequestPriority,
  OrganizationType,
} from '../../types';
import { ProvenanceBadge } from '../ProvenanceBadge';

export const RequestsView: React.FC = () => {
  const { requests, resources, addRequest, cancelRequest, setActiveTab, searchQuery } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedOrgType, setSelectedOrgType] = useState<string>('all');
  const [viewDetailReq, setViewDetailReq] = useState<CommunityRequest | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    organizationName: '',
    organizationType: 'school' as OrganizationType,
    category: 'stationery' as ResourceCategory,
    requestedItems: '',
    requestedQuantity: 30,
    unit: 'notebooks',
    minAcceptableCondition: 'good' as ResourceCondition,
    requiredByDate: new Date(Date.now() + 86400000 * 10).toISOString().split('T')[0],
    location: 'Greenfield East District',
    intendedUse: '',
    priorityLevel: 'high' as RequestPriority,
    priorityExplanation: '',
    permittedSubstitutions: false,
  });

  const filteredRequests = requests.filter((req) => {
    if (selectedCategory !== 'all' && req.category !== selectedCategory) return false;
    if (selectedPriority !== 'all' && req.priorityLevel !== selectedPriority) return false;
    if (selectedOrgType !== 'all' && req.organizationType !== selectedOrgType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        req.organizationName.toLowerCase().includes(q) ||
        req.requestedItems.toLowerCase().includes(q) ||
        req.intendedUse.toLowerCase().includes(q) ||
        req.location.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.organizationName.trim() || !formData.requestedItems.trim()) return;

    addRequest({
      organizationName: formData.organizationName,
      organizationType: formData.organizationType,
      category: formData.category,
      requestedItems: formData.requestedItems,
      requestedQuantity: Number(formData.requestedQuantity) || 1,
      unit: formData.unit,
      minAcceptableCondition: formData.minAcceptableCondition,
      requiredByDate: formData.requiredByDate,
      location: formData.location,
      intendedUse: formData.intendedUse,
      priorityLevel: formData.priorityLevel,
      priorityExplanation: formData.priorityExplanation,
      permittedSubstitutions: formData.permittedSubstitutions,
      verificationStatus: 'verified',
    });

    setIsCreateModalOpen(false);
    setFormData({
      organizationName: '',
      organizationType: 'school',
      category: 'stationery',
      requestedItems: '',
      requestedQuantity: 30,
      unit: 'notebooks',
      minAcceptableCondition: 'good',
      requiredByDate: new Date(Date.now() + 86400000 * 10).toISOString().split('T')[0],
      location: 'Greenfield East District',
      intendedUse: '',
      priorityLevel: 'high',
      priorityExplanation: '',
      permittedSubstitutions: false,
    });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E7EB]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#17231D]">Community Requests</h1>
          <p className="text-sm text-[#66736A]">
            Verified resource needs submitted by schools, learning centers, and local non-profits.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#176B4D] hover:bg-[#104A36] rounded-lg shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Submit Community Request</span>
        </button>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-3.5 rounded-xl border border-[#E5E7EB]">
        {/* Category Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto">
          {[
            { id: 'all', label: 'All' },
            { id: 'stationery', label: 'Stationery' },
            { id: 'books_education', label: 'Books' },
            { id: 'furniture', label: 'Furniture' },
            { id: 'digital_devices', label: 'Digital Devices' },
            { id: 'household_supplies', label: 'Household' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-[#176B4D] text-white shadow-2xs'
                  : 'text-[#47544C] hover:bg-[#F3F5F1]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Priority Filter */}
        <div className="ml-auto flex items-center gap-2">
          <label className="text-xs text-[#66736A] font-medium whitespace-nowrap">Priority:</label>
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="text-xs bg-[#F7F8F4] border border-[#E5E7EB] rounded-md px-2.5 py-1.5 text-[#17231D]"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FBFBFA] border-b border-[#E5E7EB] text-[#66736A] font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Recipient Organization</th>
                <th className="py-3 px-4">Requested Item</th>
                <th className="py-3 px-4">Priority & Urgency</th>
                <th className="py-3 px-4 text-right">Outstanding / Needed</th>
                <th className="py-3 px-4">Required By</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F6]">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-[#66736A]">
                    No community requests found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => {
                  const isUrgent = req.priorityLevel === 'urgent';
                  const isPartiallyFulfilled = req.fulfilledQuantity > 0;

                  return (
                    <tr key={req.id} className="hover:bg-[#F9FAF8] transition-colors">
                      <td className="py-3.5 px-4 font-medium text-[#17231D]">
                        <div className="space-y-0.5">
                          <span className="font-semibold block">{req.organizationName}</span>
                          <span className="text-[11px] text-[#8A958E] capitalize">
                            {req.organizationType.replace('_', ' ')} · {req.location}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-[#3D4A41]">
                        <div className="space-y-0.5 max-w-xs">
                          <span className="font-medium block truncate">{req.requestedItems}</span>
                          <span className="text-[11px] text-[#8A958E] block truncate">
                            Min condition: {req.minAcceptableCondition.replace('_', ' ')}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block text-[10px] font-mono uppercase font-semibold px-2 py-0.5 rounded ${
                            isUrgent
                              ? 'bg-rose-50 text-rose-800 border border-rose-200'
                              : req.priorityLevel === 'high'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-stone-100 text-stone-700'
                          }`}
                        >
                          {req.priorityLevel}
                        </span>
                        {req.priorityExplanation && (
                          <span className="text-[10px] text-[#8A958E] block truncate max-w-[150px] mt-0.5">
                            {req.priorityExplanation}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                        <span className="font-bold text-[#17231D]">
                          {req.outstandingQuantity}
                        </span>
                        <span className="text-[#8A958E]">
                          {' '}
                          / {req.requestedQuantity} {req.unit}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-[#47544C] font-mono tabular-nums">
                        {req.requiredByDate}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[11px] font-medium capitalize ${
                            isPartiallyFulfilled
                              ? 'text-teal-700'
                              : req.status === 'open'
                              ? 'text-[#176B4D]'
                              : 'text-[#66736A]'
                          }`}
                        >
                          {req.status.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setViewDetailReq(req)}
                            className="p-1.5 text-[#66736A] hover:text-[#17231D] hover:bg-[#EEF1EB] rounded transition-colors"
                            title="Inspect Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setActiveTab('optimizer')}
                            className="px-2 py-1 text-xs font-semibold text-[#176B4D] hover:bg-[#EEF5F1] rounded transition-colors"
                          >
                            Allocate
                          </button>
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

      {/* Request Details Modal */}
      {viewDetailReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-[#E5E7EB] p-6 space-y-4">
            <div className="flex items-start justify-between border-b border-[#E5E7EB] pb-3">
              <div>
                <span className="text-xs font-mono uppercase text-[#176B4D] font-medium">
                  {viewDetailReq.id} · {viewDetailReq.organizationType}
                </span>
                <h3 className="text-base font-bold text-[#17231D] mt-0.5">
                  {viewDetailReq.organizationName}
                </h3>
              </div>
              <button
                onClick={() => setViewDetailReq(null)}
                className="text-[#8A958E] hover:text-[#17231D] p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-[#3D4A41]">
              <div>
                <span className="text-[11px] font-semibold text-[#8A958E] uppercase tracking-wide block">
                  Requested Items & Intended Use
                </span>
                <p className="font-medium text-[#17231D]">{viewDetailReq.requestedItems}</p>
                <p className="text-[#66736A] mt-1">{viewDetailReq.intendedUse}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-[#F7F8F4] rounded-lg border border-[#E5E7EB]">
                <div>
                  <span className="text-[11px] text-[#8A958E] block">Demand Status</span>
                  <span className="font-mono font-bold text-[#17231D] text-sm tabular-nums">
                    {viewDetailReq.outstandingQuantity} outstanding ({viewDetailReq.fulfilledQuantity} fulfilled)
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-[#8A958E] block">Priority Justification</span>
                  <span className="font-semibold text-rose-800 capitalize">
                    {viewDetailReq.priorityLevel}: {viewDetailReq.priorityExplanation}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-[#8A958E] block">Required By Date</span>
                  <span className="font-mono text-[#17231D] tabular-nums">
                    {viewDetailReq.requiredByDate}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-[#8A958E] block">Minimum Condition</span>
                  <span className="capitalize text-[#17231D]">
                    {viewDetailReq.minAcceptableCondition.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {viewDetailReq.supportingNotes && (
                <div className="p-2.5 bg-stone-50 rounded border border-stone-200 text-[#47544C]">
                  <strong>Coordinator Notes:</strong> {viewDetailReq.supportingNotes}
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-[#E5E7EB]">
              <button
                onClick={() => {
                  cancelRequest(viewDetailReq.id);
                  setViewDetailReq(null);
                }}
                className="text-xs text-rose-600 hover:underline"
              >
                Cancel Request
              </button>
              <button
                onClick={() => setViewDetailReq(null)}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#176B4D] hover:bg-[#104A36] rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Request Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-xl w-full border border-[#E5E7EB] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#17231D]">Submit Community Request</h3>
                <p className="text-xs text-[#66736A]">Register an organization's resource needs.</p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-[#8A958E] hover:text-[#17231D] p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-[#17231D]">Organization Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.organizationName}
                    onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                    placeholder="e.g. Lincoln Middle School"
                    className="w-full px-3 py-2 bg-[#F7F8F4] border border-[#E5E7EB] rounded-lg text-[#17231D]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-[#17231D]">Organization Type</label>
                  <select
                    value={formData.organizationType}
                    onChange={(e) => setFormData({ ...formData, organizationType: e.target.value as OrganizationType })}
                    className="w-full px-3 py-2 bg-[#F7F8F4] border border-[#E5E7EB] rounded-lg text-[#17231D]"
                  >
                    <option value="school">School</option>
                    <option value="community_learning_center">Community Learning Center</option>
                    <option value="nonprofit">Non-Profit Organization</option>
                    <option value="library">Library</option>
                    <option value="youth_club">Youth Club / Center</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-[#17231D]">Requested Items Description *</label>
                <input
                  type="text"
                  required
                  value={formData.requestedItems}
                  onChange={(e) => setFormData({ ...formData, requestedItems: e.target.value })}
                  placeholder="e.g. 50 student writing notebooks and pens"
                  className="w-full px-3 py-2 bg-[#F7F8F4] border border-[#E5E7EB] rounded-lg text-[#17231D]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-[#17231D]">Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.requestedQuantity}
                    onChange={(e) => setFormData({ ...formData, requestedQuantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#F7F8F4] border border-[#E5E7EB] rounded-lg font-mono tabular-nums text-[#17231D]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-[#17231D]">Unit *</label>
                  <input
                    type="text"
                    required
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F7F8F4] border border-[#E5E7EB] rounded-lg text-[#17231D]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-[#17231D]">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as ResourceCategory })}
                    className="w-full px-3 py-2 bg-[#F7F8F4] border border-[#E5E7EB] rounded-lg text-[#17231D]"
                  >
                    <option value="stationery">Stationery</option>
                    <option value="books_education">Books & Education</option>
                    <option value="furniture">Furniture</option>
                    <option value="digital_devices">Digital Devices</option>
                    <option value="household_supplies">Household Supplies</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-[#17231D]">Priority Level</label>
                  <select
                    value={formData.priorityLevel}
                    onChange={(e) => setFormData({ ...formData, priorityLevel: e.target.value as RequestPriority })}
                    className="w-full px-3 py-2 bg-[#F7F8F4] border border-[#E5E7EB] rounded-lg text-[#17231D]"
                  >
                    <option value="urgent">Urgent (Imminent deadline / emergency)</option>
                    <option value="high">High (Semester start / key program)</option>
                    <option value="medium">Medium (Standard replenishment)</option>
                    <option value="low">Low (Flexible timing)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-[#17231D]">Required By Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.requiredByDate}
                    onChange={(e) => setFormData({ ...formData, requiredByDate: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F7F8F4] border border-[#E5E7EB] rounded-lg text-[#17231D]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-[#17231D]">Priority Explanation</label>
                <input
                  type="text"
                  value={formData.priorityExplanation}
                  onChange={(e) => setFormData({ ...formData, priorityExplanation: e.target.value })}
                  placeholder="Explain why this deadline or priority is required"
                  className="w-full px-3 py-2 bg-[#F7F8F4] border border-[#E5E7EB] rounded-lg text-[#17231D]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-medium text-[#47544C] hover:bg-[#F3F5F1] rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#176B4D] hover:bg-[#104A36] rounded-lg shadow-xs"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
