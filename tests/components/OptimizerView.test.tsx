import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AppProvider } from '../../src/context/AppContext';
import { OptimizerView } from '../../src/components/views/OptimizerView';

describe('OptimizerView Component & Multi-Objective Engine UI', () => {
  it('renders strategy selection, objective controls, and generation actions', () => {
    render(
      <AppProvider>
        <OptimizerView />
      </AppProvider>
    );

    expect(screen.getByRole('heading', { level: 1, name: /Impact Optimizer/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Generate Allocation Plan/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Compare Strategies/i })).toBeInTheDocument();

    // Check strategy buttons
    expect(screen.getByText(/Strategy A: Maximize Volume/i)).toBeInTheDocument();
    expect(screen.getByText(/Strategy B: Prioritize Urgency/i)).toBeInTheDocument();
    expect(screen.getByText(/Strategy C: Balanced Fairness/i)).toBeInTheDocument();
  });

  it('generates an allocation plan and displays proposed allocations', () => {
    render(
      <AppProvider>
        <OptimizerView />
      </AppProvider>
    );

    const generateBtn = screen.getByRole('button', { name: /Generate Allocation Plan/i });
    fireEvent.click(generateBtn);

    // After generation, plan overview metrics should appear
    expect(screen.getByText(/Proposed Allocations/i)).toBeInTheDocument();
    expect(screen.getByText(/Approve & Commit Plan/i)).toBeInTheDocument();
  });

  it('opens and closes the strategy comparison workspace', () => {
    render(
      <AppProvider>
        <OptimizerView />
      </AppProvider>
    );

    const compareBtn = screen.getByRole('button', { name: /Compare Strategies/i });
    fireEvent.click(compareBtn);

    // Expect comparison heading
    expect(screen.getByText(/Multi-Strategy Allocation Comparison/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Close Comparison/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Close Comparison/i }));
    expect(screen.queryByText(/Multi-Strategy Allocation Comparison/i)).not.toBeInTheDocument();
  });
});
