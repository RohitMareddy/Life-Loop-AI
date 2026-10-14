import {
  ResourceLot,
  CommunityRequest,
  CompatibilityMetrics,
  MatchRecommendation,
  ResourceCondition,
} from '../types';

export const CONDITION_RANK: Record<ResourceCondition, number> = {
  unsuitable: 0,
  requires_inspection: 1,
  used_functional: 2,
  good: 3,
  new: 4,
};

// Haversine distance in km
export function calculateDistanceKm(
  lat1?: number,
  lon1?: number,
  lat2?: number,
  lon2?: number
): number | undefined {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) {
    return undefined;
  }
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export function evaluateCompatibility(
  resource: ResourceLot,
  request: CommunityRequest
): CompatibilityMetrics {
  const violations: string[] = [];
  const warnings: string[] = [];
  const assumptions: string[] = [];

  // 1. Hard Constraint: Unsuitable status or condition
  if (resource.condition === 'unsuitable' || resource.status === 'unsuitable') {
    violations.push('Resource is marked unsuitable for redistribution.');
  }

  // 2. Hard Constraint: Available inventory > 0
  if (resource.availableQuantity <= 0) {
    violations.push('Resource has 0 available uncommitted units.');
  }

  // 3. Hard Constraint: Category match
  let categoryScore = 0;
  if (resource.category === request.category) {
    categoryScore = 100;
  } else {
    // If request allows substitutions and categories are closely adjacent
    if (
      request.permittedSubstitutions &&
      ((resource.category === 'stationery' && request.category === 'books_education') ||
        (resource.category === 'books_education' && request.category === 'stationery'))
    ) {
      categoryScore = 65;
      warnings.push('Cross-category substitution permitted by recipient.');
    } else {
      violations.push(`Category mismatch: Resource is '${resource.category}' while request needs '${request.category}'.`);
    }
  }

  // 4. Hard Constraint: Condition compliance
  const resCondRank = CONDITION_RANK[resource.condition];
  const reqCondRank = CONDITION_RANK[request.minAcceptableCondition];
  let conditionScore = 0;

  if (resource.condition === 'requires_inspection') {
    conditionScore = 40;
    warnings.push('Resource requires physical inspection before delivery.');
    assumptions.push('Coordinator must verify condition passes inspection before dispatch.');
  } else if (resCondRank >= reqCondRank) {
    conditionScore = 70 + (resCondRank - reqCondRank) * 10;
  } else {
    violations.push(
      `Condition '${resource.condition}' does not satisfy minimum required condition '${request.minAcceptableCondition}'.`
    );
  }

  // 5. Hard Constraint: Recipient eligibility
  if (
    resource.permittedRecipientTypes &&
    resource.permittedRecipientTypes.length > 0 &&
    !resource.permittedRecipientTypes.includes(request.organizationType)
  ) {
    violations.push(
      `Donor restriction: '${request.organizationType}' is not among permitted recipient types for this lot.`
    );
  }

  // 6. Timing & Expiry Constraints
  let timingScore = 80;
  const reqDate = new Date(request.requiredByDate).getTime();
  const resFrom = new Date(resource.availableFrom).getTime();

  if (!isNaN(resFrom) && !isNaN(reqDate) && resFrom > reqDate) {
    violations.push(
      `Resource is not available until ${resource.availableFrom}, which is after the required-by date ${request.requiredByDate}.`
    );
  }

  if (resource.expiryDate) {
    const expDate = new Date(resource.expiryDate).getTime();
    if (!isNaN(expDate) && !isNaN(reqDate) && expDate < reqDate) {
      violations.push(`Resource expires on ${resource.expiryDate}, before the needed date ${request.requiredByDate}.`);
    }
  }

  if (resource.availableUntil) {
    const untilDate = new Date(resource.availableUntil).getTime();
    if (!isNaN(untilDate) && !isNaN(reqDate)) {
      if (untilDate < reqDate) {
        warnings.push('Resource pickup window closes before required-by date; early collection needed.');
        timingScore = Math.max(30, timingScore - 30);
      } else {
        timingScore = 95;
      }
    }
  }

  // 7. Quantity Feasibility
  let quantityScore = 0;
  const needed = request.outstandingQuantity;
  const avail = resource.availableQuantity;

  if (avail >= needed) {
    quantityScore = 100;
  } else if (avail > 0) {
    // Partial fulfillment
    const ratio = avail / needed;
    quantityScore = Math.round(50 + ratio * 40);
    warnings.push(`Partial fulfillment only: ${avail} / ${needed} ${request.unit} available.`);
  }

  // 8. Location & Distance Compatibility
  let locationScore = 75; // Default neutral when coordinates missing
  const distance = calculateDistanceKm(
    resource.coordinates?.lat,
    resource.coordinates?.lng,
    request.coordinates?.lat,
    request.coordinates?.lng
  );

  if (distance !== undefined) {
    if (distance <= 5) {
      locationScore = 100;
    } else if (distance <= 15) {
      locationScore = 85;
    } else if (distance <= 30) {
      locationScore = 65;
      warnings.push(`Moderate transit distance (${distance} km).`);
    } else {
      locationScore = 40;
      warnings.push(`Longer transit distance (${distance} km); transport assistance recommended.`);
    }
  } else {
    assumptions.push('Coordinates not provided for both locations; distance assumed feasible.');
  }

  // Check unit compatibility
  const normResUnit = resource.unit.toLowerCase().trim();
  const normReqUnit = request.unit.toLowerCase().trim();
  if (normResUnit !== normReqUnit && !request.permittedSubstitutions) {
    warnings.push(`Unit difference: Resource is measured in '${resource.unit}', request in '${request.unit}'.`);
  }

  const hardConstraintsPassed = violations.length === 0;

  // Composite overall score
  // If hard constraints fail, cap score at 20 or less
  let overallScore = 0;
  if (hardConstraintsPassed) {
    overallScore = Math.round(
      categoryScore * 0.3 +
        conditionScore * 0.25 +
        quantityScore * 0.2 +
        timingScore * 0.15 +
        locationScore * 0.1
    );
    overallScore = Math.min(100, Math.max(0, overallScore));
  } else {
    overallScore = Math.min(25, Math.round(categoryScore * 0.2));
  }

  return {
    overallScore,
    categoryScore,
    conditionScore,
    quantityScore,
    timingScore,
    locationScore,
    hardConstraintsPassed,
    hardConstraintViolations: violations,
    warnings,
    unresolvedAssumptions: assumptions,
  };
}

export function generateCandidateMatches(
  resources: ResourceLot[],
  requests: CommunityRequest[]
): MatchRecommendation[] {
  const matches: MatchRecommendation[] = [];

  for (const resource of resources) {
    if (resource.status === 'exhausted' || resource.status === 'archived') continue;
    for (const request of requests) {
      if (request.status === 'fulfilled' || request.status === 'closed' || request.status === 'cancelled') continue;

      const metrics = evaluateCompatibility(resource, request);
      const feasibleQuantity = Math.min(resource.availableQuantity, request.outstandingQuantity);

      // Only include matches that have reasonable score or pass hard constraints
      if (metrics.overallScore >= 35 || metrics.hardConstraintsPassed) {
        matches.push({
          id: `match-${resource.id}-${request.id}`,
          resourceId: resource.id,
          requestId: request.id,
          metrics,
          feasibleQuantity,
          generatedAt: new Date().toISOString(),
        });
      }
    }
  }

  // Sort descending by overallScore
  return matches.sort((a, b) => b.metrics.overallScore - a.metrics.overallScore);
}
