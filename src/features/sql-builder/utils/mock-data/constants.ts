/**
 * Mock Data Constants
 * Centralized data pools for realistic variations
 */

// Personal Names
export const FIRST_NAMES = {
  male: ["James", "John", "Robert", "Michael", "William", "David", "Richard", "Joseph", "Thomas", "Charles", "Daniel", "Matthew", "Anthony", "Mark", "Donald", "Steven", "Paul", "Andrew", "Joshua", "Kenneth"],
  female: ["Mary", "Patricia", "Jennifer", "Linda", "Elizabeth", "Barbara", "Susan", "Jessica", "Sarah", "Karen", "Nancy", "Lisa", "Betty", "Margaret", "Sandra", "Ashley", "Kimberly", "Emily", "Donna", "Michelle"],
  neutral: ["Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Avery", "Quinn", "Reese", "Sage"]
};

export const LAST_NAMES = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
  "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin",
  "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson",
  "Walker", "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores",
  "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell", "Carter", "Roberts"
];

// Geography
export const CITIES = [
  { name: "New York", state: "NY", timezone: "America/New_York" },
  { name: "Los Angeles", state: "CA", timezone: "America/Los_Angeles" },
  { name: "Chicago", state: "IL", timezone: "America/Chicago" },
  { name: "Houston", state: "TX", timezone: "America/Chicago" },
  { name: "Phoenix", state: "AZ", timezone: "America/Phoenix" },
  { name: "Philadelphia", state: "PA", timezone: "America/New_York" },
  { name: "San Antonio", state: "TX", timezone: "America/Chicago" },
  { name: "San Diego", state: "CA", timezone: "America/Los_Angeles" },
  { name: "Dallas", state: "TX", timezone: "America/Chicago" },
  { name: "San Jose", state: "CA", timezone: "America/Los_Angeles" },
  { name: "Austin", state: "TX", timezone: "America/Chicago" },
  { name: "Seattle", state: "WA", timezone: "America/Los_Angeles" },
  { name: "Denver", state: "CO", timezone: "America/Denver" },
  { name: "Boston", state: "MA", timezone: "America/New_York" },
  { name: "Miami", state: "FL", timezone: "America/New_York" },
];

export const COUNTRIES = ["USA", "Canada", "UK", "Australia", "Germany", "France", "Japan", "India"];

// Business
export const DEPARTMENTS = [
  "Engineering", "Product", "Design", "Marketing", "Sales", "Customer Success",
  "HR", "Finance", "Operations", "Legal", "Data Science", "Security"
];

export const JOB_TITLES = [
  "Software Engineer", "Senior Developer", "Product Manager", "Designer", "Data Analyst",
  "Marketing Manager", "Sales Representative", "Customer Support", "DevOps Engineer",
  "QA Engineer", "Technical Writer", "Business Analyst", "Project Manager", "Recruiter"
];

export const COMPANIES = [
  "TechCorp", "InnovateLabs", "DataFlow Inc", "CloudBase", "DevTools Co",
  "AppWorks", "CodeCraft", "SoftServe", "ByteForge", "LogicLeap"
];

// Products & E-commerce
export const PRODUCT_CATEGORIES = [
  "Electronics", "Computers", "Smartphones", "Tablets", "Wearables",
  "Audio", "Cameras", "Gaming", "Smart Home", "Accessories",
  "Office Supplies", "Furniture", "Kitchen", "Sports", "Outdoor"
];

export const BRANDS = {
  tech: ["Apple", "Samsung", "Google", "Microsoft", "Sony", "Dell", "HP", "Lenovo", "Asus", "Acer"],
  fashion: ["Nike", "Adidas", "Puma", "Under Armour", "Reebok", "New Balance"],
  general: ["Amazon Basics", "Generic", "Premium", "Budget", "Standard"]
};

export const PRODUCT_ADJECTIVES = [
  "Premium", "Professional", "Ultra", "Pro", "Advanced", "Smart", "Wireless",
  "Portable", "Compact", "High-Performance", "Ergonomic", "Durable"
];

export const DEVICE_TYPES = [
  "Laptop", "Desktop", "Monitor", "Keyboard", "Mouse", "Headphones", "Webcam",
  "Microphone", "Speaker", "Tablet", "Phone", "Watch", "Camera", "Printer"
];

// User Attributes
export const USER_STATUSES = ["active", "inactive", "pending", "suspended", "banned"];
export const USER_ROLES = ["admin", "moderator", "user", "guest", "vip", "premium"];
export const SUBSCRIPTION_TIERS = ["free", "basic", "pro", "enterprise"];

// Order & Transaction
export const ORDER_STATUSES = ["pending", "processing", "confirmed", "shipped", "delivered", "cancelled", "refunded"];
export const PAYMENT_METHODS = ["credit_card", "debit_card", "paypal", "stripe", "bank_transfer", "apple_pay", "google_pay", "crypto"];
export const SHIPPING_METHODS = ["standard", "express", "overnight", "pickup"];

// Content
export const POST_CATEGORIES = ["Technology", "Business", "Design", "Development", "Marketing", "Productivity", "Tutorial", "News"];
export const POST_TAGS = ["react", "nodejs", "typescript", "javascript", "python", "sql", "devops", "cloud", "ai", "ml"];

export const BLOG_TITLES = [
  "Getting Started with {tech}",
  "10 Tips for Better {topic}",
  "Understanding {concept} in Depth",
  "Building {project} from Scratch",
  "{tech} Best Practices for {year}",
  "How to Master {skill}",
  "The Complete Guide to {topic}",
  "Why {concept} Matters in {year}",
  "Advanced {tech} Techniques",
  "Common {tech} Mistakes to Avoid"
];

export const COMMENT_TEXTS = [
  "Great article! Thanks for sharing this.",
  "This helped me solve my problem. Much appreciated!",
  "Very informative and well-written.",
  "Could you explain more about the {topic} part?",
  "Excellent breakdown of {concept}.",
  "I have a question regarding this approach.",
  "This is exactly what I was looking for!",
  "Bookmarked for future reference.",
  "Would love to see a tutorial on {topic}.",
  "Thanks! This made {concept} much clearer."
];

// Tech Stack
export const TECHNOLOGIES = [
  "React", "Vue", "Angular", "Next.js", "Nuxt", "Svelte",
  "Node.js", "Express", "FastAPI", "Django", "Flask",
  "PostgreSQL", "MongoDB", "Redis", "MySQL", "SQLite",
  "Docker", "Kubernetes", "AWS", "GCP", "Azure",
  "TypeScript", "JavaScript", "Python", "Go", "Rust"
];

// Date ranges (relative to now)
export const DATE_RANGES = {
  recent: 30,      // Last 30 days
  medium: 90,      // Last 90 days
  old: 365,        // Last year
  veryOld: 730     // Last 2 years
};

