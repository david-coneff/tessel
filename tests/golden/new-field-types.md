---
title: New Field Types
doc_id: new-field-types
---

# New Field Types

This document tests all field types added in Phase 6: @datetime, @number, @email, @phone, @url.

---

## Datetime

@datetime Appointment Time
{id=appointment_time, hint=Select date and time}

## Number Fields

@number Quantity
{id=quantity, min=1, max=100, step=1, required=true}

@number Price
{id=price, min=0, step=0.01, placeholder=0.00}

## Email

@email Contact Email
{id=contact_email, required=true, hint=We will never share your email}

@email CC Email
{id=cc_email, visible_if=contact_email, placeholder=cc@example.com}

## Phone

@phone Primary Phone
{id=primary_phone, required=true}

@phone Secondary Phone
{id=secondary_phone, visible_if=primary_phone}

## URL

@url Project URL
{id=project_url, placeholder=https://example.com}

@url Documentation URL
{id=docs_url, visible_if=project_url != ""}

## Validation

@number Score
{id=score, min=0, max=10, validate=score >= 0 and score <= 10, warning_message=Score must be between 0 and 10}

@email Work Email
{id=work_email, validate=work_email contains "@", warning_message=Must be a valid email address}
