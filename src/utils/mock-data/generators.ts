/**
 * Mock Data Generators
 * Utility functions for creating realistic random data
 */

import * as C from './constants';

/**
 * Random selection utilities
 */
export const random = {
  // Pick random item from array
  pick: <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)],
  
  // Pick random number in range
  int: (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min,
  
  // Pick random float
  float: (min: number, max: number, decimals: number = 2): number => 
    parseFloat((Math.random() * (max - min) + min).toFixed(decimals)),
  
  // Random boolean with probability
  bool: (probability: number = 0.5): boolean => Math.random() < probability,
  
  // Random date in past
  date: (daysAgo: number): Date => {
    const now = Date.now();
    const past = now - (Math.random() * daysAgo * 24 * 60 * 60 * 1000);
    return new Date(past);
  },
  
  // Random subset of array
  subset: <T>(arr: T[], count: number): T[] => {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }
};

/**
 * Name generators
 */
export const generateName = {
  full: (): string => {
    const gender = random.pick(['male', 'female', 'neutral'] as const) as 'male' | 'female' | 'neutral';
    const firstName = gender === 'neutral' 
      ? random.pick(C.FIRST_NAMES.neutral)
      : random.pick(C.FIRST_NAMES[gender]);
    const lastName = random.pick(C.LAST_NAMES);
    return `${firstName} ${lastName}`;
  },
  
  first: (): string => {
    const allNames = [...C.FIRST_NAMES.male, ...C.FIRST_NAMES.female, ...C.FIRST_NAMES.neutral];
    return random.pick(allNames);
  },
  
  last: (): string => random.pick(C.LAST_NAMES),
  
  username: (name: string): string => {
    const clean = name.toLowerCase().replace(/\s+/g, '');
    const number = random.int(1, 999);
    const variations = [
      clean + number,
      clean + '_' + number,
      clean.split(' ')[0] + number,
      clean.charAt(0) + clean.split(' ')[1] + number
    ];
    return random.pick(variations);
  }
};

/**
 * Email generators
 */
export const generateEmail = {
  fromName: (name: string): string => {
    const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'email.com', 'company.com', 'work.com'];
    const clean = name.toLowerCase().replace(/\s+/g, '.');
    const variations = [
      clean,
      clean.replace('.', ''),
      clean + random.int(1, 99),
      name.split(' ')[0].toLowerCase() + random.int(1, 999)
    ];
    return `${random.pick(variations)}@${random.pick(domains)}`;
  },
  
  professional: (name: string, company: string): string => {
    const clean = name.toLowerCase().replace(/\s+/g, '.');
    const domain = company.toLowerCase().replace(/\s+/g, '') + '.com';
    return `${clean}@${domain}`;
  }
};

/**
 * Location generators
 */
export const generateLocation = {
  city: () => random.pick(C.CITIES),
  
  address: (): string => {
    const number = random.int(100, 9999);
    const streets = ['Main St', 'Oak Ave', 'Park Rd', 'Elm St', 'Washington Blvd', 'Broadway', 'Market St'];
    return `${number} ${random.pick(streets)}`;
  },
  
  zipCode: (): string => String(random.int(10000, 99999)),
  
  country: () => random.pick(C.COUNTRIES)
};

/**
 * Product generators
 */
export const generateProduct = {
  name: (): string => {
    const brand = random.pick([...C.BRANDS.tech, ...C.BRANDS.fashion]);
    const adjective = random.bool(0.6) ? random.pick(C.PRODUCT_ADJECTIVES) + ' ' : '';
    const device = random.pick(C.DEVICE_TYPES);
    return `${brand} ${adjective}${device}`;
  },
  
  sku: (): string => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const prefix = letters.charAt(random.int(0, 25)) + letters.charAt(random.int(0, 25));
    const number = String(random.int(1000, 9999));
    return `${prefix}-${number}`;
  },
  
  price: (category: string): number => {
    const ranges: Record<string, [number, number]> = {
      Electronics: [100, 2000],
      Computers: [500, 3000],
      Smartphones: [300, 1500],
      Audio: [50, 500],
      Accessories: [10, 200],
      default: [20, 500]
    };
    const [min, max] = ranges[category] || ranges.default;
    return random.float(min, max);
  },
  
  description: (name: string): string => {
    const templates = [
      `High-quality ${name.toLowerCase()} with advanced features and modern design`,
      `Professional-grade ${name.toLowerCase()} built for performance and reliability`,
      `Premium ${name.toLowerCase()} featuring cutting-edge technology`,
      `Durable ${name.toLowerCase()} designed for everyday use`,
      `State-of-the-art ${name.toLowerCase()} with exceptional quality`
    ];
    return random.pick(templates);
  }
};

/**
 * Content generators
 */
export const generateContent = {
  title: (): string => {
    const template = random.pick(C.BLOG_TITLES);
    const tech = random.pick(C.TECHNOLOGIES);
    const year = new Date().getFullYear();
    return template
      .replace('{tech}', tech)
      .replace('{topic}', random.pick(['Code Quality', 'Performance', 'Security', 'Testing']))
      .replace('{concept}', random.pick(['Architecture', 'Design Patterns', 'Best Practices']))
      .replace('{skill}', random.pick(['React', 'TypeScript', 'SQL', 'Docker']))
      .replace('{project}', random.pick(['API', 'Dashboard', 'Blog', 'E-commerce']))
      .replace('{year}', String(year));
  },
  
  slug: (title: string): string => {
    return title.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 60);
  },
  
  excerpt: (): string => {
    const templates = [
      "Learn the fundamentals and advanced concepts to master this technology.",
      "A comprehensive guide covering everything you need to know.",
      "Step-by-step tutorial with practical examples and best practices.",
      "Discover tips and techniques used by industry professionals.",
      "Improve your skills with this in-depth exploration of key concepts."
    ];
    return random.pick(templates);
  },
  
  comment: (): string => {
    const template = random.pick(C.COMMENT_TEXTS);
    return template
      .replace('{topic}', random.pick(['implementation', 'approach', 'solution']))
      .replace('{concept}', random.pick(['React hooks', 'API design', 'database optimization']));
  }
};

/**
 * Business data generators
 */
export const generateBusiness = {
  salary: (department: string): number => {
    const ranges: Record<string, [number, number]> = {
      Engineering: [80000, 180000],
      Product: [90000, 170000],
      Design: [70000, 140000],
      Marketing: [60000, 130000],
      Sales: [50000, 150000],
      HR: [55000, 110000],
      default: [50000, 120000]
    };
    const [min, max] = ranges[department] || ranges.default;
    return random.int(min, max);
  },
  
  employeeId: (): string => {
    const prefix = random.pick(['EMP', 'STF', 'USR']);
    const number = String(random.int(10000, 99999));
    return `${prefix}-${number}`;
  },
  
  phoneNumber: (): string => {
    const area = random.int(200, 999);
    const prefix = random.int(200, 999);
    const line = random.int(1000, 9999);
    return `(${area}) ${prefix}-${line}`;
  }
};

/**
 * Transaction generators
 */
export const generateTransaction = {
  orderId: (): string => {
    const prefix = 'ORD';
    const timestamp = Date.now().toString().slice(-8);
    const random_suffix = String(random.int(100, 999));
    return `${prefix}-${timestamp}-${random_suffix}`;
  },
  
  amount: (min: number = 10, max: number = 500): number => {
    return random.float(min, max, 2);
  },
  
  tax: (amount: number, rate: number = 0.08): number => {
    return parseFloat((amount * rate).toFixed(2));
  },
  
  total: (subtotal: number, tax: number, shipping: number = 0): number => {
    return parseFloat((subtotal + tax + shipping).toFixed(2));
  }
};

/**
 * ID generators
 */
export const generateId = {
  uuid: (): string => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  },
  
  shortId: (): string => {
    return Math.random().toString(36).substring(2, 9);
  },
  
  numeric: (length: number = 8): string => {
    return String(random.int(
      Math.pow(10, length - 1),
      Math.pow(10, length) - 1
    ));
  }
};

