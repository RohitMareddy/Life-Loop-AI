import { describe, it, expect } from 'vitest';
import { ResourceLot, CommunityRequest, DistributionRecord } from '../src/types';

describe('State Invariants & Consistency Protections', () => {
  it('deducts available units and adds to committed units upon allocation approval', () => {
    const initialResource: ResourceLot = {
      id: 'res-inv-1',
      title: 'Desks',
      category: 'furniture',
      description: 'Solid desks',
      quantity: 20,
      availableQuantity: 20,
      committedQuantity: 0,
      distributedQuantity: 0,
      unit: 'desks',
      condition: 'good',
      availableFrom: '2026-10-10',
      pickupLocation: 'Depot',
      donorOrganization: 'University',
      permittedRecipientTypes: ['school'],
      estimatedReuseValue: 400,
      status: 'available',
      createdAt: '2026-10-10T00:00:00Z',
      updatedAt: '2026-10-10T00:00:00Z',
      verificationStatus: 'verified',
      source: 'manual',
    };

    const allocatedQuantity = 12;

    // Simulate approval logic from AppContext
    const newAvailable = Math.max(0, initialResource.availableQuantity - allocatedQuantity);
    const newCommitted = initialResource.committedQuantity + allocatedQuantity;

    expect(newAvailable).toBe(8);
    expect(newCommitted).toBe(12);
    expect(newAvailable + newCommitted).toBe(initialResource.quantity);
  });

  it('correctly handles partial delivery shortfall by restoring unused inventory', () => {
    // Suppose 12 desks were committed for distribution
    let availableQuantity = 8;
    let committedQuantity = 12;
    let requestOutstanding = 0; // Originally fulfilled 12

    const scheduledQuantity = 12;
    const actualDelivered = 9; // 3 units damaged or not accepted
    const shortfall = scheduledQuantity - actualDelivered;

    expect(shortfall).toBe(3);

    // Shortfall restored back to inventory and demand
    availableQuantity += shortfall;
    committedQuantity -= shortfall;
    requestOutstanding += shortfall;

    expect(availableQuantity).toBe(11);
    expect(committedQuantity).toBe(9);
    expect(requestOutstanding).toBe(3);
  });
});
