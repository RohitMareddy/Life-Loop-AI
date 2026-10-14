import { describe, it, expect } from 'vitest';
import { runOptimization } from '../src/lib/impactOptimizer';
import { ResourceLot, CommunityRequest, OptimizationConfig } from '../src/types';

describe('Impact Optimizer Allocation Engine', () => {
  const sampleResources: ResourceLot[] = [
    {
      id: 'res-opt-1',
      title: 'Notebooks Lot A',
      category: 'stationery',
      description: '60 notebooks',
      quantity: 60,
      availableQuantity: 60,
      committedQuantity: 0,
      distributedQuantity: 0,
      unit: 'notebooks',
      condition: 'good',
      availableFrom: '2026-10-10',
      availableUntil: '2026-11-30',
      pickupLocation: 'Depot 1',
      donorOrganization: 'Donor A',
      permittedRecipientTypes: ['school', 'community_learning_center'],
      estimatedReuseValue: 120,
      status: 'available',
      createdAt: '2026-10-10T00:00:00Z',
      updatedAt: '2026-10-10T00:00:00Z',
      verificationStatus: 'verified',
      source: 'manual',
    },
    {
      id: 'res-opt-2',
      title: 'Moisture Damaged Books',
      category: 'books_education',
      description: 'Unsuitable books',
      quantity: 50,
      availableQuantity: 50,
      committedQuantity: 0,
      distributedQuantity: 0,
      unit: 'books',
      condition: 'unsuitable',
      availableFrom: '2026-10-10',
      pickupLocation: 'Depot 2',
      donorOrganization: 'Donor B',
      permittedRecipientTypes: ['school'],
      estimatedReuseValue: 0,
      status: 'unsuitable',
      createdAt: '2026-10-10T00:00:00Z',
      updatedAt: '2026-10-10T00:00:00Z',
      verificationStatus: 'unverified',
      source: 'manual',
    },
  ];

  const sampleRequests: CommunityRequest[] = [
    {
      id: 'req-opt-1',
      organizationName: 'School Alpha',
      organizationType: 'school',
      category: 'stationery',
      requestedItems: 'Notebooks',
      requestedQuantity: 40,
      fulfilledQuantity: 0,
      outstandingQuantity: 40,
      unit: 'notebooks',
      minAcceptableCondition: 'good',
      requiredByDate: '2026-10-20',
      location: 'North Zone',
      permittedSubstitutions: false,
      intendedUse: 'Classes',
      priorityLevel: 'urgent',
      priorityExplanation: 'Starts Friday',
      verificationStatus: 'verified',
      status: 'open',
      createdAt: '2026-10-11T00:00:00Z',
    },
    {
      id: 'req-opt-2',
      organizationName: 'School Beta',
      organizationType: 'school',
      category: 'stationery',
      requestedItems: 'Notebooks',
      requestedQuantity: 40,
      fulfilledQuantity: 0,
      outstandingQuantity: 40,
      unit: 'notebooks',
      minAcceptableCondition: 'good',
      requiredByDate: '2026-10-30',
      location: 'South Zone',
      permittedSubstitutions: false,
      intendedUse: 'Classes',
      priorityLevel: 'low',
      priorityExplanation: 'Replenishment',
      verificationStatus: 'verified',
      status: 'open',
      createdAt: '2026-10-11T00:00:00Z',
    },
    {
      id: 'req-opt-3',
      organizationName: 'Library Gamma',
      organizationType: 'library',
      category: 'books_education',
      requestedItems: 'Reading books',
      requestedQuantity: 30,
      fulfilledQuantity: 0,
      outstandingQuantity: 30,
      unit: 'books',
      minAcceptableCondition: 'good',
      requiredByDate: '2026-10-25',
      location: 'East Zone',
      permittedSubstitutions: false,
      intendedUse: 'Circulation',
      priorityLevel: 'medium',
      priorityExplanation: 'Shelves',
      verificationStatus: 'verified',
      status: 'open',
      createdAt: '2026-10-11T00:00:00Z',
    },
  ];

  const defaultConfig: OptimizationConfig = {
    strategy: 'maximize_fulfillment',
    urgencyWeight: 0.5,
    fairnessWeight: 0.5,
    distanceWeight: 0.2,
    minAllocationThreshold: 5,
    enforceVerifiedOnly: false,
  };

  it('guarantees inventory non-exceedance invariant', () => {
    const plan = runOptimization(sampleResources, sampleRequests, defaultConfig);

    // Sum of allocations from res-opt-1 cannot exceed its availableQuantity of 60
    const allocFromRes1 = plan.proposedAllocations
      .filter((a) => a.resourceId === 'res-opt-1')
      .reduce((sum, a) => sum + a.allocatedQuantity, 0);

    expect(allocFromRes1).toBeLessThanOrEqual(60);
    expect(plan.constraintViolationsCount).toBe(0);
  });

  it('guarantees request demand non-exceedance invariant', () => {
    const plan = runOptimization(sampleResources, sampleRequests, defaultConfig);

    // No request should receive more than its outstanding quantity
    for (const req of sampleRequests) {
      const allocForReq = plan.proposedAllocations
        .filter((a) => a.requestId === req.id)
        .reduce((sum, a) => sum + a.allocatedQuantity, 0);

      expect(allocForReq).toBeLessThanOrEqual(req.outstandingQuantity);
    }
  });

  it('never allocates unsuitable resources', () => {
    const plan = runOptimization(sampleResources, sampleRequests, defaultConfig);

    // res-opt-2 is 'unsuitable', should never appear in proposedAllocations
    const allocsUnsuitable = plan.proposedAllocations.filter(
      (a) => a.resourceId === 'res-opt-2'
    );
    expect(allocsUnsuitable).toHaveLength(0);
  });

  it('correctly diagnoses unmet demand reasons (e.g. condition mismatch or zero inventory)', () => {
    const plan = runOptimization(sampleResources, sampleRequests, defaultConfig);

    // Library Gamma requested books, but the only book lot is unsuitable
    const unmetLibrary = plan.unmetRequests.find((u) => u.requestId === 'req-opt-3');
    expect(unmetLibrary).toBeDefined();
    expect(unmetLibrary?.reason).toBe('condition_mismatch');
  });

  it('prioritizes urgent requests under prioritize_urgency strategy', () => {
    const urgencyConfig: OptimizationConfig = {
      ...defaultConfig,
      strategy: 'prioritize_urgency',
      urgencyWeight: 1.0,
    };

    const plan = runOptimization(sampleResources, sampleRequests, urgencyConfig);

    // School Alpha (urgent) should get its full 40 notebooks before School Beta (low) gets the rest
    const allocAlpha = plan.proposedAllocations.find((a) => a.requestId === 'req-opt-1');
    const allocBeta = plan.proposedAllocations.find((a) => a.requestId === 'req-opt-2');

    expect(allocAlpha).toBeDefined();
    expect(allocAlpha?.allocatedQuantity).toBe(40); // 100% fulfilled
    expect(allocBeta?.allocatedQuantity).toBe(20); // receives remainder of the 60 total
  });

  it('balances allocations across multiple recipients under balanced_fairness strategy', () => {
    const fairnessConfig: OptimizationConfig = {
      ...defaultConfig,
      strategy: 'balanced_fairness',
      fairnessWeight: 1.0,
    };

    const plan = runOptimization(sampleResources, sampleRequests, fairnessConfig);

    // Under balanced fairness, both School Alpha and School Beta receive non-zero allocations
    const allocAlpha = plan.proposedAllocations.find((a) => a.requestId === 'req-opt-1');
    const allocBeta = plan.proposedAllocations.find((a) => a.requestId === 'req-opt-2');

    expect(allocAlpha).toBeDefined();
    expect(allocBeta).toBeDefined();
    expect(allocAlpha!.allocatedQuantity).toBeGreaterThan(0);
    expect(allocBeta!.allocatedQuantity).toBeGreaterThan(0);
    expect(allocAlpha!.allocatedQuantity + allocBeta!.allocatedQuantity).toBeLessThanOrEqual(60);
  });

  it('handles empty inputs gracefully without throwing', () => {
    const emptyPlan = runOptimization([], [], defaultConfig);
    expect(emptyPlan.proposedAllocations).toHaveLength(0);
    expect(emptyPlan.totalQuantityAllocated).toBe(0);
    expect(emptyPlan.resourceUtilizationRate).toBe(0);
  });
});
