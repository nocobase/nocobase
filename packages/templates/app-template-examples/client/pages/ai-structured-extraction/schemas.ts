import { z } from 'zod';

const text = () => z.string().max(1000);

// These belong to the forms. The shared backend receives plain JSON Schema,
// not a form identifier or a backend-selected output shape.
export const contactSchema = z.strictObject({
  name: text(),
  company: text(),
  jobTitle: text(),
  email: text(),
  phone: text(),
  address: z.strictObject({ city: text(), country: text() }),
  skills: z.array(text()).max(12),
});

export const orderSchema = z.strictObject({
  supplier: text(),
  contact: z.strictObject({ name: text(), email: text() }),
  currency: z.enum(['', 'CNY', 'USD', 'EUR']),
  notes: text(),
  items: z
    .array(
      z.strictObject({
        product: text(),
        quantity: z.number().nonnegative().nullable(),
        unitPrice: z.number().nonnegative().nullable(),
      }),
    )
    .max(5),
});

export type ContactProfile = z.infer<typeof contactSchema>;
export type PurchaseOrder = z.infer<typeof orderSchema>;

export const emptyContact: ContactProfile = {
  name: '',
  company: '',
  jobTitle: '',
  email: '',
  phone: '',
  address: { city: '', country: '' },
  skills: [],
};
export const emptyOrder: PurchaseOrder = {
  supplier: '',
  contact: { name: '', email: '' },
  currency: '',
  notes: '',
  items: [],
};

export const contactJsonSchema = z.toJSONSchema(contactSchema, {
  target: 'draft-7',
});
export const orderJsonSchema = z.toJSONSchema(orderSchema, {
  target: 'draft-7',
});
