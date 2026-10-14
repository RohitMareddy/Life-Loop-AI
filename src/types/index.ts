export type ResourceCategory =
  | 'books_education'
  | 'stationery'
  | 'furniture'
  | 'household_supplies'
  | 'non_perishable'
  | 'digital_devices';

export type ResourceCondition =
  | 'new'
  | 'good'
  | 'used_functional'
  | 'requires_inspection'
  | 'unsuitable';

export type OrganizationType =
  | 'school'
  | 'community_learning_center'
  | 'nonprofit'
  | 'library'
  | 'community_center'
  | 'youth_club';

export type RequestPriority = 'low' | 'medium' | 'high' | 'urgent';

export type RequestStatus =
  | 'open'
  | 'partially_matched'
  | 'awaiting_approval'
  | 'approved'
  | 'partially_fulfilled'
  | 'fulfilled'
  | 'closed'
  | 'cancelled';

export type ResourceStatus =
  | 'available'
  | 'partially_allocated'
  | 'exhausted'
  | 'unsuitable'
  | 'archived';

export type VerificationStatus =
  | 'verified'
  | 'pending_verification'
  | 'unverified'
  | 'pending_inspection';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface ResourceLot {
  id: string;
  title: string;
  category: ResourceCategory;
  description: string;
  quantity: number; // initial
  availableQuantity: number; // current uncommitted
  committedQuantity: number; // approved in plans
  distributedQuantity: number; // distributed
  unit: string;
  condition: ResourceCondition;
  availableFrom: string; // ISO date
  availableUntil?: string; // ISO date
  expiryDate?: string;
  storageRequirements?: string;
  pickupLocation: string;
  coordinates?: Coordinates;
  donorOrganization: string;
  donorContact?: string;
  permittedRecipientTypes: OrganizationType[];
  restrictions?: string;
  estimatedReuseValue: number; // USD
  estimatedWeightKg?: number;
  status: ResourceStatus;
  createdAt: string;
  updatedAt: string;
  imageUrl?: string;
  verificationStatus: VerificationStatus;
  source: 'manual' | 'ai_extracted';
}

export interface CommunityRequest {
  id: string;
  organizationName: string;
  organizationType: OrganizationType;
  category: ResourceCategory;
  requestedItems: string;
  requestedQuantity: number;
  fulfilledQuantity: number;
  outstandingQuantity: number;
  unit: string;
  minAcceptableCondition: ResourceCondition;
  requiredByDate: string; // ISO date
  location: string;
  coordinates?: Coordinates;
  storageOrDeliveryConstraints?: string;
  permittedSubstitutions: boolean;
  intendedUse: string;
  priorityLevel: RequestPriority;
  priorityExplanation: string;
  verificationStatus: VerificationStatus;
  status: RequestStatus;
  createdAt: string;
  supportingNotes?: string;
}

export interface CompatibilityMetrics {
  overallScore: number; // 0-100
  categoryScore: number;
  quantityScore: number;
  timingScore: number;
  conditionScore: number;
  locationScore: number;
  hardConstraintsPassed: boolean;
  hardConstraintViolations: string[];
  warnings: string[];
  unresolvedAssumptions: string[];
}

export interface MatchRecommendation {
  id: string;
  resourceId: string;
  requestId: string;
  metrics: CompatibilityMetrics;
  feasibleQuantity: number;
  aiExplanation?: string;
  generatedAt: string;
}

export type OptimizationStrategy =
  | 'maximize_fulfillment'
  | 'prioritize_urgency'
  | 'balanced_fairness'
  | 'minimize_distance';

export interface OptimizationConfig {
  strategy: OptimizationStrategy;
  urgencyWeight: number; // 0 - 1
  fairnessWeight: number; // 0 - 1
  distanceWeight: number; // 0 - 1
  minAllocationThreshold: number; // e.g. min 5 items per request
  enforceVerifiedOnly: boolean;
}

export interface ProposedAllocation {
  id: string;
  resourceId: string;
  requestId: string;
  resourceTitle: string;
  recipientName: string;
  category: ResourceCategory;
  allocatedQuantity: number;
  unit: string;
  priorityContribution: number;
  distanceKm?: number;
  compatibilityScore: number;
  tradeOffNote: string;
  unresolvedAssumptions: string[];
}

export interface UnmetRequestReport {
  requestId: string;
  organizationName: string;
  requestedQuantity: number;
  unmetQuantity: number;
  unit: string;
  reason:
    | 'insufficient_inventory'
    | 'no_compatible_category'
    | 'condition_mismatch'
    | 'timing_conflict'
    | 'ineligible_recipient'
    | 'verification_pending'
    | 'unit_mismatch';
  details: string;
}

export interface UnallocatedResourceReport {
  resourceId: string;
  title: string;
  remainingQuantity: number;
  unit: string;
  reason:
    | 'demand_satisfied'
    | 'condition_unsuitable'
    | 'no_matching_requests'
    | 'quantity_surplus'
    | 'timing_mismatch';
}

export interface AllocationPlan {
  id: string;
  title: string;
  strategy: OptimizationStrategy;
  config: OptimizationConfig;
  proposedAllocations: ProposedAllocation[];
  unmetRequests: UnmetRequestReport[];
  unallocatedResources: UnallocatedResourceReport[];
  totalQuantityAllocated: number;
  totalRequestsFulfilledCount: number;
  totalRequestsPartialCount: number;
  totalRequestsUnmetCount: number;
  resourceUtilizationRate: number; // 0 - 100%
  fairnessGiniIndex: number; // 0 (perfectly fair) to 1 (monopolized)
  averageEstimatedDistanceKm: number;
  constraintViolationsCount: number;
  status: 'draft' | 'awaiting_review' | 'approved' | 'superseded' | 'cancelled';
  createdAt: string;
  approvedAt?: string;
  summaryExplanation: string;
}

export type DistributionStatus =
  | 'awaiting_scheduling'
  | 'scheduled'
  | 'in_transit'
  | 'delivered'
  | 'awaiting_verification'
  | 'verified'
  | 'cancelled';

export interface DistributionRecord {
  id: string;
  allocationId: string;
  planId: string;
  resourceId: string;
  requestId: string;
  resourceTitle: string;
  recipientName: string;
  quantity: number;
  unit: string;
  deliveryMethod: 'pickup_by_recipient' | 'coordinator_dropoff' | 'community_courier';
  pickupLocation: string;
  destination: string;
  scheduledDate?: string;
  completedDate?: string;
  coordinator: string;
  status: DistributionStatus;
  notes?: string;
  confirmationEvidence?: string;
  verificationNotes?: string;
  discrepancies?: string;
  updatedAt: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  entityType: 'resource' | 'request' | 'plan' | 'distribution';
  entityId: string;
  previousState?: string;
  newState: string;
  actor: string;
  notes?: string;
}

export type ProvenanceTag =
  | 'USER_PROVIDED'
  | 'AI_EXTRACTED'
  | 'CALCULATED'
  | 'INFERRED'
  | 'REQUIRES_VERIFICATION';
