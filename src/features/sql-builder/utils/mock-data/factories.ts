/**
 * Mock Data Factories
 * Factory functions for generating realistic table data
 */

import * as C from './constants';
import * as G from './generators';

/**
 * User Factory
 */
export function createUser(id: number): any {
  const name = G.generateName.full();
  const city = G.generateLocation.city();
  const role = G.random.pick(C.USER_ROLES);
  const createdDaysAgo = G.random.int(1, C.DATE_RANGES.veryOld);
  const updatedDaysAgo = G.random.int(1, Math.min(createdDaysAgo, C.DATE_RANGES.recent));
  
  return {
    id,
    name,
    email: G.generateEmail.fromName(name),
    username: G.generateName.username(name),
    age: G.random.int(18, 65),
    status: G.random.pick(C.USER_STATUSES),
    role,
    city: city.name,
    state: city.state,
    country: G.generateLocation.country(),
    phone: G.generateBusiness.phoneNumber(),
    bio: `${role.charAt(0).toUpperCase() + role.slice(1)} at ${G.random.pick(C.COMPANIES)}`,
    avatar_url: `https://i.pravatar.cc/150?img=${id}`,
    email_verified: G.random.bool(0.85),
    is_premium: G.random.bool(0.3),
    subscription_tier: G.random.pick(C.SUBSCRIPTION_TIERS),
    last_login: G.random.date(7).toISOString(),
    created_at: G.random.date(createdDaysAgo).toISOString(),
    updated_at: G.random.date(updatedDaysAgo).toISOString(),
  };
}

/**
 * Product Factory
 */
export function createProduct(id: number): any {
  const category = G.random.pick(C.PRODUCT_CATEGORIES);
  const name = G.generateProduct.name();
  const brand = G.random.pick([...C.BRANDS.tech, ...C.BRANDS.fashion, ...C.BRANDS.general]);
  const price = G.generateProduct.price(category);
  const cost = price * G.random.float(0.4, 0.7);
  const stock = G.random.int(0, 200);
  const isActive = stock > 0 && G.random.bool(0.85);
  
  return {
    id,
    name,
    sku: G.generateProduct.sku(),
    description: G.generateProduct.description(name),
    price: parseFloat(price.toFixed(2)),
    cost: parseFloat(cost.toFixed(2)),
    stock,
    category,
    brand,
    rating: G.random.float(3.0, 5.0, 1),
    reviews_count: G.random.int(0, 500),
    is_active: isActive,
    is_featured: G.random.bool(0.15),
    on_sale: G.random.bool(0.25),
    discount_percent: G.random.bool(0.25) ? G.random.int(5, 50) : 0,
    weight_kg: G.random.float(0.1, 5.0, 2),
    image_url: `https://picsum.photos/seed/${id}/400/400`,
    created_at: G.random.date(C.DATE_RANGES.old).toISOString(),
    updated_at: G.random.date(C.DATE_RANGES.recent).toISOString(),
  };
}

/**
 * Order Factory
 */
export function createOrder(id: number, totalUsers: number): any {
  const userId = G.random.int(1, totalUsers);
  const itemsCount = G.random.int(1, 5);
  const subtotal = G.generateTransaction.amount(20, 500);
  const tax = G.generateTransaction.tax(subtotal);
  const shipping = G.random.pick([0, 5.99, 9.99, 14.99, 0]);
  const total = G.generateTransaction.total(subtotal, tax, shipping);
  const status = G.random.pick(C.ORDER_STATUSES);
  const createdDaysAgo = G.random.int(1, C.DATE_RANGES.medium);
  
  // Determine payment status based on order status
  let isPaid = false;
  if (['confirmed', 'shipped', 'delivered'].includes(status)) {
    isPaid = true;
  } else if (status === 'processing') {
    isPaid = G.random.bool(0.8);
  }
  
  return {
    id,
    order_number: G.generateTransaction.orderId(),
    user_id: userId,
    status,
    subtotal: parseFloat(subtotal.toFixed(2)),
    tax: parseFloat(tax.toFixed(2)),
    shipping: parseFloat(shipping.toFixed(2)),
    total: parseFloat(total.toFixed(2)),
    items_count: itemsCount,
    payment_method: G.random.pick(C.PAYMENT_METHODS),
    payment_status: isPaid ? 'paid' : 'pending',
    shipping_method: G.random.pick(C.SHIPPING_METHODS),
    tracking_number: status === 'shipped' || status === 'delivered' ? `TRK${G.generateId.numeric(12)}` : null,
    notes: G.random.bool(0.2) ? 'Customer requested gift wrapping' : null,
    created_at: G.random.date(createdDaysAgo).toISOString(),
    updated_at: G.random.date(Math.min(createdDaysAgo, 7)).toISOString(),
  };
}

/**
 * Post Factory
 */
export function createPost(id: number, totalUsers: number): any {
  const title = G.generateContent.title();
  const userId = G.random.int(1, totalUsers);
  const published = G.random.bool(0.7);
  const createdDaysAgo = G.random.int(1, C.DATE_RANGES.medium);
  const views = published ? G.random.int(0, 10000) : 0;
  const likes = Math.floor(views * G.random.float(0.01, 0.1));
  const comments_count = Math.floor(likes * G.random.float(0.1, 0.5));
  
  return {
    id,
    user_id: userId,
    title,
    slug: G.generateContent.slug(title),
    excerpt: G.generateContent.excerpt(),
    content: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. ${G.generateContent.excerpt()}`,
    category: G.random.pick(C.POST_CATEGORIES),
    tags: G.random.subset(C.POST_TAGS, G.random.int(2, 5)).join(','),
    views,
    likes,
    comments_count,
    published,
    featured: published && G.random.bool(0.1),
    reading_time_min: G.random.int(3, 15),
    published_at: published ? G.random.date(createdDaysAgo).toISOString() : null,
    created_at: G.random.date(createdDaysAgo).toISOString(),
    updated_at: G.random.date(Math.min(createdDaysAgo, C.DATE_RANGES.recent)).toISOString(),
  };
}

/**
 * Comment Factory
 */
export function createComment(id: number, totalPosts: number, totalUsers: number): any {
  const postId = G.random.int(1, totalPosts);
  const userId = G.random.int(1, totalUsers);
  const createdDaysAgo = G.random.int(1, C.DATE_RANGES.recent);
  const likes = G.random.int(0, 50);
  
  return {
    id,
    post_id: postId,
    user_id: userId,
    parent_id: G.random.bool(0.2) ? G.random.int(1, Math.max(1, id - 1)) : null, // 20% are replies
    content: G.generateContent.comment(),
    likes,
    is_edited: G.random.bool(0.15),
    is_flagged: G.random.bool(0.02),
    created_at: G.random.date(createdDaysAgo).toISOString(),
    updated_at: G.random.date(Math.min(createdDaysAgo, 7)).toISOString(),
  };
}

/**
 * Category Factory
 */
export function createCategory(id: number): any {
  const categories = [
    { name: 'Electronics', icon: 'ELEC', description: 'Computers, phones, and electronic devices' },
    { name: 'Clothing', icon: 'CLTH', description: 'Fashion and apparel items' },
    { name: 'Books', icon: 'BOOK', description: 'Physical and digital books' },
    { name: 'Food & Beverage', icon: 'FOOD', description: 'Food products and drinks' },
    { name: 'Sports & Outdoors', icon: 'SPRT', description: 'Sports equipment and outdoor gear' },
    { name: 'Home & Garden', icon: 'HOME', description: 'Home decor and gardening supplies' },
    { name: 'Toys & Games', icon: 'TOYS', description: 'Toys, games, and entertainment' },
    { name: 'Health & Beauty', icon: 'HLTH', description: 'Health and beauty products' },
    { name: 'Automotive', icon: 'AUTO', description: 'Car parts and accessories' },
    { name: 'Office Supplies', icon: 'OFFC', description: 'Office and school supplies' },
  ];
  
  const category = categories[Math.min(id - 1, categories.length - 1)] || categories[0];
  const parent_id = id > 5 ? G.random.pick([null, null, null, G.random.int(1, 5)]) : null; // Top 5 are parent categories
  
  return {
    id,
    name: category.name,
    slug: category.name.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and'),
    description: category.description,
    icon: category.icon,
    parent_id,
    products_count: G.random.int(5, 150),
    is_active: G.random.bool(0.95),
    display_order: id,
    created_at: G.random.date(C.DATE_RANGES.veryOld).toISOString(),
  };
}

/**
 * Employee Factory
 */
export function createEmployee(id: number): any {
  const name = G.generateName.full();
  const department = G.random.pick(C.DEPARTMENTS);
  const salary = G.generateBusiness.salary(department);
  const hireDate = G.random.date(G.random.int(30, C.DATE_RANGES.veryOld));
  const yearsEmployed = Math.floor((Date.now() - hireDate.getTime()) / (365 * 24 * 60 * 60 * 1000));
  const isActive = G.random.bool(0.92);
  
  return {
    id,
    employee_id: G.generateBusiness.employeeId(),
    name,
    email: G.generateEmail.professional(name, 'company'),
    department,
    job_title: G.random.pick(C.JOB_TITLES),
    salary,
    bonus: parseFloat((salary * G.random.float(0.05, 0.15)).toFixed(2)),
    manager_id: id > 10 ? G.random.pick([null, G.random.int(1, Math.min(id - 1, 10))]) : null,
    phone: G.generateBusiness.phoneNumber(),
    location: G.generateLocation.city().name,
    hire_date: hireDate.toISOString().split('T')[0],
    years_employed: yearsEmployed,
    is_active: isActive,
    is_remote: G.random.bool(0.4),
    performance_rating: G.random.float(3.0, 5.0, 1),
    vacation_days: G.random.int(0, 25),
  };
}

