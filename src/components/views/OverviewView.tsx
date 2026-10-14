import React from 'react';
import {
  Boxes,
  ClipboardList,
  GitCompare,
  CheckCircle,
  ArrowRight,
  Clock,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { generateCandidateMatches } from '../../lib/matchingEngine';

export const OverviewView: React.FC = () => {
  const { resources, requests, distributions, auditLogs, activePlan, setActiveTab, setTourStep } =
    useApp();

  // Metrics calculation
  const availableLots = resources.filter((r) => r.status === 'available' || r.status === 'partially_allocated');
  const availableLotsCount = availableLots.length;

  const openRequests = requests.filter(
    (r) => r.status === 'open' || r.status === 'partially_matched' || r.status === 'partially_fulfilled'
  );
  const openRequestsCount = openRequests.length;

  const candidateMatches = generateCandidateMatches(resources, requests);
  const proposedMatchesCount = candidateMatches.filter((m) => m.metrics.hardConstraintsPassed).length;

  // Group redistributed units by compatible unit types (Never blind sum books + kg + desks!)
  const distributedLots = resources.filter((r) => r.distributedQuantity > 0);
  const redistributedByUnit: Record<string, number> = {};
  distributedLots.forEach((r) => {
    redistributedByUnit[r.unit] = (redistributedByUnit[r.unit] || 0) + r.distributedQuantity;
  });

  // Resource Flow Stages
  const flowCounts = {
    available: availableLotsCount,
    matched: proposedMatchesCount,
    approved: activePlan?.status === 'approved' ? activePlan.proposedAllocations.length : 1,
    distributed: distributions.filter((d) => d.status === 'delivered' || d.status === 'verified').length,
    verified: distributions.filter((d) => d.status === 'verified').length,
  };

  // Priority Requests
  const urgentRequests = [...requests]
    .filter((r) => r.status !== 'fulfilled' && r.status !== 'closed' && r.status !== 'cancelled')
    .sort((a, b) => {
      const pOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      return (pOrder[b.priorityLevel] || 0) - (pOrder[a.priorityLevel] || 0);
    })
    .slice(0, 4);

  // Recommended Actions derived from current state
  const recommendedActions: {
    id: string;
    text: string;
    subtext: string;
    actionLabel: string;
    tab: string;
  }[] = [];

  const urgentStationery = requests.find((r) => r.category === 'stationery' && r.priorityLevel === 'urgent' && r.outstandingQuantity > 0);
  const availStationery = resources.find((r) => r.category === 'stationery' && r.availableQuantity > 0);
  if (urgentStationery && availStationery) {
    recommendedActions.push({
      id: 'action-urgency',
      text: `${urgentStationery.organizationName} has an urgent request for ${urgentStationery.requestedQuantity} ${urgentStationery.unit}.`,
      subtext: `Available inventory: '${availStationery.title}' (${availStationery.availableQuantity} available). Run optimizer to assign.`,
      actionLabel: 'Launch Optimizer',
      tab: 'optimizer',
    });
  }

  const uninspected = resources.find((r) => r.condition === 'requires_inspection');
  if (uninspected) {
    recommendedActions.push({
      id: 'action-inspect',
      text: `'${uninspected.title}' requires physical safety inspection.`,
      subtext: 'Hard constraints prevent allocation until inspection status is confirmed by coordinator.',
      actionLabel: 'Review Resource',
      tab: 'inventory',
    });
  }

  const pendingVerification = distributions.find((d) => d.status === 'delivered');
  if (pendingVerification) {
    recommendedActions.push({
      id: 'action-verify',
      text: `Delivery to ${pendingVerification.recipientName} requires receipt verification.`,
      subtext: `${pendingVerification.quantity} ${pendingVerification.unit} awaiting intake voucher sign-off.`,
      actionLabel: 'Verify Distribution',
      tab: 'distribution',
    });
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header Greeting */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E5E7EB]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-mono uppercase tracking-wider text-[#176B4D] font-bold bg-[#EEF5F1] px-2 py-0.5 rounded border border-[#D1E3D7]">
              Greenfield Community Network
            </span>
            <span className="text-xs text-[#66736A] font-semibold">· Demo Environment</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-[#111A15] font-display">Good to see you.</h1>
          <p className="text-sm text-[#58645C] font-medium mt-0.5">
            Here&apos;s how your community resource network is performing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('intake')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-[#176B4D] bg-[#F0F6F2] hover:bg-[#E2EDE5] rounded-lg border border-[#D1E3D7] transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#176B4D]" />
            <span>Intake New Donation</span>
          </button>
          <button
            onClick={() => setActiveTab('optimizer')}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#176B4D] hover:bg-[#104A36] rounded-lg shadow-xs transition-colors"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Open Optimizer</span>
          </button>
        </div>
      </div>

      {/* Hero Visual Card */}
      <div className="relative rounded-xl overflow-hidden border border-[#E5E7EB] bg-white shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#176B4D] font-bold">
                Intelligent Community Logistics
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-[#111A15] tracking-tight leading-snug font-display">
                Turning Surplus Resources Into Coordinated Community Impact
              </h2>
              <p className="text-sm text-[#47544C] font-medium leading-relaxed">
                LIFELOOP AI combines natural-language donation intake, deterministic constraint
                validation, and a genuine multi-objective optimization engine to direct educational
                supplies and furniture where they create the greatest community value.
              </p>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-[#58645C] font-semibold">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#176B4D]" />
                <span>Zero Double-Allocation Invariant</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-[#176B4D]" />
                <span>Independently Verified Distributions</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 relative min-h-[200px] lg:min-h-full">
            <img
              src="/src/assets/images/hero_community_redistribution_1791963542804.jpg"
              alt="Community Redistribution Hub"
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent lg:hidden" />
          </div>
        </div>
      </div>

      {/* 4 Primary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric A: Available Resources */}
        <div className="p-5 bg-white rounded-xl border border-[#E5E7EB] shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#58645C] uppercase tracking-wider text-[11px]">Available Resources</span>
            <Boxes className="w-4 h-4 text-[#176B4D]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono tabular-nums text-[#111A15]">
              {availableLotsCount}
            </span>
            <span className="text-xs font-semibold text-[#7A867E]">lots active</span>
          </div>
          <p className="text-[11px] text-[#58645C] font-medium leading-tight">
            Active lots with uncommitted units in educational, stationery & furniture categories.
          </p>
        </div>

        {/* Metric B: Open Community Requests */}
        <div className="p-5 bg-white rounded-xl border border-[#E5E7EB] shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#58645C] uppercase tracking-wider text-[11px]">Open Requests</span>
            <ClipboardList className="w-4 h-4 text-[#B7791F]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono tabular-nums text-[#111A15]">
              {openRequestsCount}
            </span>
            <span className="text-xs font-semibold text-[#7A867E]">unmet needs</span>
          </div>
          <p className="text-[11px] text-[#58645C] font-medium leading-tight">
            Requests from registered schools, community centers, and libraries awaiting fulfillment.
          </p>
        </div>

        {/* Metric C: Proposed Matches */}
        <div className="p-5 bg-white rounded-xl border border-[#E5E7EB] shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#58645C] uppercase tracking-wider text-[11px]">Proposed Matches</span>
            <GitCompare className="w-4 h-4 text-[#176B4D]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono tabular-nums text-[#111A15]">
              {proposedMatchesCount}
            </span>
            <span className="text-xs font-semibold text-[#7A867E]">feasible pairings</span>
          </div>
          <p className="text-[11px] text-[#58645C] font-medium leading-tight">
            Feasible candidate pairings meeting hard condition, timing & category constraints.
          </p>
        </div>

        {/* Metric D: Resources Redistributed (Compatible Units) */}
        <div className="p-5 bg-white rounded-xl border border-[#E5E7EB] shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#58645C] uppercase tracking-wider text-[11px]">Redistributed</span>
            <CheckCircle className="w-4 h-4 text-[#16794B]" />
          </div>
          <div className="flex flex-col gap-0.5">
            {Object.keys(redistributedByUnit).length > 0 ? (
              Object.entries(redistributedByUnit).map(([unit, qty]) => (
                <div key={unit} className="flex items-baseline gap-1 text-sm font-semibold font-mono tabular-nums text-[#17231D]">
                  <span>{qty}</span>
                  <span className="text-xs font-sans font-normal text-[#66736A]">{unit}</span>
                </div>
              ))
            ) : (
              <span className="text-sm text-[#8A958E]">0 units recorded</span>
            )}
          </div>
          <p className="text-[11px] text-[#66736A] leading-tight">
            Completed distributions with confirmed recipient hand-off.
          </p>
        </div>
      </div>

      {/* Section A: Resource Flow Pipeline */}
      <div className="p-6 bg-white rounded-xl border border-[#E5E7EB] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#17231D] tracking-tight">Resource Flow Pipeline</h3>
            <p className="text-xs text-[#66736A]">
              Live state transitions tracking resources through verification and hand-off stages.
            </p>
          </div>
          <span className="text-[11px] font-mono text-[#8A958E]">
            Calculated from active dataset
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
          {[
            { label: 'Available', count: flowCounts.available, desc: 'Uncommitted lots', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
            { label: 'Matched', count: flowCounts.matched, desc: 'Feasible pairings', color: 'bg-teal-50 text-teal-800 border-teal-200' },
            { label: 'Approved', count: flowCounts.approved, desc: 'Committed in plans', color: 'bg-sky-50 text-sky-800 border-sky-200' },
            { label: 'Distributed', count: flowCounts.distributed, desc: 'Delivered to site', color: 'bg-amber-50 text-amber-800 border-amber-200' },
            { label: 'Verified', count: flowCounts.verified, desc: 'Signed intake slip', color: 'bg-[#EEF6F1] text-[#176B4D] border-[#C3DFCE]' },
          ].map((stage, idx) => (
            <div
              key={stage.label}
              className={`p-3.5 rounded-lg border flex flex-col justify-between space-y-1.5 ${stage.color}`}
            >
              <div className="flex items-center justify-between text-xs font-medium">
                <span>{stage.label}</span>
                <span className="text-[10px] font-mono opacity-60">0{idx + 1}</span>
              </div>
              <div className="text-xl font-bold font-mono tabular-nums">{stage.count}</div>
              <span className="text-[10px] opacity-75">{stage.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Two Column Layout: Priority Requests & Actionable Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Priority Requests */}
        <div className="lg:col-span-7 p-6 bg-white rounded-xl border border-[#E5E7EB] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#17231D] tracking-tight">Priority Requests</h3>
              <p className="text-xs text-[#66736A]">Most urgent unmet community needs.</p>
            </div>
            <button
              onClick={() => setActiveTab('requests')}
              className="text-xs text-[#176B4D] font-medium hover:underline flex items-center gap-1"
            >
              <span>View all ({requests.length})</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="divide-y divide-[#F3F4F6]">
            {urgentRequests.map((req) => (
              <div key={req.id} className="py-3 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#17231D]">
                      {req.organizationName}
                    </span>
                    <span
                      className={`text-[10px] uppercase font-mono px-1.5 py-0.2 rounded font-medium ${
                        req.priorityLevel === 'urgent'
                          ? 'bg-rose-50 text-rose-800 border border-rose-200'
                          : req.priorityLevel === 'high'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-stone-100 text-stone-700'
                      }`}
                    >
                      {req.priorityLevel}
                    </span>
                  </div>
                  <p className="text-xs text-[#47544C]">{req.requestedItems}</p>
                  <div className="flex items-center gap-3 text-[11px] text-[#8A958E]">
                    <span className="font-mono tabular-nums">
                      {req.outstandingQuantity} {req.unit} remaining
                    </span>
                    <span>·</span>
                    <span>Required by {req.requiredByDate}</span>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('optimizer')}
                  className="px-2.5 py-1 text-xs font-medium text-[#176B4D] bg-[#F0F6F2] hover:bg-[#E2EDE5] rounded border border-[#D1E3D7] shrink-0"
                >
                  Match
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Actionable Recommendations */}
        <div className="lg:col-span-5 p-6 bg-white rounded-xl border border-[#E5E7EB] shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-[#17231D] tracking-tight">Recommended Actions</h3>
            <p className="text-xs text-[#66736A]">Derived from real state invariants and constraints.</p>
          </div>

          <div className="space-y-3">
            {recommendedActions.map((rec) => (
              <div
                key={rec.id}
                className="p-3.5 bg-[#F9FAF8] rounded-lg border border-[#E5E7EB] space-y-2"
              >
                <div className="text-xs font-semibold text-[#17231D] leading-snug">{rec.text}</div>
                <p className="text-[11px] text-[#66736A] leading-relaxed">{rec.subtext}</p>
                <button
                  onClick={() => setActiveTab(rec.tab)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#176B4D] hover:underline pt-1"
                >
                  <span>{rec.actionLabel}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity Audit Log */}
      <div className="p-6 bg-white rounded-xl border border-[#E5E7EB] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#17231D] tracking-tight">Recent Platform Activity</h3>
            <p className="text-xs text-[#66736A]">Immutable audit trail of allocations, approvals, and distributions.</p>
          </div>
          <span className="text-xs text-[#8A958E] font-mono tabular-nums">
            {auditLogs.length} events logged
          </span>
        </div>

        <div className="divide-y divide-[#F3F4F6] text-xs">
          {auditLogs.slice(0, 5).map((log) => (
            <div key={log.id} className="py-2.5 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-[#176B4D] mt-1.5 shrink-0" />
                <div>
                  <div className="font-medium text-[#17231D]">
                    <span className="font-semibold">{log.action.replace(/_/g, ' ')}</span>
                    <span className="text-[#8A958E] font-normal"> by {log.actor}</span>
                  </div>
                  <p className="text-[#47544C] mt-0.5">{log.notes}</p>
                </div>
              </div>
              <span className="text-[11px] font-mono text-[#8A958E] shrink-0">
                {new Date(log.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
