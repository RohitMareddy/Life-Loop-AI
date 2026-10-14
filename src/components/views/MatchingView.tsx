import React, { useState } from 'react';
import {
  GitCompare,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Sparkles,
  ArrowRight,
  TrendingUp,
  MapPin,
  Calendar,
  Layers,
  ChevronRight,
  Bot,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { generateCandidateMatches, evaluateCompatibility } from '../../lib/matchingEngine';
import { MatchRecommendation, ResourceLot, CommunityRequest } from '../../types';
import { ProvenanceBadge } from '../ProvenanceBadge';

export const MatchingView: React.FC = () => {
  const { resources, requests, setActiveTab } = useApp();

  const candidateMatches = generateCandidateMatches(resources, requests);
  const [selectedMatch, setSelectedMatch] = useState<MatchRecommendation | null>(
    candidateMatches[0] || null
  );

  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [explanationSource, setExplanationSource] = useState<string | null>(null);

  const matchedResource = selectedMatch
    ? resources.find((r) => r.id === selectedMatch.resourceId)
    : null;
  const matchedRequest = selectedMatch
    ? requests.find((r) => r.id === selectedMatch.requestId)
    : null;

  const handleExplainWithGemini = async () => {
    if (!matchedResource || !matchedRequest || !selectedMatch) return;
    setIsExplaining(true);
    setAiExplanation(null);

    try {
      const response = await fetch('/api/gemini/explain-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resource: matchedResource,
          request: matchedRequest,
          compatibilityMetrics: selectedMatch.metrics,
        }),
      });

      const data = await response.json();
      setAiExplanation(data.explanation || 'No explanation generated.');
      setExplanationSource(data.generatedBy || 'gemini-3.8-flash');
    } catch (err: any) {
      setAiExplanation(
        `Deterministic Evaluation: Score is ${selectedMatch.metrics.overallScore}/100. Category compatibility is ${selectedMatch.metrics.categoryScore}%. Condition '${matchedResource.condition}' meets minimum '${matchedRequest.minAcceptableCondition}'. Available quantity is ${matchedResource.availableQuantity} ${matchedResource.unit}.`
      );
      setExplanationSource('deterministic_fallback');
    } finally {
      setIsExplaining(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E7EB]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono uppercase tracking-wider text-[#176B4D] font-medium bg-[#EEF5F1] px-2 py-0.5 rounded">
              Semantic & Constraint Evaluation
            </span>
            <span className="text-xs text-[#66736A]">· Interpretable 0-100 Scoring</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#17231D]">Smart Matching Engine</h1>
          <p className="text-sm text-[#66736A]">
            Evaluates multi-dimensional compatibility between active inventory and community requests.
          </p>
        </div>

        <button
          onClick={() => setActiveTab('optimizer')}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#176B4D] hover:bg-[#104A36] rounded-lg shadow-xs transition-colors shrink-0"
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Launch Multi-Request Optimizer</span>
        </button>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Candidate Matches List */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-[#E5E7EB] shadow-xs overflow-hidden">
          <div className="p-4 border-b border-[#E5E7EB] bg-[#FBFBFA] flex items-center justify-between">
            <span className="text-xs font-bold text-[#17231D]">
              Candidate Match Pairs ({candidateMatches.length})
            </span>
            <span className="text-[11px] text-[#8A958E]">Ranked by compatibility</span>
          </div>

          <div className="divide-y divide-[#F3F4F6] max-h-[600px] overflow-y-auto">
            {candidateMatches.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#66736A]">
                No active candidate matches generated.
              </div>
            ) : (
              candidateMatches.map((m) => {
                const res = resources.find((r) => r.id === m.resourceId);
                const req = requests.find((r) => r.id === m.requestId);
                const isSelected = selectedMatch?.id === m.id;
                const passed = m.metrics.hardConstraintsPassed;

                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      setSelectedMatch(m);
                      setAiExplanation(null);
                    }}
                    className={`w-full text-left p-4 transition-colors flex items-center justify-between gap-3 ${
                      isSelected ? 'bg-[#EEF5F1] border-l-2 border-[#176B4D]' : 'hover:bg-[#F9FAF8]'
                    }`}
                  >
                    <div className="space-y-1 truncate">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[#17231D] truncate block">
                          {res?.title}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#66736A] flex items-center gap-1.5 truncate">
                        <span>→ {req?.organizationName}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-[#8A958E]">
                        <span>
                          Feasible: {m.feasibleQuantity} {res?.unit}
                        </span>
                        <span>·</span>
                        <span className="capitalize">{res?.category.replace('_', ' ')}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end shrink-0">
                      <span
                        className={`text-sm font-bold font-mono tabular-nums ${
                          passed ? 'text-[#176B4D]' : 'text-rose-700'
                        }`}
                      >
                        {m.metrics.overallScore}
                      </span>
                      <span className="text-[10px] text-[#8A958E]">
                        {passed ? 'Feasible' : 'Blocked'}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Detailed Score Decomposition & AI Explanation */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-[#E5E7EB] shadow-xs p-6 space-y-6">
          {selectedMatch && matchedResource && matchedRequest ? (
            <>
              {/* Pair Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E7EB]">
                <div>
                  <span className="text-xs font-mono uppercase text-[#176B4D] font-medium">
                    Pairing Analysis · {matchedResource.id} ↔ {matchedRequest.id}
                  </span>
                  <h2 className="text-base font-bold text-[#17231D] mt-0.5">
                    {matchedResource.title}
                  </h2>
                  <p className="text-xs text-[#66736A]">
                    Recipient: <strong>{matchedRequest.organizationName}</strong> (
                    {matchedRequest.priorityLevel.toUpperCase()} priority)
                  </p>
                </div>

                <div className="text-right sm:border-l sm:border-[#E5E7EB] sm:pl-4">
                  <span className="text-2xl font-bold font-mono tabular-nums text-[#176B4D]">
                    {selectedMatch.metrics.overallScore}
                  </span>
                  <span className="text-xs text-[#8A958E] block">Overall Score / 100</span>
                </div>
              </div>

              {/* Hard Constraint Invariant Status */}
              <div
                className={`p-3.5 rounded-lg border text-xs flex items-start gap-2.5 ${
                  selectedMatch.metrics.hardConstraintsPassed
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                {selectedMatch.metrics.hardConstraintsPassed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
                )}
                <div className="space-y-0.5">
                  <span className="font-semibold block">
                    {selectedMatch.metrics.hardConstraintsPassed
                      ? 'All Hard Constraints Satisfied'
                      : 'Hard Constraint Violations Detected (Infeasible Pair)'}
                  </span>
                  {selectedMatch.metrics.hardConstraintViolations.length > 0 && (
                    <ul className="list-disc list-inside text-[11px] mt-1 space-y-0.5">
                      {selectedMatch.metrics.hardConstraintViolations.map((v, i) => (
                        <li key={i}>{v}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* 5-Dimension Score Breakdown */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#17231D]">
                    Calculated Factor Breakdown
                  </span>
                  <ProvenanceBadge tag="CALCULATED" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-[#F7F8F4] rounded-lg border border-[#E5E7EB] space-y-1">
                    <div className="flex justify-between font-medium">
                      <span className="text-[#66736A]">Category Alignment</span>
                      <span className="font-mono tabular-nums font-bold text-[#17231D]">
                        {selectedMatch.metrics.categoryScore}%
                      </span>
                    </div>
                    <span className="text-[11px] text-[#8A958E]">
                      {matchedResource.category === matchedRequest.category
                        ? 'Exact match'
                        : 'Substituted match'}
                    </span>
                  </div>

                  <div className="p-3 bg-[#F7F8F4] rounded-lg border border-[#E5E7EB] space-y-1">
                    <div className="flex justify-between font-medium">
                      <span className="text-[#66736A]">Condition Compliance</span>
                      <span className="font-mono tabular-nums font-bold text-[#17231D]">
                        {selectedMatch.metrics.conditionScore}%
                      </span>
                    </div>
                    <span className="text-[11px] text-[#8A958E]">
                      Resource is &lsquo;{matchedResource.condition}&rsquo; (min required &lsquo;
                      {matchedRequest.minAcceptableCondition}&rsquo;)
                    </span>
                  </div>

                  <div className="p-3 bg-[#F7F8F4] rounded-lg border border-[#E5E7EB] space-y-1">
                    <div className="flex justify-between font-medium">
                      <span className="text-[#66736A]">Quantity Feasibility</span>
                      <span className="font-mono tabular-nums font-bold text-[#17231D]">
                        {selectedMatch.metrics.quantityScore}%
                      </span>
                    </div>
                    <span className="text-[11px] text-[#8A958E]">
                      {matchedResource.availableQuantity} available vs {matchedRequest.outstandingQuantity} needed
                    </span>
                  </div>

                  <div className="p-3 bg-[#F7F8F4] rounded-lg border border-[#E5E7EB] space-y-1">
                    <div className="flex justify-between font-medium">
                      <span className="text-[#66736A]">Timing & Availability</span>
                      <span className="font-mono tabular-nums font-bold text-[#17231D]">
                        {selectedMatch.metrics.timingScore}%
                      </span>
                    </div>
                    <span className="text-[11px] text-[#8A958E]">
                      Available until {matchedResource.availableUntil || 'ongoing'} · Needed by{' '}
                      {matchedRequest.requiredByDate}
                    </span>
                  </div>
                </div>
              </div>

              {/* Grounded AI Explanation Section */}
              <div className="p-4 bg-[#F9FAF8] rounded-xl border border-[#E5E7EB] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-[#176B4D]" />
                    <span className="text-xs font-bold text-[#17231D]">
                      Grounded AI Match Explanation
                    </span>
                  </div>
                  {explanationSource && (
                    <span className="text-[10px] font-mono text-[#8A958E]">
                      Source: {explanationSource}
                    </span>
                  )}
                </div>

                {aiExplanation ? (
                  <div className="text-xs text-[#2A3B30] leading-relaxed bg-white p-3.5 rounded-lg border border-[#E5E7EB] whitespace-pre-line">
                    {aiExplanation}
                  </div>
                ) : (
                  <p className="text-xs text-[#66736A]">
                    Generate an objective, fact-checked explanation connecting the deterministic
                    factors to recipient needs without invented claims.
                  </p>
                )}

                <button
                  onClick={handleExplainWithGemini}
                  disabled={isExplaining}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#176B4D] bg-[#F0F6F2] hover:bg-[#E2EDE5] rounded-lg border border-[#D1E3D7] transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isExplaining ? 'Analyzing with Gemini...' : 'Explain Match with AI'}</span>
                </button>
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-xs text-[#66736A]">
              Select a candidate match pair from the left panel to inspect detailed compatibility.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
