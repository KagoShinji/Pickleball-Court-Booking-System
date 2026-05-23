## Table `admin_audit_logs`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `action` | `text` |  |
| `description` | `text` |  Nullable |
| `user_id` | `uuid` |  Nullable |
| `user_email` | `text` |  Nullable |
| `metadata` | `jsonb` |  Nullable |
| `created_at` | `timestamptz` |  |
| `company_id` | `text` |  |

## Table `admin_users`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `email` | `text` |  |
| `full_name` | `text` |  Nullable |
| `role` | `text` |  Nullable |
| `created_at` | `timestamp` |  Nullable |
| `company_id` | `text` |  |
| `is_superadmin` | `bool` |  Nullable |

## Table `blocked_time_slots`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `court_id` | `uuid` |  |
| `blocked_date` | `date` |  |
| `time_slot` | `time` |  |
| `reason` | `text` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |
| `updated_at` | `timestamptz` |  Nullable |
| `company_id` | `text` |  |

## Table `bookings`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `court_id` | `uuid` |  |
| `customer_name` | `text` |  |
| `customer_email` | `text` |  |
| `customer_phone` | `text` |  |
| `booking_date` | `date` |  |
| `start_time` | `time` |  |
| `end_time` | `time` |  |
| `total_price` | `numeric` |  Nullable |
| `status` | `text` |  Nullable |
| `notes` | `text` |  Nullable |
| `created_at` | `timestamp` |  Nullable |
| `updated_at` | `timestamp` |  Nullable |
| `proof_of_payment_url` | `text` |  Nullable |
| `booked_times` | `jsonb` |  Nullable |
| `rescheduled_from` | `jsonb` |  Nullable |
| `company_id` | `text` |  |

## Table `courts`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `name` | `text` |  |
| `type` | `text` |  |
| `price` | `numeric` |  |
| `description` | `text` |  Nullable |
| `admin_id` | `uuid` |  Nullable |
| `created_at` | `timestamp` |  Nullable |
| `updated_at` | `timestamp` |  Nullable |
| `images` | `jsonb` |  Nullable |
| `is_active` | `bool` |  Nullable |
| `pricing_rules` | `jsonb` |  Nullable |
| `max_players` | `int4` |  Nullable |
| `company_id` | `text` |  |

## Table `qr_codes`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `text` | Primary |
| `image_url` | `text` |  |
| `account_name` | `text` |  |
| `updated_at` | `timestamptz` |  Nullable |
| `label` | `text` |  Nullable |
| `is_active` | `bool` |  |
| `sort_order` | `int4` |  |
| `company_id` | `text` |  |

## Table `tenant_settings`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `company_name` | `text` |  |
| `company_short_name` | `text` |  Nullable |
| `company_initials` | `text` |  Nullable |
| `logo_url` | `text` |  Nullable |
| `contact_info` | `jsonb` |  Nullable |
| `hero_badge` | `text` |  Nullable |
| `hero_title` | `text` |  Nullable |
| `hero_subtitle` | `text` |  Nullable |
| `hero_stat_players` | `text` |  Nullable |
| `hero_stat_days` | `text` |  Nullable |
| `hero_content` | `jsonb` |  Nullable |
| `amenities` | `jsonb` |  Nullable |
| `operating_hours` | `jsonb` |  Nullable |
| `parking_enabled` | `bool` |  Nullable |
| `payment_instructions` | `text` |  Nullable |
| `terms_and_conditions` | `jsonb` |  Nullable |
| `updated_at` | `timestamptz` |  Nullable |
| `theme_config` | `jsonb` |  |
| `site_images` | `jsonb` |  |
| `section_content` | `jsonb` |  |
| `company_id` | `text` | Primary |
| `hero_bg_url` | `text` |  Nullable |
| `payment_qr_url` | `text` |  Nullable |
| `parking_is_inside` | `bool` |  Nullable |
| `parking_map_link` | `text` |  Nullable |

## Table `tenants`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `text` | Primary |
| `name` | `text` |  |
| `slug` | `text` |  Unique |
| `is_active` | `bool` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |
| `features` | `jsonb` |  Nullable |
| `billing_status` | `text` |  Nullable |
| `billing_tier` | `text` |  Nullable |

