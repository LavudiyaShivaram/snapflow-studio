-- SNAPFLOW STUDIO: FICTIONAL DEMONSTRATION DATA SEED
-- Multiple isolated tenants with realistic clients, bookings, team members, quotes, payments & editing workflows.
-- Consistent primary keys suffixed with table name and audit columns.

-- 1. SUBSCRIPTION PLANS
INSERT INTO subscription_plans (subscription_plan_id, name, slug, description, price_monthly, price_yearly, max_active_events, max_team_members, storage_limit_gb, inserted_date, updated_date)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'Starter Solo', 'starter-solo', 'Ideal for independent wedding photographers and boutique creators.', 49.00, 470.00, 10, 2, 25, NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000002', 'Studio Pro', 'studio-pro', 'For established photography & cinematography teams managing multiple weddings.', 129.00, 1240.00, 50, 12, 250, NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000003', 'Agency Enterprise', 'agency-enterprise', 'Multi-crew cinema studios, drone fleets, and post-production houses.', 299.00, 2870.00, 250, 50, 2000, NOW(), NOW())
ON CONFLICT (subscription_plan_id) DO NOTHING;

-- 2. TENANTS
INSERT INTO tenants (tenant_id, name, slug, business_type, logo_url, currency, currency_symbol, timezone, date_format, phone, email, website, address, city, country, inserted_date, updated_date)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'Royal Wedding Photography', 'royal-wedding', 'wedding_portrait', NULL, 'INR', '₹', 'Asia/Kolkata', 'DD/MM/YYYY', '+91 (22) 5550-0192', 'contact@royalweddingphoto.in', 'https://royalweddingphoto.in', '452 Marine Drive, Suite 14', 'Mumbai', 'India', NOW(), NOW()),
    ('22222222-2222-2222-2222-222222222222', 'Moments Photography Studio', 'moments-studio', 'wedding_portrait', NULL, 'GBP', '£', 'Europe/London', 'DD/MM/YYYY', '+44 20 7946 0912', 'hello@momentsphoto.co.uk', 'https://momentsphoto.co.uk', '18 Soho Square', 'London', 'UK', NOW(), NOW()),
    ('33333333-3333-3333-3333-333333333333', 'Creative Lens Studio', 'creative-lens', 'commercial', NULL, 'EUR', '€', 'Europe/Paris', 'DD/MM/YYYY', '+33 1 42 68 55 00', 'studio@creativelens.fr', 'https://creativelens.fr', '27 Rue de Richelieu', 'Paris', 'France', NOW(), NOW())
ON CONFLICT (tenant_id) DO NOTHING;

-- 3. TENANT SETTINGS
INSERT INTO tenant_settings (tenant_setting_id, tenant_id, booking_lead_buffer_days, default_deposit_percentage, tax_rate, tax_label, brand_primary_color, brand_dark_theme, auto_remind_days_before_shoot, inserted_date, updated_date)
VALUES
    ('ts111111-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 2, 30.00, 18.00, 'GST', '#d97706', TRUE, 3, NOW(), NOW()),
    ('ts222222-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 3, 25.00, 20.00, 'UK VAT', '#0ea5e9', TRUE, 4, NOW(), NOW()),
    ('ts333333-0000-0000-0000-000000000003', '33333333-3333-3333-3333-333333333333', 1, 40.00, 20.00, 'TVA', '#10b981', TRUE, 2, NOW(), NOW())
ON CONFLICT (tenant_id) DO NOTHING;

-- 4. TENANT SUBSCRIPTIONS
INSERT INTO tenant_subscriptions (tenant_subscription_id, tenant_id, plan_id, status, billing_interval, current_period_start, current_period_end, inserted_date, updated_date)
VALUES
    ('sub11111-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000002', 'active', 'monthly', NOW(), NOW() + INTERVAL '30 days', NOW(), NOW()),
    ('sub22222-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001', 'active', 'yearly', NOW(), NOW() + INTERVAL '365 days', NOW(), NOW()),
    ('sub33333-0000-0000-0000-000000000003', '33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000003', 'active', 'monthly', NOW(), NOW() + INTERVAL '30 days', NOW(), NOW())
ON CONFLICT (tenant_id) DO NOTHING;

-- 5. CLIENTS (Strictly Isolated by tenant_id)
INSERT INTO clients (client_id, tenant_id, first_name, last_name, partner_first_name, partner_last_name, email, phone, address, city, state, source, notes, inserted_date, updated_date)
VALUES
    -- Royal Wedding Photography Clients (Tenant 1)
    ('c1111111-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Eleanor', 'Vance', 'Julian', 'Hastings', 'eleanor.vance@example.com', '+1 (555) 234-8901', '742 Evergreen Terrace', 'New York', 'NY', 'Referral', 'Grand 3-day estate wedding. Requested drone footage of fireworks.', NOW(), NOW()),
    ('c1111111-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Sophia', 'Chen', 'Marcus', 'Abernathy', 'sophia.chen@example.com', '+1 (555) 789-0123', '124 Hudson Yards #42', 'New York', 'NY', 'Instagram', 'Editorial rooftop engagement shoot and ballroom reception.', NOW(), NOW()),
    ('c1111111-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'Aarav', 'Patel', 'Ananya', 'Deshmukh', 'aarav.patel@example.com', '+1 (555) 456-7890', '50 Central Park South', 'New York', 'NY', 'WeddingWire', 'Traditional Indian wedding: Sangeet, Mehendi, Baraat and Grand Reception.', NOW(), NOW()),
    
    -- Moments Photography Studio Clients (Tenant 2)
    ('c2222222-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'Charlotte', 'Windsor', 'Oliver', 'Kensington', 'charlotte.w@example.co.uk', '+44 7700 900123', '44 Holland Park', 'London', 'UK', 'Referral', 'Cotswolds manor wedding. Intimate family ceremony and black-tie dinner.', NOW(), NOW()),
    ('c2222222-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'Liam', 'Gallagher', 'Chloe', 'Bennett', 'liam.g@example.co.uk', '+44 7700 900456', '88 Camden High Street', 'London', 'UK', 'Website', 'Rock-and-roll warehouse celebration in Shoreditch.', NOW(), NOW());

-- 6. EVENTS (Main Bookings)
INSERT INTO events (event_id, tenant_id, client_id, title, event_type, status, start_date, end_date, primary_venue_name, primary_venue_address, primary_venue_city, estimated_guest_count, total_package_price, total_paid, lead_notes, inserted_date, updated_date)
VALUES
    -- Tenant 1 Bookings
    ('e1111111-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'c1111111-0000-0000-0000-000000000001', 'The Vance & Hastings Nuptials', 'wedding', 'confirmed', '2026-11-14', '2026-11-15', 'Oheka Castle Estate', '135 W Gate Dr', 'Huntington', 280, 14500.00, 7500.00, 'Requires 2 principal photographers, 2 cinema videographers, and 1 licensed drone pilot.', NOW(), NOW()),
    ('e1111111-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'c1111111-0000-0000-0000-000000000002', 'Chen & Abernathy Autumn Gala', 'reception', 'confirmed', '2026-11-20', '2026-11-20', 'The Plaza Hotel Grand Ballroom', '768 5th Ave', 'New York', 190, 8200.00, 8200.00, 'Black tie reception. Full payment settled.', NOW(), NOW()),
    ('e1111111-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'c1111111-0000-0000-0000-000000000003', 'Patel & Deshmukh Wedding Festivities', 'haldi_mehendi', 'in_progress', '2026-11-07', '2026-11-09', 'Cipriani 42nd St & Private Estate', '110 E 42nd St', 'New York', 450, 18500.00, 10000.00, 'Multi-day coverage: Haldi/Mehendi Friday, Sangeet Saturday, Vows Sunday.', NOW(), NOW()),

    -- Tenant 2 Bookings
    ('e2222222-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'c2222222-0000-0000-0000-000000000001', 'Windsor & Kensington Countryside Vows', 'wedding', 'confirmed', '2026-12-05', '2026-12-06', 'Soho Farmhouse Estate', 'Great Tew', 'Chipping Norton', 120, 9500.00, 4500.00, 'Classic British countryside documentary styling.', NOW(), NOW());

-- 7. EVENT_SESSIONS
INSERT INTO event_sessions (event_session_id, tenant_id, event_id, title, session_date, start_time, end_time, reporting_time, venue_name, venue_address, is_drone_permitted, inserted_date, updated_date)
VALUES
    -- Vance & Hastings Sessions
    ('s1111111-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'e1111111-0000-0000-0000-000000000001', 'Bridal Preparations & First Look', '2026-11-14', '10:00:00', '13:30:00', '09:15:00', 'Oheka Castle Bridal Suite', '135 W Gate Dr', FALSE, NOW(), NOW()),
    ('s1111111-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'e1111111-0000-0000-0000-000000000001', 'Ceremony & Terrace Vows', '2026-11-14', '14:30:00', '16:00:00', '14:00:00', 'Great Lawn Sunken Gardens', '135 W Gate Dr', TRUE, NOW(), NOW()),
    ('s1111111-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'e1111111-0000-0000-0000-000000000001', 'Grand Ballroom Dinner & Fireworks', '2026-11-14', '17:30:00', '23:30:00', '17:00:00', 'Grand Ballroom & Courtyard', '135 W Gate Dr', TRUE, NOW(), NOW()),
    
    -- Patel Festivities Sessions
    ('s1111111-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'e1111111-0000-0000-0000-000000000003', 'Mehendi & Sangeet Night', '2026-11-07', '16:00:00', '22:30:00', '15:15:00', 'Tribeca Rooftop', '2 Desbrosses St', FALSE, NOW(), NOW()),
    ('s1111111-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'e1111111-0000-0000-0000-000000000003', 'Baraat & Sacred Vivaha Vows', '2026-11-08', '09:00:00', '14:00:00', '08:00:00', 'Cipriani 42nd St', '110 E 42nd St', TRUE, NOW(), NOW());

-- 8. TEAM_MEMBERS
INSERT INTO team_members (team_member_id, tenant_id, name, email, phone, role, is_freelancer, hourly_rate, day_rate, gear_list, rating, inserted_date, updated_date)
VALUES
    -- Tenant 1 Crew
    ('tm111111-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Julian Thorne', 'julian@royalweddingphoto.com', '+1 (212) 555-4011', 'photographer', FALSE, 150.00, 1200.00, 'Sony A1, Sony A7R V, 35mm f/1.4 GM, 85mm f/1.2 GM, Profoto A10', 5.0, NOW(), NOW()),
    ('tm111111-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Maya Lin-Ross', 'maya.cinematics@gmail.com', '+1 (646) 555-8821', 'videographer', TRUE, 120.00, 950.00, 'Canon C70, RED Komodo, Atlas Anamorphic Primes, DJI RS3 Pro', 4.9, NOW(), NOW()),
    ('tm111111-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'Darius Keller', 'darius.keller.drone@gmail.com', '+1 (917) 555-3390', 'videographer', TRUE, 110.00, 850.00, 'DJI Inspire 3 (Part 107 Licensed), DJI Mavic 3 Pro Cine', 5.0, NOW(), NOW()),
    ('tm111111-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'Helena Cruz', 'helena@royalweddingphoto.com', '+1 (212) 555-9012', 'editor', FALSE, 75.00, 600.00, 'Mac Studio M2 Ultra, Pro Display XDR, DaVinci Resolve Studio', 4.9, NOW(), NOW()),

    -- Tenant 2 Crew
    ('tm222222-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'Arthur Pendelton', 'arthur@momentsphoto.co.uk', '+44 7911 123456', 'photographer', FALSE, 90.00, 750.00, 'Leica SL2, Leica M11, Summilux-M 35/50', 5.0, NOW(), NOW());

-- 9. TEAM_MEMBER_SKILLS
INSERT INTO team_member_skills (team_member_skill_id, tenant_id, team_member_id, skill, inserted_date, updated_date)
VALUES
    ('sk111111-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'tm111111-0000-0000-0000-000000000001', 'Master Candid Portraiture', NOW(), NOW()),
    ('sk111111-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'tm111111-0000-0000-0000-000000000001', 'Low-Light Off-Camera Flash', NOW(), NOW()),
    ('sk111111-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'tm111111-0000-0000-0000-000000000002', 'Cinema 4K Documentaries', NOW(), NOW()),
    ('sk111111-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'tm111111-0000-0000-0000-000000000002', 'Gimbal Operation', NOW(), NOW()),
    ('sk111111-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'tm111111-0000-0000-0000-000000000003', 'Licensed Aerial Drone (FAA 107)', NOW(), NOW()),
    ('sk111111-0000-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111', 'tm111111-0000-0000-0000-000000000004', 'Color Grading (ACES / Film Emulation)', NOW(), NOW()),
    ('sk111111-0000-0000-0000-000000000007', '11111111-1111-1111-1111-111111111111', 'tm111111-0000-0000-0000-000000000004', 'Handcrafted Fine Art Album Layout', NOW(), NOW());

-- 10. TEAM_ASSIGNMENTS
INSERT INTO team_assignments (team_assignment_id, tenant_id, event_id, session_id, team_member_id, role_assigned, status, agreed_payout, call_time, inserted_date, updated_date)
VALUES
    ('ta111111-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'e1111111-0000-0000-0000-000000000001', 's1111111-0000-0000-0000-000000000001', 'tm111111-0000-0000-0000-000000000001', 'photographer', 'confirmed', 600.00, '09:15:00', NOW(), NOW()),
    ('ta111111-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'e1111111-0000-0000-0000-000000000001', 's1111111-0000-0000-0000-000000000002', 'tm111111-0000-0000-0000-000000000001', 'photographer', 'confirmed', 600.00, '14:00:00', NOW(), NOW()),
    ('ta111111-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'e1111111-0000-0000-0000-000000000001', 's1111111-0000-0000-0000-000000000002', 'tm111111-0000-0000-0000-000000000003', 'videographer', 'confirmed', 850.00, '13:45:00', NOW(), NOW()),
    ('ta111111-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'e1111111-0000-0000-0000-000000000001', 's1111111-0000-0000-0000-000000000003', 'tm111111-0000-0000-0000-000000000002', 'videographer', 'requested', 950.00, '17:00:00', NOW(), NOW());

-- 11. PACKAGES & ITEMS
INSERT INTO packages (package_id, tenant_id, name, description, base_price, recommended_for, inserted_date, updated_date)
VALUES
    ('pkg1111-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Royal Heirloom Cinema & Photo Suite', 'All-inclusive multi-camera coverage with FAA drone footage, master album and highlights film.', 14500.00, 'Full Luxury Weekend Weddings', NOW(), NOW()),
    ('pkg1111-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Editorial Fine Art Photography', 'Full-day single lead photographer coverage with custom color grade and online gallery.', 6800.00, 'Intimate & Destination Weddings', NOW(), NOW());

INSERT INTO package_items (package_item_id, tenant_id, package_id, item_title, item_description, quantity, unit_price, inserted_date, updated_date)
VALUES
    ('pki1111-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'pkg1111-0000-0000-0000-000000000001', 'Lead Principal Photographer (12 Hours)', 'Unrestricted capture of all emotional moments and portraits.', 1, 4500.00, NOW(), NOW()),
    ('pki1111-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'pkg1111-0000-0000-0000-000000000001', 'Cinema Videographer & Assistant (10 Hours)', '4K cinematic film recording with multi-track audio.', 1, 4200.00, NOW(), NOW()),
    ('pki1111-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'pkg1111-0000-0000-0000-000000000001', 'FAA Part 107 Aerial Drone Coverage', 'High-altitude dramatic landscape and venue reveals.', 1, 1500.00, NOW(), NOW()),
    ('pki1111-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'pkg1111-0000-0000-0000-000000000001', 'Handcrafted Italian Leather Heirloom Album (12x36)', 'Hand-bound 40-page master album with bespoke debossing.', 1, 2200.00, NOW(), NOW());

-- 12. PAYMENTS & EXPENSES
INSERT INTO payments (payment_id, tenant_id, event_id, client_id, amount, payment_method, payment_stage, reference_number, paid_on, notes, inserted_date, updated_date)
VALUES
    ('pay1111-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'e1111111-0000-0000-0000-000000000001', 'c1111111-0000-0000-0000-000000000001', 4500.00, 'bank_transfer', 'advance', 'WIRE-2026-9021', '2026-08-10', 'Booking retainer and date reservation.', NOW(), NOW()),
    ('pay1111-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'e1111111-0000-0000-0000-000000000001', 'c1111111-0000-0000-0000-000000000001', 3000.00, 'credit_card', 'mid_payment', 'CC-AUTH-8820', '2026-10-01', 'Second scheduled milestone.', NOW(), NOW()),
    ('pay1111-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'e1111111-0000-0000-0000-000000000002', 'c1111111-0000-0000-0000-000000000002', 8200.00, 'stripe', 'final_settlement', 'STRIPE-CH-48910', '2026-10-15', 'Full settlement completed ahead of gala.', NOW(), NOW());

INSERT INTO expenses (expense_id, tenant_id, event_id, category, amount, recipient_name, incurred_on, notes, inserted_date, updated_date)
VALUES
    ('exp1111-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'e1111111-0000-0000-0000-000000000001', 'gear_rental', 780.00, 'Adorama Rental Co', '2026-11-12', 'Arri Orbiter & specialized anamorphic glass hire', NOW(), NOW()),
    ('exp1111-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'e1111111-0000-0000-0000-000000000001', 'freelancer_payout', 850.00, 'Darius Keller (Drone)', '2026-11-14', 'Aerial permit and flight operation fee', NOW(), NOW()),
    ('exp1111-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', NULL, 'software_license', 120.00, 'Capture One Pro & Frame.io', '2026-10-01', 'Monthly studio post-production SaaS licenses', NOW(), NOW());

-- 13. EDITING_PROJECTS & DELIVERABLES
INSERT INTO editing_projects (editing_project_id, tenant_id, event_id, lead_editor_id, current_stage, backup_disk_label, deadline_date, color_grade_notes, inserted_date, updated_date)
VALUES
    ('ep11111-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'e1111111-0000-0000-0000-000000000001', 'tm111111-0000-0000-0000-000000000004', 'photo_selection', 'RAID-ARRAY-VANCE-2026', '2026-12-20', 'Warm golden film tone, rich emerald garden greens, creamy highlights.', NOW(), NOW()),
    ('ep11111-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'e1111111-0000-0000-0000-000000000002', 'tm111111-0000-0000-0000-000000000004', 'video_teaser', 'RAID-ARRAY-CHEN-2026', '2026-11-30', 'High contrast monochrome tease with jazz audio cut.', NOW(), NOW());

INSERT INTO deliverables (deliverable_id, tenant_id, editing_project_id, title, deliverable_type, delivery_url, status, inserted_date, updated_date)
VALUES
    ('del1111-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'ep11111-0000-0000-0000-000000000001', 'Private Web Gallery (Curated 900 Images)', 'gallery_link', 'https://gallery.royalweddingphoto.com/vance-hastings', 'in_production', NOW(), NOW()),
    ('del1111-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'ep11111-0000-0000-0000-000000000001', '4K Cinematic Teaser Film (3 Minutes)', 'video_link', 'https://vimeo.com/royalwedding/vance-teaser', 'in_production', NOW(), NOW());

-- 14. TASKS
INSERT INTO tasks (task_id, tenant_id, event_id, title, description, priority, due_date, is_completed, inserted_date, updated_date)
VALUES
    ('tsk1111-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'e1111111-0000-0000-0000-000000000001', 'File Oheka Castle Drone Flight Authorization', 'Submit flight path coordinates to FAA B4UFLY and venue manager.', 'urgent', '2026-11-05', TRUE, NOW(), NOW()),
    ('tsk1111-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'e1111111-0000-0000-0000-000000000001', 'Format and Label 12x 128GB ProGrade V90 SD Cards', 'Double-check card redundancy settings on both A1 bodies.', 'high', '2026-11-12', FALSE, NOW(), NOW()),
    ('tsk1111-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'e1111111-0000-0000-0000-000000000001', 'Send Pre-Shoot Timeline and Reporting Brief to Crew', 'Confirm call times and dress code for castle staff entrance.', 'normal', '2026-11-10', FALSE, NOW(), NOW()),
    ('tsk1111-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'e1111111-0000-0000-0000-000000000003', 'Collect Final 40% Balance for Patel Wedding', 'Send friendly reminder with payment link.', 'high', '2026-11-06', FALSE, NOW(), NOW());

-- 15. MESSAGE_TEMPLATES
INSERT INTO message_templates (message_template_id, tenant_id, name, channel, template_body, inserted_date, updated_date)
VALUES
    ('mt11111-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Freelancer Shoot Call Invitation', 'whatsapp', 'Hi {name}! 📸 SnapFlow Studio has a shoot opening for {event_title} on {session_date}. Call time is {call_time} at {venue_name}. Agreed fee is {agreed_payout}. Please reply YES to confirm your dispatch!', NOW(), NOW()),
    ('mt11111-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Client Milestone Payment Reminder', 'whatsapp', 'Dear {client_name}, warm greetings from Royal Wedding Photography! Your upcoming milestone payment of {amount} for {event_title} is scheduled for {due_date}. You can securely settle via our studio link: {portal_link}. Thank you!', NOW(), NOW()),
    ('mt11111-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'Gallery Teaser Delivery Notice', 'whatsapp', 'Congratulations {client_name}! ✨ Your wedding teaser gallery is now ready for viewing. Click here to preview the first 50 highlights: {gallery_url} (Passcode: {password}). Enjoy your timeless memories!', NOW(), NOW());
