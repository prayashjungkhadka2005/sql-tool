/**
 * Schema Templates
 * Pre-built database schemas for quick start
 */

import { SchemaTemplate } from '../types';

export const SCHEMA_TEMPLATES: SchemaTemplate[] = [
  // Simple User Authentication
  {
    id: 'user-auth',
    name: 'User Authentication',
    description: 'Basic user authentication with roles',
    category: 'Starter',
    difficulty: 'Beginner',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    useCases: ['Login system', 'User management', 'Role-based access'],
    schema: {
      name: 'User Authentication',
      description: 'Simple authentication schema with users and sessions',
      tables: [
        {
          id: 'users-1',
          name: 'users',
          position: { x: 100, y: 100 },
          columns: [
            { id: '1', name: 'id', type: 'INTEGER', nullable: false, unique: false, primaryKey: true, autoIncrement: true },
            { id: '2', name: 'email', type: 'VARCHAR', length: 255, nullable: false, unique: true, primaryKey: false, autoIncrement: false },
            { id: '3', name: 'password_hash', type: 'VARCHAR', length: 255, nullable: false, unique: false, primaryKey: false, autoIncrement: false },
            { id: '4', name: 'name', type: 'VARCHAR', length: 255, nullable: false, unique: false, primaryKey: false, autoIncrement: false },
            { id: '5', name: 'role', type: 'VARCHAR', length: 50, nullable: false, unique: false, primaryKey: false, autoIncrement: false, defaultValue: 'user' },
            { id: '6', name: 'created_at', type: 'TIMESTAMP', nullable: false, unique: false, primaryKey: false, autoIncrement: false, defaultValue: 'NOW()' },
          ],
          indexes: [],
        },
        {
          id: 'sessions-1',
          name: 'sessions',
          position: { x: 500, y: 100 },
          columns: [
            { id: '1', name: 'id', type: 'INTEGER', nullable: false, unique: false, primaryKey: true, autoIncrement: true },
            { id: '2', name: 'user_id', type: 'INTEGER', nullable: false, unique: false, primaryKey: false, autoIncrement: false, references: { table: 'users', column: 'id', onDelete: 'CASCADE' } },
            { id: '3', name: 'token', type: 'VARCHAR', length: 255, nullable: false, unique: true, primaryKey: false, autoIncrement: false },
            { id: '4', name: 'expires_at', type: 'TIMESTAMP', nullable: false, unique: false, primaryKey: false, autoIncrement: false },
            { id: '5', name: 'created_at', type: 'TIMESTAMP', nullable: false, unique: false, primaryKey: false, autoIncrement: false, defaultValue: 'NOW()' },
          ],
          indexes: [
            { id: 'idx-1', name: 'idx_sessions_user_id', columns: ['user_id'], type: 'BTREE', unique: false, comment: 'Foreign key index for optimal JOIN performance' },
          ],
        },
      ],
      relationships: [
        {
          id: 'rel-1',
          fromTable: 'sessions-1',
          fromColumn: 'user_id',
          toTable: 'users-1',
          toColumn: 'id',
          type: '1:N',
          onDelete: 'CASCADE',
        },
      ],
    },
  },

  // Blog Platform
  {
    id: 'blog',
    name: 'Blog Platform',
    description: 'Complete blog with posts, comments, and categories',
    category: 'Social',
    difficulty: 'Intermediate',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
    useCases: ['Blog website', 'Content management', 'Publishing platform'],
    schema: {
      name: 'Blog Platform',
      description: 'Blog schema with users, posts, comments, and categories',
      tables: [
        {
          id: 'users-blog',
          name: 'users',
          position: { x: 100, y: 50 },
          columns: [
            { id: '1', name: 'id', type: 'INTEGER', nullable: false, unique: false, primaryKey: true, autoIncrement: true },
            { id: '2', name: 'username', type: 'VARCHAR', length: 100, nullable: false, unique: true, primaryKey: false, autoIncrement: false },
            { id: '3', name: 'email', type: 'VARCHAR', length: 255, nullable: false, unique: true, primaryKey: false, autoIncrement: false },
            { id: '4', name: 'bio', type: 'TEXT', nullable: true, unique: false, primaryKey: false, autoIncrement: false },
            { id: '5', name: 'created_at', type: 'TIMESTAMP', nullable: false, unique: false, primaryKey: false, autoIncrement: false, defaultValue: 'NOW()' },
          ],
          indexes: [],
        },
        {
          id: 'posts-blog',
          name: 'posts',
          position: { x: 500, y: 50 },
          columns: [
            { id: '1', name: 'id', type: 'INTEGER', nullable: false, unique: false, primaryKey: true, autoIncrement: true },
            { id: '2', name: 'user_id', type: 'INTEGER', nullable: false, unique: false, primaryKey: false, autoIncrement: false, references: { table: 'users', column: 'id', onDelete: 'CASCADE' } },
            { id: '3', name: 'title', type: 'VARCHAR', length: 255, nullable: false, unique: false, primaryKey: false, autoIncrement: false },
            { id: '4', name: 'content', type: 'TEXT', nullable: false, unique: false, primaryKey: false, autoIncrement: false },
            { id: '5', name: 'published', type: 'BOOLEAN', nullable: false, unique: false, primaryKey: false, autoIncrement: false, defaultValue: 'false' },
            { id: '6', name: 'views', type: 'INTEGER', nullable: false, unique: false, primaryKey: false, autoIncrement: false, defaultValue: '0' },
            { id: '7', name: 'created_at', type: 'TIMESTAMP', nullable: false, unique: false, primaryKey: false, autoIncrement: false, defaultValue: 'NOW()' },
          ],
          indexes: [
            { id: 'idx-2', name: 'idx_posts_user_id', columns: ['user_id'], type: 'BTREE', unique: false, comment: 'Foreign key index for optimal JOIN performance' },
          ],
        },
        {
          id: 'comments-blog',
          name: 'comments',
          position: { x: 500, y: 400 },
          columns: [
            { id: '1', name: 'id', type: 'INTEGER', nullable: false, unique: false, primaryKey: true, autoIncrement: true },
            { id: '2', name: 'post_id', type: 'INTEGER', nullable: false, unique: false, primaryKey: false, autoIncrement: false, references: { table: 'posts', column: 'id', onDelete: 'CASCADE' } },
            { id: '3', name: 'user_id', type: 'INTEGER', nullable: false, unique: false, primaryKey: false, autoIncrement: false, references: { table: 'users', column: 'id', onDelete: 'CASCADE' } },
            { id: '4', name: 'content', type: 'TEXT', nullable: false, unique: false, primaryKey: false, autoIncrement: false },
            { id: '5', name: 'created_at', type: 'TIMESTAMP', nullable: false, unique: false, primaryKey: false, autoIncrement: false, defaultValue: 'NOW()' },
          ],
          indexes: [
            { id: 'idx-3', name: 'idx_comments_post_id', columns: ['post_id'], type: 'BTREE', unique: false, comment: 'Foreign key index for optimal JOIN performance' },
            { id: 'idx-4', name: 'idx_comments_user_id', columns: ['user_id'], type: 'BTREE', unique: false, comment: 'Foreign key index for optimal JOIN performance' },
          ],
        },
      ],
      relationships: [
        {
          id: 'rel-blog-1',
          fromTable: 'posts-blog',
          fromColumn: 'user_id',
          toTable: 'users-blog',
          toColumn: 'id',
          type: '1:N',
          onDelete: 'CASCADE',
        },
        {
          id: 'rel-blog-2',
          fromTable: 'comments-blog',
          fromColumn: 'post_id',
          toTable: 'posts-blog',
          toColumn: 'id',
          type: '1:N',
          onDelete: 'CASCADE',
        },
        {
          id: 'rel-blog-3',
          fromTable: 'comments-blog',
          fromColumn: 'user_id',
          toTable: 'users-blog',
          toColumn: 'id',
          type: '1:N',
          onDelete: 'CASCADE',
        },
      ],
    },
  },

  // E-commerce
  {
    id: 'ecommerce',
    name: 'E-commerce Store',
    description: 'Online store with products, orders, and cart',
    category: 'E-commerce',
    difficulty: 'Advanced',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    useCases: ['Online shop', 'Product catalog', 'Order management'],
    schema: {
      name: 'E-commerce Store',
      description: 'E-commerce database with products, orders, and shopping cart',
      tables: [
        {
          id: 'products-ec',
          name: 'products',
          position: { x: 100, y: 50 },
          columns: [
            { id: '1', name: 'id', type: 'INTEGER', nullable: false, unique: false, primaryKey: true, autoIncrement: true },
            { id: '2', name: 'name', type: 'VARCHAR', length: 255, nullable: false, unique: false, primaryKey: false, autoIncrement: false },
            { id: '3', name: 'description', type: 'TEXT', nullable: true, unique: false, primaryKey: false, autoIncrement: false },
            { id: '4', name: 'price', type: 'DECIMAL', precision: 10, scale: 2, nullable: false, unique: false, primaryKey: false, autoIncrement: false },
            { id: '5', name: 'stock', type: 'INTEGER', nullable: false, unique: false, primaryKey: false, autoIncrement: false, defaultValue: '0' },
            { id: '6', name: 'category', type: 'VARCHAR', length: 100, nullable: false, unique: false, primaryKey: false, autoIncrement: false },
            { id: '7', name: 'is_active', type: 'BOOLEAN', nullable: false, unique: false, primaryKey: false, autoIncrement: false, defaultValue: 'true' },
          ],
          indexes: [],
        },
        {
          id: 'customers-ec',
          name: 'customers',
          position: { x: 600, y: 50 },
          columns: [
            { id: '1', name: 'id', type: 'INTEGER', nullable: false, unique: false, primaryKey: true, autoIncrement: true },
            { id: '2', name: 'email', type: 'VARCHAR', length: 255, nullable: false, unique: true, primaryKey: false, autoIncrement: false },
            { id: '3', name: 'name', type: 'VARCHAR', length: 255, nullable: false, unique: false, primaryKey: false, autoIncrement: false },
            { id: '4', name: 'address', type: 'TEXT', nullable: true, unique: false, primaryKey: false, autoIncrement: false },
            { id: '5', name: 'created_at', type: 'TIMESTAMP', nullable: false, unique: false, primaryKey: false, autoIncrement: false, defaultValue: 'NOW()' },
          ],
          indexes: [],
        },
        {
          id: 'orders-ec',
          name: 'orders',
          position: { x: 350, y: 350 },
          columns: [
            { id: '1', name: 'id', type: 'INTEGER', nullable: false, unique: false, primaryKey: true, autoIncrement: true },
            { id: '2', name: 'customer_id', type: 'INTEGER', nullable: false, unique: false, primaryKey: false, autoIncrement: false, references: { table: 'customers', column: 'id', onDelete: 'CASCADE' } },
            { id: '3', name: 'product_id', type: 'INTEGER', nullable: false, unique: false, primaryKey: false, autoIncrement: false, references: { table: 'products', column: 'id', onDelete: 'CASCADE' } },
            { id: '4', name: 'quantity', type: 'INTEGER', nullable: false, unique: false, primaryKey: false, autoIncrement: false, defaultValue: '1' },
            { id: '5', name: 'total', type: 'DECIMAL', precision: 10, scale: 2, nullable: false, unique: false, primaryKey: false, autoIncrement: false },
            { id: '6', name: 'status', type: 'VARCHAR', length: 50, nullable: false, unique: false, primaryKey: false, autoIncrement: false, defaultValue: 'pending' },
            { id: '7', name: 'created_at', type: 'TIMESTAMP', nullable: false, unique: false, primaryKey: false, autoIncrement: false, defaultValue: 'NOW()' },
          ],
          indexes: [
            { id: 'idx-5', name: 'idx_orders_customer_id', columns: ['customer_id'], type: 'BTREE', unique: false, comment: 'Foreign key index for optimal JOIN performance' },
            { id: 'idx-6', name: 'idx_orders_product_id', columns: ['product_id'], type: 'BTREE', unique: false, comment: 'Foreign key index for optimal JOIN performance' },
          ],
        },
      ],
      relationships: [
        {
          id: 'rel-ec-1',
          fromTable: 'orders-ec',
          fromColumn: 'customer_id',
          toTable: 'customers-ec',
          toColumn: 'id',
          type: '1:N',
          onDelete: 'CASCADE',
        },
        {
          id: 'rel-ec-2',
          fromTable: 'orders-ec',
          fromColumn: 'product_id',
          toTable: 'products-ec',
          toColumn: 'id',
          type: '1:N',
          onDelete: 'CASCADE',
        },
      ],
    },
  },

  // Social Network
  {
    id: 'social-network',
    name: 'Social Network',
    description: 'Social platform with posts, followers, and likes',
    category: 'Social',
    difficulty: 'Advanced',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    useCases: ['Social media', 'Community platform', 'Networking app'],
    schema: {
      name: 'Social Network',
      description: 'Social network schema with users, posts, and interactions',
      tables: [
        {
          id: 'users-social',
          name: 'users',
          position: { x: 400, y: 50 },
          columns: [
            { id: '1', name: 'id', type: 'INTEGER', nullable: false, unique: false, primaryKey: true, autoIncrement: true },
            { id: '2', name: 'username', type: 'VARCHAR', length: 50, nullable: false, unique: true, primaryKey: false, autoIncrement: false },
            { id: '3', name: 'email', type: 'VARCHAR', length: 255, nullable: false, unique: true, primaryKey: false, autoIncrement: false },
            { id: '4', name: 'bio', type: 'TEXT', nullable: true, unique: false, primaryKey: false, autoIncrement: false },
            { id: '5', name: 'avatar_url', type: 'VARCHAR', length: 500, nullable: true, unique: false, primaryKey: false, autoIncrement: false },
            { id: '6', name: 'created_at', type: 'TIMESTAMP', nullable: false, unique: false, primaryKey: false, autoIncrement: false, defaultValue: 'NOW()' },
          ],
          indexes: [],
        },
        {
          id: 'posts-social',
          name: 'posts',
          position: { x: 100, y: 350 },
          columns: [
            { id: '1', name: 'id', type: 'INTEGER', nullable: false, unique: false, primaryKey: true, autoIncrement: true },
            { id: '2', name: 'user_id', type: 'INTEGER', nullable: false, unique: false, primaryKey: false, autoIncrement: false, references: { table: 'users', column: 'id', onDelete: 'CASCADE' } },
            { id: '3', name: 'content', type: 'TEXT', nullable: false, unique: false, primaryKey: false, autoIncrement: false },
            { id: '4', name: 'image_url', type: 'VARCHAR', length: 500, nullable: true, unique: false, primaryKey: false, autoIncrement: false },
            { id: '5', name: 'likes_count', type: 'INTEGER', nullable: false, unique: false, primaryKey: false, autoIncrement: false, defaultValue: '0' },
            { id: '6', name: 'created_at', type: 'TIMESTAMP', nullable: false, unique: false, primaryKey: false, autoIncrement: false, defaultValue: 'NOW()' },
          ],
          indexes: [
            { id: 'idx-7', name: 'idx_posts_user_id', columns: ['user_id'], type: 'BTREE', unique: false, comment: 'Foreign key index for optimal JOIN performance' },
          ],
        },
        {
          id: 'follows-social',
          name: 'follows',
          position: { x: 700, y: 350 },
          columns: [
            { id: '1', name: 'id', type: 'INTEGER', nullable: false, unique: false, primaryKey: true, autoIncrement: true },
            { id: '2', name: 'follower_id', type: 'INTEGER', nullable: false, unique: false, primaryKey: false, autoIncrement: false, references: { table: 'users', column: 'id', onDelete: 'CASCADE' } },
            { id: '3', name: 'following_id', type: 'INTEGER', nullable: false, unique: false, primaryKey: false, autoIncrement: false, references: { table: 'users', column: 'id', onDelete: 'CASCADE' } },
            { id: '4', name: 'created_at', type: 'TIMESTAMP', nullable: false, unique: false, primaryKey: false, autoIncrement: false, defaultValue: 'NOW()' },
          ],
          indexes: [
            { id: 'idx-8', name: 'idx_follows_follower_id', columns: ['follower_id'], type: 'BTREE', unique: false, comment: 'Foreign key index for optimal JOIN performance' },
            { id: 'idx-9', name: 'idx_follows_following_id', columns: ['following_id'], type: 'BTREE', unique: false, comment: 'Foreign key index for optimal JOIN performance' },
          ],
        },
      ],
      relationships: [
        {
          id: 'rel-social-1',
          fromTable: 'posts-social',
          fromColumn: 'user_id',
          toTable: 'users-social',
          toColumn: 'id',
          type: '1:N',
          onDelete: 'CASCADE',
        },
        {
          id: 'rel-social-2',
          fromTable: 'follows-social',
          fromColumn: 'follower_id',
          toTable: 'users-social',
          toColumn: 'id',
          type: '1:N',
          onDelete: 'CASCADE',
        },
        {
          id: 'rel-social-3',
          fromTable: 'follows-social',
          fromColumn: 'following_id',
          toTable: 'users-social',
          toColumn: 'id',
          type: '1:N',
          onDelete: 'CASCADE',
        },
      ],
    },
  },
];

