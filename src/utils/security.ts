import { z } from 'zod';

// Shopping item validation schemas
export const shoppingItemSchema = z.object({
  name: z.string()
    .min(1, 'שם הפריט הוא שדה חובה')
    .max(100, 'שם הפריט לא יכול להיות ארוך מ-100 תווים')
    .regex(/^[א-ת\s\w\-().,!?]+$/u, 'שם הפריט מכיל תווים לא חוקיים'),
  category: z.string()
    .min(1, 'קטגוריה היא שדה חובה')
    .max(50, 'שם הקטגוריה לא יכול להיות ארוך מ-50 תווים'),
  quantity: z.number()
    .min(1, 'הכמות חייבת להיות לפחות 1')
    .max(999, 'הכמות לא יכולה להיות יותר מ-999')
    .int('הכמות חייבת להיות מספר שלם'),
});

export const shoppingListSchema = z.object({
  name: z.string()
    .min(1, 'שם הרשימה הוא שדה חובה')
    .max(100, 'שם הרשימה לא יכול להיות ארוך מ-100 תווים')
    .regex(/^[א-ת\s\w\-().,!?]+$/u, 'שם הרשימה מכיל תווים לא חוקיים'),
});

// User input validation schemas
export const userProfileSchema = z.object({
  username: z.string()
    .min(2, 'שם המשתמש חייב להיות לפחות 2 תווים')
    .max(30, 'שם המשתמש לא יכול להיות ארוך מ-30 תווים')
    .regex(/^[א-ת\w\-_]+$/u, 'שם המשתמש מכיל תווים לא חוקיים')
    .optional(),
  avatar_url: z.string().url('כתובת תמונה לא חוקית').optional(),
});

export const emailSchema = z.string()
  .email('כתובת אימייל לא חוקית')
  .max(254, 'כתובת האימייל ארוכה מדי');

export const passwordSchema = z.string()
  .min(8, 'הסיסמה חייבת להיות לפחות 8 תווים')
  .max(128, 'הסיסמה לא יכולה להיות ארוכה מ-128 תווים')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'הסיסמה חייבת לכלול אות קטנה, אות גדולה ומספר');

// Search and filter validation
export const searchQuerySchema = z.string()
  .max(100, 'חיפוש לא יכול להיות ארוך מ-100 תווים')
  .regex(/^[א-ת\s\w\-().,!?]*$/u, 'חיפוש מכיל תווים לא חוקיים');

// Sanitization functions
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>'"&]/g, '') // Remove potentially dangerous characters
    .replace(/\s+/g, ' '); // Normalize whitespace
};

export const sanitizeHtml = (input: string): string => {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

// Validation helpers
export const validateShoppingItem = (data: unknown) => {
  return shoppingItemSchema.safeParse(data);
};

export const validateShoppingList = (data: unknown) => {
  return shoppingListSchema.safeParse(data);
};

export const validateUserProfile = (data: unknown) => {
  return userProfileSchema.safeParse(data);
};

export const validateEmail = (email: string) => {
  return emailSchema.safeParse(email);
};

export const validatePassword = (password: string) => {
  return passwordSchema.safeParse(password);
};

export const validateSearchQuery = (query: string) => {
  return searchQuerySchema.safeParse(query);
};

// Rate limiting for client-side
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  
  constructor(
    private maxAttempts: number = 10,
    private windowMs: number = 60000 // 1 minute
  ) {}
  
  isAllowed(key: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    
    // Remove old attempts outside the window
    const validAttempts = attempts.filter(time => now - time < this.windowMs);
    
    if (validAttempts.length >= this.maxAttempts) {
      return false;
    }
    
    // Add current attempt
    validAttempts.push(now);
    this.attempts.set(key, validAttempts);
    
    return true;
  }
  
  reset(key: string): void {
    this.attempts.delete(key);
  }
}

// Global rate limiter instances
export const authRateLimiter = new RateLimiter(5, 300000); // 5 attempts per 5 minutes
export const apiRateLimiter = new RateLimiter(100, 60000); // 100 requests per minute