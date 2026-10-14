import {
  ResourceLot,
  CommunityRequest,
  AllocationPlan,
  ProposedAllocation,
  UnmetRequestReport,
  UnallocatedResourceReport,
  OptimizationConfig,
  OptimizationStrategy,
  RequestPriority,
} from '../types';
import { evaluateCompatibility, calculateDistanceKm } from './matchingEngine';

const PRIORITY_WEIGHTS: Record<RequestPriority, number> = {
  urgent: 4.0,
  high: 2.5,
  medium: 1.5,
  low: 1.0,
};

export function runOptimization(
  resources: ResourceLot[],
  requests: CommunityRequest[],
  config: OptimizationConfig
): AllocationPlan {
  const planId = `plan-${Date.now()}`;
  const startTime = new Date().toISOString();

  // Create isolated mutable snapshots of supply and demand
  const supplyState = new Map<string, number>();
  resources.forEach((r) => {
    supplyState.set(r.id, Math.max(0, r.availableQuantity));
  });

  const demandState = new Map<string, number>();
  requests.forEach((req) => {
    demandState.set(req.id, Math.max(0, req.outstandingQuantity));
  });

  // Track allocations per request to assess fairness
  const requestAllocations = new Map<string, number>();
  requests.forEach((req) => requestAllocations.set(req.id, 0));

  const proposedAllocations: ProposedAllocation[] = [];
  const candidateEdges: {
    resource: ResourceLot;
    request: CommunityRequest;
    compatibilityScore: number;
    utility: number;
    distanceKm?: number;
    tradeOffNote: string;
    assumptions: string[];
  }[] = [];

  // 1. Build feasible edges passing all hard constraints
  for (const res of resources) {
    if (res.status === 'exhausted' || res.status === 'archived' || res.status === 'unsuitable') {
      continue;
    }

    for (const req of requests) {
      if (req.status === 'fulfilled' || req.status === 'closed' || req.status === 'cancelled') {
        continue;
      }

      if (config.enforceVerifiedOnly && req.verificationStatus !== 'verified') {
        continue;
      }

      const metrics = evaluateCompatibility(res, req);

      if (!metrics.hardConstraintsPassed) {
        continue;
      }

      const distanceKm = calculateDistanceKm(
        res.coordinates?.lat,
        res.coordinates?.lng,
        req.coordinates?.lat,
        req.coordinates?.lng
      );

      // Calculate utility based on selected strategy
      let utility = metrics.overallScore;
      let tradeOffNote = '';

      const priorityWeight = PRIORITY_WEIGHTS[req.priorityLevel] || 1.0;

      // Deadline proximity score (closer deadline = higher score)
      const now = Date.now();
      const reqTimestamp = new Date(req.requiredByDate).getTime();
      const daysUntilNeeded = Math.max(0.5, (reqTimestamp - now) / (1000 * 60 * 60 * 24));
      const urgencyScore = Math.min(100, Math.round(100 / daysUntilNeeded));

      switch (config.strategy) {
        case 'maximize_fulfillment':
          // Pure volume and compatibility focus
          utility = metrics.overallScore * 1.0 + priorityWeight * 15;
          tradeOffNote = 'Prioritizes maximum total quantity redistributed to meet community demand.';
          break;

        case 'prioritize_urgency':
          // Heavy emphasis on urgent requests and immediate deadlines
          utility = priorityWeight * 60 + urgencyScore * 30 + metrics.overallScore * 20;
          tradeOffNote = `Targeted due to ${req.priorityLevel.toUpperCase()} priority (${req.priorityExplanation || 'imminent deadline'}).`;
          break;

        case 'balanced_fairness':
          // Standard utility base; dynamic fair-share allocation handles the spreading
          utility = metrics.overallScore * 1.2 + priorityWeight * 20;
          tradeOffNote = 'Allocated under fair-share multi-recipient distribution objective.';
          break;

        case 'minimize_distance': {
          const distPenalty = distanceKm !== undefined ? distanceKm * 3 : 25;
          utility = metrics.overallScore * 1.5 - distPenalty + priorityWeight * 10;
          tradeOffNote = `Logistics-optimized (${distanceKm !== undefined ? `${distanceKm} km transit` : 'local assumed'}).`;
          break;
        }
      }

      candidateEdges.push({
        resource: res,
        request: req,
        compatibilityScore: metrics.overallScore,
        utility,
        distanceKm,
        tradeOffNote,
        assumptions: metrics.unresolvedAssumptions,
      });
    }
  }

  // 2. Execute Allocation depending on strategy
  if (config.strategy === 'balanced_fairness') {
    // Multi-round fair-share allocation:
    // Distribute in proportional increments (e.g., 20% or min allocation) across all eligible requests
    // so no single large request consumes 100% of scarce inventory while others get 0
    let progressMade = true;
    let round = 0;
    const maxRounds = 10;

    while (progressMade && round < maxRounds) {
      progressMade = false;
      round++;

      // Sort requests by current fulfillment percentage ascending (most underserved first)
      const sortedRequests = [...requests].sort((a, b) => {
        const aTotalNeeded = a.requestedQuantity || 1;
        const bTotalNeeded = b.requestedQuantity || 1;
        const aFulfilledRatio = (requestAllocations.get(a.id) || 0) / aTotalNeeded;
        const bFulfilledRatio = (requestAllocations.get(b.id) || 0) / bTotalNeeded;
        return aFulfilledRatio - bFulfilledRatio;
      });

      for (const req of sortedRequests) {
        const remainingDemand = demandState.get(req.id) || 0;
        if (remainingDemand <= 0) continue;

        // Find best compatible resource with available supply
        const viableEdges = candidateEdges
          .filter((e) => e.request.id === req.id && (supplyState.get(e.resource.id) || 0) > 0)
          .sort((a, b) => b.utility - a.utility);

        if (viableEdges.length === 0) continue;

        const edge = viableEdges[0];
        const resSupply = supplyState.get(edge.resource.id) || 0;

        // Allocation step: either min chunk or fraction to ensure sharing
        const targetShare = Math.max(5, Math.ceil(req.requestedQuantity * 0.35));
        const allocAmount = Math.min(remainingDemand, resSupply, targetShare);

        if (allocAmount > 0) {
          supplyState.set(edge.resource.id, resSupply - allocAmount);
          demandState.set(req.id, remainingDemand - allocAmount);
          requestAllocations.set(req.id, (requestAllocations.get(req.id) || 0) + allocAmount);

          // Record or merge allocation
          const existingAlloc = proposedAllocations.find(
            (p) => p.resourceId === edge.resource.id && p.requestId === req.id
          );
          if (existingAlloc) {
            existingAlloc.allocatedQuantity += allocAmount;
          } else {
            proposedAllocations.push({
              id: `alloc-${edge.resource.id}-${req.id}-${proposedAllocations.length + 1}`,
              resourceId: edge.resource.id,
              requestId: req.id,
              resourceTitle: edge.resource.title,
              recipientName: req.organizationName,
              category: edge.resource.category,
              allocatedQuantity: allocAmount,
              unit: edge.resource.unit,
              priorityContribution: PRIORITY_WEIGHTS[req.priorityLevel],
              distanceKm: edge.distanceKm,
              compatibilityScore: edge.compatibilityScore,
              tradeOffNote: edge.tradeOffNote,
              unresolvedAssumptions: edge.assumptions,
            });
          }
          progressMade = true;
        }
      }
    }
  } else {
    // Greedy heuristic optimization ordered by computed utility
    candidateEdges.sort((a, b) => b.utility - a.utility);

    for (const edge of candidateEdges) {
      const availableSupply = supplyState.get(edge.resource.id) || 0;
      const outstandingDemand = demandState.get(edge.request.id) || 0;

      if (availableSupply <= 0 || outstandingDemand <= 0) {
        continue;
      }

      const allocAmount = Math.min(availableSupply, outstandingDemand);

      if (allocAmount > 0) {
        supplyState.set(edge.resource.id, availableSupply - allocAmount);
        demandState.set(edge.request.id, outstandingDemand - allocAmount);
        requestAllocations.set(
          edge.request.id,
          (requestAllocations.get(edge.request.id) || 0) + allocAmount
        );

        proposedAllocations.push({
          id: `alloc-${edge.resource.id}-${edge.request.id}`,
          resourceId: edge.resource.id,
          requestId: edge.request.id,
          resourceTitle: edge.resource.title,
          recipientName: edge.request.organizationName,
          category: edge.resource.category,
          allocatedQuantity: allocAmount,
          unit: edge.resource.unit,
          priorityContribution: PRIORITY_WEIGHTS[edge.request.priorityLevel],
          distanceKm: edge.distanceKm,
          compatibilityScore: edge.compatibilityScore,
          tradeOffNote: edge.tradeOffNote,
          unresolvedAssumptions: edge.assumptions,
        });
      }
    }
  }

  // 3. Compile Unmet Request Reports
  const unmetRequests: UnmetRequestReport[] = [];
  for (const req of requests) {
    const outstanding = demandState.get(req.id) ?? req.outstandingQuantity;
    if (outstanding > 0) {
      // Determine exact explicit cause
      let reason: UnmetRequestReport['reason'] = 'insufficient_inventory';
      let details = 'Available inventory was insufficient or committed to higher-priority requests.';

      const matchingCategoryLots = resources.filter((r) => r.category === req.category);
      if (matchingCategoryLots.length === 0) {
        reason = 'no_compatible_category';
        details = `No inventory exists in '${req.category}' category.`;
      } else {
        const conditionMatches = matchingCategoryLots.filter(
          (r) => evaluateCompatibility(r, req).hardConstraintsPassed
        );
        if (conditionMatches.length === 0) {
          const inspected = matchingCategoryLots.some((r) => r.condition === 'requires_inspection');
          if (inspected) {
            reason = 'condition_mismatch';
            details = 'Available lots in this category require physical inspection before allocation.';
          } else {
            reason = 'condition_mismatch';
            details = `Available lots do not satisfy minimum condition '${req.minAcceptableCondition}'.`;
          }
        }
      }

      unmetRequests.push({
        requestId: req.id,
        organizationName: req.organizationName,
        requestedQuantity: req.requestedQuantity,
        unmetQuantity: outstanding,
        unit: req.unit,
        reason,
        details,
      });
    }
  }

  // 4. Compile Unallocated Resource Reports
  const unallocatedResources: UnallocatedResourceReport[] = [];
  for (const res of resources) {
    const remaining = supplyState.get(res.id) ?? res.availableQuantity;
    if (remaining > 0) {
      let reason: UnallocatedResourceReport['reason'] = 'demand_satisfied';
      if (res.condition === 'unsuitable') {
        reason = 'condition_unsuitable';
      } else {
        const categoryRequests = requests.filter((r) => r.category === res.category && (demandState.get(r.id) || 0) > 0);
        if (categoryRequests.length === 0) {
          reason = 'no_matching_requests';
        } else {
          reason = 'quantity_surplus';
        }
      }

      unallocatedResources.push({
        resourceId: res.id,
        title: res.title,
        remainingQuantity: remaining,
        unit: res.unit,
        reason,
      });
    }
  }

  // 5. Compute Objective Metrics
  const totalAllocated = proposedAllocations.reduce((sum, a) => sum + a.allocatedQuantity, 0);

  let fulfilledCount = 0;
  let partialCount = 0;
  let unmetCount = 0;

  const fulfillmentRatios: number[] = [];

  for (const req of requests) {
    const allocated = requestAllocations.get(req.id) || 0;
    const ratio = req.requestedQuantity > 0 ? allocated / req.requestedQuantity : 0;
    fulfillmentRatios.push(ratio);

    if (ratio >= 0.99) {
      fulfilledCount++;
    } else if (ratio > 0) {
      partialCount++;
    } else {
      unmetCount++;
    }
  }

  // Compute Gini Index of fairness across eligible requests
  let fairnessGini = 0;
  const n = fulfillmentRatios.length;
  if (n > 1) {
    let diffSum = 0;
    let ratioSum = 0;
    for (let i = 0; i < n; i++) {
      ratioSum += fulfillmentRatios[i];
      for (let j = 0; j < n; j++) {
        diffSum += Math.abs(fulfillmentRatios[i] - fulfillmentRatios[j]);
      }
    }
    if (ratioSum > 0) {
      fairnessGini = Math.round((diffSum / (2 * n * ratioSum)) * 100) / 100;
    }
  }

  const initialTotalSupply = resources.reduce((sum, r) => sum + r.availableQuantity, 0);
  const resourceUtilizationRate =
    initialTotalSupply > 0 ? Math.round((totalAllocated / initialTotalSupply) * 1000) / 10 : 0;

  const distances = proposedAllocations
    .map((a) => a.distanceKm)
    .filter((d): d is number => d !== undefined);
  const averageEstimatedDistanceKm =
    distances.length > 0
      ? Math.round((distances.reduce((sum, d) => sum + d, 0) / distances.length) * 10) / 10
      : 8.5;

  let summaryExplanation = '';
  switch (config.strategy) {
    case 'maximize_fulfillment':
      summaryExplanation = `Generated allocation maximizing total community volume: ${totalAllocated} units allocated across ${proposedAllocations.length} pairings, fulfilling ${fulfilledCount} requests in full and ${partialCount} partially.`;
      break;
    case 'prioritize_urgency':
      summaryExplanation = `Urgency-weighted optimization prioritized time-critical and high-priority needs first, dedicating available supply to requests with imminent deadlines.`;
      break;
    case 'balanced_fairness':
      summaryExplanation = `Fair-share multi-recipient distribution balanced inventory across ${proposedAllocations.length} allocations, preventing starvation of smaller community organizations. Gini index: ${fairnessGini}.`;
      break;
    case 'minimize_distance':
      summaryExplanation = `Logistics-optimized plan minimized transit footprint with average distribution distance of ${averageEstimatedDistanceKm} km.`;
      break;
  }

  return {
    id: planId,
    title: `Allocation Plan — ${config.strategy.replace('_', ' ').toUpperCase()}`,
    strategy: config.strategy,
    config,
    proposedAllocations,
    unmetRequests,
    unallocatedResources,
    totalQuantityAllocated: totalAllocated,
    totalRequestsFulfilledCount: fulfilledCount,
    totalRequestsPartialCount: partialCount,
    totalRequestsUnmetCount: unmetCount,
    resourceUtilizationRate,
    fairnessGiniIndex: fairnessGini,
    averageEstimatedDistanceKm,
    constraintViolationsCount: 0, // Hard constraints guaranteed 0
    status: 'draft',
    createdAt: startTime,
    summaryExplanation,
  };
}
