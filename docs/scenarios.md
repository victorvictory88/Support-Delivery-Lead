# Synthetic scenario guide

Every organization, event, exposure estimate, and metric in this guide is fictional. The scenarios are authored to show decision paths and user experience.

## CASE-1042: Delivery drop

**Signals:** Impressions fall from a 184,000 daily baseline to an 8,400 projection. A payment attempt fails before the ad stops serving, while budget remains available.

**Expected handling:** Triage the advertiser's launch deadline, verify the payment state, and avoid attributing the drop to budget exhaustion. Draft a clear next step and confirm serving recovery after the payment issue is addressed. Feed a payment-state check into the delivery playbook.

## CASE-2087: Measurement gap

**Signals:** The platform reports 3,820 clicks and site analytics reports 2,370 sessions. The landing URL has no campaign parameters.

**Expected handling:** Treat the discrepancy as an open investigation. Missing URL tags weaken campaign attribution but cannot explain the total session gap alone. Align account and campaign filters, reporting windows, time zones, redirects, consent behavior, and analytics capture before stating a cause. The measurement lead reviews the final explanation.

## CASE-3164: Billing interpretation

**Signals:** The objective is conversions, while the selected buying mode bills clicks. The fictional invoice shows 15,400 billed clicks and 620 conversions.

**Expected handling:** Explain the distinction between optimization and billing. Route invoice interpretation to a billing specialist before promising any adjustment or customer outcome. Add setup guidance that makes buying mode easier to understand.

## CASE-4271: Policy review

**Signals:** An ad is rejected with a landing page access code. A crawler check sees an access-denied response. The buyer requests an exception before a launch.

**Expected handling:** Explain the observed access issue, request a page fix, and route any appeal through policy review. The policy team owns exception decisions.

## CASE-5308: Launch readiness

**Signals:** A planned feature launch affects 180 fictional accounts. The runbook is incomplete, four issues remain open, and rollback still needs a test.

**Expected handling:** Assign owners, complete the runbook and rollback check, and bring Product, Engineering, and Support together for a launch decision. The system records a readiness recommendation and requires a launch owner.
