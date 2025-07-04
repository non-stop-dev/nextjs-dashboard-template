# Database Architecture - Authentication System

## Overview

The Sifrex authentication system uses a dedicated `sifrex_users` schema within the PostgreSQL database to maintain clear separation between app user authentication data and scraped social media data. This architecture ensures security, scalability, and maintainability.

## Schema Organization

```
sifrex_db (Database)
├── public (Schema) - Scraped X/Twitter data
│   ├── partidos - Political parties data
│   ├── x_usuarios - Scraped X user profiles
│   ├── x_posts - Scraped X posts
│   ├── x_post_connections - Post relationships
│   └── password_reset_tokens - Legacy (to be migrated)
│
└── sifrex_users (Schema) - App user authentication
    ├── Core Authentication Tables
    ├── Security & Audit Tables
    ├── User Preferences & Configuration
    └── Integration Tables
```

## Core Authentication Tables

### 1. app_users (Primary User Table)

**Purpose**: Main table for Sifrex platform users who use the app to analyze X data.

```sql
CREATE TABLE sifrex_users.app_users (
    id SERIAL PRIMARY KEY,                          -- Unique autoincremental ID
    auth_id VARCHAR(255) UNIQUE NOT NULL,           -- NextAuth cuid() mapping
    email VARCHAR(255) UNIQUE NOT NULL,             -- User email (login)
    name VARCHAR(255) NOT NULL,                     -- Full name
    phone VARCHAR(20),                              -- Optional phone number
    country VARCHAR(100),                           -- User's country
    password_hash VARCHAR(255),                     -- bcrypt hashed password
    role sifrex_users.app_user_role DEFAULT 'BASIC', -- Subscription tier
    email_verified TIMESTAMP,                       -- Email verification timestamp
    phone_verified TIMESTAMP,                       -- Phone verification timestamp
    profile_picture_url VARCHAR(500),               -- Profile picture URL
    
    -- Account Status
    is_active BOOLEAN DEFAULT TRUE,
    is_email_verified BOOLEAN DEFAULT FALSE,
    is_phone_verified BOOLEAN DEFAULT FALSE,
    
    -- Security & Audit
    last_login TIMESTAMP,
    login_count INTEGER DEFAULT 0,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    
    -- GDPR & Compliance
    data_processing_consent BOOLEAN DEFAULT FALSE,
    privacy_policy_accepted TIMESTAMP,
    terms_accepted TIMESTAMP,
    
    -- Subscription & Billing
    subscription_status VARCHAR(50) DEFAULT 'free',
    subscription_tier sifrex_users.app_user_role,
    billing_customer_id VARCHAR(255),               -- Stripe/payment provider ID
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Key Features:**
- Autoincremental `id` for internal references
- `auth_id` maps to NextAuth.js session system
- Clear separation from X user data (no handles, X-specific fields)
- GDPR compliance fields
- Subscription management integration
- Security tracking (login attempts, account locking)

### 2. app_user_role (Enum)

**Purpose**: Defines the 6-tier subscription and administrative hierarchy.

```sql
CREATE TYPE sifrex_users.app_user_role AS ENUM (
    'BASIC',        -- Level 0: Free tier users
    'PLUS',         -- Level 1: Basic paid subscription
    'PREMIUM',      -- Level 2: Advanced features
    'PREMIUM_PLUS', -- Level 3: Enterprise features
    'ADMIN',        -- Level 4: Platform administration
    'SUPER_ADMIN'   -- Level 5: Full platform access
);
```

**Role Hierarchy:**
- **Subscription Roles** (0-3): Customer tiers with feature access
- **Administrative Roles** (4-5): Platform management and system access

### 3. app_user_accounts (OAuth Integration)

**Purpose**: Stores OAuth provider connections (Google, Apple, etc.).

```sql
CREATE TABLE sifrex_users.app_user_accounts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES sifrex_users.app_users(id) ON DELETE CASCADE,
    provider VARCHAR(100) NOT NULL,                 -- 'google', 'credentials', etc.
    provider_account_id VARCHAR(255) NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    expires_at BIGINT,
    token_type VARCHAR(50),
    scope TEXT,
    id_token TEXT,
    session_state TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(provider, provider_account_id)
);
```

### 4. app_user_sessions (Active Sessions)

**Purpose**: Tracks active user sessions for JWT validation and security monitoring.

```sql
CREATE TABLE sifrex_users.app_user_sessions (
    id SERIAL PRIMARY KEY,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    user_id INTEGER REFERENCES sifrex_users.app_users(id) ON DELETE CASCADE,
    expires TIMESTAMP NOT NULL,
    ip_address INET,
    user_agent TEXT,
    device_info JSONB,                              -- Browser, OS, device details
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 5. app_password_resets (Password Recovery)

**Purpose**: Secure password reset token management with tracking.

```sql
CREATE TABLE sifrex_users.app_password_resets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES sifrex_users.app_users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) NOT NULL,
    attempts INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP,
    ip_address INET
);
```

### 6. app_verification_tokens (Multi-purpose Verification)

**Purpose**: Handles email, phone, and other verification workflows.

```sql
CREATE TABLE sifrex_users.app_verification_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES sifrex_users.app_users(id) ON DELETE CASCADE,
    identifier VARCHAR(255) NOT NULL,               -- email or phone
    token VARCHAR(255) NOT NULL,
    verification_type VARCHAR(50) NOT NULL,         -- 'email', 'phone', 'password_reset'
    expires TIMESTAMP NOT NULL,
    attempts INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP,
    
    UNIQUE(identifier, token, verification_type)
);
```

## Security & Audit Tables

### 7. app_rate_limits (Rate Limiting)

**Purpose**: Prevents abuse by tracking and limiting user actions.

```sql
CREATE TABLE sifrex_users.app_rate_limits (
    id SERIAL PRIMARY KEY,
    identifier VARCHAR(255) NOT NULL,               -- email, IP, or user_id
    action_type VARCHAR(100) NOT NULL,              -- 'login', 'password_reset', 'api_call'
    attempt_count INTEGER DEFAULT 1,
    window_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    blocked_until TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Rate Limiting Strategy:**
- **Login Attempts**: 5 attempts per 15 minutes per email
- **Password Reset**: 3 attempts per hour per email
- **API Calls**: Role-based limits (see Role Documentation)

### 8. app_audit_log (Security Audit Trail)

**Purpose**: Comprehensive logging for security monitoring and compliance.

```sql
CREATE TABLE sifrex_users.app_audit_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES sifrex_users.app_users(id),
    event_type VARCHAR(100) NOT NULL,               -- 'login', 'logout', 'role_change', etc.
    event_details JSONB,                            -- Additional event data
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Tracked Events:**
- Authentication events (login, logout, failed attempts)
- Role changes and permission modifications
- Data export and API usage
- Security-related configuration changes

### 9. app_role_history (Role Change Tracking)

**Purpose**: Audit trail for subscription and role changes.

```sql
CREATE TABLE sifrex_users.app_role_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES sifrex_users.app_users(id),
    from_role sifrex_users.app_user_role,
    to_role sifrex_users.app_user_role NOT NULL,
    changed_by INTEGER REFERENCES sifrex_users.app_users(id),
    reason TEXT,                                    -- 'subscription_upgrade', 'admin_promotion'
    metadata JSONB,                                 -- Subscription details, admin notes
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 10. app_user_2fa (Two-Factor Authentication)

**Purpose**: Future enhancement for additional security layer.

```sql
CREATE TABLE sifrex_users.app_user_2fa (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES sifrex_users.app_users(id) ON DELETE CASCADE,
    method VARCHAR(50) NOT NULL,                    -- 'totp', 'sms', 'email'
    secret_key VARCHAR(255),                        -- Encrypted TOTP secret
    backup_codes TEXT[],                            -- Encrypted backup codes array
    is_enabled BOOLEAN DEFAULT FALSE,
    last_used TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, method)
);
```

## User Preferences & Configuration

### 11. app_user_preferences (User Settings)

**Purpose**: Stores user preferences and application settings.

```sql
CREATE TABLE sifrex_users.app_user_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES sifrex_users.app_users(id) ON DELETE CASCADE,
    preference_key VARCHAR(100) NOT NULL,           -- 'theme', 'language', 'notifications'
    preference_value TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, preference_key)
);
```

**Common Preferences:**
- `theme`: 'light', 'dark', 'auto'
- `language`: 'en', 'es', etc.
- `notifications_email`: 'true', 'false'
- `timezone`: User's timezone preference

### 12. app_user_api_keys (API Access)

**Purpose**: Manages API keys for programmatic access to Sifrex platform.

```sql
CREATE TABLE sifrex_users.app_user_api_keys (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES sifrex_users.app_users(id) ON DELETE CASCADE,
    key_name VARCHAR(100) NOT NULL,                 -- User-defined name
    api_key VARCHAR(255) UNIQUE NOT NULL,           -- Generated API key
    key_hash VARCHAR(255) NOT NULL,                 -- Hashed version for validation
    permissions JSONB,                              -- What this key can access
    last_used TIMESTAMP,
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 13. app_user_usage (Usage Tracking)

**Purpose**: Tracks usage for billing and rate limiting enforcement.

```sql
CREATE TABLE sifrex_users.app_user_usage (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES sifrex_users.app_users(id) ON DELETE CASCADE,
    usage_type VARCHAR(100) NOT NULL,               -- 'api_calls', 'data_exports', 'analysis_runs'
    usage_count INTEGER DEFAULT 0,
    period_start DATE NOT NULL,                     -- Monthly/daily period
    period_end DATE NOT NULL,
    metadata JSONB,                                 -- Additional usage details
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, usage_type, period_start)
);
```

**Usage Types:**
- `api_calls`: API requests per period
- `data_exports`: Number of data exports
- `analysis_runs`: Analysis executions
- `storage_mb`: Data storage usage

## Integration Tables

### 14. app_user_saved_analyses (User Analysis Storage)

**Purpose**: Stores user's saved analysis configurations and bookmarks.

```sql
CREATE TABLE sifrex_users.app_user_saved_analyses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES sifrex_users.app_users(id) ON DELETE CASCADE,
    analysis_name VARCHAR(255) NOT NULL,
    analysis_type VARCHAR(100),                     -- 'sentiment', 'network', 'trending'
    saved_filters JSONB,                            -- Query parameters, date ranges
    x_user_ids INTEGER[],                           -- References to x_usuarios.id
    partido_ids INTEGER[],                          -- References to partidos.id
    post_ids VARCHAR(255)[],                        -- References to x_posts.post_id
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Integration Notes:**
- References existing scraped data without modifying original tables
- Uses arrays to store multiple entity references efficiently
- JSONB filters allow flexible query storage

### 15. app_user_exports (Export History)

**Purpose**: Tracks data export requests and file generation.

```sql
CREATE TABLE sifrex_users.app_user_exports (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES sifrex_users.app_users(id) ON DELETE CASCADE,
    export_type VARCHAR(100) NOT NULL,              -- 'csv', 'json', 'pdf_report'
    export_name VARCHAR(255),
    export_filters JSONB,                           -- What data was exported
    file_url VARCHAR(500),                          -- S3/storage URL
    file_size_bytes BIGINT,
    status VARCHAR(50) DEFAULT 'pending',           -- 'pending', 'completed', 'failed'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);
```

## Performance Indexes

### Critical Performance Indexes

```sql
-- Core user lookup indexes
CREATE INDEX idx_app_users_email ON sifrex_users.app_users(email);
CREATE INDEX idx_app_users_auth_id ON sifrex_users.app_users(auth_id);
CREATE INDEX idx_app_users_role ON sifrex_users.app_users(role);
CREATE INDEX idx_app_users_subscription_status ON sifrex_users.app_users(subscription_status);

-- Session and authentication indexes
CREATE INDEX idx_app_user_sessions_token ON sifrex_users.app_user_sessions(session_token);
CREATE INDEX idx_app_user_sessions_user_id ON sifrex_users.app_user_sessions(user_id);
CREATE INDEX idx_app_user_sessions_expires ON sifrex_users.app_user_sessions(expires);

-- Security and rate limiting indexes
CREATE INDEX idx_app_rate_limits_identifier_action ON sifrex_users.app_rate_limits(identifier, action_type);
CREATE INDEX idx_app_audit_log_user_created ON sifrex_users.app_audit_log(user_id, created_at);

-- API and usage indexes
CREATE INDEX idx_app_user_api_keys_api_key ON sifrex_users.app_user_api_keys(api_key);
CREATE INDEX idx_app_user_usage_user_period ON sifrex_users.app_user_usage(user_id, period_start);
```

## Data Relationships

### Primary Relationships

```
app_users (1) ←→ (N) app_user_accounts      [OAuth providers]
app_users (1) ←→ (N) app_user_sessions      [Active sessions]
app_users (1) ←→ (N) app_password_resets    [Password recovery]
app_users (1) ←→ (N) app_verification_tokens [Email/phone verification]
app_users (1) ←→ (N) app_user_preferences   [User settings]
app_users (1) ←→ (N) app_user_api_keys      [API access]
app_users (1) ←→ (N) app_user_usage         [Usage tracking]
app_users (1) ←→ (N) app_user_saved_analyses [Saved work]
app_users (1) ←→ (N) app_user_exports       [Export history]
```

### Cross-Schema References

```
sifrex_users.app_user_saved_analyses → public.x_usuarios    [Analysis subjects]
sifrex_users.app_user_saved_analyses → public.partidos     [Political entities]
sifrex_users.app_user_saved_analyses → public.x_posts      [Post references]
```

## Security Considerations

### 1. Data Isolation
- **Schema Separation**: App users completely isolated from scraped data
- **Row-Level Security**: Can be implemented for multi-tenant scenarios
- **API Key Scoping**: Granular permissions per API key

### 2. Password Security
- **bcrypt Hashing**: 12+ rounds for password storage
- **Reset Token Security**: Cryptographically secure, time-limited tokens
- **Rate Limiting**: Prevents brute force attacks

### 3. Session Management
- **JWT Strategy**: Stateless sessions with configurable expiration
- **Session Cleanup**: Automated cleanup of expired sessions
- **Device Tracking**: IP and user agent logging for security monitoring

### 4. Audit & Compliance
- **Comprehensive Logging**: All security events tracked
- **GDPR Compliance**: Data processing consent and user rights
- **Data Retention**: Configurable retention policies for audit logs

## Backup and Recovery

### Critical Tables (Priority 1)
- `app_users` - Core user data
- `app_user_accounts` - OAuth connections
- `app_audit_log` - Security audit trail

### Important Tables (Priority 2)
- `app_user_preferences` - User settings
- `app_user_saved_analyses` - User work
- `app_role_history` - Role changes

### Recoverable Tables (Priority 3)
- `app_user_sessions` - Can be regenerated
- `app_rate_limits` - Temporary data
- `app_password_resets` - Short-lived tokens

## Migration Strategy

### From Legacy System
1. **Assessment**: Identify existing user data in `public.password_reset_tokens`
2. **Schema Creation**: Deploy `sifrex_users` schema
3. **Data Migration**: Move applicable data to new structure
4. **Validation**: Verify data integrity and relationships
5. **Cutover**: Update application to use new schema
6. **Cleanup**: Archive or drop legacy tables

### Future Enhancements
- **Multi-tenant Support**: Organization-level user management
- **Advanced 2FA**: Hardware keys, biometric authentication
- **Federated Identity**: SAML, OpenID Connect integration
- **Advanced Analytics**: User behavior analytics and insights

This database architecture provides a robust, secure, and scalable foundation for the Sifrex authentication system while maintaining clear separation from the social media analysis data.