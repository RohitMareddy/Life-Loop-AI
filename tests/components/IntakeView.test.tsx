import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AppProvider } from '../../src/context/AppContext';
import { IntakeView } from '../../src/components/views/IntakeView';

describe('IntakeView Component & Smart Extraction UI', () => {
  it('renders intake input form, sample buttons, and extraction guardrails', () => {
    render(
      <AppProvider>
        <IntakeView />
      </AppProvider>
    );

    expect(screen.getByRole('heading', { level: 1, name: /AI-Powered Smart Resource Intake/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Extract Structured Records/i })).toBeInTheDocument();
    expect(screen.getByText(/Sample 1: Multi-Item Workshop Surplus/i)).toBeInTheDocument();
  });

  it('populates description when a sample prompt is clicked', () => {
    render(
      <AppProvider>
        <IntakeView />
      </AppProvider>
    );

    const sample2Btn = screen.getByText(/Sample 2: School Library Book Purge/i);
    fireEvent.click(sample2Btn);

    const textarea = screen.getByPlaceholderText(/Paste donation description/i) as HTMLTextAreaElement;
    expect(textarea.value).toContain('85 elementary reading books');
  });

  it('runs extraction with deterministic fallback when offline and renders editable lot cards', async () => {
    render(
      <AppProvider>
        <IntakeView />
      </AppProvider>
    );

    const extractBtn = screen.getByRole('button', { name: /Extract Structured Records/i });
    fireEvent.click(extractBtn);

    // Wait for extracted lots to appear
    await waitFor(() => {
      expect(screen.getByText(/Human Review & Validation/i)).toBeInTheDocument();
    });

    expect(screen.getByDisplayValue(/Unused Spiral Notebooks/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Confirm & Save All to Inventory/i })).toBeInTheDocument();
  });
});
