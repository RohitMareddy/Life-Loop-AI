import React from 'react';
import { X, ArrowRight, ArrowLeft, CheckCircle2, Sparkles, TrendingUp, Sliders, BarChart3, Boxes } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const EvaluatorTourModal: React.FC = () => {
  const { tourStep, setTourStep, setActiveTab } = useApp();

  if (tourStep === null) return null;

  const steps = [
    {
      title: 'Step 1: The Community Resource Dilemma',
      badge: 'Context & Invariants',
      icon: Boxes,
      targetTab: 'overview',
      description:
        'In Greenfield Community Network, schools and community learning centers urgently need stationery, books, and furniture. However, supply is finite: 55 notebooks and 50 writing kits cannot simultaneously fulfill 135 requested units. How should resources be allocated fairly and feasibly?',
      highlight:
        'Notice the four distinct metric categories on the command center: Available, Requested, Matched, and Redistributed. Units are never blindly combined.',
      actionText: 'Next: Explore AI Smart Intake',
    },
    {
      title: 'Step 2: AI-Powered Smart Resource Intake',
      badge: 'Generative Extraction',
      icon: Sparkles,
      targetTab: 'intake',
      description:
        'Donors frequently describe surplus resources in messy natural language (e.g., "We have 60 notebooks, 35 pen boxes, and desks available until Friday"). LIFELOOP uses Gemini 3.8 Flash to extract structured schema items without fabricating addresses or safety claims.',
      highlight:
        'The donor retains full human review over extracted condition, quantities, and ambiguities before committing to inventory.',
      actionText: 'Next: Inspect Smart Matching',
    },
    {
      title: 'Step 3: Deterministic Semantic Matching',
      badge: 'Constraint-Aware Scoring',
      icon: CheckCircle2,
      targetTab: 'matching',
      description:
        'Matching does not guess with an LLM. It calculates deterministic compatibility across 6 dimensions: category compatibility, quantity feasibility, condition compliance, availability timing, and recipient eligibility.',
      highlight:
        'Hard constraints (such as moisture-damaged items or expired lots) are strictly blocked with 0 score, while Gemini explains the verifiable reasons.',
      actionText: 'Next: Launch Impact Optimizer',
    },
    {
      title: 'Step 4: The Impact Optimizer Engine',
      badge: 'Core Signature Engine',
      icon: TrendingUp,
      targetTab: 'optimizer',
      description:
        'This is the central differentiator. Rather than simple 1-to-1 pairings, the optimizer solves a multi-organization bipartite network under hard capacity limits. You can switch between Maximize Fulfillment, Prioritize Urgency, and Balanced Fairness.',
      highlight:
        'Inspect unmet requests to see mathematically proven reasons (e.g. zero compatible inventory vs condition mismatch).',
      actionText: 'Next: Run What-If Simulation',
    },
    {
      title: 'Step 5: Interactive What-If Simulation',
      badge: 'Scenario Stress Testing',
      icon: Sliders,
      targetTab: 'simulator',
      description:
        'Evaluators can adjust supply quantities, tighten deadlines, inject new donations, or change fairness weights to witness genuine mathematical recalculations in real time.',
      highlight:
        'Notice how the before-and-after comparison highlights exactly which school gains or loses allocations under shifting constraints.',
      actionText: 'Next: Inspect Verifiable Impact',
    },
    {
      title: 'Step 6: Verifiable Impact Observatory',
      badge: 'Honest Carbon & Waste Accounting',
      icon: BarChart3,
      targetTab: 'observatory',
      description:
        'Unlike platforms that fabricate speculative carbon offsets, LIFELOOP rigorously distinguishes Proposed Impact, Approved Reservations, Recorded Distributions, and Independently Verified Outcomes with stamped receipts.',
      highlight:
        'Avoided waste is calculated strictly using physical kilogram baselines from delivered lots.',
      actionText: 'Finish Walkthrough',
    },
  ];

  const current = steps[tourStep] || steps[0];
  const StepIcon = current.icon;

  const handleNext = () => {
    if (tourStep < steps.length - 1) {
      const nextStep = tourStep + 1;
      setTourStep(nextStep);
      setActiveTab(steps[nextStep].targetTab);
    } else {
      setTourStep(null);
    }
  };

  const handlePrev = () => {
    if (tourStep > 0) {
      const prevStep = tourStep - 1;
      setTourStep(prevStep);
      setActiveTab(steps[prevStep].targetTab);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full border border-[#E5E7EB] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header Strip */}
        <div className="bg-[#176B4D] text-white p-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
              <StepIcon className="w-5 h-5 text-[#B9E769]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono tracking-wider uppercase bg-white/20 px-2 py-0.5 rounded text-white font-medium">
                  {current.badge}
                </span>
                <span className="text-xs text-white/80 tabular-nums">
                  {tourStep + 1} of {steps.length}
                </span>
              </div>
              <h3 className="text-base font-bold text-white mt-1 leading-snug">{current.title}</h3>
            </div>
          </div>

          <button
            onClick={() => setTourStep(null)}
            className="text-white/70 hover:text-white p-1 hover:bg-white/10 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-4 text-sm text-[#17231D] leading-relaxed">
          <p>{current.description}</p>

          <div className="p-3.5 bg-[#F7F8F4] border border-[#E2E8E0] rounded-lg text-xs space-y-1">
            <span className="font-semibold text-[#176B4D] block uppercase tracking-wide text-[10px]">
              Key Evaluator Checkpoint
            </span>
            <p className="text-[#3D4A41]">{current.highlight}</p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#FBFBFA] border-t border-[#E5E7EB] flex items-center justify-between">
          <button
            onClick={() => setTourStep(null)}
            className="text-xs text-[#66736A] hover:text-[#17231D] px-3 py-1.5 rounded"
          >
            Exit Tour
          </button>

          <div className="flex items-center gap-2">
            {tourStep > 0 && (
              <button
                onClick={handlePrev}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#3D4A41] bg-white border border-[#E5E7EB] hover:bg-[#F3F5F1] rounded-lg transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}

            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#176B4D] hover:bg-[#104A36] rounded-lg shadow-xs transition-colors"
            >
              <span>{current.actionText}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
