import React, { useState } from 'react';
import {
  TrendingUp,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Layers,
  ChevronRight,
  Check,
  GitCompare,
  BarChart2,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  OptimizationConfig,
  OptimizationStrategy,
  AllocationPlan,
  ProposedAllocation,
} from '../../types';
import { runOptimization } from '../../lib/impactOptimizer';
import { ProvenanceBadge } from '../ProvenanceBadge';

export const OptimizerView: React.FC = () => {
  const { resources, requests, activePlan, generatePlan, approvePlan, setActiveTab } = useApp();

  const [selectedStrategy, setSelectedStrategy] =
    useState<OptimizationStrategy>('maximize_fulfillment');
  const [urgencyWeight, setUrgencyWeight] = useState(0.8);
  const [fairnessWeight, setFairnessWeight] = useState(0.5);
  const [distanceWeight, setDistanceWeight] = useState(0.3);
  const [enforceVerifiedOnly, setEnforceVerifiedOnly] = useState(false);

  const [isComparing, setIsComparing] = useState(false);
  const [comparePlanA, setComparePlanA] = useState<AllocationPlan | null>(null);
  const [comparePlanB, setComparePlanB] = useState<AllocationPlan | null>(null);

  const [isApprovedSuccess, setIsApprovedSuccess] = useState(false);

  const handleGenerate = () => {
    setIsApprovedSuccess(false);
    const config: OptimizationConfig = {
      strategy: selectedStrategy,
      urgencyWeight,
      fairnessWeight,
      distanceWeight,
      minAllocationThreshold: 5,
      enforceVerifiedOnly,
    };
    generatePlan(config);
  };

  const handleRunComparison = () => {
    // Generate Strategy A (Maximize Fulfillment)
    const planA = runOptimization(resources, requests, {
      strategy: 'maximize_fulfillment',
      urgencyWeight: 0.3,
      fairnessWeight: 0.2,
      distanceWeight: 0.1,
      minAllocationThreshold: 5,
      enforceVerifiedOnly: false,
    });
    // Generate Strategy B (Prioritize Urgency) or Strategy C (Balanced Fairness)
    const planB = runOptimization(resources, requests, {
      strategy: 'prioritize_urgency',
      urgencyWeight: 1.0,
      fairnessWeight: 0.2,
      distanceWeight: 0.1,
      minAllocationThreshold: 5,
      enforceVerifiedOnly: false,
    });

    setComparePlanA(planA);
    setComparePlanB(planB);
    setIsComparing(true);
  };

  const handleApprove = () => {
    if (!activePlan) return;
    const ok = approvePlan(activePlan.id);
    if (ok) {
      setIsApprovedSuccess(true);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E7EB]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono uppercase tracking-wider text-[#176B4D] font-medium bg-[#EEF5F1] px-2 py-0.5 rounded">
              Signature Optimization Engine
            </span>
            <span className="text-xs text-[#66736A]">· Constraint-Satisfaction Heuristic</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#17231D]">Impact Optimizer</h1>
          <p className="text-sm text-[#66736A]">
            Solves multi-recipient allocation under capacity, timing, eligibility, and fairness
            constraints.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRunComparison}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#176B4D] bg-[#F0F6F2] hover:bg-[#E2EDE5] rounded-lg border border-[#D1E3D7] transition-colors"
          >
            <GitCompare className="w-3.5 h-3.5 text-[#176B4D]" />
            <span>Compare Strategies</span>
          </button>
          <button
            onClick={handleGenerate}
            className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-[#176B4D] hover:bg-[#104A36] rounded-lg shadow-xs transition-colors shrink-0"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Generate Allocation Plan</span>
          </button>
        </div>
      </div>

      {/* Control Workspace: Objectives & Parameters */}
      <div className="bg-white p-6 rounded-xl border border-[#E5E7EB] shadow-xs space-y-6">
        <div>
          <h2 className="text-sm font-bold text-[#17231D] tracking-tight">
            1. Select Allocation Strategy & Constraints
          </h2>
          <p className="text-xs text-[#66736A]">
            Configure multi-objective weights before computing feasible flows.
          </p>
        </div>

        {/* Strategy Selector Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {[
            {
              id: 'maximize_fulfillment' as OptimizationStrategy,
              title: 'Strategy A: Maximize Volume',
              desc: 'Maximizes aggregate units redistributed across all feasible pairs.',
            },
            {
              id: 'prioritize_urgency' as OptimizationStrategy,
              title: 'Strategy B: Prioritize Urgency',
              desc: 'Steeply weights imminent deadlines and emergency educational needs.',
            },
            {
              id: 'balanced_fairness' as OptimizationStrategy,
              title: 'Strategy C: Balanced Fairness',
              desc: 'Multi-round fair-share prevents large centers from starving smaller schools.',
            },
            {
              id: 'minimize_distance' as OptimizationStrategy,
              title: 'Strategy D: Logistics Optimized',
              desc: 'Penalizes transit distance to reduce logistics friction and fuel usage.',
            },
          ].map((strat) => {
            const isSelected = selectedStrategy === strat.id;
            return (
              <button
                key={strat.id}
                onClick={() => setSelectedStrategy(strat.id)}
                className={`p-3.5 text-left rounded-lg border transition-all ${
                  isSelected
                    ? 'bg-[#EEF5F1] border-[#176B4D] shadow-2xs'
                    : 'bg-[#FBFBFA] border-[#E5E7EB] hover:border-[#D1D5DB]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-xs font-bold ${
                      isSelected ? 'text-[#176B4D]' : 'text-[#17231D]'
                    }`}
                  >
                    {strat.title}
                  </span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#176B4D]" />}
                </div>
                <p className="text-[11px] text-[#66736A] leading-normal">{strat.desc}</p>
              </button>
            );
          })}
        </div>

        {/* Sliders & Constraints */}
        <div className="pt-2 border-t border-[#F3F4F6] grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
          <div className="space-y-1.5">
            <div className="flex justify-between font-medium">
              <span className="text-[#47544C]">Urgency Weight Multiplier</span>
              <span className="font-mono tabular-nums text-[#17231D]">{urgencyWeight}x</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="2.0"
              step="0.1"
              value={urgencyWeight}
              onChange={(e) => setUrgencyWeight(Number(e.target.value))}
              className="w-full accent-[#176B4D]"
            />
            <span className="text-[10px] text-[#8A958E]">
              Boosts priority allocation to schools facing term deadlines.
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between font-medium">
              <span className="text-[#47544C]">Fairness Multi-Recipient Spreading</span>
              <span className="font-mono tabular-nums text-[#17231D]">
                {Math.round(fairnessWeight * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={fairnessWeight}
              onChange={(e) => setFairnessWeight(Number(e.target.value))}
              className="w-full accent-[#176B4D]"
            />
            <span className="text-[10px] text-[#8A958E]">
              Limits single-recipient monopoly of limited stock.
            </span>
          </div>

          <div className="space-y-1.5 flex flex-col justify-center">
            <label className="flex items-center gap-2 cursor-pointer pt-2">
              <input
                type="checkbox"
                checked={enforceVerifiedOnly}
                onChange={(e) => setEnforceVerifiedOnly(e.target.checked)}
                className="w-4 h-4 rounded text-[#176B4D] focus:ring-[#176B4D]"
              />
              <span className="font-medium text-[#17231D]">
                Enforce Verified Organizations Only
              </span>
            </label>
            <span className="text-[10px] text-[#8A958E]">
              Excludes requests with unverified or pending documentation.
            </span>
          </div>
        </div>
      </div>

      {/* Strategy Comparison Modal */}
      {isComparing && comparePlanA && comparePlanB && (
        <div className="bg-white p-6 rounded-xl border border-[#176B4D] shadow-md space-y-6 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
            <div>
              <span className="text-xs font-mono uppercase text-[#176B4D] font-bold">
                Multi-Strategy Trade-Off Inspection
              </span>
              <h2 className="text-base font-bold text-[#17231D] mt-0.5">
                Comparing Strategy A (Volume) vs Strategy B (Urgency)
              </h2>
            </div>
            <button
              onClick={() => setIsComparing(false)}
              className="text-xs text-[#66736A] hover:text-[#17231D] px-2.5 py-1 border rounded"
            >
              Close Comparison
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Strategy A Card */}
            <div className="p-4 bg-[#FBFBFA] rounded-lg border border-[#E5E7EB] space-y-3">
              <span className="font-bold text-sm text-[#17231D] block">
                Strategy A: Maximize Volume
              </span>
              <div className="space-y-1.5 font-mono tabular-nums">
                <div className="flex justify-between py-1 border-b border-[#E5E7EB]">
                  <span className="text-[#66736A]">Total Quantity Allocated:</span>
                  <span className="font-bold text-[#17231D]">
                    {comparePlanA.totalQuantityAllocated} units
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E5E7EB]">
                  <span className="text-[#66736A]">Requests Fully Fulfilled:</span>
                  <span className="font-bold text-[#17231D]">
                    {comparePlanA.totalRequestsFulfilledCount}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E5E7EB]">
                  <span className="text-[#66736A]">Resource Utilization Rate:</span>
                  <span className="font-bold text-[#17231D]">
                    {comparePlanA.resourceUtilizationRate}%
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#66736A]">Fairness Gini Index:</span>
                  <span className="font-bold text-[#17231D]">
                    {comparePlanA.fairnessGiniIndex}
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-[#47544C] leading-relaxed pt-1">
                Maximizes units shifted by fulfilling bulk requests first. Can leave smaller or
                time-constrained needs waiting if bulk lots match faster.
              </p>
            </div>

            {/* Strategy B Card */}
            <div className="p-4 bg-[#EEF5F1] rounded-lg border border-[#D1E3D7] space-y-3">
              <span className="font-bold text-sm text-[#176B4D] block">
                Strategy B: Prioritize Urgency
              </span>
              <div className="space-y-1.5 font-mono tabular-nums">
                <div className="flex justify-between py-1 border-b border-[#D1E3D7]">
                  <span className="text-[#47544C]">Total Quantity Allocated:</span>
                  <span className="font-bold text-[#17231D]">
                    {comparePlanB.totalQuantityAllocated} units
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#D1E3D7]">
                  <span className="text-[#47544C]">Requests Fully Fulfilled:</span>
                  <span className="font-bold text-[#17231D]">
                    {comparePlanB.totalRequestsFulfilledCount}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#D1E3D7]">
                  <span className="text-[#47544C]">Resource Utilization Rate:</span>
                  <span className="font-bold text-[#17231D]">
                    {comparePlanB.resourceUtilizationRate}%
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#47544C]">Fairness Gini Index:</span>
                  <span className="font-bold text-[#17231D]">
                    {comparePlanB.fairnessGiniIndex}
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-[#2A3B30] leading-relaxed pt-1">
                Directs finite stationery and furniture to imminent semester deadlines (e.g.
                Eastside Elementary). May sacrifice raw volume to guarantee critical deadlines are met.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Generated Allocation Plan Section */}
      {activePlan ? (
        <div className="space-y-6">
          {/* Plan Summary Strip */}
          <div className="bg-white p-6 rounded-xl border border-[#E5E7EB] shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E7EB]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono uppercase text-[#176B4D] font-bold">
                    {activePlan.id} · {activePlan.status.toUpperCase()}
                  </span>
                  <ProvenanceBadge tag="CALCULATED" />
                </div>
                <h3 className="text-base font-bold text-[#17231D] mt-0.5">{activePlan.title}</h3>
                <p className="text-xs text-[#66736A] mt-0.5">{activePlan.summaryExplanation}</p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {activePlan.status === 'draft' ? (
                  <button
                    onClick={handleApprove}
                    className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#176B4D] hover:bg-[#104A36] rounded-lg shadow-xs transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    <span>Approve Plan & Commit Reservations</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200 text-xs font-semibold">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    <span>Plan Approved & Reserved</span>
                  </div>
                )}
              </div>
            </div>

            {/* Invariant Success Alert */}
            {isApprovedSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-xs flex items-center justify-between">
                <span>
                  Allocation approved! Inventory uncommitted units deducted and scheduled
                  distributions created in the Distribution Planner.
                </span>
                <button
                  onClick={() => setActiveTab('distribution')}
                  className="font-semibold underline ml-2"
                >
                  View Distribution Planner
                </button>
              </div>
            )}

            {/* Plan KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1 font-mono tabular-nums text-xs">
              <div className="p-3 bg-[#F7F8F4] rounded-lg border border-[#E5E7EB]">
                <span className="text-[#8A958E] block text-[11px] font-sans">
                  Total Allocated Units
                </span>
                <span className="text-xl font-bold text-[#17231D]">
                  {activePlan.totalQuantityAllocated}
                </span>
              </div>
              <div className="p-3 bg-[#F7F8F4] rounded-lg border border-[#E5E7EB]">
                <span className="text-[#8A958E] block text-[11px] font-sans">
                  Requests Fulfilled / Partial
                </span>
                <span className="text-xl font-bold text-[#17231D]">
                  {activePlan.totalRequestsFulfilledCount} / {activePlan.totalRequestsPartialCount}
                </span>
              </div>
              <div className="p-3 bg-[#F7F8F4] rounded-lg border border-[#E5E7EB]">
                <span className="text-[#8A958E] block text-[11px] font-sans">
                  Resource Utilization
                </span>
                <span className="text-xl font-bold text-[#17231D]">
                  {activePlan.resourceUtilizationRate}%
                </span>
              </div>
              <div className="p-3 bg-[#F7F8F4] rounded-lg border border-[#E5E7EB]">
                <span className="text-[#8A958E] block text-[11px] font-sans">
                  Fairness Gini Index
                </span>
                <span className="text-xl font-bold text-[#17231D]">
                  {activePlan.fairnessGiniIndex}
                </span>
              </div>
            </div>
          </div>

          {/* Proposed Allocations Table */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-xs overflow-hidden">
            <div className="p-4 bg-[#FBFBFA] border-b border-[#E5E7EB] flex items-center justify-between">
              <h4 className="text-xs font-bold text-[#17231D]">
                Proposed Allocations ({activePlan.proposedAllocations.length} Pairings)
              </h4>
              <span className="text-[11px] text-[#8A958E]">
                Enforces inventory non-exceedance: sum(alloc) &le; available
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FBFBFA] border-b border-[#E5E7EB] text-[#66736A] font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Donor Resource</th>
                    <th className="py-3 px-4">Recipient Organization</th>
                    <th className="py-3 px-4 text-right">Allocated Quantity</th>
                    <th className="py-3 px-4">Score</th>
                    <th className="py-3 px-4">Distance</th>
                    <th className="py-3 px-4">Trade-Off & Optimization Rationale</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3F4F6]">
                  {activePlan.proposedAllocations.map((alloc) => (
                    <tr key={alloc.id} className="hover:bg-[#F9FAF8] transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-[#17231D]">
                        {alloc.resourceTitle}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-[#3D4A41]">
                        {alloc.recipientName}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums font-bold text-[#176B4D]">
                        {alloc.allocatedQuantity} {alloc.unit}
                      </td>
                      <td className="py-3.5 px-4 font-mono tabular-nums">
                        {alloc.compatibilityScore}%
                      </td>
                      <td className="py-3.5 px-4 font-mono tabular-nums text-[#66736A]">
                        {alloc.distanceKm !== undefined ? `${alloc.distanceKm} km` : 'Local'}
                      </td>
                      <td className="py-3.5 px-4 text-[11px] text-[#47544C] max-w-xs">
                        {alloc.tradeOffNote}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Unmet Requests & Remaining Inventory Diagnostics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Unmet Demands */}
            <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#17231D]">
                  Unmet Community Requests ({activePlan.unmetRequests.length})
                </h4>
                <span className="text-[11px] text-[#8A958E]">Mathematically explicit cause</span>
              </div>

              <div className="divide-y divide-[#F3F4F6] text-xs">
                {activePlan.unmetRequests.map((unmet) => (
                  <div key={unmet.requestId} className="py-2.5 space-y-1">
                    <div className="flex justify-between font-medium">
                      <span className="text-[#17231D]">{unmet.organizationName}</span>
                      <span className="font-mono text-rose-700 tabular-nums">
                        {unmet.unmetQuantity} {unmet.unit} unmet
                      </span>
                    </div>
                    <p className="text-[11px] text-[#66736A]">{unmet.details}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Unallocated Resources */}
            <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#17231D]">
                  Remaining Unallocated Inventory ({activePlan.unallocatedResources.length})
                </h4>
                <span className="text-[11px] text-[#8A958E]">Preserved for future requests</span>
              </div>

              <div className="divide-y divide-[#F3F4F6] text-xs">
                {activePlan.unallocatedResources.map((unalloc) => (
                  <div key={unalloc.resourceId} className="py-2.5 space-y-1">
                    <div className="flex justify-between font-medium">
                      <span className="text-[#17231D]">{unalloc.title}</span>
                      <span className="font-mono text-[#176B4D] tabular-nums">
                        {unalloc.remainingQuantity} {unalloc.unit} remaining
                      </span>
                    </div>
                    <span className="text-[10px] text-[#8A958E] uppercase tracking-wide">
                      Reason: {unalloc.reason.replace(/_/g, ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-xl border border-[#E5E7EB] shadow-xs space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-[#EEF5F1] flex items-center justify-center text-[#176B4D]">
            <TrendingUp className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#17231D]">Ready to Calculate Optimal Allocation</h3>
          <p className="text-xs text-[#66736A] max-w-md mx-auto">
            Click &ldquo;Generate Allocation Plan&rdquo; above to run the constraint-aware
            optimization solver across all active Greenfield donation lots and community requests.
          </p>
        </div>
      )}
    </div>
  );
};
