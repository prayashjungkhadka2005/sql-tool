/**
 * Schema Templates
 * Pre-built database schemas inspired by popular products
 * Educational purposes - not affiliated with or endorsed by mentioned companies
 */

import { SchemaTemplate } from '../types';

export const SCHEMA_TEMPLATES: SchemaTemplate[] = [
  // ============================================
  // 🎯 POPULAR PRODUCT-INSPIRED TEMPLATES
  // ============================================

  // Twitter-like Microblogging
  {
    id: 'twitter-inspired',
    name: 'Twitter-inspired Microblogging',
    description: 'Microblogging platform with tweets, retweets, likes, follows, and mentions (inspired by Twitter/X)',
    category: 'Social',
    difficulty: 'Advanced',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    useCases: [
      'Microblogging platform (Twitter, Mastodon, Bluesky)',
      'Social feed with engagement metrics',
      'Real-time trending topics and hashtags'
    ],
    schema: {
      name: 'Twitter-inspired Microblogging',
      description: 'Social microblogging platform with tweets, engagement, and social graph',
      tables: [
        {
          id: 'users-twitter',
          name: 'users',
          position: { x: 400, y: 50 },
          columns: [
            { id: '1', name: 'id', type: 'INTEGER', nullable: false, unique: false, primaryKey: true, autoIncrement: true },
            { id: '2', name: 'username', type: 'VARCHAR', length: 15, nullable: false, unique: true, primaryKey: false, autoIncrement: false, comment: 'Unique handle (e.g., @johndoe)' },
            { id: '3', name: 'email', type: 'VARCHAR', length: 255, nullable: false, unique: true, primaryKey: false, autoIncrement: false },
            { id: '4', name: 'display_name', type: 'VARCHAR', length: 50, nullable: false, unique: false, primaryKey: false, autoIncrement: false },
            { id: '5', name: 'bio', type: 'VARCHAR', length: 160, nullable: true, unique: false, primaryKey: false, autoIncrement: false },
            { id: '6', name: 'avatar_url', type: 'VARCHAR', length: 500, nullable: true, unique: false, primaryKey: false, autoIncrement: false },
            { id: '7', name: 'verified', type: 'BOOLEAN', nullable: false, unique: false, primaryKey: false, autoIncrement: false, defaultValue: 'false' },
            { id: '8', name: 'followers_count', type: 'INTEGER', nullable: false, unique: false, primaryKey: false, autoIncrement: false, defaultValue: '0', comment: 'Denormalized for performance' },
            { id: '9', name: 'following_count', type: 'INTEGER', nullable: false, unique: false, primaryKey: false, autoIncrement: false, defaultValue: '0' },
            { id: '10', name: 'created_at', type: 'TIMESTAMP', nullable: false, unique: false, primaryKey: false, autoIncrement: false, defaultValue: 'NOW()' },
          ],
          indexes: [
            { id: 'idx-tw-1', name: 'idx_users_username', columns: ['username'], type: 'BTREE', unique: true, comment: 'Fast lookup by @handle' },
          ],
        },
        {
          id: 'tweets-twitter',
          name: 'tweets',
          position: { x: 100, y: 400 },
          columns: [
            { id: '1', name: 'id', type: 'BIGINT', nullable: false, unique: false, primaryKey: true, autoIncrement: true, comment: 'BIGINT for billions of tweets' },
            { id: '2', name: 'user_id', type: 'INTEGER', nullable: false, unique: false, primaryKey: false, autoIncrement: false, references: { table: 'users', column: 'id', onDelete: 'CASCADE' } },
            { id: '3', name: 'content', type: 'VARCHAR', length: 280, nullable: false, unique: false, primaryKey: false, autoIncrement: false, comment: 'Classic 280 character limit' },
            { id: '4', name: 'reply_to_id', type: 'BIGINT', nullable: true, unique: false, primaryKey: false, autoIncrement: false, references: { table: 'tweets', column: 'id', onDelete: 'CASCADE' }, comment: 'NULL for original tweets' },
            { id: '5', name: 'retweet_of_id', type: 'BIGINT', nullable: true, unique: false, primaryKey: false, autoIncrement: false, references: { table: 'tweets', column: 'id', onDelete: 'CASCADE' }, comment: 'NULL for original content' },
            { id: '6', name: 'likes_count', type: 'INTEGER', nullable: false, unique: false, primaryKey: false, autoIncrement: false, defaultValue: '0', comment: 'Denormalized counter' },
            { id: '7', name: 'retweets_count', type: 'INTEGER', nullable: false, unique: false, primaryKey: false, autoIncrement: false, defaultValue: '0' },
            { id: '8', name: 'replies_count', type: 'INTEGER', nullable: false, unique: false, primaryKey: false, autoIncrement: false, defaultValue: '0' },
            { id: '9', name: 'created_at', type: 'TIMESTAMP', nullable: false, unique: false, primaryKey: false, autoIncrement: false, defaultValue: 'NOW()' },
          ],
          indexes: [
            { id: 'idx-tw-2', name: 'idx_tweets_user_id', columns: ['user_id'], type: 'BTREE', unique: false, comment: 'User timeline queries' },
            { id: 'idx-tw-3', name: 'idx_tweets_created_at', columns: ['created_at'], type: 'BTREE', unique: false, comment: 'Chronological feed generation' },
            { id: 'idx-tw-4', name: 'idx_tweets_reply_to', columns: ['reply_to_id'], type: 'BTREE', unique: false, comment: 'Thread reconstruction' },
            { id: 'idx-tw-13', name: 'idx_tweets_retweet_of', columns: ['retweet_of_id'], type: 'BTREE', unique: false, comment: 'Foreign key index for retweet queries' },
          ],
        },
        {
          id: 'likes-twitter',
          name: 'likes',
          position: { x: 100, y: 750 },
          columns: [
            { id: '1', name: 'id', type: 'BIGINT', nullable: false, unique: false, primaryKey: true, autoIncrement: true },
            { id: '2', name: 'user_id', type: 'INTEGER', nullable: false, unique: false, primaryKey: false, autoIncrement: false, references: { table: 'users', column: 'id', onDelete: 'CASCADE' } },
            { id: '3', name: 'tweet_id', type: 'BIGINT', nullable: false, unique: false, primaryKey: false, autoIncrement: false, references: { table: 'tweets', column: 'id', onDelete: 'CASCADE' } },
            { id: '4', name: 'created_at', type: 'TIMESTAMP', nullable: false, unique: false, primaryKey: false, autoIncrement: false, defaultValue: 'NOW()' },
          ],
          indexes: [
            { id: 'idx-tw-5', name: 'idx_likes_user_tweet', columns: ['user_id', 'tweet_id'], type: 'BTREE', unique: true, comment: 'Prevent duplicate likes + fast lookup' },
            { id: 'idx-tw-6', name: 'idx_likes_tweet_id', columns: ['tweet_id'], type: 'BTREE', unique: false, comment: 'Who liked this tweet' },
          ],
        },
        {
          id: 'follows-twitter',
          name: 'follows',
          position: { x: 700, y: 400 },
          columns: [
            { id: '1', name: 'id', type: 'INTEGER', nullable: false, unique: false, primaryKey: true, autoIncrement: true },
            { id: '2', name: 'follower_id', type: 'INTEGER', nullable: false, unique: false, primaryKey: false, autoIncrement: false, references: { table: 'users', column: 'id', onDelete: 'CASCADE' }, comment: 'Who is following' },
            { id: '3', name: 'following_id', type: 'INTEGER', nullable: false, unique: false, primaryKey: false, autoIncrement: false, references: { table: 'users', column: 'id', onDelete: 'CASCADE' }, comment: 'Who is being followed' },
            { id: '4', name: 'created_at', type: 'TIMESTAMP', nullable: false, unique: false, primaryKey: false, autoIncrement: false, defaultValue: 'NOW()' },
          ],
          indexes: [
            { id: 'idx-tw-7', name: 'idx_follows_follower_following', columns: ['follower_id', 'following_id'], type: 'BTREE', unique: true, comment: 'Prevent duplicate follows' },
            { id: 'idx-tw-8', name: 'idx_follows_following_id', columns: ['following_id'], type: 'BTREE', unique: false, comment: 'Followers list' },
          ],
        },
        {
          id: 'hashtags-twitter',
          name: 'hashtags',
          position: { x: 500, y: 750 },
          columns: [
            { id: '1', name: 'id', type: 'INTEGER', nullable: false, unique: false, primaryKey: true, autoIncrement: true },
            { id: '2', name: 'tag', type: 'VARCHAR', length: 50, nullable: false, unique: true, primaryKey: false, autoIncrement: false, comment: 'Lowercase tag name' },
            { id: '3', name: 'tweet_count', type: 'INTEGER', nullable: false, unique: false, primaryKey: false, autoIncrement: false, defaultValue: '0', comment: 'For trending calculation' },
            { id: '4', name: 'created_at', type: 'TIMESTAMP', nullable: false, unique: false, primaryKey: false, autoIncrement: false, defaultValue: 'NOW()' },
          ],
          indexes: [
            { id: 'idx-tw-9', name: 'idx_hashtags_tag', columns: ['tag'], type: 'BTREE', unique: true, comment: 'Fast hashtag lookup' },
            { id: 'idx-tw-10', name: 'idx_hashtags_tweet_count', columns: ['tweet_count'], type: 'BTREE', unique: false, comment: 'Trending hashtags' },
          ],
        },
        {
          id: 'tweet_hashtags-twitter',
          name: 'tweet_hashtags',
          position: { x: 300, y: 900 },
          columns: [
            { id: '1', name: 'tweet_id', type: 'BIGINT', nullable: false, unique: false, primaryKey: true, autoIncrement: false, references: { table: 'tweets', column: 'id', onDelete: 'CASCADE' } },
            { id: '2', name: 'hashtag_id', type: 'INTEGER', nullable: false, unique: false, primaryKey: true, autoIncrement: false, references: { table: 'hashtags', column: 'id', onDelete: 'CASCADE' } },
          ],
          indexes: [
            { id: 'idx-tw-11', name: 'idx_tweet_hashtags_tweet', columns: ['tweet_id'], type: 'BTREE', unique: false, comment: 'Hashtags in tweet' },
            { id: 'idx-tw-12', name: 'idx_tweet_hashtags_hashtag', columns: ['hashtag_id'], type: 'BTREE', unique: false, comment: 'Tweets with hashtag' },
          ],
        },
      ],
      relationships: [],
    },
  },

  // Stripe-like Payment System
  {
    id: 'stripe-inspired',
    name: 'Stripe-inspired Payment System',
    description: 'Payment processing platform with subscriptions, invoices, and webhooks (inspired by Stripe)',
    category: 'SaaS',
    difficulty: 'Advanced',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
    useCases: [
      'Subscription billing (SaaS, memberships)',
      'Payment processing and checkout',
      'Financial audit trails and compliance'
    ],
    schema: {
      name: 'Stripe-inspired Payment System',
      description: 'Subscription billing and payment processing with audit trails',
      tables: [
        {
          id: 'customers-stripe',
          name: 'customers',
          position: { x: 100, y: 50 },
          columns: [
            { id: '1', name: 'id', type: 'INTEGER', nullable: false, unique: false, primaryKey: true, autoIncrement: true },
            { id: '2', name: 'email', type: 'VARCHAR', length: 255, nullable: false, unique: true, primaryKey: false, autoIncrement: false },
            { id: '3', name: 'name', type: 'VARCHAR', length: 255, nullable: false, unique: false, primaryKey: false, autoIncrement: false },
            { id: '4', name: 'balance', type: 'DECIMAL', precision: 10, scale: 2, nullable: false, unique: false, primaryKey: false, autoIncrement: false, defaultValue: '0.00', comment: 'Account balance (credits/debits)' },
            { id: '5', name: 'currency', type: 'CHAR', length: 3, nullable: false, unique: false, primaryKey: false, autoIncrement: false, defaultValue: 'USD', comment: 'ISO 4217 currency code' },
            { id: '6', name: 'metadata', type: 'JSONB', nullable: true, unique: false, primaryKey: false, autoIncrement: false, comment: 'Custom key-value pairs' },
            { id: '7', name: 'created_at', type: 'TIMESTAMP', nullable: false, unique: false, primaryKey: false, autoIncrement: false, defaultValue: 'NOW()' },
          ],
          indexes: [
            { id: 'idx-st-1', name: 'idx_customers_email', columns: ['email'], type: 'BTREE', unique: true, comment: 'Fast customer lookup' },
          ],
        },
        {
          id: 'payment_methods-stripe',
          name: 'payment_methods',
          position: { x: 500, y: 50 },
          columns: [
            { id: '1', name: 'id', type: 'INTEGER', nullable: false, unique: false, primaryKey: true, autoIncrement: true },
            { id: '2', name: 'customer_id', type: 'INTEGER', nullable: false, unique: false, primaryKey: false, autoIncrement: false, references: { table: 'customers', column: 'id', onDelete: 'CASCADE' } },
            { id: '3', name: 'type', type: 'VARCHAR', length: 20, nullable: false, unique: false, primaryKey: false, autoIncrement: false, comment: 'card, bank_account, etc.' },
            { id: '4', name: 'last4', type: 'CHAR', length: 4, nullable: false, unique: false, primaryKey: false, autoIncrement: false, comment: 'Last 4 digits (PCI compliance)' },
            { id: '5', name: 'brand', type: 'VARCHAR', length: 20, nullable: true, unique: false, primaryKey: false, autoIncrement: false, comment: 'Visa, Mastercard, etc.' },
            { id: '6', name: 'exp_month', type: 'SMALLINT', nullable: true, unique: false, primaryKey: false, autoIncrement: false },
            { id: '7', name: 'exp_year', type: 'SMALLINT', nullable: true, unique: false, primaryKey: false, autoIncrement: false },
            { id: '8', name: 'is_default', type: 'BOOLEAN', nullable: false, unique: false, primaryKey: false, autoIncrement: false, defaultValue: 'false' },
            { id: '9', name: 'created_at', type: 'TIMESTAMP', nullable: false, unique: false, primaryKey: false, autoIncrement: false, defaultValue: 'NOW()' },
          ],
          indexes: [
            { id: 'idx-st-2', name: 'idx_payment_methods_customer', columns: ['customer_id'], type: 'BTREE', unique: false },
          ],
        },
        {
          id: 'subscriptions-stripe',
          name: 'subscriptions',
          position: { x: 100, y: 350 },
          columns: [
            { id: '1', name: 'id', type: 'INTEGER', nullable: false, unique: false, primaryKey: true, autoIncrement: true },
            { id: '2', name: 'customer_id', type: 'INTEGER', nullable: false, unique: false, primaryKey: false, autoIncrement: false, references: { table: 'customers', column: 'id', onDelete: 'CASCADE' } },
            { id: '3', name: 'status', type: 'VARCHAR', length: 20, nullable: false, unique: false, primaryKey: false, autoIncrement: false, comment: 'active, canceled, past_due, etc.' },
            { id: '4', name: 'plan_id', type: 'VARCHAR', length: 50, nullable: false, unique: false, primaryKey: false, autoIncrement: false, comment: 'Reference to pricing plan' },
            { id: '5', name: 'amount', type: 'DECIMAL', precision: 10, scale: 2, nullable: false, unique: false, primaryKey: false, autoIncrement: false, comment: 'Recurring amount' },
            { id: '6', name: 'interval', type: 'VARCHAR', length: 10, nullable: false, unique: false, primaryKey: false, autoIncrement: false, comment: 'month, year, etc.' },
            { id: '7', name: 'current_period_start', type: 'TIMESTAMP', nullable: false, unique: false, primaryKey: false, autoIncrement: false },
            { id: '8', name: 'current_period_end', type: 'TIMESTAMP', nullable: false, unique: false, primaryKey: false, autoIncrement: false },
            { id: '9', name: 'cancel_at_period_end', type: 'BOOLEAN', nullable: false, unique: false, primaryKey: false, autoIncrement: false, defaultValue: 'false' },
            { id: '10', name: 'created_at', type: 'TIMESTAMP', nullable: false, unique: false, primaryKey: false, autoIncrement: false, defaultValue: 'NOW()' },
          ],
          indexes: [
            { id: 'idx-st-3', name: 'idx_subscriptions_customer', columns: ['customer_id'], type: 'BTREE', unique: false },
            { id: 'idx-st-4', name: 'idx_subscriptions_status', columns: ['status'], type: 'BTREE', unique: false, comment: 'Filter active subscriptions' },
          ],
        },
        {
          id: 'invoices-stripe',
          name: 'invoices',
          position: { x: 500, y: 350 },
          columns: [
            { id: '1', name: 'id', type: 'INTEGER', nullable: false, unique: false, primaryKey: true, autoIncrement: true },
            { id: '2', name: 'customer_id', type: 'INTEGER', nullable: false, unique: false, primaryKey: false, autoIncrement: false, references: { table: 'customers', column: 'id', onDelete: 'CASCADE' } },
            { id: '3', name: 'subscription_id', type: 'INTEGER', nullable: true, unique: false, primaryKey: false, autoIncrement: false, references: { table: 'subscriptions', column: 'id', onDelete: 'SET NULL' }, comment: 'NULL for one-time payments' },
            { id: '4', name: 'number', type: 'VARCHAR', length: 50, nullable: false, unique: true, primaryKey: false, autoIncrement: false, comment: 'Invoice number (INV-001)' },
            { id: '5', name: 'status', type: 'VARCHAR', length: 20, nullable: false, unique: false, primaryKey: false, autoIncrement: false, comment: 'draft, open, paid, void' },
            { id: '6', name: 'amount_due', type: 'DECIMAL', precision: 10, scale: 2, nullable: false, unique: false, primaryKey: false, autoIncrement: false },
            { id: '7', name: 'amount_paid', type: 'DECIMAL', precision: 10, scale: 2, nullable: false, unique: false, primaryKey: false, autoIncrement: false, defaultValue: '0.00' },
            { id: '8', name: 'currency', type: 'CHAR', length: 3, nullable: false, unique: false, primaryKey: false, autoIncrement: false, defaultValue: 'USD' },
            { id: '9', name: 'due_date', type: 'DATE', nullable: true, unique: false, primaryKey: false, autoIncrement: false },
            { id: '10', name: 'paid_at', type: 'TIMESTAMP', nullable: true, unique: false, primaryKey: false, autoIncrement: false },
            { id: '11', name: 'created_at', type: 'TIMESTAMP', nullable: false, unique: false, primaryKey: false, autoIncrement: false, defaultValue: 'NOW()' },
          ],
          indexes: [
            { id: 'idx-st-5', name: 'idx_invoices_customer', columns: ['customer_id'], type: 'BTREE', unique: false },
            { id: 'idx-st-6', name: 'idx_invoices_number', columns: ['number'], type: 'BTREE', unique: true },
            { id: 'idx-st-7', name: 'idx_invoices_status', columns: ['status'], type: 'BTREE', unique: false },
            { id: 'idx-st-13', name: 'idx_invoices_subscription', columns: ['subscription_id'], type: 'BTREE', unique: false, comment: 'Foreign key index for subscription invoices' },
          ],
        },
        {
          id: 'charges-stripe',
          name: 'charges',
          position: { x: 300, y: 650 },
          columns: [
            { id: '1', name: 'id', type: 'INTEGER', nullable: false, unique: false, primaryKey: true, autoIncrement: true },
            { id: '2', name: 'customer_id', type: 'INTEGER', nullable: false, unique: false, primaryKey: false, autoIncrement: false, references: { table: 'customers', column: 'id', onDelete: 'CASCADE' } },
            { id: '3', name: 'invoice_id', type: 'INTEGER', nullable: true, unique: false, primaryKey: false, autoIncrement: false, references: { table: 'invoices', column: 'id', onDelete: 'SET NULL' } },
            { id: '4', name: 'payment_method_id', type: 'INTEGER', nullable: false, unique: false, primaryKey: false, autoIncrement: false, references: { table: 'payment_methods', column: 'id', onDelete: 'RESTRICT' } },
            { id: '5', name: 'amount', type: 'DECIMAL', precision: 10, scale: 2, nullable: false, unique: false, primaryKey: false, autoIncrement: false, comment: 'Immutable for audit' },
            { id: '6', name: 'currency', type: 'CHAR', length: 3, nullable: false, unique: false, primaryKey: false, autoIncrement: false },
            { id: '7', name: 'status', type: 'VARCHAR', length: 20, nullable: false, unique: false, primaryKey: false, autoIncrement: false, comment: 'succeeded, failed, pending' },
            { id: '8', name: 'failure_code', type: 'VARCHAR', length: 50, nullable: true, unique: false, primaryKey: false, autoIncrement: false },
            { id: '9', name: 'failure_message', type: 'TEXT', nullable: true, unique: false, primaryKey: false, autoIncrement: false },
            { id: '10', name: 'idempotency_key', type: 'UUID', nullable: true, unique: true, primaryKey: false, autoIncrement: false, comment: 'Prevent duplicate charges' },
            { id: '11', name: 'created_at', type: 'TIMESTAMP', nullable: false, unique: false, primaryKey: false, autoIncrement: false, defaultValue: 'NOW()' },
          ],
          indexes: [
            { id: 'idx-st-8', name: 'idx_charges_customer', columns: ['customer_id'], type: 'BTREE', unique: false },
            { id: 'idx-st-9', name: 'idx_charges_invoice', columns: ['invoice_id'], type: 'BTREE', unique: false },
            { id: 'idx-st-10', name: 'idx_charges_idempotency', columns: ['idempotency_key'], type: 'BTREE', unique: true },
            { id: 'idx-st-14', name: 'idx_charges_payment_method', columns: ['payment_method_id'], type: 'BTREE', unique: false, comment: 'Foreign key index for payment method lookups' },
          ],
        },
        {
          id: 'webhook_events-stripe',
          name: 'webhook_events',
          position: { x: 700, y: 650 },
          columns: [
            { id: '1', name: 'id', type: 'INTEGER', nullable: false, unique: false, primaryKey: true, autoIncrement: true },
            { id: '2', name: 'event_type', type: 'VARCHAR', length: 100, nullable: false, unique: false, primaryKey: false, autoIncrement: false, comment: 'payment.succeeded, etc.' },
            { id: '3', name: 'resource_id', type: 'INTEGER', nullable: false, unique: false, primaryKey: false, autoIncrement: false, comment: 'Related object ID' },
            { id: '4', name: 'resource_type', type: 'VARCHAR', length: 50, nullable: false, unique: false, primaryKey: false, autoIncrement: false, comment: 'charge, invoice, etc.' },
            { id: '5', name: 'data', type: 'JSONB', nullable: false, unique: false, primaryKey: false, autoIncrement: false, comment: 'Full event payload' },
            { id: '6', name: 'processed', type: 'BOOLEAN', nullable: false, unique: false, primaryKey: false, autoIncrement: false, defaultValue: 'false' },
            { id: '7', name: 'created_at', type: 'TIMESTAMP', nullable: false, unique: false, primaryKey: false, autoIncrement: false, defaultValue: 'NOW()' },
          ],
          indexes: [
            { id: 'idx-st-11', name: 'idx_webhooks_type', columns: ['event_type'], type: 'BTREE', unique: false },
            { id: 'idx-st-12', name: 'idx_webhooks_processed', columns: ['processed'], type: 'BTREE', unique: false, comment: 'Unprocessed events queue' },
          ],
        },
      ],
      relationships: [],
    },
  },

  // Slack-like Team Chat
  {
    id: 'slack-inspired',
    name: 'Slack-inspired Team Chat',
    description: 'Team collaboration platform with workspaces, channels, and threaded messages (inspired by Slack)',
    category: 'SaaS',
    difficulty: 'Advanced',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    ),
    useCases: [
      'Team communication (Slack, Discord, Microsoft Teams)',
      'Multi-tenant SaaS with workspaces',
      'Real-time messaging with threads'
    ],
    schema: {
      name: 'Slack-inspired Team Chat',
      description: 'Multi-tenant team chat with channels, threads, and reactions',
      tables: [
        {
          id: 'workspaces-slack',
          name: 'workspaces',
          position: { x: 100, y: 50 },
          columns: [
            { id: '1', name: 'id', type: 'INTEGER', nullable: false, unique: false, primaryKey: true, autoIncrement: true },
            { id: '2', name: 'name', type: 'VARCHAR', length: 100, nullable: false, unique: false, primaryKey: false, autoIncrement: false },
            { id: '3', name: 'slug', type: 'VARCHAR', length: 50, nullable: false, unique: true, primaryKey: false, autoIncrement: false, comment: 'URL-friendly (acme-corp.slack.com)' },
            { id: '4', name: 'icon_url', type: 'VARCHAR', length: 500, nullable: true, unique: false, primaryKey: false, autoIncrement: false },
            { id: '5', name: 'created_at', type: 'TIMESTAMP', nullable: false, unique: false, primaryKey: false, autoIncrement: false, defaultValue: 'NOW()' },
          ],
          indexes: [
            { id: 'idx-sl-1', name: 'idx_workspaces_slug', columns: ['slug'], type: 'BTREE', unique: true },
          ],
        },
        {
          id: 'users-slack',
          name: 'users',
          position: { x: 500, y: 50 },
          columns: [
            { id: '1', name: 'id', type: 'INTEGER', nullable: false, unique: false, primaryKey: true, autoIncrement: true },
            { id: '2', name: 'email', type: 'VARCHAR', length: 255, nullable: false, unique: true, primaryKey: false, autoIncrement: false },
            { id: '3', name: 'display_name', type: 'VARCHAR', length: 100, nullable: false, unique: false, primaryKey: false, autoIncrement: false },
            { id: '4', name: 'avatar_url', type: 'VARCHAR', length: 500, nullable: true, unique: false, primaryKey: false, autoIncrement: false },
            { id: '5', name: 'status', type: 'VARCHAR', length: 100, nullable: true, unique: false, primaryKey: false, autoIncrement: false, comment: 'Custom status message' },
            { id: '6', name: 'created_at', type: 'TIMESTAMP', nullable: false, unique: false, primaryKey: false, autoIncrement: false, defaultValue: 'NOW()' },
          ],
          indexes: [
            { id: 'idx-sl-2', name: 'idx_users_email', columns: ['email'], type: 'BTREE', unique: true },
          ],
        },
        {
          id: 'workspace_members-slack',
          name: 'workspace_members',
          position: { x: 300, y: 250 },
          columns: [
            { id: '1', name: 'id', type: 'INTEGER', nullable: false, unique: false, primaryKey: true, autoIncrement: true },
            { id: '2', name: 'workspace_id', type: 'INTEGER', nullable: false, unique: false, primaryKey: false, autoIncrement: false, references: { table: 'workspaces', column: 'id', onDelete: 'CASCADE' } },
            { id: '3', name: 'user_id', type: 'INTEGER', nullable: false, unique: false, primaryKey: false, autoIncrement: false, references: { table: 'users', column: 'id', onDelete: 'CASCADE' } },
            { id: '4', name: 'role', type: 'VARCHAR', length: 20, nullable: false, unique: false, primaryKey: false, autoIncrement: false, defaultValue: 'member', comment: 'admin, member, guest' },
            { id: '5', name: 'joined_at', type: 'TIMESTAMP', nullable: false, unique: false, primaryKey: false, autoIncrement: false, defaultValue: 'NOW()' },
          ],
          indexes: [
            { id: 'idx-sl-3', name: 'idx_workspace_members_workspace', columns: ['workspace_id'], type: 'BTREE', unique: false },
            { id: 'idx-sl-4', name: 'idx_workspace_members_user', columns: ['user_id'], type: 'BTREE', unique: false },
            { id: 'idx-sl-5', name: 'idx_workspace_members_unique', columns: ['workspace_id', 'user_id'], type: 'BTREE', unique: true, comment: 'Prevent duplicate membership' },
          ],
        },
        {
          id: 'channels-slack',
          name: 'channels',
          position: { x: 100, y: 450 },
          columns: [
            { id: '1', name: 'id', type: 'INTEGER', nullable: false, unique: false, primaryKey: true, autoIncrement: true },
            { id: '2', name: 'workspace_id', type: 'INTEGER', nullable: false, unique: false, primaryKey: false, autoIncrement: false, references: { table: 'workspaces', column: 'id', onDelete: 'CASCADE' } },
            { id: '3', name: 'name', type: 'VARCHAR', length: 80, nullable: false, unique: false, primaryKey: false, autoIncrement: false, comment: 'Channel name (#general)' },
            { id: '4', name: 'description', type: 'VARCHAR', length: 250, nullable: true, unique: false, primaryKey: false, autoIncrement: false },
            { id: '5', name: 'is_private', type: 'BOOLEAN', nullable: false, unique: false, primaryKey: false, autoIncrement: false, defaultValue: 'false' },
            { id: '6', name: 'created_by', type: 'INTEGER', nullable: false, unique: false, primaryKey: false, autoIncrement: false, references: { table: 'users', column: 'id', onDelete: 'RESTRICT' } },
            { id: '7', name: 'created_at', type: 'TIMESTAMP', nullable: false, unique: false, primaryKey: false, autoIncrement: false, defaultValue: 'NOW()' },
          ],
          indexes: [
            { id: 'idx-sl-6', name: 'idx_channels_workspace', columns: ['workspace_id'], type: 'BTREE', unique: false },
            { id: 'idx-sl-7', name: 'idx_channels_name', columns: ['workspace_id', 'name'], type: 'BTREE', unique: true, comment: 'Unique channel names per workspace' },
            { id: 'idx-sl-15', name: 'idx_channels_created_by', columns: ['created_by'], type: 'BTREE', unique: false, comment: 'Foreign key index for channel creator' },
          ],
        },
        {
          id: 'channel_members-slack',
          name: 'channel_members',
          position: { x: 500, y: 450 },
          columns: [
            { id: '1', name: 'channel_id', type: 'INTEGER', nullable: false, unique: false, primaryKey: true, autoIncrement: false, references: { table: 'channels', column: 'id', onDelete: 'CASCADE' } },
            { id: '2', name: 'user_id', type: 'INTEGER', nullable: false, unique: false, primaryKey: true, autoIncrement: false, references: { table: 'users', column: 'id', onDelete: 'CASCADE' } },
            { id: '3', name: 'joined_at', type: 'TIMESTAMP', nullable: false, unique: false, primaryKey: false, autoIncrement: false, defaultValue: 'NOW()' },
          ],
          indexes: [
            { id: 'idx-sl-8', name: 'idx_channel_members_channel', columns: ['channel_id'], type: 'BTREE', unique: false },
            { id: 'idx-sl-9', name: 'idx_channel_members_user', columns: ['user_id'], type: 'BTREE', unique: false },
          ],
        },
        {
          id: 'messages-slack',
          name: 'messages',
          position: { x: 100, y: 750 },
          columns: [
            { id: '1', name: 'id', type: 'BIGINT', nullable: false, unique: false, primaryKey: true, autoIncrement: true, comment: 'BIGINT for millions of messages' },
            { id: '2', name: 'channel_id', type: 'INTEGER', nullable: false, unique: false, primaryKey: false, autoIncrement: false, references: { table: 'channels', column: 'id', onDelete: 'CASCADE' } },
            { id: '3', name: 'user_id', type: 'INTEGER', nullable: false, unique: false, primaryKey: false, autoIncrement: false, references: { table: 'users', column: 'id', onDelete: 'CASCADE' } },
            { id: '4', name: 'content', type: 'TEXT', nullable: false, unique: false, primaryKey: false, autoIncrement: false },
            { id: '5', name: 'thread_id', type: 'BIGINT', nullable: true, unique: false, primaryKey: false, autoIncrement: false, references: { table: 'messages', column: 'id', onDelete: 'CASCADE' }, comment: 'NULL for top-level messages' },
            { id: '6', name: 'edited_at', type: 'TIMESTAMP', nullable: true, unique: false, primaryKey: false, autoIncrement: false },
            { id: '7', name: 'created_at', type: 'TIMESTAMP', nullable: false, unique: false, primaryKey: false, autoIncrement: false, defaultValue: 'NOW()' },
          ],
          indexes: [
            { id: 'idx-sl-11', name: 'idx_messages_channel', columns: ['channel_id', 'created_at'], type: 'BTREE', unique: false, comment: 'Channel history pagination' },
            { id: 'idx-sl-12', name: 'idx_messages_thread', columns: ['thread_id'], type: 'BTREE', unique: false, comment: 'Thread replies' },
          ],
        },
        {
          id: 'reactions-slack',
          name: 'reactions',
          position: { x: 500, y: 750 },
          columns: [
            { id: '1', name: 'id', type: 'INTEGER', nullable: false, unique: false, primaryKey: true, autoIncrement: true },
            { id: '2', name: 'message_id', type: 'BIGINT', nullable: false, unique: false, primaryKey: false, autoIncrement: false, references: { table: 'messages', column: 'id', onDelete: 'CASCADE' } },
            { id: '3', name: 'user_id', type: 'INTEGER', nullable: false, unique: false, primaryKey: false, autoIncrement: false, references: { table: 'users', column: 'id', onDelete: 'CASCADE' } },
            { id: '4', name: 'emoji', type: 'VARCHAR', length: 50, nullable: false, unique: false, primaryKey: false, autoIncrement: false, comment: 'thumbsup, heart, etc.' },
            { id: '5', name: 'created_at', type: 'TIMESTAMP', nullable: false, unique: false, primaryKey: false, autoIncrement: false, defaultValue: 'NOW()' },
          ],
          indexes: [
            { id: 'idx-sl-13', name: 'idx_reactions_message', columns: ['message_id'], type: 'BTREE', unique: false },
            { id: 'idx-sl-14', name: 'idx_reactions_unique', columns: ['message_id', 'user_id', 'emoji'], type: 'BTREE', unique: true, comment: 'One reaction per user per emoji' },
          ],
        },
      ],
      relationships: [],
    },
  },

  // ============================================
  // 📦 CLASSIC STARTER TEMPLATES (Enhanced)
  // ============================================

  // User Authentication
  {
    id: 'user-auth',
    name: 'User Authentication (Beginner)',
    description: 'Basic user authentication with roles and sessions - perfect starting point',
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
      relationships: [],
    },
  },

  // Blog Platform
  {
    id: 'blog',
    name: 'Medium-inspired Blog Platform',
    description: 'Complete blogging platform with posts, comments, and engagement (inspired by Medium, Dev.to)',
    category: 'Social',
    difficulty: 'Intermediate',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
    useCases: ['Blog website', 'Content management', 'Publishing platform'],
    schema: {
      name: 'Medium-inspired Blog',
      description: 'Blog schema with users, posts, comments, and engagement metrics',
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
      relationships: [],
    },
  },

  // E-commerce
  {
    id: 'ecommerce',
    name: 'Amazon-inspired Store (Simplified)',
    description: 'E-commerce platform with products, orders, and inventory (inspired by Amazon, Shopify)',
    category: 'E-commerce',
    difficulty: 'Advanced',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    useCases: ['Online shop', 'Product catalog', 'Order management'],
    schema: {
      name: 'Amazon-inspired Store',
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
      relationships: [],
    },
  },

  // Social Network
  {
    id: 'social-network',
    name: 'Instagram-inspired Social Platform',
    description: 'Social media platform with posts, followers, and engagement (inspired by Instagram, TikTok)',
    category: 'Social',
    difficulty: 'Advanced',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    useCases: ['Social media', 'Community platform', 'Networking app'],
    schema: {
      name: 'Instagram-inspired Social Platform',
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
      relationships: [],
    },
  },
];
