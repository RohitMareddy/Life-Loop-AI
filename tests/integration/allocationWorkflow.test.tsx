import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { AppProvider, useApp } from '../../src/context/AppContext';
import { evaluateCompatibility } from '../../src/lib/matchingEngine';

describe('Critical End-to-End Resource Redistribution Workflow', () => {
  it('executes full intake -> matching -> optimization -> approval -> distribution lifecycle', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AppProvider>{children}</AppProvider>
    );

    const { result } = renderHook(() => useApp(), { wrapper });

    // Step 1: Add a verified surplus resource
    let newResource: any;
    act(() => {
      newResource = result.current.addResource({
        title: 'New Chemistry Lab Kits',
        category: 'books_education',
        description: 'Complete basic chemistry kits for high school',
        quantity: 25,
        unit: 'kits',
        condition: 'new',
        availableUntil: '2026-11-20',
        pickupLocation: 'Central Science Warehouse',
        donorOrganization: 'STEM Outreach Initiative',
        estimatedReuseValue: 750,
        estimatedWeightKg: 50,
        verificationStatus: 'verified',
        source: 'manual',
      });
    });

    expect(newResource.id).toBeDefined();
    expect(result.current.resources.some((r) => r.id === newResource.id)).toBe(true);

    // Step 2: Register an urgent community request
    let newRequest: any;
    act(() => {
      newRequest = result.current.addRequest({
        organizationName: 'East Valley Science Academy',
        organizationType: 'school',
        category: 'books_education',
        requestedItems: 'Chemistry kits for lab course',
        requestedQuantity: 20,
        unit: 'kits',
        minAcceptableCondition: 'good',
        requiredByDate: '2026-10-30',
        location: 'East Valley',
        intendedUse: 'Senior Chemistry Practical',
        priorityLevel: 'urgent',
        priorityExplanation: 'Course starts next week without lab kits',
        verificationStatus: 'verified',
      });
    });

    expect(newRequest.id).toBeDefined();

    // Step 3: Verify semantic compatibility
    const compat = evaluateCompatibility(newResource, newRequest);
    expect(compat.hardConstraintsPassed).toBe(true);
    expect(compat.overallScore).toBeGreaterThanOrEqual(80);

    // Step 4: Run optimization engine
    let generatedPlan: any;
    act(() => {
      generatedPlan = result.current.generatePlan({
        strategy: 'prioritize_urgency',
        urgencyWeight: 1.0,
        fairnessWeight: 0.5,
        distanceWeight: 0.2,
        minAllocationThreshold: 1,
        enforceVerifiedOnly: true,
      });
    });

    expect(generatedPlan).toBeDefined();
    expect(generatedPlan.proposedAllocations.length).toBeGreaterThan(0);

    // Find the allocation for our newly added request
    const allocation = generatedPlan.proposedAllocations.find(
      (a: any) => a.requestId === newRequest.id && a.resourceId === newResource.id
    );
    expect(allocation).toBeDefined();
    expect(allocation.allocatedQuantity).toBe(20);

    // Step 5: Approve the allocation plan
    let approved = false;
    act(() => {
      approved = result.current.approvePlan(generatedPlan.id);
    });

    expect(approved).toBe(true);

    // Step 6: Verify State Invariant Protection:
    // Resource availableQuantity must be decremented by 20 (25 -> 5)
    // Resource committedQuantity must be incremented by 20 (0 -> 20)
    const updatedResource = result.current.resources.find((r) => r.id === newResource.id);
    expect(updatedResource?.availableQuantity).toBe(5);
    expect(updatedResource?.committedQuantity).toBe(20);

    // Request outstandingQuantity must be reduced (20 -> 0 fulfilled)
    const updatedRequest = result.current.requests.find((r) => r.id === newRequest.id);
    expect(updatedRequest?.fulfilledQuantity).toBe(20);
    expect(updatedRequest?.outstandingQuantity).toBe(0);

    // Step 7: A distribution record must be created in 'awaiting_scheduling'
    const newDist = result.current.distributions.find(
      (d) => d.requestId === newRequest.id && d.resourceId === newResource.id
    );
    expect(newDist).toBeDefined();
    expect(newDist?.status).toBe('awaiting_scheduling');

    // Step 8: Complete distribution lifecycle: schedule -> deliver -> verify
    act(() => {
      result.current.updateDistributionStatus(
        newDist!.id,
        'scheduled',
        'Pickup van scheduled for Tuesday 10am'
      );
    });

    let currentDist = result.current.distributions.find((d) => d.id === newDist!.id);
    expect(currentDist?.status).toBe('scheduled');

    act(() => {
      result.current.updateDistributionStatus(
        newDist!.id,
        'delivered',
        'Items delivered at Science Hall B',
        'Driver dropoff voucher #ST-991'
      );
    });

    currentDist = result.current.distributions.find((d) => d.id === newDist!.id);
    expect(currentDist?.status).toBe('delivered');

    act(() => {
      result.current.updateDistributionStatus(
        newDist!.id,
        'verified',
        'Principal verified chemistry kits count',
        'Stamped intake receipt #EV-4421'
      );
    });

    currentDist = result.current.distributions.find((d) => d.id === newDist!.id);
    expect(currentDist?.status).toBe('verified');
  });
});
