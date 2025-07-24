import { render } from '@testing-library/react';
import React from 'react';
import { useForm } from 'react-hook-form';

import type { Brief } from '@/lib/types';

import { BriefAccordion } from './BriefAccordion';

// Mock komponen UI yang digunakan
jest.mock('@/components/ui/accordion', () => ({
  Accordion: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="accordion">{children}</div>
  ),
  AccordionContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="accordion-content">{children}</div>
  ),
  AccordionItem: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="accordion-item">{children}</div>
  ),
  AccordionTrigger: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="accordion-trigger">{children}</div>
  ),
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children }: { children: React.ReactNode }) => (
    <button data-testid="button">{children}</button>
  ),
}));

jest.mock('@/components/ui/form', () => ({
  FormControl: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="form-control">{children}</div>
  ),
  FormField: ({ render }: { render: (props: { field: Record<string, unknown> }) => React.ReactNode }) => (
    <div data-testid="form-field">{render({ field: {} })}</div>
  ),
  FormItem: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="form-item">{children}</div>
  ),
  FormLabel: ({ children }: { children: React.ReactNode }) => (
    <label data-testid="form-label">{children}</label>
  ),
  FormMessage: () => <div data-testid="form-message" />,
}));

jest.mock('@/components/ui/input', () => ({
  Input: (props: Record<string, unknown>) => <input data-testid="input" {...props} />,
}));

jest.mock('@/components/ui/select', () => ({
  Select: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="select">{children}</div>
  ),
  SelectContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="select-content">{children}</div>
  ),
  SelectItem: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="select-item">{children}</div>
  ),
  SelectTrigger: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="select-trigger">{children}</div>
  ),
  SelectValue: () => <div data-testid="select-value" />,
}));

jest.mock('@/components/ui/textarea', () => ({
  Textarea: (props: Record<string, unknown>) => <textarea data-testid="textarea" {...props} />,
}));

// Test wrapper component
function TestWrapper({ children }: { children: React.ReactNode }): JSX.Element {
  return <div>{children}</div>;
}

// Mock data
const mockBrief: Brief = {
  instanceId: 'test-instance-1',
  productId: 'test-product-1',
  productName: 'Test Product',
  tier: 'Budget Kaki Lima',
  briefDetails: 'Test brief details',
  googleDriveAssetLinks: 'https://drive.google.com/test',
  width: 100,
  height: 200,
  unit: 'px',
};

const mockFields = [
  {
    id: 'field-1',
    originalIndex: 0,
  },
];

describe('BriefAccordion', () => {
  const mockRemove = jest.fn();
  const mockSetOpenItems = jest.fn();

  // Mock useForm hook
  const mockForm = {
    control: {},
    getValues: jest.fn().mockReturnValue(mockBrief),
  } as unknown as ReturnType<typeof useForm<{ briefs: Brief[] }>>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render empty state when no fields provided', () => {
    const { getByText } = render(
      <TestWrapper>
        <BriefAccordion
          form={mockForm}
          fields={[]}
          remove={mockRemove}
          openItems={[]}
          setOpenItems={mockSetOpenItems}
        />
      </TestWrapper>
    );

    expect(getByText('Belum ada brief yang ditambahkan.')).toBeDefined();
    expect(getByText(/Brief akan muncul di sini setelah Anda menambahkan produk/)).toBeDefined();
  });

  it('should render accordion with brief data', () => {
    const { getByTestId, getByText } = render(
      <TestWrapper>
        <BriefAccordion
          form={mockForm}
          fields={mockFields}
          remove={mockRemove}
          openItems={['test-instance-1']}
          setOpenItems={mockSetOpenItems}
        />
      </TestWrapper>
    );

    expect(getByTestId('accordion')).toBeDefined();
    expect(getByText(/Test Product - Test brief details/)).toBeDefined();
  });

  it('should render delete button as div element (not nested button)', () => {
    const { container } = render(
      <TestWrapper>
        <BriefAccordion
          form={mockForm}
          fields={mockFields}
          remove={mockRemove}
          openItems={['test-instance-1']}
          setOpenItems={mockSetOpenItems}
        />
      </TestWrapper>
    );

    // Memastikan tombol hapus adalah div dengan role="button", bukan button element
    const deleteButton = container.querySelector('[role="button"]');
    expect(deleteButton).toBeDefined();
    expect(deleteButton?.tagName.toLowerCase()).toBe('div');
    expect(deleteButton?.getAttribute('role')).toBe('button');
    expect(deleteButton?.getAttribute('tabIndex')).toBe('0');
  });
});