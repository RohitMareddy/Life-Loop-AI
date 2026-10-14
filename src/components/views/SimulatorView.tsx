import React, { useState, useMemo } from 'react';
import {
  Sliders,
  Play,
  RotateCcw,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ResourceLot, CommunityRequest, OptimizationConfig, AllocationPlan } from '../../types';
import { runOptimization } from '../../lib/impactOptimizer';
import { ProvenanceBadge } from '../ProvenanceBadge';

export const SimulatorView: React.FC = () => {
  const { resources: baseResources, requests: baseRequests } = useApp();

  const [activePreset, setActivePreset] = useState<'A' | 'B' | 'C' | 'D' | 'E'>('A');

  // Simulation controls state
  const [simulatedSupplyDelta, setSimulatedSupplyDelta] = useState<number>(-25); // Scenario A default
  const [urgentDeadlineDays, setUrgentDeadlineDays] = useState<number>(2); // Scenario B
  const [includeInspectionLot, setIncludeInspectionLot] = useState<boolean>(true); // Scenario C
  const [simulatedNewLotQty, setSimulatedNewLotQty] = useState<number>(50); // Scenario D
  const [simulatedStrategy, setSimulatedStrategy] =
    useState<OptimizationConfig['strategy']>('maximize_fulfillment');

  // Baseline plan (before simulation modifications)
  const baselinePlan = useMemo(() => {
    return runOptimization(baseResources, baseRequests, {
      strategy: 'maximize_fulfillment',
      urgencyWeight: 0.5,
      fairnessWeight: 0.5,
      distanceWeight: 0.2,
      minAllocationThreshold: 5,
      enforceVerifiedOnly: false,
    });
  }, [baseResources, baseRequests]);

  // Apply scenario preset
  const handleSelectPreset = (preset: 'A' | 'B' | 'C' | 'D' | 'E') => {
    setActivePreset(preset);
    if (preset === 'A') {
      // Limited Supply: Cut notebook inventory by 35 units
      setSimulatedSupplyDelta(-35);
      setSimulatedStrategy('maximize_fulfillment');
    } else if (preset === 'B') {
      // Urgent Request: Fast-forward Eastside deadline to 1 day and prioritize urgency
      setUrgentDeadlineDays(1);
      setSimulatedStrategy('prioritize_urgency');
    } else if (preset === 'C') {
      // Incompatible condition: Res-107 needs inspection
      setIncludeInspectionLot(false);
      setSimulatedStrategy('maximize_fulfillment');
    } else if (preset === 'D') {
      // New donation: +80 notebooks from college workshop
      setSimulatedSupplyDelta(80);
      setSimulatedStrategy('maximize_fulfillment');
    } else if (preset === 'E') {
      // Fairness vs Total Fulfillment
      setSimulatedStrategy('balanced_fairness');
    }
  };

  // Build simulated dataset
  const simulatedResources = useMemo(() => {
    return baseResources.map((r) => {
      if (r.id === 'res-101') {
        const newAvailable = Math.max(5, r.availableQuantity + simulatedSupplyDelta);
        return { ...r, availableQuantity: newAvailable };
      }
      if (r.id === 'res-107' && !includeInspectionLot) {
        return { ...r, condition: 'unsuitable' as const };
      }
      return r;
    });
  }, [baseResources, simulatedSupplyDelta, includeInspectionLot]);

  const simulatedRequests = useMemo(() => {
    return baseRequests.map((req) => {
      if (req.id === 'req-202') {
        const deadlineDate = new Date(Date.now() + urgentDeadlineDays * 86400000)
          .toISOString()
          .split('T')[0];
        return {
          ...req,
          requiredByDate: deadlineDate,
          priorityLevel: urgentDeadlineDays <= 2 ? ('urgent' as const) : ('high' as const),
        };
      }
      return req;
    });
  }, [baseRequests, urgentDeadlineDays]);

  // Run the REAL optimizer on the simulated dataset!
  const simulatedPlan: AllocationPlan = useMemo(() => {
    return runOptimization(simulatedResources, simulatedRequests, {
      strategy: simulatedStrategy,
      urgencyWeight: simulatedStrategy === 'prioritize_urgency' ? 1.0 : 0.4,
      fairnessWeight: simulatedStrategy === 'balanced_fairness' ? 1.0 : 0.3,
      distanceWeight: 0.2,
      minAllocationThreshold: 5,
      enforceVerifiedOnly: false,
    });
  }, [simulatedResources, simulatedRequests, simulatedStrategy]);

  // Delta metrics between baseline and simulated
  const quantityDelta =
    simulatedPlan.totalQuantityAllocated - baselinePlan.totalQuantityAllocated;
  const fulfilledDelta =
    simulatedPlan.totalRequestsFulfilledCount - baselinePlan.totalRequestsFulfilledCount;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="pb-4 border-b border-[#E5E7EB]">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-mono uppercase tracking-wider text-[#176B4D] font-medium bg-[#EEF5F1] px-2 py-0.5 rounded">
            Interactive What-If Simulation
          </span>
          <span className="text-xs text-[#66736A]">· Dynamic Recalculation Engine</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[#17231D]">
          Constraint Stress Testing & Simulation
        </h1>
        <p className="text-sm text-[#66736A] mt-0.5">
          Simulate supply shocks, emergency deadlines, and policy trade-offs. The optimizer runs the
          genuine constraint algorithm on updated parameters in real time.
        </p>
      </div>

      {/* Scenario Presets Selector */}
      <div className="space-y-3">
        <span className="text-xs font-bold text-[#17231D]">Select Scenario Preset:</span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            {
              id: 'A' as const,
              title: 'A: Severe Supply Deficit',
              desc: 'Notebooks cut by 35 units. Inspect who gets prioritized.',
            },
            {
              id: 'B' as const,
              title: 'B: Imminent Term Deadline',
              desc: 'Eastside Elementary deadline moved to tomorrow.',
            },
            {
              id: 'C' as const,
              title: 'C: Inspection Failure',
              desc: 'Chemistry glassware marked unsuitable; test safety block.',
            },
            {
              id: 'D' as const,
              title: 'D: Major Surplus Arrival',
              desc: '+80 notebooks donated by university surplus.',
            },
            {
              id: 'E' as const,
              title: 'E: Fairness vs Volume',
              desc: 'Multi-round fair-share vs greedy single-recipient allocation.',
            },
          ].map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleSelectPreset(preset.id)}
              className={`p-3 text-left rounded-lg border transition-all ${
                activePreset === preset.id
                  ? 'bg-[#EEF5F1] border-[#176B4D] shadow-2xs font-semibold'
                  : 'bg-white border-[#E5E7EB] hover:bg-[#FBFBFA]'
              }`}
            >
              <div className="text-xs font-bold text-[#17231D] mb-1">{preset.title}</div>
              <p className="text-[11px] text-[#66736A] leading-normal font-normal">{preset.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Sliders & Parameter Modifiers */}
      <div className="bg-white p-6 rounded-xl border border-[#E5E7EB] shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
          <h2 className="text-sm font-bold text-[#17231D]">Active Simulation Parameters</h2>
          <span className="text-[11px] font-mono text-[#8A958E]">Hypothetical Sandbox State</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          {/* Supply Shock Slider */}
          <div className="space-y-2">
            <div className="flex justify-between font-medium">
              <span className="text-[#47544C]">Notebook Supply Adjustment</span>
              <span className="font-mono tabular-nums font-bold text-[#17231D]">
                {simulatedSupplyDelta > 0 ? `+${simulatedSupplyDelta}` : simulatedSupplyDelta} units
              </span>
            </div>
            <input
              type="range"
              min="-40"
              max="100"
              step="5"
              value={simulatedSupplyDelta}
              onChange={(e) => setSimulatedSupplyDelta(Number(e.target.value))}
              className="w-full accent-[#176B4D]"
            />
            <p className="text-[11px] text-[#8A958E]">
              Available notebooks lot (res-101) adjusted to{' '}
              {Math.max(5, 55 + simulatedSupplyDelta)} units.
            </p>
          </div>

          {/* Deadline Slider */}
          <div className="space-y-2">
            <div className="flex justify-between font-medium">
              <span className="text-[#47544C]">Eastside School Deadline</span>
              <span className="font-mono tabular-nums font-bold text-[#17231D]">
                {urgentDeadlineDays} days
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="14"
              step="1"
              value={urgentDeadlineDays}
              onChange={(e) => setUrgentDeadlineDays(Number(e.target.value))}
              className="w-full accent-[#176B4D]"
            />
            <p className="text-[11px] text-[#8A958E]">
              Adjusting deadline tightens urgency weighting and deadline proximity score.
            </p>
          </div>

          {/* Allocation Strategy Dropdown */}
          <div className="space-y-2">
            <label className="font-medium text-[#47544C] block">Simulated Strategy</label>
            <select
              value={simulatedStrategy}
              onChange={(e) => setSimulatedStrategy(e.target.value as any)}
              className="w-full px-3 py-2 bg-[#F7F8F4] border border-[#E5E7EB] rounded-lg text-[#17231D] text-xs font-medium"
            >
              <option value="maximize_fulfillment">Strategy A: Maximize Volume</option>
              <option value="prioritize_urgency">Strategy B: Prioritize Urgency</option>
              <option value="balanced_fairness">Strategy C: Balanced Fairness</option>
              <option value="minimize_distance">Strategy D: Logistics Optimized</option>
            </select>
            <p className="text-[11px] text-[#8A958E]">
              Determines the objective function used in the bipartite allocation solver.
            </p>
          </div>
        </div>
      </div>

      {/* Before-and-After Recalculation Results */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#17231D] tracking-tight">
              Before-and-After Simulation Outcome
            </h3>
            <p className="text-xs text-[#66736A]">
              Real mathematical comparison between baseline and simulated scenario.
            </p>
          </div>
          <ProvenanceBadge tag="CALCULATED" />
        </div>

        {/* Delta KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono tabular-nums text-xs">
          <div className="p-4 bg-white rounded-xl border border-[#E5E7EB] shadow-2xs space-y-1">
            <span className="text-[11px] text-[#8A958E] font-sans block">Total Units Allocated</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-[#17231D]">
                {simulatedPlan.totalQuantityAllocated}
              </span>
              <span
                className={`text-xs font-semibold ${
                  quantityDelta >= 0 ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                ({quantityDelta >= 0 ? `+${quantityDelta}` : quantityDelta})
              </span>
            </div>
            <span className="text-[10px] text-[#8A958E] font-sans">
              Baseline: {baselinePlan.totalQuantityAllocated}
            </span>
          </div>

          <div className="p-4 bg-white rounded-xl border border-[#E5E7EB] shadow-2xs space-y-1">
            <span className="text-[11px] text-[#8A958E] font-sans block">
              Fully Fulfilled Requests
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-[#17231D]">
                {simulatedPlan.totalRequestsFulfilledCount}
              </span>
              <span
                className={`text-xs font-semibold ${
                  fulfilledDelta >= 0 ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                ({fulfilledDelta >= 0 ? `+${fulfilledDelta}` : fulfilledDelta})
              </span>
            </div>
            <span className="text-[10px] text-[#8A958E] font-sans">
              Baseline: {baselinePlan.totalRequestsFulfilledCount}
            </span>
          </div>

          <div className="p-4 bg-white rounded-xl border border-[#E5E7EB] shadow-2xs space-y-1">
            <span className="text-[11px] text-[#8A958E] font-sans block">Resource Utilization</span>
            <div className="text-xl font-bold text-[#17231D]">
              {simulatedPlan.resourceUtilizationRate}%
            </div>
            <span className="text-[10px] text-[#8A958E] font-sans">
              Baseline: {baselinePlan.resourceUtilizationRate}%
            </span>
          </div>

          <div className="p-4 bg-white rounded-xl border border-[#E5E7EB] shadow-2xs space-y-1">
            <span className="text-[11px] text-[#8A958E] font-sans block">Fairness Gini Index</span>
            <div className="text-xl font-bold text-[#17231D]">
              {simulatedPlan.fairnessGiniIndex}
            </div>
            <span className="text-[10px] text-[#8A958E] font-sans">
              Baseline: {baselinePlan.fairnessGiniIndex}
            </span>
          </div>
        </div>

        {/* Dynamic Re-allocated Table */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-xs overflow-hidden">
          <div className="p-4 bg-[#FBFBFA] border-b border-[#E5E7EB] flex items-center justify-between">
            <h4 className="text-xs font-bold text-[#17231D]">
              Simulated Allocations Under {simulatedStrategy.replace('_', ' ').toUpperCase()} (
              {simulatedPlan.proposedAllocations.length} Pairings)
            </h4>
            <span className="text-[11px] text-[#8A958E]">
              Zero simulated results represent actual distributions
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FBFBFA] border-b border-[#E5E7EB] text-[#66736A] font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Resource Lot</th>
                  <th className="py-3 px-4">Recipient</th>
                  <th className="py-3 px-4 text-right">Simulated Quantity</th>
                  <th className="py-3 px-4">Compatibility</th>
                  <th className="py-3 px-4">Scenario Trade-Off & Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6]">
                {simulatedPlan.proposedAllocations.map((alloc) => (
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
                    <td className="py-3.5 px-4 text-[11px] text-[#47544C] max-w-sm">
                      {alloc.tradeOffNote}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
