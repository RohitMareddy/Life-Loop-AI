import { describe, it, expect } from 'vitest';
import {
  evaluateCompatibility,
  generateCandidateMatches,
  calculateDistanceKm,
  CONDITION_RANK,
} from '../src/lib/matchingEngine';
import { ResourceLot, CommunityRequest } from '../src/types';

describe('Matching Engine & Compatibility Scoring', () => {
  const baseResource: ResourceLot = {
    id: 'res-test-1',
    title: 'Test Notebooks',
    category: 'stationery',
    description: '100 college ruled notebooks',
    quantity: 100,
    availableQuantity: 100,
    committedQuantity: 0,
    distributedQuantity: 0,
    unit: 'notebooks',
    condition: 'good',
    availableFrom: '2026-10-10',
    availableUntil: '2026-11-30',
    pickupLocation: 'Main Depot',
    donorOrganization: 'Greenfield Bookstore',
    permittedRecipientTypes: ['school', 'community_learning_center', 'library'],
    estimatedReuseValue: 200,
    status: 'available',
    createdAt: '2026-10-10T00:00:00Z',
    updatedAt: '2026-10-10T00:00:00Z',
    verificationStatus: 'verified',
    source: 'manual',
    coordinates: { lat: 45.51, lng: -122.68 },
  };

  const baseRequest: CommunityRequest = {
    id: 'req-test-1',
    organizationName: 'Lincoln High School',
    organizationType: 'school',
    category: 'stationery',
    requestedItems: 'Spiral notebooks for students',
    requestedQuantity: 50,
    fulfilledQuantity: 0,
    outstandingQuantity: 50,
    unit: 'notebooks',
    minAcceptableCondition: 'good',
    requiredByDate: '2026-10-25',
    location: 'Downtown Campus',
    permittedSubstitutions: false,
    intendedUse: 'Classes',
    priorityLevel: 'high',
    priorityExplanation: 'Term starting',
    verificationStatus: 'verified',
    status: 'open',
    createdAt: '2026-10-11T00:00:00Z',
    coordinates: { lat: 45.52, lng: -122.67 },
  };

  it('calculates high compatibility for an ideal compatible pair', () => {
    const metrics = evaluateCompatibility(baseResource, baseRequest);
    expect(metrics.hardConstraintsPassed).toBe(true);
    expect(metrics.hardConstraintViolations).toHaveLength(0);
    expect(metrics.overallScore).toBeGreaterThanOrEqual(75);
    expect(metrics.categoryScore).toBe(100);
  });

  it('strictly rejects resources marked unsuitable', () => {
    const unsuitableResource: ResourceLot = {
      ...baseResource,
      condition: 'unsuitable',
      status: 'unsuitable',
    };
    const metrics = evaluateCompatibility(unsuitableResource, baseRequest);
    expect(metrics.hardConstraintsPassed).toBe(false);
    expect(metrics.hardConstraintViolations).toContain('Resource is marked unsuitable for redistribution.');
    expect(metrics.overallScore).toBeLessThanOrEqual(25);
  });

  it('enforces condition hierarchy (rejects condition below minimum acceptable)', () => {
    const usedResource: ResourceLot = {
      ...baseResource,
      condition: 'used_functional',
    };
    const strictRequest: CommunityRequest = {
      ...baseRequest,
      minAcceptableCondition: 'new',
    };
    const metrics = evaluateCompatibility(usedResource, strictRequest);
    expect(metrics.hardConstraintsPassed).toBe(false);
    expect(metrics.hardConstraintViolations.some((v) => v.includes('does not satisfy minimum required condition'))).toBe(true);
  });

  it('strictly enforces recipient organization eligibility constraints', () => {
    const restrictedResource: ResourceLot = {
      ...baseResource,
      permittedRecipientTypes: ['library'], // Only libraries permitted
    };
    // baseRequest is a 'school'
    const metrics = evaluateCompatibility(restrictedResource, baseRequest);
    expect(metrics.hardConstraintsPassed).toBe(false);
    expect(metrics.hardConstraintViolations.some((v) => v.includes('not among permitted recipient types'))).toBe(true);
  });

  it('flags timing conflict if resource availability starts after request required-by date', () => {
    const lateResource: ResourceLot = {
      ...baseResource,
      availableFrom: '2026-11-01', // After request requiredByDate of 2026-10-25
    };
    const metrics = evaluateCompatibility(lateResource, baseRequest);
    expect(metrics.hardConstraintsPassed).toBe(false);
    expect(metrics.hardConstraintViolations.some((v) => v.includes('after the required-by date'))).toBe(true);
  });

  it('rejects expired resources before the required date', () => {
    const expiredResource: ResourceLot = {
      ...baseResource,
      expiryDate: '2026-10-20', // Expires before required date 2026-10-25
    };
    const metrics = evaluateCompatibility(expiredResource, baseRequest);
    expect(metrics.hardConstraintsPassed).toBe(false);
    expect(metrics.hardConstraintViolations.some((v) => v.includes('expires on'))).toBe(true);
  });

  it('rejects resources with 0 available quantity', () => {
    const emptyResource: ResourceLot = {
      ...baseResource,
      availableQuantity: 0,
    };
    const metrics = evaluateCompatibility(emptyResource, baseRequest);
    expect(metrics.hardConstraintsPassed).toBe(false);
    expect(metrics.hardConstraintViolations).toContain('Resource has 0 available uncommitted units.');
  });

  it('calculates accurate Haversine distance in km', () => {
    // Distance between (45.51, -122.68) and (45.52, -122.67) is roughly ~1.3 km
    const dist = calculateDistanceKm(45.51, -122.68, 45.52, -122.67);
    expect(dist).toBeDefined();
    expect(dist).toBeGreaterThan(1);
    expect(dist).toBeLessThan(3);

    // Returns undefined if coordinates are missing
    expect(calculateDistanceKm(undefined, -122.68, 45.52, -122.67)).toBeUndefined();
  });

  it('generates candidate matches sorted descending by score', () => {
    const matches = generateCandidateMatches([baseResource], [baseRequest]);
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].resourceId).toBe(baseResource.id);
    expect(matches[0].requestId).toBe(baseRequest.id);
    expect(matches[0].feasibleQuantity).toBe(50);
  });
});
