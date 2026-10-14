import React, { useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  AlertCircle,
  Archive,
  Edit,
  Eye,
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  X,
  FileCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ResourceLot, ResourceCategory, ResourceCondition } from '../../types';
import { ProvenanceBadge } from '../ProvenanceBadge';

export const InventoryView: React.FC = () => {
  const { resources, addResource, updateResource, archiveResource, setActiveTab, searchQuery } =
    useApp();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCondition, setSelectedCondition] = useState<string>('all');
  const [viewDetailLot, setViewDetailLot] = useState<ResourceLot | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State for Manual Add
  const [formData, setFormData] = useState({
    title: '',
    category: 'stationery' as ResourceCategory,
    description: '',
    quantity: 50,
    unit: 'notebooks',
    condition: 'good' as ResourceCondition,
    availableFrom: new Date().toISOString().split('T')[0],
    availableUntil: '',
    pickupLocation: 'Greenfield Community Depot',
    donorOrganization: 'Greenfield Education Foundation',
    estimatedReuseValue: 150,
    estimatedWeightKg: 15,
  });

  const categories: { id: string; label: string }[] = [
    { id: 'all', label: 'All Categories' },
    { id: 'stationery', label: 'Stationery' },
    { id: 'books_education', label: 'Books & Educational' },
    { id: 'furniture', label: 'Furniture' },
    { id: 'digital_devices', label: 'Digital Devices' },
    { id: 'household_supplies', label: 'Household Supplies' },
    { id: 'non_perishable', label: 'Non-Perishables' },
  ];

  const filteredLots = resources.filter((lot) => {
    if (lot.status === 'archived') return false;
    if (selectedCategory !== 'all' && lot.category !== selectedCategory) return false;
    if (selectedCondition !== 'all' && lot.condition !== selectedCondition) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        lot.title.toLowerCase().includes(q) ||
        lot.description.toLowerCase().includes(q) ||
        lot.donorOrganization.toLowerCase().includes(q) ||
        lot.pickupLocation.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const handleCreateResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    addResource({
      title: formData.title,
      category: formData.category,
      description: formData.description,
      quantity: Number(formData.quantity) || 1,
      unit: formData.unit,
      condition: formData.condition,
      availableFrom: formData.availableFrom,
      availableUntil: formData.availableUntil || undefined,
      pickupLocation: formData.pickupLocation,
      donorOrganization: formData.donorOrganization,
      estimatedReuseValue: Number(formData.estimatedReuseValue) || 50,
      estimatedWeightKg: Number(formData.estimatedWeightKg) || 5,
      verificationStatus: 'verified',
      source: 'manual',
    });

    setIsAddModalOpen(false);
    setFormData({
      title: '',
      category: 'stationery',
      description: '',
      quantity: 50,
      unit: 'notebooks',
      condition: 'good',
      availableFrom: new Date().toISOString().split('T')[0],
      availableUntil: '',
      pickupLocation: 'Greenfield Community Depot',
      donorOrganization: 'Greenfield Education Foundation',
      estimatedReuseValue: 150,
      estimatedWeightKg: 15,
    });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E7EB]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#17231D]">Resource Inventory</h1>
          <p className="text-sm text-[#66736A]">
            Manage available donation lots, conditions, and strict quantity reservations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('intake')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#176B4D] bg-[#F0F6F2] hover:bg-[#E2EDE5] rounded-lg border border-[#D1E3D7] transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#176B4D]" />
            <span>AI Smart Intake</span>
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#176B4D] hover:bg-[#104A36] rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Resource</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-3.5 rounded-xl border border-[#E5E7EB]">
        {/* Category Pills/Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
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

        {/* Condition Filter */}
        <div className="ml-auto flex items-center gap-2">
          <label className="text-xs text-[#66736A] font-medium whitespace-nowrap">Condition:</label>
          <select
            value={selectedCondition}
            onChange={(e) => setSelectedCondition(e.target.value)}
            className="text-xs bg-[#F7F8F4] border border-[#E5E7EB] rounded-md px-2.5 py-1.5 text-[#17231D] focus:outline-none focus:border-[#176B4D]"
          >
            <option value="all">All Conditions</option>
            <option value="new">New</option>
            <option value="good">Good</option>
            <option value="used_functional">Used Functional</option>
            <option value="requires_inspection">Requires Inspection</option>
            <option value="unsuitable">Unsuitable</option>
          </select>
        </div>
      </div>

      {/* Resource Table */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FBFBFA] border-b border-[#E5E7EB] text-[#66736A] font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Resource Lot</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">Available / Total</th>
                <th className="py-3 px-4">Condition</th>
                <th className="py-3 px-4">Donor & Location</th>
                <th className="py-3 px-4">Provenance</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F6]">
              {filteredLots.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-[#66736A]">
                    No resource lots match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredLots.map((lot) => {
                  const isUnsuitable = lot.condition === 'unsuitable';
                  const needsInspection = lot.condition === 'requires_inspection';

                  return (
                    <tr
                      key={lot.id}
                      className={`hover:bg-[#F9FAF8] transition-colors ${
                        isUnsuitable ? 'bg-rose-50/20' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 font-medium text-[#17231D]">
                        <div className="space-y-0.5">
                          <span className="font-semibold block">{lot.title}</span>
                          <span className="text-[11px] text-[#66736A] font-normal truncate block max-w-xs">
                            {lot.description}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-[#47544C]">
                        <span className="capitalize">{lot.category.replace('_', ' ')}</span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                        <span className="font-bold text-[#17231D]">{lot.availableQuantity}</span>
                        <span className="text-[#8A958E]"> / {lot.quantity} {lot.unit}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          {isUnsuitable && (
                            <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          )}
                          {needsInspection && (
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          )}
                          <span
                            className={`font-medium ${
                              isUnsuitable
                                ? 'text-rose-700 font-semibold'
                                : needsInspection
                                ? 'text-amber-800'
                                : 'text-[#3D4A41]'
                            }`}
                          >
                            {lot.condition.replace('_', ' ')}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-[#47544C]">
                        <div className="truncate max-w-[180px]">
                          <span className="font-medium text-[#17231D] block truncate">
                            {lot.donorOrganization}
                          </span>
                          <span className="text-[11px] text-[#8A958E] truncate block">
                            {lot.pickupLocation}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <ProvenanceBadge
                          tag={lot.source === 'ai_extracted' ? 'AI_EXTRACTED' : 'USER_PROVIDED'}
                        />
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setViewDetailLot(lot)}
                            aria-label={`View specifications for ${lot.title}`}
                            className="p-1.5 text-[#66736A] hover:text-[#17231D] hover:bg-[#EEF1EB] rounded transition-colors focus-visible:ring-2 focus-visible:ring-[#176B4D] focus-visible:outline-none"
                            title="View Lot Specifications"
                          >
                            <Eye className="w-4 h-4" aria-hidden="true" />
                          </button>
                          <button
                            onClick={() => archiveResource(lot.id)}
                            aria-label={`Archive resource lot ${lot.title}`}
                            className="p-1.5 text-[#66736A] hover:text-rose-600 hover:bg-rose-50 rounded transition-colors focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
                            title="Archive Lot"
                          >
                            <Archive className="w-4 h-4" aria-hidden="true" />
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

      {/* View Detail Modal */}
      {viewDetailLot && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="detail-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-xs p-4"
          onKeyDown={(e) => e.key === 'Escape' && setViewDetailLot(null)}
        >
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-[#E5E7EB] p-6 space-y-4">
            <div className="flex items-start justify-between border-b border-[#E5E7EB] pb-3">
              <div>
                <span className="text-xs font-mono uppercase text-[#176B4D] font-medium">
                  {viewDetailLot.id} · {viewDetailLot.category}
                </span>
                <h3 id="detail-modal-title" className="text-base font-bold text-[#17231D] mt-0.5">{viewDetailLot.title}</h3>
              </div>
              <button
                onClick={() => setViewDetailLot(null)}
                aria-label="Close resource details dialog"
                className="text-[#8A958E] hover:text-[#17231D] p-1 rounded focus-visible:ring-2 focus-visible:ring-[#176B4D] focus-visible:outline-none"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-[#3D4A41]">
              <p>{viewDetailLot.description}</p>

              <div className="grid grid-cols-2 gap-3 p-3 bg-[#F7F8F4] rounded-lg border border-[#E5E7EB]">
                <div>
                  <span className="text-[11px] text-[#8A958E] block">Available / Total</span>
                  <span className="font-mono font-bold text-[#17231D] text-sm tabular-nums">
                    {viewDetailLot.availableQuantity} / {viewDetailLot.quantity} {viewDetailLot.unit}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-[#8A958E] block">Condition</span>
                  <span className="font-semibold capitalize text-[#17231D]">
                    {viewDetailLot.condition.replace('_', ' ')}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-[#8A958E] block">Pickup Location</span>
                  <span className="text-[#17231D]">{viewDetailLot.pickupLocation}</span>
                </div>
                <div>
                  <span className="text-[11px] text-[#8A958E] block">Donor Organization</span>
                  <span className="text-[#17231D]">{viewDetailLot.donorOrganization}</span>
                </div>
                <div>
                  <span className="text-[11px] text-[#8A958E] block">Estimated Reuse Value</span>
                  <span className="font-mono font-semibold text-[#17231D] tabular-nums">
                    ${viewDetailLot.estimatedReuseValue}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-[#8A958E] block">Estimated Weight</span>
                  <span className="font-mono text-[#17231D] tabular-nums">
                    {viewDetailLot.estimatedWeightKg || 10} kg
                  </span>
                </div>
              </div>

              {viewDetailLot.restrictions && (
                <div className="p-2.5 bg-amber-50/80 rounded border border-amber-200 text-amber-900 text-[11px]">
                  <strong>Donor Restrictions:</strong> {viewDetailLot.restrictions}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setViewDetailLot(null)}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#176B4D] hover:bg-[#104A36] rounded-lg transition-colors"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Add Resource Modal */}
      {isAddModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-resource-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-xs p-4"
          onKeyDown={(e) => e.key === 'Escape' && setIsAddModalOpen(false)}
        >
          <div className="bg-white rounded-xl shadow-xl max-w-xl w-full border border-[#E5E7EB] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
              <div>
                <h3 id="add-resource-modal-title" className="text-base font-bold text-[#17231D]">Register New Resource Lot</h3>
                <p className="text-xs text-[#66736A]">Manual creation with deterministic validation.</p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                aria-label="Close add resource dialog"
                className="text-[#8A958E] hover:text-[#17231D] p-1 rounded focus-visible:ring-2 focus-visible:ring-[#176B4D] focus-visible:outline-none"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleCreateResource} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label htmlFor="res-title-input" className="font-semibold text-[#17231D]">Resource Title *</label>
                <input
                  id="res-title-input"
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. 100 Hardcover Children Readers"
                  className="w-full px-3 py-2 bg-[#F7F8F4] border border-[#E5E7EB] rounded-lg text-[#17231D] focus:outline-none focus:border-[#176B4D] focus-visible:ring-2 focus-visible:ring-[#176B4D]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="res-category-select" className="font-semibold text-[#17231D]">Category</label>
                  <select
                    id="res-category-select"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as ResourceCategory })}
                    className="w-full px-3 py-2 bg-[#F7F8F4] border border-[#E5E7EB] rounded-lg text-[#17231D] focus-visible:ring-2 focus-visible:ring-[#176B4D]"
                  >
                    <option value="stationery">Stationery</option>
                    <option value="books_education">Books & Educational</option>
                    <option value="furniture">Furniture</option>
                    <option value="digital_devices">Digital Devices</option>
                    <option value="household_supplies">Household Supplies</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label htmlFor="res-condition-select" className="font-semibold text-[#17231D]">Condition</label>
                  <select
                    id="res-condition-select"
                    value={formData.condition}
                    onChange={(e) => setFormData({ ...formData, condition: e.target.value as ResourceCondition })}
                    className="w-full px-3 py-2 bg-[#F7F8F4] border border-[#E5E7EB] rounded-lg text-[#17231D] focus-visible:ring-2 focus-visible:ring-[#176B4D]"
                  >
                    <option value="new">New</option>
                    <option value="good">Good</option>
                    <option value="used_functional">Used Functional</option>
                    <option value="requires_inspection">Requires Inspection</option>
                    <option value="unsuitable">Unsuitable</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="res-quantity-input" className="font-semibold text-[#17231D]">Quantity *</label>
                  <input
                    id="res-quantity-input"
                    type="number"
                    min="1"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#F7F8F4] border border-[#E5E7EB] rounded-lg font-mono tabular-nums text-[#17231D] focus-visible:ring-2 focus-visible:ring-[#176B4D]"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="res-unit-input" className="font-semibold text-[#17231D]">Unit *</label>
                  <input
                    id="res-unit-input"
                    type="text"
                    required
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="e.g. books, notebooks, desks"
                    className="w-full px-3 py-2 bg-[#F7F8F4] border border-[#E5E7EB] rounded-lg text-[#17231D] focus-visible:ring-2 focus-visible:ring-[#176B4D]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="res-description-input" className="font-semibold text-[#17231D]">Description</label>
                <textarea
                  id="res-description-input"
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Details on condition, packaging, and usability"
                  className="w-full px-3 py-2 bg-[#F7F8F4] border border-[#E5E7EB] rounded-lg text-[#17231D] focus-visible:ring-2 focus-visible:ring-[#176B4D]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="res-location-input" className="font-semibold text-[#17231D]">Pickup Location</label>
                  <input
                    id="res-location-input"
                    type="text"
                    value={formData.pickupLocation}
                    onChange={(e) => setFormData({ ...formData, pickupLocation: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F7F8F4] border border-[#E5E7EB] rounded-lg text-[#17231D] focus-visible:ring-2 focus-visible:ring-[#176B4D]"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="res-donor-input" className="font-semibold text-[#17231D]">Donor Organization</label>
                  <input
                    id="res-donor-input"
                    type="text"
                    value={formData.donorOrganization}
                    onChange={(e) => setFormData({ ...formData, donorOrganization: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F7F8F4] border border-[#E5E7EB] rounded-lg text-[#17231D] focus-visible:ring-2 focus-visible:ring-[#176B4D]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-[#47544C] hover:bg-[#F3F5F1] rounded-lg focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:outline-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-[#176B4D] hover:bg-[#104A36] rounded-lg shadow-xs focus-visible:ring-2 focus-visible:ring-[#176B4D] focus-visible:outline-none"
                >
                  Save to Inventory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
