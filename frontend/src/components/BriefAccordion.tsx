
'use client';

import { Trash2 } from 'lucide-react';
import React from 'react';
import { UseFormReturn, UseFieldArrayRemove } from 'react-hook-form';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { Brief } from '@/lib/types';

// Interfaces
interface BriefFieldWithIndex {
  id: string;
  originalIndex: number;
}

interface BriefAccordionProps {
  form: UseFormReturn<{ briefs: Brief[] }>;
  fields: BriefFieldWithIndex[];
  remove: UseFieldArrayRemove;
  openItems: string[];
  setOpenItems: (items: string[]) => void;
}

// Constants
const UNIT_OPTIONS = [
  { value: 'cm', label: 'Centimeter (cm)' },
  { value: 'mm', label: 'Milimeter (mm)' },
  { value: 'inch', label: 'Inch' },
  { value: 'px', label: 'Pixel (px)' }
] as const;

// Component
export function BriefAccordion({ form, fields, remove, openItems, setOpenItems }: BriefAccordionProps): JSX.Element {
  const { control, getValues } = form;

  const handleRemoveBrief = (index: number): void => {
    const brief = getValues(`briefs.${index}`);
    if (brief) {
      // Remove from openItems
      const newOpenItems = openItems.filter(item => item !== brief.instanceId);
      setOpenItems(newOpenItems);
    }
    remove(index);
  };

  const toggleAccordionItem = (instanceId: string): void => {
    const newOpenItems = openItems.includes(instanceId)
      ? openItems.filter(item => item !== instanceId)
      : [...openItems, instanceId];
    setOpenItems(newOpenItems);
  };

  if (fields.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Belum ada brief yang ditambahkan.</p>
        <p className="text-sm mt-2">Brief akan muncul di sini setelah Anda menambahkan produk ke keranjang.</p>
      </div>
    );
  }

  return (
    <Accordion 
      type="multiple" 
      className="w-full space-y-4"
      value={openItems}
      onValueChange={setOpenItems}
    >
      {fields.map((field, index) => {
        const brief = getValues(`briefs.${field.originalIndex}`);
        return (
          <AccordionItem 
            key={field.id} 
            value={brief.instanceId}
            className="border border-gray-200 rounded-lg px-4"
          >
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center justify-between w-full">
                <span className="font-medium">
                  {brief.productName} - {brief.briefDetails || 'Belum ada detail'}
                </span>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={(e: React.MouseEvent<HTMLDivElement>): void => {
                    e.stopPropagation();
                    handleRemoveBrief(field.originalIndex);
                  }}
                  onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>): void => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation();
                      handleRemoveBrief(field.originalIndex);
                    }
                  }}
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 rounded-md px-3 text-red-500 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <FormField
                control={control}
                name={`briefs.${field.originalIndex}.briefDetails`}
                render={({ field: formField }) => (
                  <FormItem>
                    <FormLabel>Detail Brief</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Jelaskan detail desain yang Anda inginkan..."
                        className="min-h-[100px]"
                        {...formField}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={control}
                  name={`briefs.${field.originalIndex}.width`}
                  render={({ field: formField }) => (
                    <FormItem>
                      <FormLabel>Lebar</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          min="0"
                          step="0.1"
                          {...formField}
                          value={formField.value === '' ? '' : formField.value || ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            formField.onChange(value === '' ? '' : parseFloat(value) || '');
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={control}
                  name={`briefs.${field.originalIndex}.height`}
                  render={({ field: formField }) => (
                    <FormItem>
                      <FormLabel>Tinggi</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          min="0"
                          step="0.1"
                          {...formField}
                          value={formField.value === '' ? '' : formField.value || ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            formField.onChange(value === '' ? '' : parseFloat(value) || '');
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={control}
                  name={`briefs.${field.originalIndex}.unit`}
                  render={({ field: formField }) => (
                    <FormItem>
                      <FormLabel>Satuan</FormLabel>
                      <Select
                        value={formField.value || ''}
                        onValueChange={formField.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih satuan" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {UNIT_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={control}
                name={`briefs.${field.originalIndex}.googleDriveAssetLinks`}
                render={({ field: formField }) => (
                  <FormItem>
                    <FormLabel>Link Google Drive (Opsional)</FormLabel>
                    <FormControl>
                      <Input
                        type="url"
                        placeholder="https://drive.google.com/..."
                        {...formField}
                        value={formField.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
