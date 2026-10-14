import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  ResourceLot,
  CommunityRequest,
  DistributionRecord,
  AuditLogEntry,
  AllocationPlan,
  OptimizationConfig,
  DistributionStatus,
} from '../types';
import {
  INITIAL_RESOURCES,
  INITIAL_REQUESTS,
  INITIAL_DISTRIBUTIONS,
  INITIAL_AUDIT_LOGS,
} from '../data/initialData';
import { runOptimization } from '../lib/impactOptimizer';

interface AppContextType {
  resources: ResourceLot[];
  requests: CommunityRequest[];
  distributions: DistributionRecord[];
  auditLogs: AuditLogEntry[];
  activePlan: AllocationPlan | null;
  plansHistory: AllocationPlan[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  tourStep: number | null;
  setTourStep: (step: number | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Actions
  addResource: (res: Partial<ResourceLot>) => ResourceLot;
  updateResource: (id: string, updates: Partial<ResourceLot>) => void;
  archiveResource: (id: string) => void;

  addRequest: (req: Partial<CommunityRequest>) => CommunityRequest;
  updateRequest: (id: string, updates: Partial<CommunityRequest>) => void;
  cancelRequest: (id: string) => void;

  generatePlan: (config: OptimizationConfig) => AllocationPlan;
  approvePlan: (planId: string) => boolean;

  updateDistributionStatus: (
    id: string,
    status: DistributionStatus,
    notes?: string,
    evidence?: string
  ) => void;
  recordPartialDelivery: (id: string, deliveredQty: number, notes?: string) => void;

  resetDemoData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  RESOURCES: 'lifeloop_resources_v1',
  REQUESTS: 'lifeloop_requests_v1',
  DISTRIBUTIONS: 'lifeloop_distributions_v1',
  LOGS: 'lifeloop_audit_logs_v1',
  ACTIVE_PLAN: 'lifeloop_active_plan_v1',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [resources, setResources] = useState<ResourceLot[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.RESOURCES);
      return saved ? JSON.parse(saved) : INITIAL_RESOURCES;
    } catch {
      return INITIAL_RESOURCES;
    }
  });

  const [requests, setRequests] = useState<CommunityRequest[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.REQUESTS);
      return saved ? JSON.parse(saved) : INITIAL_REQUESTS;
    } catch {
      return INITIAL_REQUESTS;
    }
  });

  const [distributions, setDistributions] = useState<DistributionRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DISTRIBUTIONS);
      return saved ? JSON.parse(saved) : INITIAL_DISTRIBUTIONS;
    } catch {
      return INITIAL_DISTRIBUTIONS;
    }
  });

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LOGS);
      return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
    } catch {
      return INITIAL_AUDIT_LOGS;
    }
  });

  const [activePlan, setActivePlan] = useState<AllocationPlan | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_PLAN);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [plansHistory, setPlansHistory] = useState<AllocationPlan[]>([]);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [tourStep, setTourStep] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Persist state changes safely
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.RESOURCES, JSON.stringify(resources));
    } catch (e) {
      console.warn('Storage quota or error saving resources', e);
    }
  }, [resources]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(requests));
    } catch (e) {
      console.warn('Storage quota or error saving requests', e);
    }
  }, [requests]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.DISTRIBUTIONS, JSON.stringify(distributions));
    } catch (e) {
      console.warn('Storage quota or error saving distributions', e);
    }
  }, [distributions]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(auditLogs));
    } catch (e) {
      console.warn('Storage quota or error saving audit logs', e);
    }
  }, [auditLogs]);

  useEffect(() => {
    try {
      if (activePlan) {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_PLAN, JSON.stringify(activePlan));
      }
    } catch (e) {
      console.warn('Storage quota or error saving plan', e);
    }
  }, [activePlan]);

  const addResource = (res: Partial<ResourceLot>): ResourceLot => {
    const qty = Math.max(1, Number(res.quantity) || 1);
    const newLot: ResourceLot = {
      id: `res-${Date.now()}`,
      title: res.title || 'Untitled Resource Lot',
      category: res.category || 'stationery',
      description: res.description || '',
      quantity: qty,
      availableQuantity: qty,
      committedQuantity: 0,
      distributedQuantity: 0,
      unit: res.unit || 'items',
      condition: res.condition || 'good',
      availableFrom: res.availableFrom || new Date().toISOString().split('T')[0],
      availableUntil: res.availableUntil,
      expiryDate: res.expiryDate,
      storageRequirements: res.storageRequirements,
      pickupLocation: res.pickupLocation || 'Community Warehouse, Main St',
      coordinates: res.coordinates,
      donorOrganization: res.donorOrganization || 'Community Donor',
      donorContact: res.donorContact,
      permittedRecipientTypes: res.permittedRecipientTypes || [
        'school',
        'community_learning_center',
        'nonprofit',
        'library',
        'community_center',
      ],
      restrictions: res.restrictions,
      estimatedReuseValue: Number(res.estimatedReuseValue) || 100,
      estimatedWeightKg: Number(res.estimatedWeightKg) || 10,
      status: res.condition === 'unsuitable' ? 'unsuitable' : 'available',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      imageUrl: res.imageUrl,
      verificationStatus: res.verificationStatus || 'unverified',
      source: res.source || 'manual',
    };

    setResources((prev) => [newLot, ...prev]);

    // Append audit log
    const log: AuditLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'RESOURCE_CREATED',
      entityType: 'resource',
      entityId: newLot.id,
      newState: newLot.status,
      actor: newLot.donorOrganization,
      notes: `Added ${newLot.quantity} ${newLot.unit} of '${newLot.title}' (${newLot.condition}).`,
    };
    setAuditLogs((prev) => [log, ...prev]);

    return newLot;
  };

  const updateResource = (id: string, updates: Partial<ResourceLot>) => {
    setResources((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const updated = {
          ...r,
          ...updates,
          updatedAt: new Date().toISOString(),
        };
        // Ensure status reflects available quantity
        if (updated.availableQuantity <= 0 && updated.status === 'available') {
          updated.status = 'exhausted';
        } else if (updated.availableQuantity > 0 && updated.status === 'exhausted') {
          updated.status = 'available';
        }
        return updated;
      })
    );
  };

  const archiveResource = (id: string) => {
    updateResource(id, { status: 'archived' });
    const log: AuditLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'RESOURCE_ARCHIVED',
      entityType: 'resource',
      entityId: id,
      newState: 'archived',
      actor: 'Community Coordinator',
      notes: 'Archived resource from active circulation.',
    };
    setAuditLogs((prev) => [log, ...prev]);
  };

  const addRequest = (req: Partial<CommunityRequest>): CommunityRequest => {
    const qty = Math.max(1, Number(req.requestedQuantity) || 1);
    const newReq: CommunityRequest = {
      id: `req-${Date.now()}`,
      organizationName: req.organizationName || 'Community Recipient',
      organizationType: req.organizationType || 'school',
      category: req.category || 'stationery',
      requestedItems: req.requestedItems || 'Essential supplies',
      requestedQuantity: qty,
      fulfilledQuantity: 0,
      outstandingQuantity: qty,
      unit: req.unit || 'items',
      minAcceptableCondition: req.minAcceptableCondition || 'used_functional',
      requiredByDate: req.requiredByDate || new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0],
      location: req.location || 'Greenfield District',
      coordinates: req.coordinates,
      storageOrDeliveryConstraints: req.storageOrDeliveryConstraints,
      permittedSubstitutions: Boolean(req.permittedSubstitutions),
      intendedUse: req.intendedUse || 'Community support',
      priorityLevel: req.priorityLevel || 'medium',
      priorityExplanation: req.priorityExplanation || 'Standard educational program need',
      verificationStatus: req.verificationStatus || 'pending_verification',
      status: 'open',
      createdAt: new Date().toISOString(),
      supportingNotes: req.supportingNotes,
    };

    setRequests((prev) => [newReq, ...prev]);

    const log: AuditLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'REQUEST_CREATED',
      entityType: 'request',
      entityId: newReq.id,
      newState: 'open',
      actor: newReq.organizationName,
      notes: `Submitted request for ${newReq.requestedQuantity} ${newReq.unit} (${newReq.priorityLevel} priority).`,
    };
    setAuditLogs((prev) => [log, ...prev]);

    return newReq;
  };

  const updateRequest = (id: string, updates: Partial<CommunityRequest>) => {
    setRequests((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const updated = { ...r, ...updates };
        if (updated.outstandingQuantity <= 0) {
          updated.status = 'fulfilled';
        }
        return updated;
      })
    );
  };

  const cancelRequest = (id: string) => {
    updateRequest(id, { status: 'cancelled' });
    const log: AuditLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'REQUEST_CANCELLED',
      entityType: 'request',
      entityId: id,
      newState: 'cancelled',
      actor: 'Community Coordinator',
      notes: 'Cancelled community request.',
    };
    setAuditLogs((prev) => [log, ...prev]);
  };

  const generatePlan = (config: OptimizationConfig): AllocationPlan => {
    const plan = runOptimization(resources, requests, config);
    setActivePlan(plan);
    setPlansHistory((prev) => [plan, ...prev]);

    const log: AuditLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'OPTIMIZATION_PLAN_GENERATED',
      entityType: 'plan',
      entityId: plan.id,
      newState: 'draft',
      actor: 'Constraint-Aware Impact Optimizer',
      notes: `Generated draft with ${plan.proposedAllocations.length} pairings under strategy '${config.strategy}'.`,
    };
    setAuditLogs((prev) => [log, ...prev]);

    return plan;
  };

  const approvePlan = (planId: string): boolean => {
    const targetPlan = activePlan?.id === planId ? activePlan : plansHistory.find((p) => p.id === planId);
    if (!targetPlan || targetPlan.status === 'approved') return false;

    // Strict constraint re-verification against latest real inventory
    for (const alloc of targetPlan.proposedAllocations) {
      const res = resources.find((r) => r.id === alloc.resourceId);
      if (!res || res.availableQuantity < alloc.allocatedQuantity) {
        alert(
          `Cannot approve plan: Resource '${alloc.resourceTitle}' only has ${res?.availableQuantity ?? 0} available units, but allocation requests ${alloc.allocatedQuantity}.`
        );
        return false;
      }
    }

    // Apply inventory deductions and request status updates
    setResources((prev) =>
      prev.map((res) => {
        const allocsForRes = targetPlan.proposedAllocations.filter((a) => a.resourceId === res.id);
        if (allocsForRes.length === 0) return res;

        const totalAllocated = allocsForRes.reduce((sum, a) => sum + a.allocatedQuantity, 0);
        const newAvailable = Math.max(0, res.availableQuantity - totalAllocated);
        const newCommitted = res.committedQuantity + totalAllocated;

        return {
          ...res,
          availableQuantity: newAvailable,
          committedQuantity: newCommitted,
          status: newAvailable === 0 ? 'exhausted' : 'partially_allocated',
          updatedAt: new Date().toISOString(),
        };
      })
    );

    setRequests((prev) =>
      prev.map((req) => {
        const allocsForReq = targetPlan.proposedAllocations.filter((a) => a.requestId === req.id);
        if (allocsForReq.length === 0) return req;

        const totalAllocated = allocsForReq.reduce((sum, a) => sum + a.allocatedQuantity, 0);
        const newFulfilled = req.fulfilledQuantity + totalAllocated;
        const newOutstanding = Math.max(0, req.requestedQuantity - newFulfilled);

        return {
          ...req,
          fulfilledQuantity: newFulfilled,
          outstandingQuantity: newOutstanding,
          status: newOutstanding === 0 ? 'approved' : 'partially_matched',
        };
      })
    );

    // Create corresponding Distribution Records
    const newDistributions: DistributionRecord[] = targetPlan.proposedAllocations.map((alloc) => {
      const res = resources.find((r) => r.id === alloc.resourceId);
      const req = requests.find((r) => r.id === alloc.requestId);
      return {
        id: `dist-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        allocationId: alloc.id,
        planId: targetPlan.id,
        resourceId: alloc.resourceId,
        requestId: alloc.requestId,
        resourceTitle: alloc.resourceTitle,
        recipientName: alloc.recipientName,
        quantity: alloc.allocatedQuantity,
        unit: alloc.unit,
        deliveryMethod: 'coordinator_dropoff',
        pickupLocation: res?.pickupLocation || 'Community Depot',
        destination: req?.location || 'Recipient Facility',
        scheduledDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
        coordinator: 'Sarah Jenkins (Lead Volunteer Coordinator)',
        status: 'awaiting_scheduling',
        notes: `Reserved via approved plan '${targetPlan.title}'.`,
        updatedAt: new Date().toISOString(),
      };
    });

    setDistributions((prev) => [...newDistributions, ...prev]);

    // Mark plan approved
    const updatedPlan: AllocationPlan = {
      ...targetPlan,
      status: 'approved',
      approvedAt: new Date().toISOString(),
    };
    setActivePlan(updatedPlan);
    setPlansHistory((prev) => prev.map((p) => (p.id === planId ? updatedPlan : p)));

    const log: AuditLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'PLAN_APPROVED_RESERVATIONS_COMMITTED',
      entityType: 'plan',
      entityId: targetPlan.id,
      newState: 'approved',
      actor: 'Sarah Jenkins (Coordinator)',
      notes: `Approved plan with ${targetPlan.proposedAllocations.length} allocations. Created ${newDistributions.length} scheduled distributions.`,
    };
    setAuditLogs((prev) => [log, ...prev]);

    return true;
  };

  const updateDistributionStatus = (
    id: string,
    status: DistributionStatus,
    notes?: string,
    evidence?: string
  ) => {
    setDistributions((prev) =>
      prev.map((d) => {
        if (d.id !== id) return d;
        const updated: DistributionRecord = {
          ...d,
          status,
          notes: notes !== undefined ? notes : d.notes,
          confirmationEvidence: evidence !== undefined ? evidence : d.confirmationEvidence,
          completedDate: status === 'delivered' || status === 'verified' ? new Date().toISOString() : d.completedDate,
          updatedAt: new Date().toISOString(),
        };

        // When delivered or verified, commit to distributedQuantity on the resource
        if (status === 'delivered' || status === 'verified') {
          setResources((resList) =>
            resList.map((r) => {
              if (r.id !== d.resourceId) return r;
              return {
                ...r,
                distributedQuantity: r.distributedQuantity + d.quantity,
                committedQuantity: Math.max(0, r.committedQuantity - d.quantity),
              };
            })
          );
        }

        return updated;
      })
    );

    const log: AuditLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'DISTRIBUTION_STATUS_UPDATED',
      entityType: 'distribution',
      entityId: id,
      newState: status,
      actor: 'Coordinator',
      notes: notes || `Updated distribution status to ${status}.`,
    };
    setAuditLogs((prev) => [log, ...prev]);
  };

  const recordPartialDelivery = (id: string, deliveredQty: number, notes?: string) => {
    setDistributions((prev) =>
      prev.map((d) => {
        if (d.id !== id) return d;
        const safeDelivered = Math.min(d.quantity, Math.max(1, deliveredQty));
        const shortfall = d.quantity - safeDelivered;

        // Return shortfall back to available inventory
        if (shortfall > 0) {
          setResources((resList) =>
            resList.map((r) => {
              if (r.id !== d.resourceId) return r;
              return {
                ...r,
                availableQuantity: r.availableQuantity + shortfall,
                committedQuantity: Math.max(0, r.committedQuantity - shortfall),
                status: 'available',
              };
            })
          );
          // And restore shortfall to request outstanding quantity
          setRequests((reqList) =>
            reqList.map((req) => {
              if (req.id !== d.requestId) return req;
              return {
                ...req,
                outstandingQuantity: req.outstandingQuantity + shortfall,
                fulfilledQuantity: Math.max(0, req.fulfilledQuantity - shortfall),
                status: 'partially_fulfilled',
              };
            })
          );
        }

        return {
          ...d,
          quantity: safeDelivered,
          status: 'delivered',
          completedDate: new Date().toISOString(),
          discrepancies: shortfall > 0 ? `Delivered ${safeDelivered} of ${d.quantity} (shortfall of ${shortfall} restored to inventory)` : undefined,
          notes: notes || d.notes,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  const resetDemoData = () => {
    setResources(INITIAL_RESOURCES);
    setRequests(INITIAL_REQUESTS);
    setDistributions(INITIAL_DISTRIBUTIONS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setActivePlan(null);
    setPlansHistory([]);

    try {
      localStorage.removeItem(STORAGE_KEYS.RESOURCES);
      localStorage.removeItem(STORAGE_KEYS.REQUESTS);
      localStorage.removeItem(STORAGE_KEYS.DISTRIBUTIONS);
      localStorage.removeItem(STORAGE_KEYS.LOGS);
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_PLAN);
    } catch (e) {
      console.warn('Error clearing localStorage', e);
    }
  };

  return (
    <AppContext.Provider
      value={{
        resources,
        requests,
        distributions,
        auditLogs,
        activePlan,
        plansHistory,
        activeTab,
        setActiveTab,
        tourStep,
        setTourStep,
        searchQuery,
        setSearchQuery,
        addResource,
        updateResource,
        archiveResource,
        addRequest,
        updateRequest,
        cancelRequest,
        generatePlan,
        approvePlan,
        updateDistributionStatus,
        recordPartialDelivery,
        resetDemoData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
