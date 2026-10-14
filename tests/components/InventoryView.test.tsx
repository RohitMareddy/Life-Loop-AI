import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AppProvider } from '../../src/context/AppContext';
import { InventoryView } from '../../src/components/views/InventoryView';

describe('InventoryView Component & Accessibility', () => {
  it('renders inventory title and filter controls with accessible roles', () => {
    render(
      <AppProvider>
        <InventoryView />
      </AppProvider>
    );

    expect(screen.getByRole('heading', { level: 1, name: /Resource Inventory/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add Resource/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /AI Smart Intake/i })).toBeInTheDocument();
  });

  it('filters resource lots when a category filter is clicked', () => {
    render(
      <AppProvider>
        <InventoryView />
      </AppProvider>
    );

    // Initial state shows multiple lots
    const furnitureTab = screen.getByRole('button', { name: /^Furniture$/i });
    fireEvent.click(furnitureTab);

    // Expect furniture lots to be shown
    expect(screen.getByText(/Solid Oak Study Desks/i)).toBeInTheDocument();
  });

  it('opens and closes Add Resource modal with proper keyboard and focus accessibility', () => {
    render(
      <AppProvider>
        <InventoryView />
      </AppProvider>
    );

    const addBtn = screen.getByRole('button', { name: /Add Resource/i });
    fireEvent.click(addBtn);

    // Check dialog role and labelledby
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Register New Resource Lot/i })).toBeInTheDocument();

    // Check accessible inputs
    const titleInput = screen.getByLabelText(/Resource Title \*/i);
    expect(titleInput).toBeInTheDocument();

    // Press Escape to close modal
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens the detail specifications modal when view button is clicked', () => {
    render(
      <AppProvider>
        <InventoryView />
      </AppProvider>
    );

    const viewButtons = screen.getAllByLabelText(/View specifications for/i);
    expect(viewButtons.length).toBeGreaterThan(0);
    fireEvent.click(viewButtons[0]);

    // Modal dialog should be rendered
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Close Details/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Close Details/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
